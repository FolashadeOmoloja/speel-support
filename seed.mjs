/**
 * seed.mjs
 * Populates this week's shifts based on the agreed schedule:
 *
 * Mon–Wed: Folashade = Day, Seun = Night
 * Thu–Fri: Seun = Day, Folashade = Night
 * Sat–Sun: Both = Day (all day coverage)
 *
 * Run with: node seed.mjs
 * Make sure MONGODB_URI is in your .env.local first.
 */

import { config } from 'dotenv'
import mongoose from 'mongoose'

config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local')
  process.exit(1)
}

const ShiftSchema = new mongoose.Schema({
  date: String,
  shift: String,
  assignedTo: String,
  status: { type: String, default: 'Not Started' },
  startTime: String,
  endTime: String,
  handoverNotes: { type: String, default: '' },
  ticketsHandled: { type: Number, default: 0 },
  issues: [String],
}, { timestamps: true })

ShiftSchema.index({ date: 1, shift: 1 }, { unique: true })
const Shift = mongoose.models.Shift || mongoose.model('Shift', ShiftSchema)

// Get Monday of current week
function getMondayOfCurrentWeek() {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday = 1
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function dateStr(date) {
  return date.toISOString().split('T')[0]
}

function addDays(date, n) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  const monday = getMondayOfCurrentWeek()

  const schedule = [
    // Mon (0) → Wed (2): Folashade Day, Seun Night
    { offset: 0, shift: 'Day',   assignedTo: 'Folashade', startTime: '09:00', endTime: '17:00' },
    { offset: 0, shift: 'Night', assignedTo: 'Seun',      startTime: '17:00', endTime: '09:00' },
    { offset: 1, shift: 'Day',   assignedTo: 'Folashade', startTime: '09:00', endTime: '17:00' },
    { offset: 1, shift: 'Night', assignedTo: 'Seun',      startTime: '17:00', endTime: '09:00' },
    { offset: 2, shift: 'Day',   assignedTo: 'Folashade', startTime: '09:00', endTime: '17:00' },
    { offset: 2, shift: 'Night', assignedTo: 'Seun',      startTime: '17:00', endTime: '09:00' },
    // Thu (3) → Fri (4): Seun Day, Folashade Night
    { offset: 3, shift: 'Day',   assignedTo: 'Seun',      startTime: '09:00', endTime: '17:00' },
    { offset: 3, shift: 'Night', assignedTo: 'Folashade', startTime: '17:00', endTime: '09:00' },
    { offset: 4, shift: 'Day',   assignedTo: 'Seun',      startTime: '09:00', endTime: '17:00' },
    { offset: 4, shift: 'Night', assignedTo: 'Folashade', startTime: '17:00', endTime: '09:00' },
    // Sat (5) → Sun (6): Both on Day
    { offset: 5, shift: 'Day',   assignedTo: 'Folashade', startTime: '09:00', endTime: '17:00' },
    { offset: 5, shift: 'Night', assignedTo: 'Seun',      startTime: '17:00', endTime: '09:00' },
    { offset: 6, shift: 'Day',   assignedTo: 'Folashade', startTime: '09:00', endTime: '17:00' },
    { offset: 6, shift: 'Night', assignedTo: 'Seun',      startTime: '17:00', endTime: '09:00' },
  ]

  let created = 0
  let skipped = 0

  for (const entry of schedule) {
    const date = dateStr(addDays(monday, entry.offset))
    try {
      await Shift.findOneAndUpdate(
        { date, shift: entry.shift },
        { $setOnInsert: { date, shift: entry.shift, assignedTo: entry.assignedTo, status: 'Not Started', startTime: entry.startTime, endTime: entry.endTime, ticketsHandled: 0, issues: [], handoverNotes: '' } },
        { upsert: true, new: true }
      )
      console.log(`  ✓ ${date} — ${entry.shift} → ${entry.assignedTo}`)
      created++
    } catch (e) {
      if (e.code === 11000) {
        console.log(`  ⚠ ${date} — ${entry.shift} already exists, skipped`)
        skipped++
      } else {
        console.error(`  ✗ ${date} — ${entry.shift}:`, e.message)
      }
    }
  }

  console.log(`\n🎉 Done — ${created} shifts seeded, ${skipped} skipped (already existed)`)
  await mongoose.disconnect()
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
