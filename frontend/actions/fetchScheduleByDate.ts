"use server";

import { BACKEND_URL } from "@/server";

export default async function fetchScheduleByDate(date: Date) {
  try {
    console.log(`Fetching schedule for date: ${date.toISOString().split("T")[0]}`);
    const res = await fetch(`${BACKEND_URL}/schedule/${date.toISOString().split("T")[0]}`);
    if (!res.ok) {
      throw new Error(`Server error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
}
