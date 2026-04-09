"use server";

import { BACKEND_URL } from "@/server";

export async function fetchPrevDayLastSlots(day: Date) {
  try {
    const prevDay = new Date(day);
    prevDay.setDate(prevDay.getDate() - 1);

    const year = prevDay.getFullYear();
    const month = String(prevDay.getMonth() + 1).padStart(2, "0");
    const dayOfMonth = String(prevDay.getDate()).padStart(2, "0");
    const prevDayString = `${year}-${month}-${dayOfMonth}`;
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
