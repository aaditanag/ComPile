import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const MAX_ACTIVE_MS = 90 * 60 * 1000; // 90 minutes

export async function POST(req: NextRequest) {
  try {
    const { sessionId, activeTimeMs } = await req.json() as {
      sessionId: string;
      activeTimeMs: number;
    };

    if (!sessionId || typeof activeTimeMs !== "number") {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ ok: true }); // offline mode — no-op
    }

    // Read current stored active time to prevent rollback attacks
    const { data: student } = await supabase
      .from("students")
      .select("active_time_ms, finished_at")
      .eq("id", sessionId)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    const storedMs = student.active_time_ms ?? 0;
    const newMs = Math.max(storedMs, Math.floor(activeTimeMs));
    const timeExpired = newMs >= MAX_ACTIVE_MS;

    // Update to highest seen value (prevents rollback)
    await supabase
      .from("students")
      .update({ active_time_ms: newMs })
      .eq("id", sessionId);

    return NextResponse.json({
      ok: true,
      activeTimeMs: newMs,
      timeExpired,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
