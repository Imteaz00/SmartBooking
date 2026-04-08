"use server";

import { BACKEND_URL } from "@/server";
import { Schedule } from "@/types";

export default async function saveSchedules({
  day,
  schedules,
}: {
  day: string;
  schedules: Schedule[];
}) {
  try {
    const res = await fetch(`${BACKEND_URL}/schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date: day, schedules }),
    });
  } catch (error) {
    console.error("Error saving schedules:", error);
  }
}
