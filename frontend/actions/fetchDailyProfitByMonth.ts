"use server";

import { BACKEND_URL } from "@/server";
import { format } from "date-fns";

export async function fetchDailyProfitByMonth(date: Date) {
  try {
    const formattedDate = format(date, "yyyy-MM-dd");
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
