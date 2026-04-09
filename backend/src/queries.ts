import { db } from "./config/db.js";
import { and, eq, gte, lt } from "drizzle-orm";
import { schedule } from "./schema.js";
import { NewSchedule } from "./types.js";

export const getAllVenues = async () => {
  const venues = await db.query.venue.findMany({ orderBy: (v, { asc }) => [asc(v.capacity)] });
  return venues;
};

export const getAllSlots = async () => {
  const slots = await db.query.slot.findMany({ orderBy: (s, { asc }) => [asc(s.id)] });
  return slots;
};

export const getAllEvents = async () => {
  const events = await db.query.event.findMany({ orderBy: (e, { asc }) => [asc(e.size)] });
  return events;
};

export const getScheduleByDate = async (date: Date) => {
  const rows = await db.query.schedule.findMany({
    where: eq(schedule.date, date),
  });
  return rows;
};

export const saveSchedules = async ({
  scheduleRows,
  date,
}: {
  scheduleRows: NewSchedule[];
  date: Date;
}) => {
  const normalizedDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );

  await db.transaction(async (tx) => {
    const incomingKeys = new Set(scheduleRows.map((row) => `${row.venueName}:${row.slotId}`));

    const existingRows = await tx.query.schedule.findMany({
      where: eq(schedule.date, normalizedDate),
    });

    for (const existing of existingRows) {
      const existingKey = `${existing.venueName}:${existing.slotId}`;
      if (!incomingKeys.has(existingKey)) {
        await tx.delete(schedule).where(eq(schedule.id, existing.id));
      }
    }

    for (const row of scheduleRows) {
      const sanitizedRow = {
        date: normalizedDate,
        slotId: row.slotId,
        venueName: row.venueName,
        eventSize: row.eventSize,
        byUser: row.byUser ?? false,
      } satisfies NewSchedule;

      const existing = existingRows.find(
        (item) => item.venueName === row.venueName && item.slotId === row.slotId,
      );

      if (existing) {
        await tx
          .update(schedule)
          .set({ eventSize: sanitizedRow.eventSize, byUser: sanitizedRow.byUser })
          .where(eq(schedule.id, existing.id));
      } else {
        await tx.insert(schedule).values(sanitizedRow);
      }
    }
  });
};

export const getMonthlySchedules = async (date: Date) => {
  const startOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const startOfNextMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));

  const rows = await db.query.schedule.findMany({
    where: and(gte(schedule.date, startOfMonth), lt(schedule.date, startOfNextMonth)),
    orderBy: (s, { asc }) => [asc(s.date), asc(s.slotId), asc(s.venueName)],
  });

  return rows;
};
