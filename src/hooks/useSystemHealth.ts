'use client';

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  memory: {
    used: number
    total: number
    percent: number
  }
  cpu: {
    percent: number
    cores: number
  }
  gpu?: {
    percent: number
    memory: number
    temperature: number
  }
  network: {
    bytesIn: number
    bytesOut: number
  }
  processes: number
  timestamp: string
}

export function useSystemHealth() {
  const { data: systemHealth, isLoading: loading, error } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: async (): Promise<SystemHealth> => {
      const response = await fetch('/api/system/health')
      if (!response.ok) {
        throw new Error('Failed to fetch system health')
      }
      return response.json()
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  })

  return {
    systemHealth,
    loading,
    error,
  }
}
