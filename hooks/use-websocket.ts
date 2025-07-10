import { useEffect, useRef, useState } from 'react'

export interface VoteLogEntry {
  id: string
  name: string
  vote: "up" | "down"
  timestamp: string
  minute: number
  userId: string
}

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [voteLogs, setVoteLogs] = useState<VoteLogEntry[]>([])
  const pollInterval = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)

  // Fallback polling when WebSocket is not available
  const pollVoteLogs = async () => {
    try {
      const response = await fetch("/api/history")
      const result = await response.json()
      
      if (result.success) {
        // Update connection status based on successful response
        setIsConnected(true)
        
        // Only update if we have new data
        const newLogsString = JSON.stringify(result.voteLogs)
        const currentLogsString = JSON.stringify(voteLogs)
        
        if (newLogsString !== currentLogsString) {
          setVoteLogs(result.voteLogs)
        }
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error("Error polling vote logs:", error)
      setIsConnected(false)
    }
  }

  const connect = () => {
    console.log('Starting vote log polling...')
    
    // Poll every 1 second for new vote logs
    pollInterval.current = setInterval(pollVoteLogs, 1000)
    
    // Initial poll
    pollVoteLogs()
  }

  useEffect(() => {
    if (url && typeof window !== 'undefined') {
      connect()
    }
    
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current)
      }
    }
  }, [url])

  const sendMessage = (message: any) => {
    // For polling approach, we don't send messages
    console.log('Would send message:', message)
  }

  return {
    isConnected,
    voteLogs,
    setVoteLogs,
    sendMessage
  }
}
