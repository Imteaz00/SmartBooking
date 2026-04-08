"use server";

import { BACKEND_URL } from "@/server";

export default async function fetchSlots() {
  try {
    const res = await fetch(`${BACKEND_URL}/slots`);
    if (!res.ok) {
      throw new Error(`Server error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching slots:", error);
  }
}
