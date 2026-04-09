"use server";

import { BACKEND_URL } from "@/server";

export default async function fetchScheduleByDate(date: Date) {
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;

    console.log(`Fetching schedule for date: ${formattedDate}`);
    const res = await fetch(`${BACKEND_URL}/schedule/${formattedDate}`);
    if (!res.ok) {
      throw new Error(`Server error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
}
