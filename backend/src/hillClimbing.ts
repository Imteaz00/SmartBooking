import type { Event, Slot, Venue } from "./types.js";

type Booking = {
  venueName: string;
  eventSize: number;
  slotId: number;
  byUser: boolean;
};

const STAFF_LIMIT = 12;
const PARKING_LIMIT = 450;
const PEOPLE_LIMIT = 2600;
const LARGE_EVENT_THRESHOLD = 1250;
const MAX_VENUES_WITH_LARGE_EVENT = 2;
const CONSECUTIVE_BONUS = 0.1; // +10% for consecutive slots
const FATIGUE_COST = 5000; // -5000 BDT if 3+ slots
const FATIGUE_THRESHOLD = 3;

export function hillClimbingOptimizer(
  venues: Venue[],
  slots: Slot[],
  events: Event[],
  greedySolution: Booking[],
  date: Date,
): Booking[] {
  const season = getSeason(date);
  let currentSolution = JSON.parse(JSON.stringify(greedySolution)) as Booking[];
  let currentScore = calculateScore(currentSolution, venues, events, slots, season);

  let improved = true;
  let iterations = 0;
  const maxIterations = 1000;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // Try all possible moves
    const moves = generateMoves(currentSolution, venues, events, slots);

    for (const move of moves) {
      const newSolution = applyMove(currentSolution, move);

      // Validate the new solution
      if (!isValidSchedule(newSolution, venues, events, slots)) {
        continue;
      }

      const newScore = calculateScore(newSolution, venues, events, slots, season);

      // Accept if better
      if (newScore > currentScore) {
        currentSolution = newSolution;
        currentScore = newScore;
        improved = true;
        break; // First-improvement (greedy hill climbing)
      }
    }
  }

  return currentSolution;
}

function getSeason(date: Date): "winter" | "summer" {
  const month = date.getMonth();
  return month >= 3 && month <= 10 ? "summer" : "winter";
}

type Move = {
  type: "swap" | "move" | "remove" | "add";
  from?: number; // booking index
  to?: number; // slot id or booking index
  venueName?: string;
  eventSize?: number;
  slotId?: number;
};

function generateMoves(
  bookings: Booking[],
  venues: Venue[],
  events: Event[],
  slots: Slot[],
): Move[] {
  const moves: Move[] = [];

  // Move 1: Swap venues between two slots
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      if (bookings[i].slotId !== bookings[j].slotId) {
        moves.push({
          type: "swap",
          from: i,
          to: j,
        });
      }
    }
  }

  // Move 2: Relocate booking to different slot
  for (let i = 0; i < bookings.length; i++) {
    for (const slot of slots) {
      if (slot.id !== bookings[i].slotId) {
        moves.push({
          type: "move",
          from: i,
          slotId: slot.id,
        });
      }
    }
  }

  // Move 3: Remove a booking (might free up resources)
  for (let i = 0; i < bookings.length; i++) {
    if (!bookings[i].byUser) {
      // Only remove greedy bookings
      moves.push({
        type: "remove",
        from: i,
      });
    }
  }

  // Move 4: Add a new booking (if there's room)
  for (const slot of slots) {
    for (const venue of venues) {
      for (const event of events) {
        if (event.size <= venue.capacity) {
          moves.push({
            type: "add",
            slotId: slot.id,
            venueName: venue.name,
            eventSize: event.size,
          });
        }
      }
    }
  }

  return moves.slice(0, 100); // Limit moves for performance
}

function applyMove(bookings: Booking[], move: Move): Booking[] {
  const result = JSON.parse(JSON.stringify(bookings)) as Booking[];

  if (move.type === "swap" && move.from !== undefined && move.to !== undefined) {
    // Swap slot IDs
    [result[move.from].slotId, result[move.to].slotId] = [
      result[move.to].slotId,
      result[move.from].slotId,
    ];
  } else if (move.type === "move" && move.from !== undefined && move.slotId !== undefined) {
    result[move.from].slotId = move.slotId;
  } else if (move.type === "remove" && move.from !== undefined) {
    result.splice(move.from, 1);
  } else if (move.type === "add" && move.slotId !== undefined && move.venueName && move.eventSize) {
    result.push({
      venueName: move.venueName,
      eventSize: move.eventSize,
      slotId: move.slotId,
      byUser: false,
    });
  }

  return result;
}

function isValidSchedule(
  bookings: Booking[],
  venues: Venue[],
  events: Event[],
  slots: Slot[],
): boolean {
  const venueMap = new Map(venues.map((v) => [v.name, v]));
  const eventMap = new Map(events.map((e) => [e.size, e]));

  // Group by slot
  const bySlot = new Map<number, Booking[]>();
  for (const booking of bookings) {
    if (!bySlot.has(booking.slotId)) {
      bySlot.set(booking.slotId, []);
    }
    bySlot.get(booking.slotId)!.push(booking);
  }

  // Validate each slot
  for (const [slotId, slotBookings] of bySlot) {
    // No duplicate venues in same slot
    const venueSet = new Set(slotBookings.map((b) => b.venueName));
    if (venueSet.size !== slotBookings.length) return false;

    // Track totals
    let totalStaff = 0;
    let totalParking = 0;
    let totalPeople = 0;
    let largeEventCount = 0;

    for (const booking of slotBookings) {
      const venue = venueMap.get(booking.venueName);
      const event = eventMap.get(booking.eventSize);

      if (!venue || !event) return false;
      if (event.size > venue.capacity) return false;

      totalStaff += event.minStaff;
      totalParking += event.parkingRequired;
      totalPeople += event.size;

      if (booking.eventSize >= LARGE_EVENT_THRESHOLD) {
        largeEventCount++;
      }
    }

    // Check constraints
    if (totalStaff > STAFF_LIMIT) return false;
    if (totalParking > PARKING_LIMIT) return false;
    if (totalPeople > PEOPLE_LIMIT) return false;

    // Large event rule: if any large event, max 2 venues
    if (largeEventCount > 0 && slotBookings.length > MAX_VENUES_WITH_LARGE_EVENT) {
      return false;
    }
  }

  return true;
}

function calculateScore(
  bookings: Booking[],
  venues: Venue[],
  events: Event[],
  slots: Slot[],
  season: "winter" | "summer",
): number {
  const venueMap = new Map(venues.map((v) => [v.name, v]));
  const eventMap = new Map(events.map((e) => [e.size, e]));
  const slotMap = new Map(slots.map((s) => [s.id, s]));

  let totalRevenue = 0;
  let consecutiveBonus = 0;
  let fatigueCost = 0;

  // Calculate base revenue
  for (const booking of bookings) {
    const event = eventMap.get(booking.eventSize);
    const slot = slotMap.get(booking.slotId);
    if (!event || !slot) continue;

    const rate = season === "winter" ? event.winterRate : event.summerRate;
    const probability = getProbability(slot.id, season);
    const revenue = rate * slot.duration * probability;

    totalRevenue += revenue;
  }

  // Calculate consecutive slot bonus (+10%)
  const venueSlots = new Map<string, number[]>();
  for (const booking of bookings) {
    if (!venueSlots.has(booking.venueName)) {
      venueSlots.set(booking.venueName, []);
    }
    venueSlots.get(booking.venueName)!.push(booking.slotId);
  }

  for (const [venue, slotIds] of venueSlots) {
    const sorted = slotIds.sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] === sorted[i] + 1) {
        // Consecutive slots
        const booking = bookings.find((b) => b.venueName === venue && b.slotId === sorted[i]);
        if (booking) {
          const event = eventMap.get(booking.eventSize);
          if (event) {
            const slot = slotMap.get(sorted[i]);
            if (slot) {
              const rate = season === "summer" ? event.summerRate : event.winterRate;
              consecutiveBonus += rate * slot.duration * CONSECUTIVE_BONUS;
            }
          }
        }
      }
    }
  }

  // Calculate fatigue cost (-5000 if 3+ slots)
  for (const [venue, slotIds] of venueSlots) {
    if (slotIds.length >= FATIGUE_THRESHOLD) {
      fatigueCost += FATIGUE_COST;
    }
  }

  return totalRevenue + consecutiveBonus - fatigueCost;
}

function getProbability(slotId: number, season: "winter" | "summer"): number {
  // Slot IDs map to time periods
  const probabilities: Record<number, Record<string, number>> = {
    1: { winter: 0.65, summer: 0.55 }, // Morning
    2: { winter: 0.85, summer: 0.92 }, // Mid-Noon
    3: { winter: 0.7, summer: 0.75 }, // Late Afternoon
    4: { winter: 0.8, summer: 0.95 }, // Night
  };

  return probabilities[slotId]?.[season] || 0.7;
}
