import mongoose, { Schema, Document } from 'mongoose'

export type ShiftType = 'Day' | 'Night'
export type ShiftStatus = 'Not Started' | 'Active' | 'Completed'
export type TeamMember = 'Folashade' | 'Seun' | string

export interface IShift extends Document {
  date: string
  shift: ShiftType
  assignedTo: TeamMember
  status: ShiftStatus
  startTime?: string
  endTime?: string
  handoverNotes?: string
  ticketsHandled: number
  issues: string[]
  createdAt: Date
  updatedAt: Date
}

const ShiftSchema = new Schema<IShift>(
  {
    date: { type: String, required: true },
    shift: { type: String, enum: ['Day', 'Night'], required: true },
    assignedTo: { type: String, required: true },
    status: {
      type: String,
      enum: ['Not Started', 'Active', 'Completed'],
      default: 'Not Started',
    },
    startTime: { type: String },
    endTime: { type: String },
    handoverNotes: { type: String, default: '' },
    ticketsHandled: { type: Number, default: 0 },
    issues: [{ type: String }],
  },
  { timestamps: true }
)

ShiftSchema.index({ date: 1, shift: 1 }, { unique: true })

export const Shift =
  mongoose.models.Shift || mongoose.model<IShift>('Shift', ShiftSchema)
