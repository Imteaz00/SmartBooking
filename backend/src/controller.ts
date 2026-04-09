import { Request, Response } from "express";
import { greedyOptimizer } from "./greedy.js";
import { hillClimbingOptimizer } from "./hillClimbing.js";
import * as queries from "./queries.js";

export const greedy = async (req: Request, res: Response) => {
  try {
    const venues = await queries.getAllVenues();
    const slots = await queries.getAllSlots();
    const events = await queries.getAllEvents();
    const date = new Date(req.body.date);
    const fixedSlots = req.body.fixedSlots;

    const scheduleRow = greedyOptimizer({
      venues,
      slots,
      events,
      date,
      fixedSlots,
    });
    return res.json(scheduleRow);
  } catch (error) {
    console.error("Error in greedy optimizer:", error);
    res.status(500).json({ error: "An error occurred while using the greedy optimizer." });
  }
};

export const hillClimbing = async (req: Request, res: Response) => {
  try {
    const venues = await queries.getAllVenues();
    const slots = await queries.getAllSlots();
    const events = await queries.getAllEvents();
    const date = new Date(req.body.date);
    const fixedSlots = req.body.fixedSlots;

    // Phase 1: Greedy solution
    const greedySolution = greedyOptimizer({
      venues,
      slots,
      events,
      date,
      fixedSlots,
    });

    // Phase 2: Improve with hill climbing
    const improvedSolution = hillClimbingOptimizer(
      venues,
      slots,
      events,
      greedySolution.map((b) => ({
        venueName: b.venueName,
        eventSize: b.eventSize,
        slotId: b.slotId,
        byUser: b.byUser || false,
      })),
      date,
    );

    return res.json(improvedSolution);
  } catch (error) {
    console.error("Error in optimization:", error);
    res.status(500).json({ error: "An error occurred during optimization." });
  }
};

export const getAllVenues = async (req: Request, res: Response) => {
  try {
    const venues = await queries.getAllVenues();
    return res.json(venues);
  } catch (error) {
    console.error("Error fetching venues:", error);
    res.status(500).json({ error: "An error occurred while fetching venues." });
  }
};

export const getAllSlots = async (req: Request, res: Response) => {
  try {
    const slots = await queries.getAllSlots();
    res.json(slots);
  } catch (error) {
    console.error("Error fetching slots:", error);
    res.status(500).json({ error: "An error occurred while fetching slots." });
  }
};

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const events = await queries.getAllEvents();
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "An error occurred while fetching events." });
  }
};

export const getScheduleByDate = async (req: Request, res: Response) => {
  try {
    const date = new Date(req.params.date as string);
    const schedule = await queries.getScheduleByDate(date);
    res.json(schedule);
  } catch (error) {
    console.error("Error fetching schedule:", error);
    res.status(500).json({ error: "An error occurred while fetching schedule." });
  }
};

export const getDailyProfitByMonth = async (req: Request, res: Response) => {
  try {
    const date = new Date(req.params.date as string);
    const schedules = await queries.getMonthlySchedules(date);

    const venues = await queries.getAllVenues();
    const slots = await queries.getAllSlots();
    const events = await queries.getAllEvents();

    const venueMap = new Map(venues.map((venue) => [venue.name, venue]));
    const slotMap = new Map(slots.map((slot) => [slot.id, slot]));
    const eventMap = new Map(events.map((event) => [event.size, event]));

    const byDate = new Map<string, typeof schedules>();
    for (const row of schedules) {
      const adjustedDate = new Date(row.date);
      const key = adjustedDate.toISOString().split("T")[0];
      const dayRows = byDate.get(key) || [];
      dayRows.push(row);
      byDate.set(key, dayRows);
    }

    const profitByDate = Object.fromEntries(
      Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([day, dayRows]) => {
          const dayDate = new Date(day);
          const month = dayDate.getMonth() + 1;
          const isWinter = month === 11 || month === 12 || month === 1 || month === 2;

          let totalExpectedRevenue = 0;
          const usedVenues = new Set<string>();
          const venueSlotIds = new Map<string, number[]>();

          for (const booking of dayRows) {
            const venue = venueMap.get(booking.venueName);
            const slot = slotMap.get(booking.slotId);
            const event = eventMap.get(booking.eventSize);
            if (!venue || !slot || !event) continue;

            const rate = isWinter ? event.winterRate : event.summerRate;
            const expectedRevenue = rate * slot.duration;

            totalExpectedRevenue += expectedRevenue;
            usedVenues.add(venue.name);

            const ids = venueSlotIds.get(venue.name) || [];
            ids.push(slot.id);
            venueSlotIds.set(venue.name, ids);
          }

          let consecutiveBonus = 0;
          let fatigueCost = 0;

          for (const [venueName, slotIds] of venueSlotIds.entries()) {
            const sortedUnique = Array.from(new Set(slotIds)).sort((a, b) => a - b);

            if (sortedUnique.length >= 3) {
              fatigueCost += 5000;
            }

            for (let i = 1; i < sortedUnique.length; i++) {
              if (sortedUnique[i] === sortedUnique[i - 1] + 1) {
                const prevSlotId = sortedUnique[i - 1];
                const prevSlot = slotMap.get(prevSlotId);
                const prevBooking = dayRows.find(
                  (row) => row.venueName === venueName && row.slotId === prevSlotId,
                );
                const prevEvent = prevBooking ? eventMap.get(prevBooking.eventSize) : undefined;

                if (prevSlot && prevEvent) {
                  const prevRate = isWinter ? prevEvent.winterRate : prevEvent.summerRate;
                  const prevExpectedRevenue = prevRate * prevSlot.duration;
                  consecutiveBonus += prevExpectedRevenue * 0.1;
                }
              }
            }
          }

          const venueCost = Array.from(usedVenues).reduce((sum, venueName) => {
            const venue = venueMap.get(venueName);
            return sum + (venue ? venue.dailyCost : 0);
          }, 0);

          const netProfit = totalExpectedRevenue + consecutiveBonus - venueCost - fatigueCost;
          return [day, Math.round(netProfit)] as const;
        }),
    );
    return res.json(profitByDate);
  } catch (error) {
    console.error("Error fetching monthly schedule:", error);
    return res.status(500).json({ error: "An error occurred while fetching monthly schedule." });
  }
};

export const saveSchedules = async (req: Request, res: Response) => {
  try {
    const scheduleRows = req.body.schedules;
    const date = new Date(req.body.date as string);
    await queries.saveSchedules({ scheduleRows, date });
    res.json({ message: "Schedules saved successfully." });
  } catch (error) {
    console.error("Error saving schedules:", error);
    res.status(500).json({ error: "An error occurred while saving schedules." });
  }
};

export const getLastSlots = async (req: Request, res: Response) => {
  try {
    const day = new Date(req.params.day as string);
    const schedule = await queries.getScheduleByDate(day);
    const lastSlots = schedule.filter((row) => row.slotId === 4);
    res.json(lastSlots);
  } catch (error) {
    console.error("Error fetching last slots:", error);
    res.status(500).json({ error: "An error occurred while fetching last slots." });
  }
};
