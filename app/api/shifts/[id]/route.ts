import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Shift } from '@/models/Shift'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const doc = await Shift.findById(params.id)
    if (!doc) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: doc })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const body = await req.json()
    const doc = await Shift.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    )
    if (!doc) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: doc })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    await Shift.findByIdAndDelete(params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ success: false, error: 'Failed to delete' }, { status: 500 })
  }
}
