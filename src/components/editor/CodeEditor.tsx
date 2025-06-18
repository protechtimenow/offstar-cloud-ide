'use client';

import { useState, useEffect, useRef } from 'react'
import { Editor } from '@monaco-editor/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Save, 
  Play, 
  FileText, 
  Settings, 
  Maximize2, 
  Minimize2,
  Search,
  Replace
} from 'lucide-react'
import { useFileTabs } from '@/hooks/useFileTabs'
import { useSocket } from '@/hooks/useSocket'

interface CodeEditorProps {
  language?: string
  theme?: string
}

export function CodeEditor({ language = 'typescript', theme = 'vs-dark' }: CodeEditorProps) {
  const [code, setCode] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<any>(null)
  const { activeFile, openFiles, openFile, closeFile, saveFile } = useFileTabs()
  const { socket } = useSocket()

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    
    // Custom keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave()
    })
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
      setShowSearch(true)
    })
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      handleRun()
    })
  }

  const handleSave = async () => {
    if (!activeFile) return
    
    setIsSaving(true)
    try {
      await saveFile(activeFile.path, code)
      // Emit to socket for real-time collaboration
      socket?.emit('fileChanged', { path: activeFile.path, content: code })
    } catch (error) {
      console.error('Failed to save file:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRun = () => {
    if (socket) {
      socket.emit('runCode', { code, language })
    }
  }

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run()
    }
  }

  return (
    <div className={`flex flex-col h-full bg-dark-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Toolbar */}
      <motion.div 
        className="flex items-center justify-between p-2 bg-dark-800 border-b border-dark-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* File Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto max-w-md">
          {openFiles.map((file) => (
            <motion.div
              key={file.path}
              className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
                activeFile?.path === file.path
                  ? 'bg-primary-500 text-black'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <FileText className="w-3 h-3" />
              <button
                onClick={() => openFile(file)}
                className="truncate max-w-24"
              >
                {file.name}
              </button>
              <button
                onClick={() => closeFile(file.path)}
                className="hover:text-red-400 ml-1"
              >
                ×
              </button>
            </motion.div>
          ))}
        </div>

        {/* Editor Controls */}
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={handleSave}
            disabled={isSaving}
            className="p-2 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
          </motion.button>
          
          <motion.button
            onClick={handleRun}
            className="p-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-md bg-dark-700 hover:bg-dark-600 transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            <Search className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            onClick={handleFormat}
            className="p-2 rounded-md bg-dark-700 hover:bg-dark-600 transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            <Settings className="w-4 h-4" />
          </motion.button>
          
          <motion.button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-md bg-dark-700 hover:bg-dark-600 transition-colors"
            whileHover={{ scale: 1.05 }}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="p-2 bg-dark-800 border-b border-dark-700"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-dark-700 text-white px-3 py-1 rounded border-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
              <Replace className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Replace..."
                className="flex-1 bg-dark-700 text-white px-3 py-1 rounded border-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => setShowSearch(false)}
                className="p-1 hover:bg-dark-600 rounded"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          onMount={handleEditorDidMount}
          options={{
            fontSize: 14,
            fontFamily: 'var(--font-jetbrains-mono)',
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: true },
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            parameterHints: { enabled: true },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true
            },
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            }
          }}
        />
      </div>

      {/* Status Bar */}
      <motion.div 
        className="flex items-center justify-between p-2 bg-dark-800 border-t border-dark-700 text-xs text-gray-400"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center space-x-4">
          <span>Language: {language}</span>
          <span>Lines: {code.split('\n').length}</span>
          <span>Characters: {code.length}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {activeFile && (
            <span>📁 {activeFile.name}</span>
          )}
          {isSaving && (
            <span className="text-green-500">💾 Saving...</span>
          )}
        </div>
      </motion.div>
    </div>
  )
}
