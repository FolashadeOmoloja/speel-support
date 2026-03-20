"use client";

import { format } from "date-fns";
import { Plus, FileText, AlertCircle, CheckCircle2, Timer } from "lucide-react";
import { IShift, ShiftType } from "@/models/Shift";
import clsx from "clsx";

const SHIFT_META: Record<
  ShiftType,
  { emoji: string; time: string; color: string; bg: string; border: string }
> = {
  Day: {
    emoji: "☀️",
    time: "9AM – 5PM",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  Night: {
    emoji: "🌙",
    time: "5PM – 9AM",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
};

interface Props {
  todayShifts: IShift[];
  overnightShift?: IShift;
  shifts: ShiftType[];
  teamMembers: string[];
  today: Date;
  onAdd: (slot: ShiftType) => void;
  onEdit: (shift: IShift) => void;
}

export default function TodaySummary({
  todayShifts,
  overnightShift,
  shifts,
  today,
  onAdd,
  onEdit,
}: Props) {
  // Overnight active night shift takes priority
  const activeShift =
    overnightShift ?? todayShifts.find((s) => s.status === "Active");

  const currentHour = today.getHours();
  const upcomingSlot: ShiftType = currentHour < 17 ? "Day" : "Night";
  const upcomingShift = !activeShift
    ? todayShifts.find(
        (s) => s.shift === upcomingSlot && s.status === "Not Started",
      )
    : null;

  return (
    <div className="space-y-4">
      {/* ON DUTY NOW */}
      {activeShift ? (
        <div className="rounded-2xl bg-ink text-white px-5 py-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-green-400 via-transparent to-transparent pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse-soft flex-shrink-0" />
            <p className="text-[11px] font-mono uppercase tracking-widest text-white/50">
              On Duty Now
            </p>
          </div>
          <p className="font-display text-5xl leading-none text-white">
            {activeShift.assignedTo}
          </p>
          <p className="text-sm text-white/50 mt-2">
            {SHIFT_META[activeShift.shift].emoji}&nbsp;{activeShift.shift} shift
            {activeShift.startTime ? ` · since ${activeShift.startTime}` : ""}
          </p>
          {activeShift.handoverNotes && (
            <div className="mt-4 flex items-start gap-2 bg-white/10 rounded-xl px-3 py-2.5">
              <FileText
                size={12}
                className="text-white/40 mt-0.5 flex-shrink-0"
              />
              <p className="text-xs text-white/70 leading-relaxed">
                {activeShift.handoverNotes}
              </p>
            </div>
          )}
          {activeShift.ticketsHandled > 0 && (
            <p className="mt-3 text-xs text-white/40">
              <CheckCircle2 size={11} className="inline mr-1" />
              {activeShift.ticketsHandled} tickets handled
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 px-5 py-6 text-center">
          <p className="text-3xl mb-2">😴</p>
          <p className="font-display text-2xl text-ink">No one on duty</p>
          {upcomingShift ? (
            <p className="text-sm text-muted mt-1.5">
              Next up:{" "}
              <span className="font-semibold text-ink">
                {upcomingShift.assignedTo}
              </span>
              &nbsp;· {SHIFT_META[upcomingShift.shift].emoji}{" "}
              {upcomingShift.shift}
            </p>
          ) : (
            <p className="text-sm text-muted mt-1.5">
              No shift assigned — tap below to add one
            </p>
          )}
        </div>
      )}

      {/* Date rule */}
      <div className="flex items-center gap-2 px-1 pt-1">
        <p className="text-xs font-mono text-muted whitespace-nowrap">
          {format(today, "EEEE, MMMM d")}
        </p>
        <div className="flex-1 h-px bg-border" />
        <p className="text-[10px] font-mono text-muted uppercase tracking-wider">
          All shifts
        </p>
      </div>

      {/* Shift slots */}
      {shifts.map((slot) => {
        const shift = todayShifts.find((s) => s.shift === slot);
        const meta = SHIFT_META[slot];
        const isActive = shift?.status === "Active";

        if (!shift) {
          return (
            <button
              key={slot}
              onClick={() => onAdd(slot)}
              className={clsx(
                "w-full glass-card p-4 flex items-center gap-4 border-dashed",
                "hover:border-ink/30 hover:shadow active:scale-[0.99] transition-all text-left",
                meta.border,
              )}
            >
              <div
                className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-xl",
                  meta.bg,
                )}
              >
                {meta.emoji}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">{slot} Shift</p>
                <p className="text-xs text-muted">{meta.time} · Unassigned</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center">
                <Plus size={16} className="text-muted" />
              </div>
            </button>
          );
        }

        return (
          <button
            key={slot}
            onClick={() => onEdit(shift)}
            className={clsx(
              "w-full glass-card p-4 text-left transition-all hover:shadow-md active:scale-[0.99]",
              isActive ? "ring-2 ring-green-300 border-green-200" : meta.border,
            )}
          >
            <div className="flex items-start gap-4">
              <div
                className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0",
                  meta.bg,
                )}
              >
                {meta.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-ink">
                    {shift.assignedTo}
                  </p>
                  <StatusBadge status={shift.status} />
                </div>
                <p className={clsx("text-xs font-medium mt-0.5", meta.color)}>
                  {slot} · {meta.time}
                </p>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {shift.ticketsHandled > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <CheckCircle2 size={11} />
                      <span>{shift.ticketsHandled} tickets</span>
                    </div>
                  )}
                  {shift.startTime && (
                    <div className="flex items-center gap-1 text-xs text-muted">
                      <Timer size={11} />
                      <span>
                        {shift.startTime}
                        {shift.endTime ? ` – ${shift.endTime}` : ""}
                      </span>
                    </div>
                  )}
                  {shift.issues?.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertCircle size={11} />
                      <span>
                        {shift.issues.length} issue
                        {shift.issues.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
                {shift.handoverNotes && (
                  <div className="mt-3 flex items-start gap-1.5 bg-black/[0.03] rounded-lg px-2.5 py-2">
                    <FileText
                      size={11}
                      className="text-muted mt-0.5 flex-shrink-0"
                    />
                    <p className="text-xs text-muted leading-relaxed line-clamp-2">
                      {shift.handoverNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
            {shift.issues?.length > 0 && (
              <div className="mt-3 pl-16 space-y-1">
                {shift.issues.slice(0, 2).map((issue, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 text-[10px] mt-0.5">⚠</span>
                    <p className="text-xs text-ink/70 leading-snug">{issue}</p>
                  </div>
                ))}
                {shift.issues.length > 2 && (
                  <p className="text-[10px] text-muted pl-4">
                    +{shift.issues.length - 2} more
                  </p>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-green-100 text-green-700",
    Completed: "bg-gray-100 text-gray-500",
    "Not Started": "bg-gray-50 text-gray-400",
  };
  return (
    <span
      className={clsx(
        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
        styles[status] ?? styles["Not Started"],
      )}
    >
      {status === "Active" && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse-soft" />
      )}
      {status}
    </span>
  );
}
