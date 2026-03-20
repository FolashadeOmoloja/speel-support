import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Shift } from "@/models/Shift";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const week = searchParams.get("week");

    let query: Record<string, unknown> = {};

    if (date) {
      query.date = date;
    } else if (week) {
      const [year, month, day] = week.split("-").map(Number);
      const days: string[] = [];
      // Start from -1 to include yesterday (for overnight shifts)
      for (let i = -1; i < 7; i++) {
        const d = new Date(year, month - 1, day + i);
        days.push(
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
        );
      }
      query.date = { $in: days };
    }

    const shifts = await Shift.find(query).sort({ date: 1, shift: 1 });
    return NextResponse.json({ success: true, data: shifts });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shifts" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { date, shift, assignedTo } = body;
    if (!date || !shift || !assignedTo) {
      return NextResponse.json(
        { success: false, error: "date, shift, and assignedTo are required" },
        { status: 400 },
      );
    }

    const doc = await Shift.findOneAndUpdate(
      { date, shift },
      { $set: body },
      { new: true, upsert: true, runValidators: true },
    );

    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    if (
      err instanceof Error &&
      "code" in err &&
      Number((err as Record<string, unknown>).code) === 11000
    ) {
      return NextResponse.json(
        { success: false, error: "Shift already assigned for this date/slot" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create shift" },
      { status: 500 },
    );
  }
}
