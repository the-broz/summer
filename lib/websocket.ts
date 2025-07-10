import { WebSocketServer, WebSocket } from 'ws'
import { Server } from 'http'

export interface WebSocketMessage {
  type: 'vote' | 'sync' | 'timer'
  data?: any
}

export class WebSocketManager {
  private wss: WebSocketServer | null = null
  private server: Server | null = null

  initialize(server: Server) {
    this.server = server
    this.wss = new WebSocketServer({ server })

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection')
      
      ws.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString())
          this.handleMessage(ws, data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      })

      ws.on('close', () => {
        console.log('WebSocket connection closed')
      })
    })
  }

  private handleMessage(ws: WebSocket, message: WebSocketMessage) {
    switch (message.type) {
      case 'sync':
        // Client requesting sync - handled in API routes
        break
      default:
        console.log('Unknown message type:', message.type)
    }
  }

  broadcast(message: WebSocketMessage) {
    if (!this.wss) return

    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message))
      }
    })
  }
}

export const wsManager = new WebSocketManager()
