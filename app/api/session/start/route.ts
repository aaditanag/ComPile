import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const rateLimitMap = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, rollNumber } = body;

    if (!name?.trim() || !rollNumber?.trim()) {
      return NextResponse.json(
        { error: "Name and roll number are required." },
        { status: 400 }
      );
    }

    const sessionId = crypto.randomUUID();
    const startedAt = new Date().toISOString();

    if (supabase) {
      // Check for existing session with same roll number
      const { data: existing } = await supabase
        .from("students")
        .select("id")
        .eq("roll_number", rollNumber.trim())
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "A session for this roll number already exists." },
          { status: 409 }
        );
      }

      const { error } = await supabase.from("students").insert({
        id: sessionId,
        name: name.trim(),
        roll_number: rollNumber.trim(),
        started_at: startedAt,
        total_blocks_used: 0,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json(
          { error: "Failed to create session." },
          { status: 500 }
        );
      }
    }

    // Record rate-limit timestamp
    rateLimitMap.set(sessionId, Date.now());

    return NextResponse.json({
      sessionId,
      name: name.trim(),
      rollNumber: rollNumber.trim(),
      startedAt,
      startedAtMs: new Date(startedAt).getTime(),
      activeTimeMs: 0,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
