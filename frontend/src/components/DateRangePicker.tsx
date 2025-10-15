import { useEffect, useMemo, useRef, useState } from "react";
import Calendar, { type CalendarProps } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useStationStore } from "../store";

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

const fmt = (d?: Date | null) =>
  d ? d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";

export function DateRangePicker() {
  const { setEarliest, setLatest } = useStationStore();

  // Local selection (range) and popover state
  const [calendarValue, setCalendarValue] = useState<CalValue>(null);
  const [open, setOpen] = useState(false);

  const endOfToday = useMemo(() => endOfDay(new Date()), []);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const commitRange = (from: Date, to: Date) => {
    setEarliest(startOfDay(from));
    setLatest(endOfDay(to));
  };

  const clearRange = () => {
    setEarliest(null as never);
    setLatest(null as never);
    setCalendarValue(null);
  };

  // Close on outside click / ESC
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Calendar change handler (always in range mode)
  const onCalChange: CalendarProps["onChange"] = (value) => {
    setCalendarValue(value as CalValue);
    if (Array.isArray(value)) {
      const [from, to] = value;
      if (from && to) {
        commitRange(from, to);
        // Slight delay so Calendar can visually apply the range before closing
        requestAnimationFrame(() => setOpen(false));
      }
    } else {
      // clicked a single day while building range; don't commit yet
    }
  };

  // Derive what to show in the boxes from our local selection
  const from = Array.isArray(calendarValue) ? calendarValue[0] : null;
  const to = Array.isArray(calendarValue) ? calendarValue[1] : null;

  return (
    <div className="relative w-full">
      {/* Trigger / condensed input */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full border rounded-xl px-4 py-2 text-left hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          {/* Start box */}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">Start</div>
            <div className={`truncate ${from ? "text-gray-900" : "text-gray-400"}`}>
              {from ? fmt(from) : "Add dates"}
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200" />

          {/* End box */}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wide text-gray-500">End</div>
            <div className={`truncate ${to ? "text-gray-900" : "text-gray-400"}`}>
              {to ? fmt(to) : "Add dates"}
            </div>
          </div>

          {/* Clear button (only when a range is selected) */}
          {from || to ? (
            <div className="ml-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearRange();
                }}
                className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md hover:bg-gray-100"
                aria-label="Clear dates"
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>
      </button>

      {/* Popover */}
      {open && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Choose date range"
          className="absolute z-50 mt-2 rounded-xl border bg-white shadow-lg"
          style={{
            // simple positioning under trigger; grow with content
            minWidth: 320
          }}
        >
          <div className="p-3">
            <Calendar
              selectRange
              value={calendarValue as any}
              onChange={onCalChange}
              maxDate={endOfToday}
              tileDisabled={({ date }) => date > endOfToday}
              // Slightly nicer sizing inside the popover
              prev2Label={null}
              next2Label={null}
            />
            <div className="flex items-center justify-between mt-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <div className="text-xs text-gray-500">
                {from && !to && "Select an end date"}
                {!from && !to && "Select a start date"}
                {from && to && `${fmt(from)} → ${fmt(to)}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
