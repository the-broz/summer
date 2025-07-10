"use client"

import { useState, useEffect, useCallback, useRef, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ThumbsUp, ThumbsDown, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, MessageCircle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import Cookies from "js-cookie"
import { useWebSocket } from "@/hooks/use-websocket"

interface DataPoint {
  time: string
  productivity: number
  minute: number
}

interface VoteStats {
  upVotes: number
  downVotes: number
  totalVotes: number
}

// Memoized chart component to prevent unnecessary re-renders
const ProductivityChart = memo(({ data, currentProductivity }: { data: DataPoint[], currentProductivity: number }) => {
  console.log('ProductivityChart render with', data.length, 'data points')
  
  return (
    <ChartContainer
      config={{
        productivity: {
          label: "Productivity %",
          color: "hsl(var(--chart-1))",
        },
      }}
      className="h-[400px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
          <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
          <ChartTooltip
            content={<ChartTooltipContent className="bg-gray-700 border-gray-600" />}
            formatter={(value) => [`${value}%`, "Productivity"]}
          />
          <Line
            type="monotone"
            dataKey="productivity"
            stroke={
              currentProductivity >= 80
                ? "#22c55e" // green
                : currentProductivity >= 60
                ? "#eab308" // yellow
                : "#ef4444" // red
            }
            strokeWidth={3}
            dot={(props: any) => {
              const isLast = props.payload === data[data.length - 1]
              const color =
                props.payload.productivity >= 80
                  ? "#22c55e"
                  : props.payload.productivity >= 60
                  ? "#eab308"
                  : "#ef4444"
              if (isLast) {
                return (
                  <g>
                    <circle cx={props.cx} cy={props.cy} r="8" fill={color} opacity="0.6" />
                    <circle cx={props.cx} cy={props.cy} r="4" fill={color} />
                  </g>
                )
              }
              return <circle cx={props.cx} cy={props.cy} r="3" fill={color} opacity="0.7" />
            }}
            activeDot={{
              r: 6,
              stroke:
                currentProductivity >= 80
                  ? "#22c55e"
                  : currentProductivity >= 60
                  ? "#eab308"
                  : "#ef4444",
              strokeWidth: 2,
              fill:
                currentProductivity >= 80
                  ? "#22c55e"
                  : currentProductivity >= 60
                  ? "#eab308"
                  : "#ef4444",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
})

ProductivityChart.displayName = 'ProductivityChart'

// Memoized stats cards component
const StatsCards = memo(({ status, timeLeft, currentProductivity, currentMinute }: {
  status: { text: string, color: string, icon: any },
  timeLeft: number,
  currentProductivity: number,
  currentMinute: number
}) => {
  console.log('StatsCards render')
  
  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`
  }
  
  const StatusIcon = status.icon
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
            <div>
              <p className="text-sm text-gray-400">Current Status</p>
              <p className="text-xl font-bold text-white flex items-center gap-1">
                {status.text} <StatusIcon className="w-4 h-4" />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-sm text-gray-400">Time Left</p>
              <p className="text-xl font-bold text-white">{formatTime(timeLeft)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div>
            <p className="text-sm text-gray-400">Productivity Level</p>
            <p className="text-2xl font-bold text-white">{currentProductivity.toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div>
            <p className="text-sm text-gray-400">Voting Round</p>
            <p className="text-2xl font-bold text-white">{currentMinute}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

StatsCards.displayName = 'StatsCards'

// Memoized vote feed component
const VoteFeed = memo(({ voteLogs }: { voteLogs: Array<{
  id: string
  name: string
  vote: "up" | "down"
  timestamp: string
  minute: number
  userId: string
}> }) => {
  console.log('VoteFeed render with', voteLogs.length, 'logs')
  
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageCircle className="w-5 h-5" />
          Live Vote Feed
        </CardTitle>
        <CardDescription className="text-gray-400">Recent voting activity from the team</CardDescription>
      </CardHeader>
      <CardContent>
        {voteLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No votes yet. Be the first to vote!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {voteLogs.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  item.vote === "up" ? "bg-green-900/30 border-green-700/50" : "bg-red-900/30 border-red-700/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${item.vote === "up" ? "bg-green-800/50" : "bg-red-800/50"}`}>
                    {item.vote === "up" ? (
                      <ThumbsUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <ThumbsDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="text-sm text-gray-400">
                      {item.vote === "up" ? "boosted" : "decreased"} productivity
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{item.timestamp}</p>
                  <p>Minute {item.minute}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

VoteFeed.displayName = 'VoteFeed'

// Memoized debug panel component  
const DebugPanel = memo(({ 
  currentMinute, 
  timeLeft, 
  hasVoted, 
  isConnected, 
  isProcessing, 
  dataLength,
  onManualTrigger,
  onReloadData,
  onCleanup
}: {
  currentMinute: number,
  timeLeft: number,
  hasVoted: boolean,
  isConnected: boolean,
  isProcessing: boolean,
  dataLength: number,
  onManualTrigger: () => void,
  onReloadData: () => void,
  onCleanup: () => void
}) => {
  console.log('DebugPanel render')
  
  return null
  // return (
  //   <Card className="bg-gray-800 border-gray-700">
  //     <CardHeader>
  //       <CardTitle className="text-white">Debug Panel</CardTitle>
  //     </CardHeader>
  //     <CardContent>
  //       <div className="flex gap-2">
  //         <Button onClick={onManualTrigger} variant="outline" size="sm">
  //           Manual Trigger
  //         </Button>
  //         <Button onClick={onReloadData} variant="outline" size="sm">
  //           Reload Data
  //         </Button>
  //         <Button onClick={onCleanup} variant="outline" size="sm">
  //           Cleanup Duplicates
  //         </Button>
  //       </div>
  //       <div className="mt-2 text-xs text-gray-400">
  //         <p>Current Minute: {currentMinute}</p>
  //         <p>Time Left: {timeLeft}</p>
  //         <p>Has Voted: {hasVoted ? 'Yes' : 'No'}</p>
  //         <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
  //         <p>Processing: {isProcessing ? 'Yes' : 'No'}</p>
  //         <p>Chart Data Points: {dataLength}</p>
  //       </div>
  //     </CardContent>
  //   </Card>
  // )
})

DebugPanel.displayName = 'DebugPanel'

export default function SummerITProductivity() {
  const [data, setData] = useState<DataPoint[]>([])
  const [currentProductivity, setCurrentProductivity] = useState(75)
  const [hasVoted, setHasVoted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [currentMinute, setCurrentMinute] = useState(1)
  const [voteStats, setVoteStats] = useState<VoteStats>({ upVotes: 0, downVotes: 0, totalVotes: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [userName, setUserName] = useState("")
  const [userId, setUserId] = useState("")

  // Use ref to capture current minute in timer
  const currentMinuteRef = useRef(currentMinute)
  const isProcessingRef = useRef(false)
  
  // Update refs when state changes
  useEffect(() => {
    currentMinuteRef.current = currentMinute
  }, [currentMinute])
  
  useEffect(() => {
    isProcessingRef.current = isProcessing
  }, [isProcessing])

  // WebSocket connection for real-time updates
  const wsUrl = typeof window !== 'undefined' 
    ? `ws${window.location.protocol === 'https:' ? 's' : ''}://${window.location.host}/api/ws`
    : ''
  const { isConnected, voteLogs, setVoteLogs } = useWebSocket(wsUrl)

  // Load historical data from server
  const loadHistoricalData = useCallback(async (syncTimer = true) => {
    try {
      console.log('Loading historical data...')
      const response = await fetch("/api/history")
      const result = await response.json()
      console.log('History API result:', result)
      
      if (result.success) {
        setData(result.data)
        setCurrentProductivity(result.currentProductivity)
        setCurrentMinute(result.currentMinute)
        
        // Only sync timer from server on initial load, not during active countdown
        if (syncTimer) {
          setTimeLeft(result.timeLeft)
        }
        
        console.log('Updated state:', {
          dataLength: result.data.length,
          productivity: result.currentProductivity,
          minute: result.currentMinute,
          timeLeft: result.timeLeft,
          syncedTimer: syncTimer
        })
        
        // Sync vote logs if WebSocket isn't connected yet
        if (!isConnected && result.voteLogs) {
          setVoteLogs(result.voteLogs)
        }
      }
    } catch (error) {
      console.error("Error loading historical data:", error)
    }
  }, [isConnected, setVoteLogs])

  // Load user data from cookies and historical data on component mount
  useEffect(() => {
    const loadUserFromCookies = () => {
      let storedUserId = Cookies.get("userId")
      let storedUserName = Cookies.get("userName")

      if (!storedUserId) {
        storedUserId = uuidv4()
        Cookies.set("userId", storedUserId, { expires: 365 }) // Expires in 1 year
      }

      if (storedUserName) {
        setUserName(storedUserName)
      }

      setUserId(storedUserId)
    }

    loadUserFromCookies()
    loadHistoricalData(true) // Sync timer on initial load
  }, []) // Remove loadHistoricalData dependency to prevent infinite loop

  // Save user name to cookie when it changes
  useEffect(() => {
    if (userName.trim()) {
      Cookies.set("userName", userName.trim(), { expires: 365 })
    }
  }, [userName])

  const processVotesAndUpdate = useCallback(async () => {
    if (isProcessing) {
      console.log('Already processing votes, skipping...')
      return
    }
    
    setIsProcessing(true)
    console.log('Processing votes for minute:', currentMinute)
    try {
      const response = await fetch("/api/process-votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minute: currentMinute }),
      })

      const result = await response.json()
      console.log('Process votes result:', result)

      if (result.success) {
        // Reload from server to get the updated state after processing
        // Don't sync timer since we just reset it to 60
        await loadHistoricalData(false)
        setHasVoted(false)
        setVoteStats({ upVotes: 0, downVotes: 0, totalVotes: 0 })
      }
    } catch (error) {
      console.error("Error processing votes:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [currentMinute, loadHistoricalData, isProcessing])

  useEffect(() => {
    console.log('Setting up timer...')
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        console.log('Timer tick, time left:', prev, 'current minute:', currentMinuteRef.current)
        if (prev <= 1) {
          // Time's up - process votes and reset
          if (!isProcessingRef.current) {
            console.log('Time is up, processing votes for minute:', currentMinuteRef.current)
            processVotesAndUpdate()
          } else {
            console.log('Already processing, skipping vote processing')
          }
          return 60 // Reset to 60 seconds
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      console.log('Clearing timer')
      clearInterval(timer)
    }
  }, [processVotesAndUpdate]) // Keep processVotesAndUpdate as dependency

  const handleVote = async (voteType: "up" | "down") => {
    if (hasVoted || isLoading || !userName.trim() || !isConnected) return

    setIsLoading(true)
    try {
      console.log('Submitting vote:', { voteType, currentMinute, userId, userName })
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vote: voteType,
          minute: currentMinute,
          userId: userId,
          userName: userName.trim(),
        }),
      })

      const result = await response.json()
      console.log('Vote result:', result)

      if (result.success) {
        setHasVoted(true)
        setVoteStats(result.stats)
        // Vote log is now handled by WebSocket/polling
      } else {
        console.error('Vote failed:', result.error)
      }
    } catch (error) {
      console.error("Error voting:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Debug function to manually trigger vote processing
  const handleManualTrigger = async () => {
    console.log('Manually triggering vote processing...')
    await processVotesAndUpdate()
  }

  // Debug function to clean up duplicates
  const handleCleanup = async () => {
    console.log('Cleaning up duplicate entries...')
    try {
      const response = await fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup' })
      })
      const result = await response.json()
      console.log('Cleanup result:', result)
      // Reload data after cleanup
      await loadHistoricalData(false)
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  const formatTime = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`
  }

  const getProductivityStatus = () => {
    if (currentProductivity >= 80) return { text: "High", color: "bg-green-500", icon: TrendingUp }
    if (currentProductivity >= 60) return { text: "Medium", color: "bg-yellow-500", icon: TrendingUp }
    return { text: "Low", color: "bg-red-500", icon: TrendingDown }
  }

  const status = getProductivityStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Summer IT Productivity</h1>
          <p className="text-lg text-gray-300">Vote to influence the team's productivity level</p>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards 
          status={status} 
          timeLeft={timeLeft} 
          currentProductivity={currentProductivity} 
          currentMinute={currentMinute} 
        />

        {/* Name Input */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="w-5 h-5" />
              Your Identity
            </CardTitle>
            <CardDescription className="text-gray-400">Enter your name to participate in voting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="userName" className="text-gray-300">
                Name
              </Label>
              <Input
                id="userName"
                type="text"
                placeholder="Enter your name..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                maxLength={20}
                className="max-w-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
              {userName.trim() && (
                <p className="text-sm text-green-400">
                  Ready to vote as: <strong>{userName.trim()}</strong>
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voting Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Cast Your Vote</CardTitle>
            <CardDescription className="text-gray-400">
              Vote once per minute to influence productivity. Results are calculated at the end of each minute.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Button
                onClick={() => handleVote("up")}
                disabled={hasVoted || isLoading || !userName.trim() || !isConnected}
                size="lg"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp className="w-5 h-5" />
                Boost Productivity
              </Button>

              <Button
                onClick={() => handleVote("down")}
                disabled={hasVoted || isLoading || !userName.trim() || !isConnected}
                size="lg"
                variant="destructive"
                className="flex items-center gap-2"
              >
                <ThumbsDown className="w-5 h-5" />
                Decrease Productivity
              </Button>
            </div>

            {!isConnected && (
              <div className="mt-4 text-center">
                <Badge variant="destructive" className="bg-red-700 text-white">
                  Disconnected from server - voting disabled
                </Badge>
              </div>
            )}

            {!userName.trim() && isConnected && (
              <div className="mt-4 text-center">
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  Please enter your name above to vote
                </Badge>
              </div>
            )}

            {hasVoted && (
              <div className="mt-4 text-center">
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                  Vote recorded! Wait for next minute to vote again.
                </Badge>
              </div>
            )}

            {/* Vote Stats */}
            {voteStats.totalVotes > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-400">Up Votes</p>
                  <p className="text-lg font-bold text-green-400">{voteStats.upVotes}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Down Votes</p>
                  <p className="text-lg font-bold text-red-400">{voteStats.downVotes}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Votes</p>
                  <p className="text-lg font-bold text-white">{voteStats.totalVotes}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Productivity Over Time</CardTitle>
            <CardDescription className="text-gray-400">
              Real-time productivity tracking based on team votes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductivityChart data={data} currentProductivity={currentProductivity} />
          </CardContent>
        </Card>

        {/* Debug Panel */}
        <DebugPanel 
          currentMinute={currentMinute}
          timeLeft={timeLeft}
          hasVoted={hasVoted}
          isConnected={isConnected}
          isProcessing={isProcessing}
          dataLength={data.length}
          onManualTrigger={handleManualTrigger}
          onReloadData={() => loadHistoricalData(false)}
          onCleanup={handleCleanup}
        />

        {/* Live Vote Feed */}
        <VoteFeed voteLogs={voteLogs} />
      </div>
    </div>
  )
}
