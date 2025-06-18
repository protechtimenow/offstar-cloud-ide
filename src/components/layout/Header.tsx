'use client';

import { motion } from 'framer-motion'
import { 
  Menu,
  Settings,
  User,
  Bell,
  Wifi,
  WifiOff,
  Activity,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

interface HeaderProps {
  isConnected: boolean
  systemHealth?: {
    status: 'healthy' | 'warning' | 'critical'
    cpu: { percent: number }
    memory: { percent: number }
  }
  loading: boolean
}

export function Header({ isConnected, systemHealth, loading }: HeaderProps) {
  const getStatusIcon = () => {
    if (loading) return <Activity className="w-4 h-4 animate-spin" />
    if (!systemHealth) return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    
    switch (systemHealth.status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getStatusColor = () => {
    if (!systemHealth) return 'text-yellow-500'
    
    switch (systemHealth.status) {
      case 'healthy': return 'text-green-500'
      case 'warning': return 'text-yellow-500'
      case 'critical': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <motion.header 
      className="h-14 bg-dark-900 border-b border-dark-700 flex items-center justify-between px-4"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Left Side - Logo and Navigation */}
      <div className="flex items-center space-x-4">
        <motion.div 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-black font-bold text-sm">OS</span>
          </div>
          <span className="font-semibold text-lg">OFFSTAR Cloud IDE</span>
        </motion.div>
        
        <nav className="hidden md:flex items-center space-x-2">
          <NavButton>File</NavButton>
          <NavButton>Edit</NavButton>
          <NavButton>View</NavButton>
          <NavButton>Terminal</NavButton>
          <NavButton>Help</NavButton>
        </nav>
      </div>

      {/* Center - Project Info */}
      <div className="hidden lg:flex items-center space-x-4 text-sm text-gray-400">
        <span>Current Project: </span>
        <span className="text-white font-medium">offstar-cloud-ide</span>
        <span className="text-primary-500">main</span>
      </div>

      {/* Right Side - Status and User */}
      <div className="flex items-center space-x-3">
        {/* Connection Status */}
        <motion.div 
          className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-dark-800"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
        >
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-xs hidden sm:block">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </motion.div>

        {/* System Health */}
        <motion.div 
          className={`flex items-center space-x-2 px-2 py-1 rounded-lg bg-dark-800 ${getStatusColor()}`}
          whileHover={{ scale: 1.05 }}
        >
          {getStatusIcon()}
          {systemHealth && (
            <div className="text-xs hidden sm:flex space-x-2">
              <span>CPU: {Math.round(systemHealth.cpu.percent)}%</span>
              <span>MEM: {Math.round(systemHealth.memory.percent)}%</span>
            </div>
          )}
        </motion.div>

        {/* Notifications */}
        <motion.button 
          className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-4 h-4" />
          <motion.div 
            className="absolute -top-1 -right-1 w-3 h-3 bg-accent-500 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 }}
          />
        </motion.button>

        {/* Settings */}
        <motion.button 
          className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
          whileHover={{ scale: 1.05, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <Settings className="w-4 h-4" />
        </motion.button>

        {/* User Profile */}
        <motion.button 
          className="p-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <User className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.header>
  )
}

function NavButton({ children }: { children: React.ReactNode }) {
  return (
    <motion.button
      className="px-3 py-1 text-sm text-gray-400 hover:text-white rounded transition-colors"
      whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  )
}
