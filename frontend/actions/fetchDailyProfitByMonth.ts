"use server";

import { BACKEND_URL } from "@/server";

export async function fetchDailyProfitByMonth({ month, year }: { month: number; year: number }) {
  try {
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}`;

    const response = await fetch(`${BACKEND_URL}/schedule/dailyProfitByMonth/${formattedDate}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch daily profit: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching daily profit by month:", error);
    throw error;
  }
}
