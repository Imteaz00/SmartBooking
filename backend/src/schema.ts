import {
  boolean,
  date,
  integer,
  pgTable,
  real,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const schedule = pgTable("schedule", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date", { mode: "date" }).notNull(),
  slotId: integer("slot_id")
    .notNull()
    .references(() => slot.id),
  venueName: text("venue_name")
    .notNull()
    .references(() => venue.name),
  eventSize: integer("event_size")
    .notNull()
    .references(() => event.size),
  byUser: boolean("by_user").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const venue = pgTable("venue", {
  name: text("name").primaryKey(),
  capacity: integer("capacity").notNull(),
  dailyCost: integer("daily_cost").notNull(),
  parkingSpots: integer("parking_spots").notNull(),
});

export const slot = pgTable("slot", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  duration: real("duration").notNull(),
  winterProb: real("winter_prob").notNull(),
  summerProb: real("summer_prob").notNull(),
});

export const event = pgTable("event", {
  size: integer("size").primaryKey(),
  winterRate: integer("winter_rate").notNull(),
  summerRate: integer("summer_rate").notNull(),
  minStaff: integer("min_staff").notNull(),
  parkingRequired: integer("parking_required").notNull(),
});
