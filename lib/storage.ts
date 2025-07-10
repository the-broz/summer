import { loadDataFromFile, saveDataToFile, autoSaveData } from './file-storage'

// Load initial data from file or use defaults
const loadedData = loadDataFromFile()

// Shared storage for historical data across API routes
export const historyStorage: Array<{
  time: string
  productivity: number
  minute: number
  upVotes: number
  downVotes: number
  totalVotes: number
}> = loadedData?.historyStorage || [
  { time: "0:00", productivity: 75, minute: 0, upVotes: 0, downVotes: 0, totalVotes: 0 }
]

// Shared storage for vote logs
export const voteLogsStorage: Array<{
  id: string
  name: string
  vote: "up" | "down"
  timestamp: string
  minute: number
  userId: string
}> = loadedData?.voteLogsStorage || []

// Shared storage for votes (in production, use a database)
export const voteStorage: Record<number, { upVotes: number; downVotes: number; voters: Set<string> }> = {}

export let currentProductivity = loadedData?.currentProductivity || 75
export let currentMinuteStartTime = loadedData?.currentMinuteStartTime || Date.now() // Track when current minute started
export let isProcessingVotes = false // Server-side processing lock

// Auto-save interval (save every 30 seconds)
let autoSaveInterval: NodeJS.Timeout | null = null

function startAutoSave() {
  if (autoSaveInterval) return // Already started
  
  autoSaveInterval = setInterval(() => {
    autoSaveData(historyStorage, voteLogsStorage, currentProductivity, currentMinuteStartTime)
  }, 30000) // Save every 30 seconds
  
  console.log('Auto-save started - saving every 30 seconds')
}

// Start auto-save when module loads
if (typeof process !== 'undefined') {
  startAutoSave()
  // Clean up any duplicate entries on startup
  cleanupDuplicateEntries()
}

export function updateCurrentProductivity(newValue: number) {
  currentProductivity = newValue
  // Trigger immediate save on important changes
  autoSaveData(historyStorage, voteLogsStorage, currentProductivity, currentMinuteStartTime)
}

export function startNewMinute() {
  currentMinuteStartTime = Date.now()
  // Trigger immediate save when new minute starts
  autoSaveData(historyStorage, voteLogsStorage, currentProductivity, currentMinuteStartTime)
}

export function getTimeLeftInCurrentMinute(): number {
  const elapsed = Date.now() - currentMinuteStartTime
  const timeLeft = Math.max(0, 60000 - elapsed) // 60 seconds in milliseconds
  return Math.ceil(timeLeft / 1000) // Return seconds
}

export function addVoteLog(voteLog: {
  id: string
  name: string
  vote: "up" | "down"
  timestamp: string
  minute: number
  userId: string
}) {
  voteLogsStorage.push(voteLog)
  // Keep only last 50 votes to prevent memory issues
  if (voteLogsStorage.length > 50) {
    voteLogsStorage.shift()
  }
  // Trigger save when votes are added
  autoSaveData(historyStorage, voteLogsStorage, currentProductivity, currentMinuteStartTime)
}

export function getRecentVoteLogs(limit: number = 10): Array<{
  id: string
  name: string
  vote: "up" | "down"
  timestamp: string
  minute: number
  userId: string
}> {
  return voteLogsStorage.slice(-limit).reverse()
}

// Manual save function for immediate saves
export function saveDataNow() {
  autoSaveData(historyStorage, voteLogsStorage, currentProductivity, currentMinuteStartTime)
}

export function setProcessingLock(value: boolean) {
  isProcessingVotes = value
}

// Function to clean up any duplicate entries in history storage
export function cleanupDuplicateEntries() {
  const seen = new Set<number>()
  const cleaned = []
  
  for (const entry of historyStorage) {
    if (!seen.has(entry.minute)) {
      seen.add(entry.minute)
      cleaned.push(entry)
    } else {
      console.log('Removing duplicate entry for minute:', entry.minute)
    }
  }
  
  // Clear the array and add back the cleaned entries
  historyStorage.length = 0
  historyStorage.push(...cleaned)
  
  if (cleaned.length !== historyStorage.length) {
    console.log('Cleaned up duplicate entries:', historyStorage.length - cleaned.length)
    // Trigger save after cleanup
    autoSaveData(historyStorage, voteLogsStorage, currentProductivity, currentMinuteStartTime)
  }
}
