import { type NextRequest, NextResponse } from "next/server"
import { historyStorage, currentProductivity, updateCurrentProductivity, startNewMinute, voteStorage, saveDataNow, isProcessingVotes, setProcessingLock } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    const { minute } = await request.json()
    console.log('Processing votes for minute:', minute)
    
    // Check if already processing
    if (isProcessingVotes) {
      console.log('Already processing votes, rejecting request')
      return NextResponse.json({
        success: false,
        error: "Already processing votes"
      }, { status: 429 })
    }
    
    // Set processing lock
    setProcessingLock(true)
    
    try {
      console.log('Vote storage state:', voteStorage[minute])

      const minuteData = voteStorage[minute] || { upVotes: 0, downVotes: 0, voters: new Set() }
      const totalVotes = minuteData.upVotes + minuteData.downVotes

      console.log('Vote data:', { upVotes: minuteData.upVotes, downVotes: minuteData.downVotes, totalVotes })

      // Check if we've already processed this minute to prevent duplicates
      const existingEntry = historyStorage.find(entry => entry.minute === minute)
      if (existingEntry) {
        console.log('Minute already processed, skipping:', minute)
        return NextResponse.json({
          success: true,
          newProductivity: currentProductivity,
          votesSummary: { upVotes: 0, downVotes: 0, totalVotes: 0 },
          message: "Minute already processed"
        })
      }

    if (totalVotes === 0) {
      // No votes, productivity stays the same but still add to history
      const newHistoryPoint = {
        time: `${minute}:00`,
        productivity: currentProductivity,
        minute: minute,
        upVotes: 0,
        downVotes: 0,
        totalVotes: 0,
      }
      historyStorage.push(newHistoryPoint)
      startNewMinute()
      
      console.log('No votes received, productivity stays at:', currentProductivity)
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
    const newProductivity = Math.max(-20, Math.min(100, currentProductivity + productivityChange))
    updateCurrentProductivity(newProductivity)

    // Add to history storage
    const newHistoryPoint = {
      time: `${minute}:00`,
      productivity: newProductivity,
      minute: minute,
      upVotes: minuteData.upVotes,
      downVotes: minuteData.downVotes,
      totalVotes: totalVotes,
    }
    historyStorage.push(newHistoryPoint)

    // Start timing for the new minute
    startNewMinute()

    // Clean up old vote data to prevent memory leaks
    delete voteStorage[minute]

    console.log('Votes processed successfully:', {
      minute,
      oldProductivity: currentProductivity - productivityChange,
      newProductivity,
      change: productivityChange,
      votes: { upVotes: minuteData.upVotes, downVotes: minuteData.downVotes, totalVotes }
    })

    return NextResponse.json({
      success: true,
      newProductivity: newProductivity,
      votesSummary: {
        upVotes: minuteData.upVotes,
        downVotes: minuteData.downVotes,
        totalVotes: totalVotes,
      },
      productivityChange: productivityChange,
    }) 
    } finally {
      // Always release the processing lock
      setProcessingLock(false)
    }
  } catch (error) {
    console.error("Process votes error:", error)
    // Release lock on error
    setProcessingLock(false)
    
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
