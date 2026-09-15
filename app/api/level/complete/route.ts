import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { runProgram } from "@/lib/engine";
import { getLevel } from "@/lib/levels";
import type { Command, Procedures } from "@/lib/types";

// In-memory deduplication (per process — good enough for Vercel serverless)
const completedLevels = new Map<string, Set<number>>();
const lastSubmit = new Map<string, number>();
const DEBOUNCE_MS = 2000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, levelId, program, procedures } = body as {
      sessionId: string;
      levelId: number;
      program: Command[];
      procedures: Procedures;
    };

    if (!sessionId || !levelId || !program) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    // Rate-limit: 2s debounce per session
    const now = Date.now();
    const last = lastSubmit.get(sessionId) ?? 0;
    if (now - last < DEBOUNCE_MS) {
      return NextResponse.json(
        { error: "Please wait before submitting again." },
        { status: 429 }
      );
    }
    lastSubmit.set(sessionId, now);

    // Idempotent: don't record the same level twice
    const doneSet = completedLevels.get(sessionId) ?? new Set<number>();
    if (doneSet.has(levelId)) {
      return NextResponse.json({
        ok: true,
        alreadyCompleted: true,
        nextLevel: levelId + 1,
      });
    }

    // Load level config
    const level = getLevel(levelId);
    if (!level) {
      return NextResponse.json({ error: "Level not found." }, { status: 404 });
    }

    // Server-side re-run of interpreter
    const result = runProgram(program, level, procedures ?? { purple: [], teal: [], amber: [] });

    if (!result.success) {
      return NextResponse.json({
        ok: false,
        error: result.error ?? "Incorrect solution.",
      });
    }

    // Count blocks used
    const blocksUsed = countBlocks(program) + countBlocks(Object.values(procedures ?? {}).flat());

    // Record in DB
    if (supabase) {
      const completedAt = new Date().toISOString();

      await supabase.from("level_completions").insert({
        student_id: sessionId,
        level_id: levelId,
        completed_at: completedAt,
        blocks_used: blocksUsed,
        program: JSON.stringify({ program, procedures }),
      });

      // If final level, record finish time and total blocks
      if (levelId === 10) {
        // Sum all blocks across levels
        const { data: comps } = await supabase
          .from("level_completions")
          .select("blocks_used")
          .eq("student_id", sessionId);

        const total = (comps ?? []).reduce((s, r) => s + (r.blocks_used ?? 0), 0);

        await supabase
          .from("students")
          .update({ finished_at: completedAt, total_blocks_used: total })
          .eq("id", sessionId);
      }
    }

    // Mark as done
    doneSet.add(levelId);
    completedLevels.set(sessionId, doneSet);

    return NextResponse.json({
      ok: true,
      nextLevel: levelId < 10 ? levelId + 1 : null,
      isFinished: levelId === 10,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

function countBlocks(cmds: Command[]): number {
  let n = 0;
  for (const c of cmds) {
    n++;
    if (c.type === "loop") n += countBlocks(c.body);
  }
  return n;
}
