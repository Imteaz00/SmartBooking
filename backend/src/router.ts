import { Router } from "express";
import {
  getAllEvents,
  getAllSlots,
  getAllVenues,
  getLastSlots,
  greedy,
  hillClimbing,
  saveSchedules,
  getScheduleByDate,
  getDailyProfitByMonth,
} from "./controller.js";

const routers = Router();

routers.post("/greedy", greedy);
routers.post("/hillClimb", hillClimbing);
routers.get("/venues", getAllVenues);
routers.get("/slots", getAllSlots);
routers.get("/events", getAllEvents);
routers.get("/schedule/:date", getScheduleByDate);
routers.get("/lastSlots/:day", getLastSlots);
routers.get("/schedule/dailyProfitByMonth/:date", getDailyProfitByMonth);
routers.post("/schedules", saveSchedules);

export default routers;
