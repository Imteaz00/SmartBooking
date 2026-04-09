"use client";

import { Calendar } from "@/components/ui/calendar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchDailyProfitByMonth } from "@/actions/fetchDailyProfitByMonth";

export default function Home() {
  const router = useRouter();

  const [profitData, setProfitData] = useState<Record<string, number>>({});

  function toLocalDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getHeatColor(date: Date) {
    const profit = profitData[toLocalDateKey(date)];

    if (profit === undefined) return "";

    if (profit < 50000) return "bg-red-200";
    if (profit < 100000) return "bg-yellow-200";
    if (profit < 150000) return "bg-green-300";
    return "bg-green-500 text-white";
  }

  useEffect(() => {
    handleMonth(new Date());
  }, []);

  async function handleMonth(date: Date) {
    try {
      const data = await fetchDailyProfitByMonth(date);
      setProfitData((data || {}) as Record<string, number>);
    } catch (error) {
      console.error("Error loading monthly profit data:", error);
    }
  }

  return (
    <div className="flex justify-center items-start pt-16 min-h-screen bg-muted/30">
      <div className="bg-white p-8 rounded-xl shadow-lg border w-105">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">SmartBooking Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Click a day to manage bookings and view profit optimization.
          </p>
        </div>

        <Calendar
          mode="single"
          captionLayout="dropdown"
          className="rounded-md border p-3 w-full"
          onMonthChange={(date) => handleMonth(date)}
          onDayClick={(date) => {
            const formatted = toLocalDateKey(date);
            router.push(`${formatted}`);
          }}
          modifiers={{
            profitable: (date) => {
              const key = toLocalDateKey(date);
              return profitData[key] !== undefined;
            },
          }}
          modifiersClassNames={{
            profitable: "font-semibold",
          }}
          components={{
            DayButton: ({ day, className, ...props }) => {
              const date = day.date;
              const heatColor = getHeatColor(date);

              return (
                <button
                  {...props}
                  className={`h-9 w-9 rounded-md hover:bg-gray-200 ${className ?? ""} ${heatColor}`}
                >
                  {date.getDate()}
                </button>
              );
            },
          }}
        />

        {/* Heatmap Legend */}

        <div className="flex justify-between mt-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 rounded"></div>
            {"<50000"}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-200 rounded"></div>
            {"<100000"}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-300 rounded"></div>
            {"<150000"}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            {"150000+"}
          </div>
        </div>
      </div>
    </div>
  );
}
