'use client';

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CodeEditor } from '@/components/editor/CodeEditor'
import { Terminal } from '@/components/terminal/Terminal'
import { FileExplorer } from '@/components/file-explorer/FileExplorer'
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard'
import { AIAssistant } from '@/components/ai/AIAssistant'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBar } from '@/components/layout/StatusBar'
import { useSystemHealth } from '@/hooks/useSystemHealth'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function CloudIDE() {
  const [activeTab, setActiveTab] = useState('editor')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { systemHealth, loading } = useSystemHealth()
  const { isConnected, lastMessage } = useWebSocket()

  const tabs = [
    { id: 'editor', name: 'Editor', icon: '📝' },
    { id: 'terminal', name: 'Terminal', icon: '💻' },
    { id: 'monitoring', name: 'Monitor', icon: '📊' },
    { id: 'ai', name: 'AI Assistant', icon: '🤖' },
  ]

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'editor':
        return <CodeEditor />
      case 'terminal':
        return <Terminal />
      case 'monitoring':
        return <MonitoringDashboard systemHealth={systemHealth} />
      case 'ai':
        return <AIAssistant />
      default:
        return <CodeEditor />
    }
  }

  return (
    <div className="h-screen flex flex-col bg-dark-950 text-white overflow-hidden">
      {/* Header */}
      <Header 
        isConnected={isConnected}
        systemHealth={systemHealth}
        loading={loading}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <motion.div
          initial={false}
          animate={{ width: sidebarOpen ? 250 : 0 }}
          transition={{ duration: 0.3 }}
          className="bg-dark-900 border-r border-dark-700 overflow-hidden"
        >
          <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
          {sidebarOpen && <FileExplorer />}
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tab Bar */}
          <div className="flex bg-dark-900 border-b border-dark-700">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-500 bg-dark-800'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </motion.button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderActiveContent()}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar 
        isConnected={isConnected}
        lastMessage={lastMessage}
        systemHealth={systemHealth}
      />
    </div>
  )
}