"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ThumbsUp, ThumbsDown, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, MessageCircle } from "lucide-react"

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

export default function SummerITProductivity() {
  const [data, setData] = useState<DataPoint[]>([{ time: "0:00", productivity: 75, minute: 0 }])
  const [currentProductivity, setCurrentProductivity] = useState(75)
  const [hasVoted, setHasVoted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [currentMinute, setCurrentMinute] = useState(1)
  const [voteStats, setVoteStats] = useState<VoteStats>({ upVotes: 0, downVotes: 0, totalVotes: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState("")
  const [voteFeed, setVoteFeed] = useState<
    Array<{
      id: string
      name: string
      vote: "up" | "down"
      timestamp: string
      minute: number
    }>
  >([])

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - process votes and reset
          processVotesAndUpdate()
          return 60
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentMinute])

  const processVotesAndUpdate = useCallback(async () => {
    try {
      const response = await fetch("/api/process-votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minute: currentMinute }),
      })

      const result = await response.json()

      if (result.success) {
        const newProductivity = Math.max(0, Math.min(100, result.newProductivity))
        const newDataPoint: DataPoint = {
          time: `${currentMinute}:00`,
          productivity: newProductivity,
          minute: currentMinute,
        }

        setData((prev) => [...prev, newDataPoint])
        setCurrentProductivity(newProductivity)
        setCurrentMinute((prev) => prev + 1)
        setHasVoted(false)
        setVoteStats({ upVotes: 0, downVotes: 0, totalVotes: 0 })
      }
    } catch (error) {
      console.error("Error processing votes:", error)
    }
  }, [currentMinute])

  const handleVote = async (voteType: "up" | "down") => {
    if (hasVoted || isLoading || !userName.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vote: voteType,
          minute: currentMinute,
          userId: `${userName}_${Date.now()}`,
          userName: userName.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setHasVoted(true)
        setVoteStats(result.stats)

        // Add to feed
        const newFeedItem = {
          id: `${Date.now()}_${Math.random()}`,
          name: userName.trim(),
          vote: voteType,
          timestamp: new Date().toLocaleTimeString(),
          minute: currentMinute,
        }
        setVoteFeed((prev) => [newFeedItem, ...prev.slice(0, 9)]) // Keep last 10 items
      }
    } catch (error) {
      console.error("Error voting:", error)
    } finally {
      setIsLoading(false)
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
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Summer IT Productivity</h1>
          <p className="text-lg text-gray-300">Vote to influence the team's productivity level</p>
        </div>

        {/* Stats Cards */}
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
                <p className="text-sm text-gray-400">Current Minute</p>
                <p className="text-2xl font-bold text-white">{currentMinute}</p>
              </div>
            </CardContent>
          </Card>
        </div>

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
                disabled={hasVoted || isLoading || !userName.trim()}
                size="lg"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp className="w-5 h-5" />
                Boost Productivity
              </Button>

              <Button
                onClick={() => handleVote("down")}
                disabled={hasVoted || isLoading || !userName.trim()}
                size="lg"
                variant="destructive"
                className="flex items-center gap-2"
              >
                <ThumbsDown className="w-5 h-5" />
                Decrease Productivity
              </Button>
            </div>

            {!userName.trim() && (
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
            <ChartContainer
              config={{
                productivity: {
                  label: "Productivity %",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[400px]"
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
                    stroke="var(--color-productivity)"
                    strokeWidth={3}
                    dot={(props: any) => {
                      const isLast = props.payload === data[data.length - 1]
                      if (isLast) {
                        return (
                          <g>
                            {/* Pinging outer circle */}
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r="12"
                              fill="var(--color-productivity)"
                              opacity="0.4"
                              className="animate-ping"
                            />
                            {/* Static outer circle */}
                            <circle cx={props.cx} cy={props.cy} r="8" fill="var(--color-productivity)" opacity="0.6" />
                            {/* Inner solid circle */}
                            <circle cx={props.cx} cy={props.cy} r="4" fill="var(--color-productivity)" />
                          </g>
                        )
                      }
                      return <circle cx={props.cx} cy={props.cy} r="3" fill="var(--color-productivity)" opacity="0.7" />
                    }}
                    activeDot={{
                      r: 6,
                      stroke: "var(--color-productivity)",
                      strokeWidth: 2,
                      fill: "var(--color-productivity)",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Live Vote Feed */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageCircle className="w-5 h-5" />
              Live Vote Feed
            </CardTitle>
            <CardDescription className="text-gray-400">Recent voting activity from the team</CardDescription>
          </CardHeader>
          <CardContent>
            {voteFeed.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No votes yet. Be the first to vote!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {voteFeed.map((item) => (
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
      </div>
    </div>
  )
}
