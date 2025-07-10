import { NextRequest } from "next/server"
import { WebSocketServer } from "ws"
import { getRecentVoteLogs } from "@/lib/storage"

const clients = new Set<any>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const upgrade = request.headers.get('upgrade')
  
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket', { status: 400 })
  }

  // In Next.js, WebSocket handling is different
  // This is a simplified approach - in production you'd use a proper WebSocket server
  return new Response(null, { status: 101 })
}

// Custom WebSocket handler for Next.js
export function handleWebSocket(ws: any) {
  console.log('New WebSocket connection')
  clients.add(ws)
  
  // Send initial sync data
  ws.send(JSON.stringify({
    type: 'sync',
    data: {
      voteLogs: getRecentVoteLogs(10)
    }
  }))

  ws.on('message', (message: any) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('Received WebSocket message:', data)
    } catch (error) {
      console.error('Error parsing WebSocket message:', error)
    }
  })

  ws.on('close', () => {
    console.log('WebSocket connection closed')
    clients.delete(ws)
  })
}

export function broadcastToClients(message: any) {
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(message))
    }
  })
}
