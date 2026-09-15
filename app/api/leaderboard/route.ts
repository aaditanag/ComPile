import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { LeaderboardEntry } from "@/lib/types";

// Demo leaderboard (used when Supabase is not configured)
const demoEntries: LeaderboardEntry[] = [];

export async function GET() {
  if (!supabase) {
    return NextResponse.json({ entries: demoEntries });
  }

  try {
    // Fetch all students with their completion counts
    const { data: students, error } = await supabase
      .from("students")
      .select(
        `id, name, roll_number, started_at, finished_at, total_blocks_used,
         level_completions(level_id)`
      )
      .order("finished_at", { ascending: true, nullsFirst: false });

    if (error) {
      console.error("Leaderboard query error:", error);
      return NextResponse.json({ entries: [] }, { status: 500 });
    }

    const entries: LeaderboardEntry[] = (students ?? []).map((s, i) => {
      const levelsCompleted = Array.isArray(s.level_completions)
        ? s.level_completions.length
        : 0;
      const totalSeconds =
        s.finished_at && s.started_at
          ? Math.floor(
              (new Date(s.finished_at).getTime() -
                new Date(s.started_at).getTime()) /
                1000
            )
          : null;

      return {
        rank: s.finished_at ? i + 1 : 0,
        name: s.name,
        rollNumber: s.roll_number,
        finishedAt: s.finished_at ?? null,
        totalSeconds,
        totalBlocksUsed: s.total_blocks_used ?? 0,
        levelsCompleted,
      };
    });

    // Re-rank: finished first, then in-progress sorted by levels done
    const finished = entries.filter((e) => e.finishedAt !== null);
    const inProgress = entries
      .filter((e) => e.finishedAt === null)
      .sort((a, b) => b.levelsCompleted - a.levelsCompleted);

    const ranked = [
      ...finished.map((e, i) => ({ ...e, rank: i + 1 })),
      ...inProgress.map((e, i) => ({
        ...e,
        rank: finished.length + i + 1,
      })),
    ];

    return NextResponse.json({ entries: ranked });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ entries: [] }, { status: 500 });
  }
}
