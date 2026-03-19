'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, RefreshCw } from 'lucide-react'
import ShiftCard from './ShiftCard'
import ShiftModal from './ShiftModal'
import TodaySummary from './TodaySummary'
import { IShift, ShiftType } from '@/models/Shift'

const SHIFTS: ShiftType[] = ['Day', 'Night']
const TEAM_MEMBERS = ['Folashade', 'Seun']

export default function Dashboard() {
  const today = new Date()
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(today, { weekStartsOn: 1 })
  )
  const [shifts, setShifts] = useState<IShift[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editShift, setEditShift] = useState<IShift | null>(null)
  const [defaultDate, setDefaultDate] = useState<string>('')
  const [defaultSlot, setDefaultSlot] = useState<ShiftType>('Day')
  const [activeTab, setActiveTab] = useState<'week' | 'today'>('today')

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const fetchShifts = useCallback(async () => {
    setLoading(true)
    try {
      const startStr = weekStart.toISOString().split('T')[0]
      const res = await fetch(`/api/shifts?week=${startStr}`)
      const json = await res.json()
      if (json.success) setShifts(json.data)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { fetchShifts() }, [fetchShifts])

  const getShift = (date: Date, slot: ShiftType) => {
    const dateStr = date.toISOString().split('T')[0]
    return shifts.find(s => s.date === dateStr && s.shift === slot)
  }

  const openCreate = (date: Date, slot: ShiftType) => {
    setEditShift(null)
    setDefaultDate(date.toISOString().split('T')[0])
    setDefaultSlot(slot)
    setModalOpen(true)
  }

  const openEdit = (shift: IShift) => {
    setEditShift(shift)
    setModalOpen(true)
  }

  const todayShifts = shifts.filter(s => {
    const todayStr = today.toISOString().split('T')[0]
    return s.date === todayStr
  })

  return (
    <div className="min-h-dvh bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-paper/90 backdrop-blur-md border-b border-border px-4 pt-safe">
        <div className="max-w-2xl mx-auto flex items-center justify-between h-14">
          <div>
            <h1 className="font-display text-xl text-ink leading-none">Speel</h1>
            <p className="text-[10px] font-mono text-muted tracking-widest uppercase">Support Tracker</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchShifts}
              className="p-2 rounded-xl hover:bg-black/5 text-muted active:scale-95 transition-all"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => {
                setEditShift(null)
                setDefaultDate(today.toISOString().split('T')[0])
                setDefaultSlot('Day')
                setModalOpen(true)
              }}
              className="btn-primary flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>New Shift</span>
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto flex gap-1 pb-3 mt-1">
          {(['today', 'week'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-ink text-white'
                  : 'text-muted hover:text-ink hover:bg-black/5'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 pb-24 animate-fade-in">
        {activeTab === 'today' ? (
          <TodaySummary
            todayShifts={todayShifts}
            shifts={SHIFTS}
            teamMembers={TEAM_MEMBERS}
            today={today}
            onAdd={(slot) => openCreate(today, slot)}
            onEdit={openEdit}
          />
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setWeekStart(d => addDays(d, -7))} className="btn-ghost p-2">
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold text-ink">
                  {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                </p>
              </div>
              <button onClick={() => setWeekStart(d => addDays(d, 7))} className="btn-ghost p-2">
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="space-y-6">
              {weekDays.map(day => {
                const isToday = isSameDay(day, today)
                const isPast = day < today && !isToday
                return (
                  <div key={day.toISOString()} className="animate-slide-up">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center text-center ${
                        isToday ? 'bg-ink text-white' : 'bg-white border border-border text-ink'
                      }`}>
                        <span className="text-[9px] uppercase tracking-wider font-mono leading-none">
                          {format(day, 'EEE')}
                        </span>
                        <span className="text-sm font-bold leading-none mt-0.5">
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="h-px flex-1 bg-border" />
                      {isToday && (
                        <span className="text-[10px] font-mono text-accent uppercase tracking-wider">Today</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {SHIFTS.map(slot => {
                        const shift = getShift(day, slot)
                        return (
                          <ShiftCard
                            key={slot}
                            slot={slot}
                            shift={shift}
                            isPast={isPast}
                            onAdd={() => openCreate(day, slot)}
                            onEdit={() => shift && openEdit(shift)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>

      {modalOpen && (
        <ShiftModal
          shift={editShift}
          defaultDate={defaultDate}
          defaultSlot={defaultSlot}
          teamMembers={TEAM_MEMBERS}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); fetchShifts() }}
        />
      )}
    </div>
  )
}
