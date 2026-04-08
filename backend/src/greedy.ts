import type { Event, NewSchedule, Schedule, Slot, Venue } from "./types.js";

export function greedyOptimizer({
  venues,
  slots,
  events,
  date,
  fixedSlots = [],
}: {
  venues: Venue[];
  slots: Slot[];
  events: Event[];
  date: Date;
  fixedSlots?: { slotId: number; venueName: string; eventSize: number }[];
}) {
  const scheduleRows: NewSchedule[] = [];
  const season = getSeason(date);

  // Map fixed slots by slotId for quick lookup
  const fixedBySlot = new Map<number, { venueName: string; eventSize: number }[]>();
  for (const fixed of fixedSlots) {
    if (!fixedBySlot.has(fixed.slotId)) {
      fixedBySlot.set(fixed.slotId, []);
    }
    fixedBySlot.get(fixed.slotId)!.push(fixed);
  }

  // Process each slot
  for (const slot of slots) {
    const selected: { venueName: string; eventSize: number }[] = [];

    // First, add all fixed bookings for this slot
    if (fixedBySlot.has(slot.id)) {
      for (const fixed of fixedBySlot.get(slot.id)!) {
        scheduleRows.push({
          date,
          slotId: slot.id,
          venueName: fixed.venueName,
          eventSize: fixed.eventSize,
          byUser: true,
        });
        selected.push(fixed);
      }
    }

    // Then, run greedy to fill remaining capacity
    const greedySelected = greedySlot(venues, events, slot, season, selected);

    for (const item of greedySelected) {
      scheduleRows.push({
        date,
        slotId: slot.id,
        venueName: item.venueName,
        eventSize: item.eventSize,
        byUser: false,
      });
    }
  }

  return scheduleRows;
}

function getSeason(date: Date): "winter" | "summer" {
  const month = date.getMonth();
  return month >= 3 && month <= 10 ? "summer" : "winter";
}

function greedySlot(
  venues: Venue[],
  events: Event[],
  slot: Slot,
  season: "winter" | "summer",
  alreadySelected: { venueName: string; eventSize: number }[],
) {
  // Generate all venue + event combinations
  const options = [];
  for (const venue of venues) {
    for (const event of events) {
      if (event.size > venue.capacity) continue;

      const rate = season === "winter" ? event.winterRate : event.summerRate;
      const probability = season === "winter" ? slot.winterProb : slot.summerProb;
      const revenue = rate * slot.duration;
      const expectedRevenue = revenue * probability;
      const density = expectedRevenue / event.minStaff;

      options.push({
        venueName: venue.name,
        eventSize: event.size,
        staff: event.minStaff,
        parking: event.parkingRequired,
        people: event.size,
        density,
      });
    }
  }

  // Sort by density (profit per staff) descending
  options.sort((a, b) => b.density - a.density);

  // Track current resource usage
  let staffUsed = 0;
  let parkingUsed = 0;
  let peopleUsed = 0;
  let largeEventsCount = 0;

  // Add resource usage from already selected items
  for (const selected of alreadySelected) {
    const event = events.find((e) => e.size === selected.eventSize);
    if (event) {
      staffUsed += event.minStaff;
      parkingUsed += event.parkingRequired;
      peopleUsed += event.size;
      if (selected.eventSize >= 1250) largeEventsCount++;
    }
  }

  const usedVenues = new Set(alreadySelected.map((s) => s.venueName));
  const selected = [];

  // Check if any large event (>= 1250) already exists
  const hasLargeEvent = largeEventsCount > 0;

  // Greedily pick options while respecting constraints
  for (const opt of options) {
    // Skip if venue already booked in this slot
    if (usedVenues.has(opt.venueName)) continue;

    // Check all constraints
    if (staffUsed + opt.staff > 12) continue;
    if (parkingUsed + opt.parking > 450) continue;
    if (peopleUsed + opt.people > 2600) continue;

    // If slot has ANY large event (existing or current option), max 2 venues total
    const optIsLarge = opt.eventSize >= 1250;
    if ((hasLargeEvent || optIsLarge) && usedVenues.size >= 2) continue;

    // Accept this option
    selected.push({
      venueName: opt.venueName,
      eventSize: opt.eventSize,
    });

    usedVenues.add(opt.venueName);
    staffUsed += opt.staff;
    parkingUsed += opt.parking;
    peopleUsed += opt.people;

    if (opt.eventSize >= 1250) largeEventsCount++;
  }

  return selected;
}
