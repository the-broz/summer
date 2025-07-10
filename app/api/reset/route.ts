import { type NextRequest, NextResponse } from "next/server"
import { historyStorage, updateCurrentProductivity, startNewMinute, voteLogsStorage } from "@/lib/storage"

// Reset endpoint for testing/demo purposes
export async function POST(request: NextRequest) {
  try {
    // Reset history storage to initial state
    historyStorage.length = 0
    historyStorage.push({ time: "0:00", productivity: 75, minute: 0, upVotes: 0, downVotes: 0, totalVotes: 0 })
    
    // Reset vote logs
    voteLogsStorage.length = 0
    
    // Reset current productivity
    updateCurrentProductivity(75)

    // Start timing for minute 1
    startNewMinute()

    return NextResponse.json({
      success: true,
      message: "System reset successfully",
    })
  } catch (error) {
    console.error("Reset error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
