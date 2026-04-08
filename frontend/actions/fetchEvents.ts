"use server";

import { BACKEND_URL } from "@/server";

export default async function fetchEvents() {
  try {
    const res = await fetch(`${BACKEND_URL}/events`);
    if (!res.ok) {
      throw new Error(`Server error: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching events:", error);
  }
}
