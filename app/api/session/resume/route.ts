import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rollNumber } = body as { rollNumber: string };

    if (!rollNumber?.trim()) {
      return NextResponse.json({ error: "USN is required." }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured." }, { status: 500 });
    }

    // Look up student by USN
    const { data: student, error: studentErr } = await supabase
      .from("students")
      .select("id, name, roll_number, started_at, finished_at, active_time_ms")
      .eq("roll_number", rollNumber.trim().toUpperCase())
      .single();

    if (studentErr || !student) {
      return NextResponse.json(
        { error: "No session found for this USN. Please register first." },
        { status: 404 }
      );
    }

    // Already finished?
    if (student.finished_at) {
      return NextResponse.json(
        { error: "You have already completed the contest. Check the leaderboard!" },
        { status: 410 }
      );
    }

    // Find the highest level they've completed
    const { data: completions } = await supabase
      .from("level_completions")
      .select("level_id")
      .eq("student_id", student.id)
      .order("level_id", { ascending: false });

    const completedLevels = (completions ?? []).map((c) => c.level_id as number);
    const maxCompleted = completedLevels.length > 0 ? Math.max(...completedLevels) : 0;
    const nextLevel = Math.min(maxCompleted + 1, 10);

    // Return session info for client to restore
    return NextResponse.json({
      sessionId: student.id,
      name: student.name,
      rollNumber: student.roll_number,
      startedAt: student.started_at,
      startedAtMs: new Date(student.started_at).getTime(),
      activeTimeMs: student.active_time_ms ?? 0,
      nextLevel,
      completedLevels,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
