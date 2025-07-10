import { type NextRequest, NextResponse } from "next/server"

// In-memory storage for votes and productivity
const voteStorage: Record<number, { upVotes: number; downVotes: number; voters: Set<string> }> = {}
let currentProductivity = 75 // Starting productivity level

export async function POST(request: NextRequest) {
  try {
    const { minute } = await request.json()

    const minuteData = voteStorage[minute] || { upVotes: 0, downVotes: 0, voters: new Set() }
    const totalVotes = minuteData.upVotes + minuteData.downVotes

    if (totalVotes === 0) {
      // No votes, productivity stays the same
      return NextResponse.json({
        success: true,
        newProductivity: currentProductivity,
        votesSummary: { upVotes: 0, downVotes: 0, totalVotes: 0 },
      })
    }

    // Calculate vote ratio (-1 to 1)
    const voteRatio = (minuteData.upVotes - minuteData.downVotes) / totalVotes

    // Apply 5% change based on vote ratio
    const productivityChange = voteRatio * 5

    // Update productivity (clamp between 0 and 100)
    currentProductivity = Math.max(0, Math.min(100, currentProductivity + productivityChange))

    // Clean up old vote data to prevent memory leaks
    delete voteStorage[minute]

    return NextResponse.json({
      success: true,
      newProductivity: currentProductivity,
      votesSummary: {
        upVotes: minuteData.upVotes,
        downVotes: minuteData.downVotes,
        totalVotes: totalVotes,
      },
      productivityChange: productivityChange,
    })
  } catch (error) {
    console.error("Process votes error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
