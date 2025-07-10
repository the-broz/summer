import fs from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'productivity-data.json')

export interface HistoryData {
  historyStorage: Array<{
    time: string
    productivity: number
    minute: number
    upVotes: number
    downVotes: number
    totalVotes: number
  }>
  voteLogsStorage: Array<{
    id: string
    name: string
    vote: "up" | "down"
    timestamp: string
    minute: number
    userId: string
  }>
  currentProductivity: number
  currentMinuteStartTime: number
}

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Load data from JSON file
export function loadDataFromFile(): HistoryData | null {
  try {
    ensureDataDirectory()
    
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf-8')
      const data = JSON.parse(fileContent)
      console.log('Loaded data from file:', {
        historyPoints: data.historyStorage?.length || 0,
        voteLogs: data.voteLogsStorage?.length || 0,
        productivity: data.currentProductivity
      })
      return data
    }
  } catch (error) {
    console.error('Error loading data from file:', error)
  }
  return null
}

// Save data to JSON file
export function saveDataToFile(data: HistoryData) {
  try {
    ensureDataDirectory()
    
    const fileContent = JSON.stringify(data, null, 2)
    fs.writeFileSync(DATA_FILE, fileContent, 'utf-8')
    console.log('Saved data to file:', {
      historyPoints: data.historyStorage.length,
      voteLogs: data.voteLogsStorage.length,
      productivity: data.currentProductivity
    })
  } catch (error) {
    console.error('Error saving data to file:', error)
  }
}

// Auto-save function that can be called periodically
export function autoSaveData(
  historyStorage: any[],
  voteLogsStorage: any[],
  currentProductivity: number,
  currentMinuteStartTime: number
) {
  const data: HistoryData = {
    historyStorage,
    voteLogsStorage,
    currentProductivity,
    currentMinuteStartTime
  }
  saveDataToFile(data)
}
