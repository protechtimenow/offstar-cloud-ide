const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const { v4: uuidv4 } = require('uuid')
const si = require('systeminformation')
const pty = require('node-pty')
const fs = require('fs')
const path = require('path')
const chokidar = require('chokidar')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Storage
const activeTerminals = new Map()
const activeFiles = new Map()
const aiAgents = new Map()
const deployments = new Map()

// AI Agents Configuration
const AI_MODELS = [
  { id: 'openai-gpt-4', name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'Advanced reasoning and code generation' },
  { id: 'anthropic-claude-3', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Ethical AI with strong reasoning' },
  { id: 'meta-llama-3', name: 'Llama 3 70B', provider: 'Meta', description: 'Open-source powerhouse' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral', description: 'European AI excellence' },
  { id: 'ionet-super-001', name: 'IoNet Super AI', provider: 'Io.net', description: 'Distributed AI processing' },
  { id: 'ionet-quantum-001', name: 'IoNet Quantum', provider: 'Io.net', description: 'Quantum-enhanced consciousness' },
  { id: 'ionet-enterprise-001', name: 'IoNet Enterprise', provider: 'Io.net', description: 'Business intelligence focus' }
]

// Simulated Io.net workers
const IONET_WORKERS = [
  { id: 'worker-gpu-001', type: 'GPU-H100', performance_score: 9.8, status: 'active', location: 'US-East-1' },
  { id: 'worker-gpu-002', type: 'GPU-A100', performance_score: 9.2, status: 'active', location: 'US-West-1' },
  { id: 'worker-cpu-001', type: 'CPU-64Core', performance_score: 8.7, status: 'active', location: 'EU-West-1' },
  { id: 'worker-quantum-001', type: 'Quantum-Hybrid', performance_score: 9.9, status: 'active', location: 'Quantum-Lab' }
]

// System Health Monitoring
let systemMetrics = {
  status: 'healthy',
  uptime: 0,
  memory: { used: 0, total: 0, percent: 0 },
  cpu: { percent: 0, cores: 0 },
  network: { bytesIn: 0, bytesOut: 0 },
  processes: 0,
  timestamp: new Date().toISOString()
}

// Update system metrics every 5 seconds
setInterval(async () => {
  try {
    const [cpu, mem, networkStats] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats()
    ])

    systemMetrics = {
      status: cpu.currentLoad > 80 ? 'critical' : cpu.currentLoad > 60 ? 'warning' : 'healthy',
      uptime: process.uptime(),
      memory: {
        used: mem.used,
        total: mem.total,
        percent: (mem.used / mem.total) * 100
      },
      cpu: {
        percent: cpu.currentLoad,
        cores: cpu.cpus.length
      },
      network: {
        bytesIn: networkStats[0]?.rx_bytes || 0,
        bytesOut: networkStats[0]?.tx_bytes || 0
      },
      processes: cpu.processes || 0,
      timestamp: new Date().toISOString()
    }

    // Broadcast to connected clients
    io.emit('systemHealth', systemMetrics)
  } catch (error) {
    console.error('Error updating system metrics:', error)
  }
}, 5000)

// API Routes

// System Health
app.get('/api/system/health', (req, res) => {
  res.json(systemMetrics)
})

// AI Models
app.get('/api/ai/models', (req, res) => {
  res.json({ models: AI_MODELS })
})

// AI Command Processing
app.post('/api/ai/command', async (req, res) => {
  const { model_id, prompt, context = 'code_generation' } = req.body
  
  const model = AI_MODELS.find(m => m.id === model_id)
  if (!model) {
    return res.status(404).json({ error: 'Model not found' })
  }

  // Simulate AI processing
  const taskId = uuidv4()
  const response = {
    task_id: taskId,
    model: model.name,
    provider: model.provider,
    status: 'processing',
    estimated_time: Math.floor(Math.random() * 30) + 10
  }

  // Simulate processing time
  setTimeout(() => {
    const result = {
      task_id: taskId,
      status: 'completed',
      result: `AI-generated response for: "${prompt}" using ${model.name}`,
      tokens_used: Math.floor(Math.random() * 1000) + 100,
      processing_time: Math.floor(Math.random() * 20) + 5
    }
    
    io.emit('aiResult', result)
  }, response.estimated_time * 1000)

  res.json(response)
})

// Io.net Network Status
app.get('/api/ionet/network', (req, res) => {
  const totalCompute = IONET_WORKERS.reduce((sum, worker) => 
    sum + worker.performance_score, 0
  )
  
  res.json({
    network_status: {
      active_workers: IONET_WORKERS.filter(w => w.status === 'active').length,
      total_workers: IONET_WORKERS.length,
      total_compute_power: totalCompute.toFixed(1),
      network_health: 'excellent'
    },
    workers: IONET_WORKERS,
    compute_distribution: {
      gpu_nodes: IONET_WORKERS.filter(w => w.type.includes('GPU')).length,
      cpu_nodes: IONET_WORKERS.filter(w => w.type.includes('CPU')).length,
      quantum_nodes: IONET_WORKERS.filter(w => w.type.includes('Quantum')).length
    }
  })
})

// File System Operations
app.get('/api/files', (req, res) => {
  const { path: filePath = '.' } = req.query
  
  try {
    const fullPath = path.resolve(filePath)
    const stats = fs.statSync(fullPath)
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(fullPath).map(file => {
        const fileStats = fs.statSync(path.join(fullPath, file))
        return {
          name: file,
          type: fileStats.isDirectory() ? 'directory' : 'file',
          size: fileStats.size,
          modified: fileStats.mtime
        }
      })
      res.json({ files })
    } else {
      const content = fs.readFileSync(fullPath, 'utf8')
      res.json({ content, type: 'file' })
    }
  } catch (error) {
    res.status(404).json({ error: 'File or directory not found' })
  }
})

app.post('/api/files', (req, res) => {
  const { path: filePath, content } = req.body
  
  try {
    fs.writeFileSync(filePath, content)
    res.json({ success: true, message: 'File saved successfully' })
    
    // Broadcast file change
    io.emit('fileChanged', { path: filePath, content })
  } catch (error) {
    res.status(500).json({ error: 'Failed to save file' })
  }
})

// Deployment Management
app.post('/api/deploy', async (req, res) => {
  const { platform = 'vercel', environment = 'production' } = req.body
  
  const deploymentId = uuidv4()
  const deployment = {
    id: deploymentId,
    platform,
    environment,
    status: 'deploying',
    created_at: new Date().toISOString(),
    url: null
  }
  
  deployments.set(deploymentId, deployment)
  
  // Simulate deployment process
  setTimeout(() => {
    deployment.status = 'success'
    deployment.url = `https://${deploymentId}.vercel.app`
    deployment.completed_at = new Date().toISOString()
    
    io.emit('deploymentUpdate', deployment)
  }, 30000) // 30 seconds
  
  res.json(deployment)
})

app.get('/api/deployments', (req, res) => {
  res.json({ deployments: Array.from(deployments.values()) })
})

// WebSocket Connections
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)
  
  // Send current system health
  socket.emit('systemHealth', systemMetrics)
  
  // Terminal connections
  socket.on('createTerminal', () => {
    const terminalId = uuidv4()
    const terminal = pty.spawn(process.platform === 'win32' ? 'powershell.exe' : 'bash', [], {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: process.env
    })
    
    activeTerminals.set(terminalId, terminal)
    
    terminal.onData((data) => {
      socket.emit('terminalOutput', { terminalId, data })
    })
    
    terminal.onExit(() => {
      activeTerminals.delete(terminalId)
      socket.emit('terminalClosed', { terminalId })
    })
    
    socket.emit('terminalCreated', { terminalId })
  })
  
  socket.on('terminalInput', ({ terminalId, data }) => {
    const terminal = activeTerminals.get(terminalId)
    if (terminal) {
      terminal.write(data)
    }
  })
  
  socket.on('resizeTerminal', ({ terminalId, cols, rows }) => {
    const terminal = activeTerminals.get(terminalId)
    if (terminal) {
      terminal.resize(cols, rows)
    }
  })
  
  // File watching
  socket.on('watchFile', (filePath) => {
    const watcher = chokidar.watch(filePath)
    
    watcher.on('change', () => {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        socket.emit('fileChanged', { path: filePath, content })
      } catch (error) {
        console.error('Error reading file:', error)
      }
    })
    
    socket.on('disconnect', () => {
      watcher.close()
    })
  })
  
  // AI Agent communication
  socket.on('aiQuery', async (data) => {
    const { agent, query, context } = data
    
    // Simulate AI agent processing
    setTimeout(() => {
      socket.emit('aiResponse', {
        agent,
        query,
        response: `AI Agent ${agent} processed: ${query}`,
        confidence: Math.random(),
        suggestions: [
          'Consider optimizing the algorithm',
          'Add error handling',
          'Include unit tests'
        ]
      })
    }, 2000)
  })
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
    
    // Clean up terminals
    activeTerminals.forEach((terminal, terminalId) => {
      if (terminal.socket === socket.id) {
        terminal.destroy()
        activeTerminals.delete(terminalId)
      }
    })
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server
server.listen(PORT, () => {
  console.log(`🚀 OFFSTAR Cloud IDE Server running on port ${PORT}`)
  console.log(`📊 System monitoring active`)
  console.log(`🤖 AI agents ready: ${AI_MODELS.length} models available`)
  console.log(`⚡ Io.net workers: ${IONET_WORKERS.length} nodes online`)
  console.log(`🔗 WebSocket server running`)
  console.log(`📁 File system access enabled`)
  console.log(`🚀 Deployment system ready`)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down OFFSTAR Cloud IDE Server...')
  
  // Close all terminals
  activeTerminals.forEach((terminal) => {
    terminal.destroy()
  })
  
  server.close(() => {
    console.log('✅ Server stopped')
    process.exit(0)
  })
})

module.exports = { app, server, io }
