"use server";

import { BACKEND_URL } from "@/server";

export default async function fetchVenues() {
  try {
    const res = await fetch(`${BACKEND_URL}/venues`);
    if (!res.ok) {
      throw new Error(`Server error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching venues:", error);
  }
}
