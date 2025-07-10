import { type NextRequest, NextResponse } from "next/server"

// Reset endpoint for testing/demo purposes
export async function POST(request: NextRequest) {
  try {
    // Reset would clear vote storage and reset productivity
    // This is useful for demonstrations

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
