"use client";

import fetchEvents from "@/actions/fetchEvents";
import fetchVenues from "@/actions/fetchVenues";
import fetchSlots from "@/actions/fetchSlots";
import runGreedy from "@/actions/runGreedy";
import { Button } from "@/components/ui/button";
import type { Venue, Slot, Event, Schedule } from "@/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import runHillClimbing from "@/actions/runHillClimbing";
import saveSchedules from "@/actions/saveSchedules";
import Link from "next/link";
import fetchScheduleByDate from "@/actions/fetchScheduleByDate";
import { fetchPrevDayLastSlots } from "@/actions/fetchPrevDayLastSlots";

export default function SchedulerPage() {
  const { day } = useParams<{ day: string }>();
  const [bookings, setBookings] = useState<Schedule[]>([]);
  const [prevBookings, setPrevBookings] = useState<Schedule[]>([]);

  const [events, setEvents] = useState<Event[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  useEffect(() => {
    fetchEvents().then((fetchedEvents) => {
      setEvents(fetchedEvents);
    });
    fetchSlots().then((fetchedSlots) => {
      setSlots(fetchedSlots);
    });
    fetchVenues().then((fetchedVenues) => {
      setVenues(fetchedVenues);
    });
    fetchScheduleByDate(new Date(day)).then((fetchedSchedule) => {
      setBookings(fetchedSchedule);
    });
    fetchPrevDayLastSlots(new Date(day)).then((fetchedPrevSlots) => {
      setPrevBookings(fetchedPrevSlots);
    });
  }, []);

  console.log("Current bookings:", bookings);
  console.log("Previous bookings:", prevBookings);

  const month = Number((day ?? "").split("-")[1] ?? "1");
  const isWinter = month === 11 || month === 12 || month === 1 || month === 2;

  // Get booking for a specific venue-slot combination
  const getBooking = (venueName: string, slotId: number): number => {
    return bookings.find((b) => b.venueName === venueName && b.slotId === slotId)?.eventSize ?? 0;
  };

  // Update or create a booking
  const updateBooking = (venueName: string, slotId: number, eventSize: number) => {
    setBookings((prev) => {
      const existing = prev.findIndex((b) => b.venueName === venueName && b.slotId === slotId);
      if (existing !== -1) {
        if (eventSize === 0) {
          // Remove if eventSize is 0
          return prev.filter((_, i) => i !== existing);
        }
        // Update existing
        return prev.map((b, i) => (i === existing ? { slotId, venueName, eventSize } : b));
      }
      if (eventSize === 0) return prev; // Don't add if eventSize is 0
      if (!!prevBookings.find((b) => b.venueName === venueName && slotId === 1)) return prev; // Don't add if previous day has booking for slot 1 (rest and clean)
      return [...prev, { slotId, venueName, eventSize }];
    });
  };

  const eventSizes = [0, ...events.map((event) => event.size)];
  const eventBySize = new Map(events.map((event) => [event.size, event]));
  const alerts: String[] = [];
  const venueUsageCount: Record<string, number> = Object.fromEntries(
    venues.map((venue) => [venue.name, 0]),
  );
  let totalRevenue = 0;

  // Validate constraints and calculate profit
  for (const slot of slots) {
    const slotBookings = venues
      .map((venue) => {
        const eventSize = getBooking(venue.name, slot.id);
        const event = eventBySize.get(eventSize);

        return {
          venue,
          eventSize,
          event,
        };
      })
      .filter((booking) => booking.eventSize > 0);

    const activeVenueCount = slotBookings.length;
    const hasLargeEvent = slotBookings.some((booking) => booking.eventSize >= 1250);
    const totalPeople = slotBookings.reduce((sum, booking) => sum + booking.eventSize, 0);
    const totalParkingRequired = slotBookings.reduce(
      (sum, booking) => sum + (booking.event?.parkingRequired ?? 0),
      0,
    );
    const totalStaffRequired = slotBookings.reduce(
      (sum, booking) => sum + (booking.event?.minStaff ?? 0),
      0,
    );

    // Constraint 1: Max 2 venues for large events
    if (hasLargeEvent && activeVenueCount > 2) {
      alerts.push(
        `${slot.name}: Event size >= 1250 allows at most 2 active venues, found ${activeVenueCount}.`,
      );
    }

    // Constraint 2: Parking limit
    if (totalParkingRequired > 450) {
      alerts.push(`${slot.name}: Total parking required is ${totalParkingRequired}, limit is 450.`);
    }

    // Constraint 3: Total people limit
    if (totalPeople > 2600) {
      alerts.push(`${slot.name}: Total booked people is ${totalPeople}, limit is 2600.`);
    }

    // Constraint 4: Staff limit
    if (totalStaffRequired > 12) {
      alerts.push(`${slot.name}: Total staff required is ${totalStaffRequired}, limit is 12.`);
    }

    // Calculate revenue with consecutive slot bonus
    for (const booking of slotBookings) {
      venueUsageCount[booking.venue.name] += 1;

      if (!booking.event) {
        continue;
      }

      const durationHours = slot.duration;
      const hourlyRate = isWinter ? booking.event.winterRate : booking.event.summerRate;
      let bookingRevenue = hourlyRate * durationHours;

      // Consecutive slot bonus: +10% if used in previous slot
      if (slot.id > 1) {
        const wasUsedInPreviousSlot = getBooking(booking.venue.name, slot.id - 1) > 0;
        if (wasUsedInPreviousSlot) {
          bookingRevenue *= 1.1;
        }
      }

      totalRevenue += bookingRevenue;
    }
  }

  // Calculate costs
  const venueCost = venues.reduce((sum, venue) => {
    const isUsed = slots.some((slot) => getBooking(venue.name, slot.id) > 0);
    return sum + (isUsed ? venue.dailyCost : 0);
  }, 0);

  const fatigueCost = venues.reduce(
    (sum, venue) => sum + (venueUsageCount[venue.name] >= 3 ? 5000 : 0),
    0,
  );

  const netProfit = totalRevenue - venueCost - fatigueCost;

  const handleGreedy = async () => {
    const greedyBookings = await runGreedy({ day, fixedSlots: bookings });
    console.log(greedyBookings);
    if ("error" in greedyBookings) {
      alert("Error running greedy algorithm: " + greedyBookings.error);
      return;
    }
    greedyBookings.forEach((booking) => {
      updateBooking(booking.venueName, booking.slotId, booking.eventSize);
    });
  };

  const handleOptimizer = async () => {
    const optimizedBookings = await runHillClimbing({ day, fixedSlots: bookings });
    console.log(optimizedBookings);
    if ("error" in optimizedBookings) {
      alert("Error running optimization: " + optimizedBookings.error);
      return;
    }
    optimizedBookings.forEach((booking) => {
      updateBooking(booking.venueName, booking.slotId, booking.eventSize);
    });
  };

  const clearBookings = () => {
    setBookings([]);
  };

  const handleSave = async () => {
    saveSchedules({ day, schedules: bookings })
      .then(() => {
        alert("Schedules saved successfully!");
      })
      .catch((error) => {
        alert("Error saving schedules: " + error);
      });
  };

  const hasViolations = alerts.length > 0;

  return (
    <div className="flex gap-6 p-6">
      {/* Scheduler Grid */}
      <div className="flex-1 bg-white rounded-xl shadow p-6">
        <Link href="/" className="text-sm text-gray-500 mb-4 inline-block">
          &larr; Back to Dashboard
        </Link>
        <h2 className="text-xl font-semibold mb-4">Daily Scheduler ({day})</h2>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Venue</th>
              {slots.map((slot) => (
                <th key={slot.id} className="p-3 text-center">
                  {slot.name}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {venues.map((venue) => (
              <tr key={venue.name} className="border-t">
                <td className="p-3 font-medium">Venue {venue.name}</td>

                {slots.map((slot) => {
                  const value = getBooking(venue.name, slot.id);

                  return (
                    <td key={slot.id} className="p-3 text-center">
                      {!!prevBookings.find((b) => b.venueName === venue.name && slot.id === 1) ? (
                        <span className="text-green-600">Rest and Clean</span>
                      ) : (
                        <select
                          className="border rounded px-2 py-1"
                          value={value}
                          onChange={(e) =>
                            updateBooking(venue.name, slot.id, Number(e.target.value))
                          }
                        >
                          {eventSizes.map(
                            (size) =>
                              size <= venue.capacity && (
                                <option key={size} value={size}>
                                  {size === 0 ? "None" : size}
                                </option>
                              ),
                          )}
                        </select>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right Panel */}
      <div className="w-[320px] flex flex-col gap-6">
        {/* Profit Panel */}
        <div className="bg-white shadow rounded-xl p-5">
          <h3 className="font-semibold text-lg mb-3">Profit Summary</h3>

          <div className="space-y-2 text-sm">
            <p>
              Total Revenue: <b>{Math.round(totalRevenue).toLocaleString()} BDT</b>
            </p>
            <p>
              Venue Costs: <b>{venueCost.toLocaleString()} BDT</b>
            </p>
            <p>
              Fatigue Cost: <b>{fatigueCost} BDT</b>
            </p>

            <div className="border-t pt-2 mt-2">
              <p
                className={`text-lg font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                Net Profit: {Math.round(netProfit).toLocaleString()} BDT
              </p>
            </div>
          </div>
        </div>

        {/* Constraint Alerts */}
        <div className="bg-white shadow rounded-xl p-5">
          <h3 className="font-semibold text-lg mb-3">Constraint Alerts</h3>

          <ul className="text-sm space-y-2">
            {alerts.length === 0 ? (
              <li className="text-green-600">✓ No violations</li>
            ) : (
              alerts.map((alert, id) => (
                <li key={id} className="text-red-600">
                  ⚠ {alert}
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Optimization Panel */}
        <div className="bg-white shadow rounded-xl p-5">
          <h3 className="font-semibold text-lg mb-3">Optimization</h3>

          <div className="flex flex-col gap-3">
            <Button
              className="bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
              disabled={hasViolations}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              onClick={handleGreedy}
            >
              Run Greedy Algorithm
            </Button>

            <Button
              className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
              onClick={handleOptimizer}
            >
              Maximize Profit
            </Button>
            <Button
              className="bg-red-600 text-white py-2 rounded hover:bg-red-700"
              onClick={clearBookings}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
