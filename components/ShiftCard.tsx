'use client'

import { Plus } from 'lucide-react'
import { IShift, ShiftType } from '@/models/Shift'
import clsx from 'clsx'

const SLOT_STYLES: Record<ShiftType, { bg: string; dot: string; border: string; emoji: string }> = {
  Day: {
    emoji: '☀️',
    bg: 'bg-amber-50',
    dot: 'bg-amber-400',
    border: 'border-amber-200',
  },
  Night: {
    emoji: '🌙',
    bg: 'bg-indigo-50',
    dot: 'bg-indigo-400',
    border: 'border-indigo-200',
  },
}

const STATUS_COLORS: Record<string, string> = {
  Active: 'text-green-700 bg-green-100',
  Completed: 'text-gray-500 bg-gray-100',
  'Not Started': 'text-gray-400 bg-gray-50',
}

interface Props {
  slot: ShiftType
  shift?: IShift
  isPast: boolean
  onAdd: () => void
  onEdit: () => void
}

export default function ShiftCard({ slot, shift, isPast, onAdd, onEdit }: Props) {
  const style = SLOT_STYLES[slot]

  if (!shift) {
    return (
      <button
        onClick={onAdd}
        className={clsx(
          'group relative rounded-xl border border-dashed p-3 text-left transition-all duration-150',
          'hover:border-ink/30 hover:bg-black/2 active:scale-95',
          isPast ? 'opacity-40 pointer-events-none' : '',
          style.border, style.bg
        )}
      >
        <p className="text-[10px] font-mono text-muted mb-1.5">{style.emoji} {slot}</p>
        <div className="flex items-center gap-1 text-muted group-hover:text-ink transition-colors">
          <Plus size={12} />
          <span className="text-xs">Assign</span>
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onEdit}
      className={clsx(
        'relative rounded-xl border p-3 text-left transition-all duration-150',
        'hover:shadow-md hover:-translate-y-0.5 active:scale-95',
        style.border, style.bg
      )}
    >
      {shift.status === 'Active' && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-500 animate-pulse-soft" />
      )}
      <p className="text-[10px] font-mono text-muted mb-1">{style.emoji} {slot}</p>
      <p className="text-sm font-bold text-ink leading-tight truncate">{shift.assignedTo}</p>
      <p className={clsx('text-[10px] font-semibold mt-1.5 px-1.5 py-0.5 rounded-md inline-block', STATUS_COLORS[shift.status])}>
        {shift.status}
      </p>
      {shift.ticketsHandled > 0 && (
        <p className="text-[10px] text-muted mt-1">{shift.ticketsHandled} tickets</p>
      )}
    </button>
  )
}
