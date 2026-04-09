"use server";

import { BACKEND_URL } from "@/server";

export async function fetchDailyProfitByMonth(date: Date) {
  try {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const formattedDate = `${year}-${month}`;

    console.log(`Fetching daily profit for month: ${formattedDate}`);

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
