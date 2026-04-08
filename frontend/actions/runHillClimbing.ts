"use server";

import { BACKEND_URL } from "@/server";
import { Schedule } from "@/types";

export default async function runHillClimbing({
  day,
  fixedSlots,
}: {
  day: string;
  fixedSlots?: Schedule[];
}): Promise<Schedule[] | { error: any }> {
  try {
    const res = await fetch(`${BACKEND_URL}/hillClimb`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        date: new Date(day),
        fixedSlots: fixedSlots || [],
      }),
    });
    if (!res.ok) {
      throw new Error(`Server error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    return { error };
  }
}
