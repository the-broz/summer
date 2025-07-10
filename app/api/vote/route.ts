import { type NextRequest, NextResponse } from "next/server"
import { addVoteLog, voteStorage } from "@/lib/storage"
import { wsManager } from "@/lib/websocket"

export async function POST(request: NextRequest) {
  try {
    const { vote, minute, userId, userName } = await request.json()
    console.log('Received vote:', { vote, minute, userId, userName })

    if (!userName || !userName.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required",
        },
        { status: 400 },
      )
    }

    if (!voteStorage[minute]) {
      voteStorage[minute] = { upVotes: 0, downVotes: 0, voters: new Set() }
    }

    const minuteData = voteStorage[minute]
    console.log('Current vote data for minute', minute, ':', { upVotes: minuteData.upVotes, downVotes: minuteData.downVotes, votersCount: minuteData.voters.size })

    // Check if user already voted this minute
    if (minuteData.voters.has(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Already voted this minute",
        },
        { status: 400 },
      )
    }

    // Record the vote
    if (vote === "up") {
      minuteData.upVotes++
    } else if (vote === "down") {
      minuteData.downVotes++
    }

    minuteData.voters.add(userId)
    console.log('Updated vote data:', { upVotes: minuteData.upVotes, downVotes: minuteData.downVotes, votersCount: minuteData.voters.size })

    // Create vote log entry
    const voteLog = {
      id: `${Date.now()}_${Math.random()}`,
      name: userName.trim(),
      vote,
      timestamp: new Date().toLocaleTimeString(),
      minute,
      userId,
    }

    // Add to vote logs storage
    addVoteLog(voteLog)

    // Broadcast to all connected clients
    wsManager.broadcast({
      type: 'vote',
      data: voteLog
    })

    const stats = {
      upVotes: minuteData.upVotes,
      downVotes: minuteData.downVotes,
      totalVotes: minuteData.upVotes + minuteData.downVotes,
    }

    return NextResponse.json({
      success: true,
      stats,
      userName: userName.trim(),
      voteLog,
    })
  } catch (error) {
    console.error("Vote error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
