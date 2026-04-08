import { event, schedule, slot, venue } from "./schema.js";

export type Schedule = typeof schedule.$inferSelect;
export type Venue = typeof venue.$inferSelect;
export type Slot = typeof slot.$inferSelect;
export type Event = typeof event.$inferSelect;

export type NewSchedule = typeof schedule.$inferInsert;
export type NewVenue = typeof venue.$inferInsert;
export type NewSlot = typeof slot.$inferInsert;
export type NewEvent = typeof event.$inferInsert;
