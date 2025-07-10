import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Call the process-votes endpoint to test
    const processResponse = await fetch(`${request.nextUrl.origin}/api/process-votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minute: 1 }) // Test with minute 1
    })
    
    const result = await processResponse.json()
    
    return NextResponse.json({
      success: true,
      message: "Test trigger completed",
      processResult: result
    })
  } catch (error) {
    console.error("Test trigger error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
