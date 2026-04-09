"use server";

import { BACKEND_URL } from "@/server";

export async function fetchPrevDayLastSlots(day: Date) {
  try {
    day.setDate(day.getDate() - 1);

    const prevDayString = day.toISOString().split("T")[0];
    const res = await fetch(`${BACKEND_URL}/lastSlots/${prevDayString}`);
    if (!res.ok) {
      throw new Error(`Server error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching previous day's last slots:", error);
    throw error;
  }
}
