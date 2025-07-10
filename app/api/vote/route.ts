import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for votes (in production, use a database)
const voteStorage: Record<number, { upVotes: number; downVotes: number; voters: Set<string> }> = {}

export async function POST(request: NextRequest) {
  try {
    const { vote, minute, userId, userName } = await request.json()

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

    const stats = {
      upVotes: minuteData.upVotes,
      downVotes: minuteData.downVotes,
      totalVotes: minuteData.upVotes + minuteData.downVotes,
    }

    return NextResponse.json({
      success: true,
      stats,
      userName: userName.trim(),
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
