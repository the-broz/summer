import { NextRequest, NextResponse } from "next/server"
import { historyStorage, currentProductivity, getTimeLeftInCurrentMinute, voteLogsStorage, cleanupDuplicateEntries } from "@/lib/storage"

export async function GET(request: NextRequest) {
  // Check for duplicates
  const minutes = historyStorage.map(entry => entry.minute)
  const uniqueMinutes = [...new Set(minutes)]
  const hasDuplicates = minutes.length !== uniqueMinutes.length
  
  // Calculate current minute the same way as history API
  const actualMinutes = historyStorage.filter(h => h.minute > 0).map(h => h.minute)
  const currentMinute = actualMinutes.length === 0 ? 1 : Math.max(...actualMinutes) + 1
  
  return NextResponse.json({
    historyStorage,
    currentProductivity,
    currentMinute,
    timeLeft: getTimeLeftInCurrentMinute(),
    voteLogsCount: voteLogsStorage.length,
    serverTime: new Date().toISOString(),
    duplicateCheck: {
      totalEntries: historyStorage.length,
      uniqueMinutes: uniqueMinutes.length,
      hasDuplicates,
      minutes,
      actualMinutes
    }
  })
}

export async function POST(request: NextRequest) {
  const { action } = await request.json()
  
  if (action === 'cleanup') {
    cleanupDuplicateEntries()
    return NextResponse.json({ success: true, message: 'Cleanup completed' })
  }
  
  return NextResponse.json({ success: false, message: 'Unknown action' })
}
