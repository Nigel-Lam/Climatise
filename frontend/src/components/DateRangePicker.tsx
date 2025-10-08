import React, { useMemo, useState } from "react";
import Calendar, { type CalendarProps } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useStationStore } from "../store";

type Mode = "single" | "range";
type CalValue = Date | [Date, Date] | null;

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export function DateRangePicker() {
  const { setEarliest, setLatest } = useStationStore();

  // local mode + calendar value (kept consistent so Calendar never flips uncontrolled <-> controlled)
  const [mode, setMode] = useState<Mode>("range");
  const [calendarValue, setCalendarValue] = useState<CalValue>(null);

  const endOfToday = useMemo(() => endOfDay(new Date()), []);

  const commitRange = (from: Date, to: Date) => {
    // only commit complete ranges to the store to avoid breaking charts
    setEarliest(startOfDay(from));
    setLatest(endOfDay(to));
  };

  const clearRange = () => {
    // keep charts happy by clearing both when selection is incomplete
    setEarliest(null as any);
    setLatest(null as any);
  };

  const handleChange: CalendarProps["onChange"] = (value) => {
    setCalendarValue(value as CalValue);

    if (mode === "single") {
      if (value instanceof Date) {
        commitRange(value, value);
      } else {
        clearRange();
      }
      return;
    }

    // range mode
    if (Array.isArray(value)) {
      const [from, to] = value;
      if (from && to) {
        commitRange(from, to);
      } else {
        clearRange();
      }
    } else {
      clearRange();
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setCalendarValue((prev) => {
      if (next === "single") {
        if (prev instanceof Date) return prev;
        if (Array.isArray(prev) && prev[0]) return prev[0];
        return null;
      } else {
        // to range
        if (Array.isArray(prev)) return prev;
        if (prev instanceof Date) return [prev, prev];
        return null;
      }
    });
    clearRange();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Date Picker</h2>
        <div className="join gap-2">
          <button
            type="button"
            onClick={() => switchMode("single")}
            className={`btn btn-sm join-item ${
              mode === "single"
                ? "!bg-blue-600 !text-white hover:!bg-blue-700"
                : "bg-base-200 text-base-content/70 hover:bg-base-300"
            }`}
          >
            Single
          </button>
          <button
            type="button"
            onClick={() => switchMode("range")}
            className={`btn btn-sm join-item ${
              mode === "range"
                ? "!bg-blue-600 !text-white hover:!bg-blue-700"
                : "bg-base-200 text-base-content/70 hover:bg-base-300"
            }`}
          >
            Range
          </button>
        </div>


      </div>

      <Calendar
        selectRange={mode === "range"}
        value={calendarValue as any}
        onChange={handleChange}
        maxDate={endOfToday}
        tileDisabled={({ date }) => date > endOfToday}
      />
    </div>
  );
}
