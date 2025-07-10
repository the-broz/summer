import { type NextRequest, NextResponse } from "next/server"
import { historyStorage, currentProductivity, getTimeLeftInCurrentMinute, getRecentVoteLogs } from "@/lib/storage"

export async function GET(request: NextRequest) {
  try {
    // Calculate the current minute correctly
    // Filter out minute 0 (which is just the initial state) and find the max actual minute
    const actualMinutes = historyStorage.filter(h => h.minute > 0).map(h => h.minute)
    const currentMinute = actualMinutes.length === 0 ? 1 : Math.max(...actualMinutes) + 1
    
    console.log('History API - calculating current minute:', {
      totalHistoryEntries: historyStorage.length,
      actualMinutes,
      calculatedCurrentMinute: currentMinute
    })
    
    return NextResponse.json({
      success: true,
      data: historyStorage,
      currentProductivity,
      currentMinute,
      timeLeft: getTimeLeftInCurrentMinute(),
      voteLogs: getRecentVoteLogs(10),
    })
  } catch (error) {
    console.error("History error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}