import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Shift, ShiftType, ShiftStatus } from '@/models/Shift'
import { format } from 'date-fns'

async function verifySlack(req: NextRequest, rawBody: string): Promise<boolean> {
  const secret = process.env.SLACK_SIGNING_SECRET
  if (!secret) return false
  const timestamp = req.headers.get('x-slack-request-timestamp') ?? ''
  const slackSig = req.headers.get('x-slack-signature') ?? ''
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false
  const sigBase = `v0:${timestamp}:${rawBody}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(sigBase))
  const hex = 'v0=' + Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hex === slackSig
}

function todayStr() { return new Date().toISOString().split('T')[0] }
function formatTime(t?: string) {
  if (!t) return '—'
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m}${hour < 12 ? 'am' : 'pm'}`
}

const SHIFT_EMOJI: Record<string, string> = { Day: '☀️', Night: '🌙' }
const STATUS_EMOJI: Record<string, string> = { Active: '🟢', Completed: '✅', 'Not Started': '⚪' }

async function handleToday(): Promise<object> {
  await connectDB()
  const shifts = await Shift.find({ date: todayStr() }).sort({ shift: 1 })
  const ORDER: ShiftType[] = ['Day', 'Night']
  const blocks: object[] = [
    { type: 'header', text: { type: 'plain_text', text: `📋 Speel Support — ${format(new Date(), 'EEEE, MMM d')}` } },
    { type: 'divider' },
  ]
  for (const slot of ORDER) {
    const shift = shifts.find(x => x.shift === slot)
    if (!shift) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `${SHIFT_EMOJI[slot]} *${slot} Shift*\n⚠️ _Not assigned yet_` } })
    } else {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `${SHIFT_EMOJI[slot]} *${slot} Shift* — ${shift.assignedTo}  ${STATUS_EMOJI[shift.status]} ${shift.status}`,
            shift.startTime ? `  • Time: ${formatTime(shift.startTime)}${shift.endTime ? ` – ${formatTime(shift.endTime)}` : ''}` : '',
            shift.ticketsHandled > 0 ? `  • Tickets: ${shift.ticketsHandled}` : '',
            shift.handoverNotes ? `  • Notes: _${shift.handoverNotes}_` : '',
          ].filter(Boolean).join('\n'),
        },
      })
    }
    blocks.push({ type: 'divider' })
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  if (appUrl) blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: `<${appUrl}|Open full tracker>` }] })
  return { blocks }
}

async function handleStatus(args: string[], userName: string): Promise<object> {
  await connectDB()
  const slotMap: Record<string, ShiftType> = { day: 'Day', night: 'Night' }
  const statusMap: Record<string, ShiftStatus> = { active: 'Active', completed: 'Completed', done: 'Completed', 'not started': 'Not Started' }
  const slot = slotMap[args[0]?.toLowerCase()]
  if (!slot) return { text: '❌ Usage: `/shift status [day|night] [active|completed] [ticket count]`' }
  const statusArg = args.slice(1).join(' ').toLowerCase()
  let status: ShiftStatus | undefined
  let tickets: number | undefined
  for (const [key, val] of Object.entries(statusMap)) {
    if (statusArg.startsWith(key)) {
      status = val
      const num = parseInt(statusArg.slice(key.length).trim())
      if (!isNaN(num)) tickets = num
      break
    }
  }
  if (!status) return { text: '❌ Status must be `active`, `completed`, or `not started`' }
  const update: Record<string, unknown> = { status }
  if (tickets !== undefined) update.ticketsHandled = tickets
  if (status === 'Active') update.startTime = format(new Date(), 'HH:mm')
  if (status === 'Completed') update.endTime = format(new Date(), 'HH:mm')
  const doc = await Shift.findOneAndUpdate({ date: todayStr(), shift: slot }, { $set: update }, { new: true })
  if (!doc) return { text: `⚠️ No ${slot} shift found for today.` }
  return { text: `${STATUS_EMOJI[status]} *${doc.assignedTo}*'s ${slot} shift → *${status}*${tickets !== undefined ? ` · ${tickets} tickets` : ''}\n_Updated by @${userName}_` }
}

async function handleNotes(args: string[], userName: string): Promise<object> {
  await connectDB()
  const slotMap: Record<string, ShiftType> = { day: 'Day', night: 'Night' }
  const slot = slotMap[args[0]?.toLowerCase()]
  if (!slot || args.length < 2) return { text: '❌ Usage: `/shift notes [day|night] <note>`' }
  const note = args.slice(1).join(' ')
  const doc = await Shift.findOneAndUpdate({ date: todayStr(), shift: slot }, { $set: { handoverNotes: note } }, { new: true })
  if (!doc) return { text: `⚠️ No ${slot} shift found for today.` }
  return { text: `📝 *Handover note added to ${slot} shift*\n> ${note}\n_Added by @${userName}_` }
}

async function handleIssue(args: string[], userName: string): Promise<object> {
  await connectDB()
  const slotMap: Record<string, ShiftType> = { day: 'Day', night: 'Night' }
  const slot = slotMap[args[0]?.toLowerCase()]
  if (!slot || args.length < 2) return { text: '❌ Usage: `/shift issue [day|night] <description>`' }
  const issue = args.slice(1).join(' ')
  const doc = await Shift.findOneAndUpdate({ date: todayStr(), shift: slot }, { $push: { issues: issue } }, { new: true })
  if (!doc) return { text: `⚠️ No ${slot} shift found for today.` }
  return { text: `⚠️ *Issue logged on ${slot} shift* (${doc.issues.length} total)\n> ${issue}\n_Logged by @${userName}_` }
}

async function handleAssign(args: string[]): Promise<object> {
  await connectDB()
  const slotMap: Record<string, ShiftType> = { day: 'Day', night: 'Night' }
  const slot = slotMap[args[0]?.toLowerCase()]
  const name = args[1]
  if (!slot || !name) return { text: '❌ Usage: `/shift assign [day|night] [name]`' }
  const doc = await Shift.findOneAndUpdate(
    { date: todayStr(), shift: slot },
    { $set: { date: todayStr(), shift: slot, assignedTo: name, status: 'Not Started' } },
    { new: true, upsert: true }
  )
  return { text: `${SHIFT_EMOJI[slot]} *${slot} shift* assigned to *${doc.assignedTo}* ✓` }
}

function handleHelp(): object {
  return {
    blocks: [
      { type: 'header', text: { type: 'plain_text', text: '📋 Shift Tracker — Commands' } },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            '`/shift today` — See today\'s shifts',
            '`/shift assign [day|night] [name]` — Assign a shift',
            '`/shift status [day|night] [active|completed] [tickets?]` — Update status',
            '`/shift notes [day|night] <text>` — Add handover notes',
            '`/shift issue [day|night] <description>` — Log an issue',
            '`/shift help` — Show this message',
          ].join('\n'),
        },
      },
    ],
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  if (process.env.SLACK_SIGNING_SECRET) {
    const valid = await verifySlack(req, rawBody)
    if (!valid) return NextResponse.json({ text: '❌ Unauthorized' }, { status: 401 })
  }
  const params = new URLSearchParams(rawBody)
  const text = (params.get('text') ?? '').trim()
  const userName = params.get('user_name') ?? 'someone'
  const parts = text.split(/\s+/).filter(Boolean)
  const command = parts[0]?.toLowerCase() ?? 'today'
  const args = parts.slice(1)
  try {
    let response: object
    switch (command) {
      case 'today': case '': response = await handleToday(); break
      case 'status': response = await handleStatus(args, userName); break
      case 'notes': response = await handleNotes(args, userName); break
      case 'issue': response = await handleIssue(args, userName); break
      case 'assign': response = await handleAssign(args); break
      case 'help': response = handleHelp(); break
      default: response = { text: `❓ Unknown command. Try \`/shift help\`` }
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ text: '❌ Something went wrong.' })
  }
}
