'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Clock, FileText, Hash, AlertTriangle } from 'lucide-react'
import { IShift, ShiftType, ShiftStatus } from '@/models/Shift'
import clsx from 'clsx'

const SHIFTS: ShiftType[] = ['Day', 'Night']
const STATUSES: ShiftStatus[] = ['Not Started', 'Active', 'Completed']

const SHIFT_TIMES: Record<ShiftType, { start: string; end: string }> = {
  Day: { start: '09:00', end: '17:00' },
  Night: { start: '17:00', end: '09:00' },
}

interface Props {
  shift: IShift | null
  defaultDate: string
  defaultSlot: ShiftType
  teamMembers: string[]
  onClose: () => void
  onSaved: () => void
}

export default function ShiftModal({ shift, defaultDate, defaultSlot, teamMembers, onClose, onSaved }: Props) {
  const isEdit = !!shift

  const [date, setDate] = useState(shift?.date ?? defaultDate)
  const [slot, setSlot] = useState<ShiftType>(shift?.shift ?? defaultSlot)
  const [assignedTo, setAssignedTo] = useState(shift?.assignedTo ?? teamMembers[0])
  const [status, setStatus] = useState<ShiftStatus>(shift?.status ?? 'Not Started')
  const [startTime, setStartTime] = useState(shift?.startTime ?? SHIFT_TIMES[shift?.shift ?? defaultSlot].start)
  const [endTime, setEndTime] = useState(shift?.endTime ?? '')
  const [handoverNotes, setHandoverNotes] = useState(shift?.handoverNotes ?? '')
  const [ticketsHandled, setTicketsHandled] = useState(shift?.ticketsHandled ?? 0)
  const [issues, setIssues] = useState<string[]>(shift?.issues ?? [])
  const [newIssue, setNewIssue] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const overlayRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstInputRef.current?.focus()
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (!isEdit) {
      setStartTime(SHIFT_TIMES[slot].start)
      setEndTime('')
    }
  }, [slot, isEdit])

  const addIssue = () => {
    const trimmed = newIssue.trim()
    if (!trimmed) return
    setIssues(prev => [...prev, trimmed])
    setNewIssue('')
  }

  const removeIssue = (i: number) => setIssues(prev => prev.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    if (!date || !slot || !assignedTo) {
      setError('Date, shift, and assignee are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = isEdit ? `/api/shifts/${shift._id}` : '/api/shifts'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, shift: slot, assignedTo, status, startTime, endTime, handoverNotes, ticketsHandled: Number(ticketsHandled), issues }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error ?? 'Unknown error')
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!shift?._id) return
    if (!confirm('Delete this shift?')) return
    setDeleting(true)
    try {
      await fetch(`/api/shifts/${shift._id}`, { method: 'DELETE' })
      onSaved()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl animate-slide-up max-h-[92dvh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-display text-xl text-ink">{isEdit ? 'Edit Shift' : 'Assign Shift'}</h2>
            <p className="text-xs text-muted mt-0.5">{isEdit ? `${shift.shift} · ${shift.date}` : 'Fill in the details below'}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          {/* Date + Slot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input ref={firstInputRef} type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="label">Shift</label>
              <select value={slot} onChange={e => setSlot(e.target.value as ShiftType)} className="input-field">
                {SHIFTS.map(s => <option key={s} value={s}>{s === 'Day' ? '☀️ Day' : '🌙 Night'}</option>)}
              </select>
            </div>
          </div>

          {/* Assigned to */}
          <div>
            <label className="label">Assigned To</label>
            <div className="flex gap-2 flex-wrap">
              {teamMembers.map(member => (
                <button
                  key={member}
                  type="button"
                  onClick={() => setAssignedTo(member)}
                  className={clsx(
                    'px-4 py-2 rounded-xl text-sm font-semibold border transition-all active:scale-95',
                    assignedTo === member
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-muted border-border hover:border-ink/30 hover:text-ink'
                  )}
                >
                  {member}
                </button>
              ))}
              <input
                type="text"
                placeholder="Other..."
                value={teamMembers.includes(assignedTo) ? '' : assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="input-field flex-1 min-w-[100px]"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUSES.map(s => {
                const colors: Record<string, string> = {
                  Active: 'border-green-300 bg-green-50 text-green-700',
                  Completed: 'border-gray-200 bg-gray-50 text-gray-500',
                  'Not Started': 'border-gray-200 bg-white text-gray-400',
                }
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={clsx(
                      'py-2 px-3 rounded-xl text-xs font-semibold border transition-all active:scale-95',
                      status === s ? `${colors[s]} ring-2 ring-offset-1 ring-current/30` : 'border-border text-muted hover:border-ink/20'
                    )}
                  >
                    {s === 'Active' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />}
                    {s}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="label flex items-center gap-1.5"><Clock size={11} />Time Range</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted mb-1">Start</p>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="input-field" />
              </div>
              <div>
                <p className="text-[10px] text-muted mb-1">End (optional)</p>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="input-field" />
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div>
            <label className="label flex items-center gap-1.5"><Hash size={11} />Tickets Handled</label>
            <input type="number" min={0} value={ticketsHandled} onChange={e => setTicketsHandled(Number(e.target.value))} className="input-field w-32" placeholder="0" />
          </div>

          {/* Handover notes */}
          <div>
            <label className="label flex items-center gap-1.5"><FileText size={11} />Handover Notes</label>
            <textarea value={handoverNotes} onChange={e => setHandoverNotes(e.target.value)} rows={3} placeholder="What should the next person know?" className="input-field resize-none" />
          </div>

          {/* Issues */}
          <div>
            <label className="label flex items-center gap-1.5"><AlertTriangle size={11} />Issues / Patterns</label>
            <p className="text-[10px] text-muted mb-2">Log recurring problems — this feeds into product insights</p>
            {issues.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <span className="text-amber-500 text-xs mt-0.5">⚠</span>
                    <p className="text-xs text-ink flex-1 leading-snug">{issue}</p>
                    <button type="button" onClick={() => removeIssue(i)} className="text-muted hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newIssue}
                onChange={e => setNewIssue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIssue() } }}
                placeholder="e.g. Credit refund confusion..."
                className="input-field flex-1"
              />
              <button type="button" onClick={addIssue} className="btn-ghost px-3 border border-border">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-sm">
              <AlertTriangle size={14} />{error}
            </div>
          )}
        </div>

        <div className={clsx('flex items-center gap-3 px-5 py-4 border-t border-border flex-shrink-0', 'pb-[max(1rem,env(safe-area-inset-bottom))]')}>
          {isEdit && (
            <button type="button" onClick={handleDelete} disabled={deleting} className="btn-ghost text-red-500 hover:bg-red-50 px-3">
              <Trash2 size={16} />
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Assign Shift'}
          </button>
        </div>
      </div>
    </div>
  )
}
