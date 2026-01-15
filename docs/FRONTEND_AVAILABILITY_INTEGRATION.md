# Frontend Availability Integration Guide (Next.js)

This guide shows you how to implement the doctor availability system in your Next.js frontend application.

## Overview

The system works as follows:
1. **Backend tracks connections** via heartbeats sent every 10 seconds
2. **If no heartbeat for 30 seconds**, the backend automatically sets `isAvailable` to `false`
3. **Frontend must send heartbeats** while the doctor is available
4. **Frontend handles disconnection** when the page closes or doctor logs out

## Implementation

### 1. Create a Custom Hook for Availability Management

Create a file `hooks/useDoctorAvailability.ts`:

```typescript
import { useEffect, useRef, useCallback } from 'react'

interface UseDoctorAvailabilityOptions {
  token: string
  isAvailable: boolean
  onAvailabilityChange?: (isAvailable: boolean) => void
  apiBaseUrl?: string
}

export function useDoctorAvailability({
  token,
  isAvailable,
  onAvailabilityChange,
  apiBaseUrl = '/api',
}: UseDoctorAvailabilityOptions) {
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const connectionIdRef = useRef<string | null>(null)

  // Generate a unique connection ID
  const generateConnectionId = useCallback(() => {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Send heartbeat to backend
  const sendHeartbeat = useCallback(async () => {
    if (!isAvailable || !token) return

    try {
      const connectionId = connectionIdRef.current || generateConnectionId()
      connectionIdRef.current = connectionId

      const response = await fetch(`${apiBaseUrl}/doctor/connection/heartbeat?connectionId=${connectionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error('Heartbeat failed:', response.statusText)
        // Stop heartbeat on failure
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }
        // Notify parent that availability should be set to false
        onAvailabilityChange?.(false)
      }
    } catch (error) {
      console.error('Heartbeat error:', error)
      // Stop heartbeat on error
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
      // Notify parent that availability should be set to false
      onAvailabilityChange?.(false)
    }
  }, [isAvailable, token, apiBaseUrl, generateConnectionId, onAvailabilityChange])

  // Start heartbeat interval
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      return // Already running
    }

    // Send initial heartbeat immediately
    sendHeartbeat()

    // Then send every 10 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      sendHeartbeat()
    }, 10000) // 10 seconds
  }, [sendHeartbeat])

  // Stop heartbeat interval
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    connectionIdRef.current = null
  }, [])

  // Handle disconnection
  const handleDisconnect = useCallback(async () => {
    stopHeartbeat()

    if (!token) return

    try {
      // Use sendBeacon for reliability during page unload
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${apiBaseUrl}/doctor/connection/disconnect`,
          JSON.stringify({})
        )
      } else {
        // Fallback for browsers that don't support sendBeacon
        await fetch(`${apiBaseUrl}/doctor/connection/disconnect`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          keepalive: true, // Keep request alive even after page unload
        })
      }
    } catch (error) {
      console.error('Disconnect signal failed:', error)
    }
  }, [token, apiBaseUrl, stopHeartbeat])

  // Toggle availability
  const toggleAvailability = useCallback(async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/doctor/availability/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to toggle availability')
      }

      const data = await response.json()
      const newAvailabilityStatus = data.data?.isAvailable ?? false

      onAvailabilityChange?.(newAvailabilityStatus)

      return data
    } catch (error) {
      console.error('Toggle availability error:', error)
      throw error
    }
  }, [token, apiBaseUrl, onAvailabilityChange])

  // Update meeting status
  const updateMeetingStatus = useCallback(async (isInMeeting: boolean) => {
    try {
      const response = await fetch(`${apiBaseUrl}/doctor/meeting/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isInMeeting }),
      })

      if (!response.ok) {
        throw new Error('Failed to update meeting status')
      }

      return await response.json()
    } catch (error) {
      console.error('Update meeting status error:', error)
      throw error
    }
  }, [token, apiBaseUrl])

  // Effect: Start/stop heartbeat based on availability
  useEffect(() => {
    if (isAvailable && token) {
      startHeartbeat()
    } else {
      stopHeartbeat()
    }

    return () => {
      stopHeartbeat()
    }
  }, [isAvailable, token, startHeartbeat, stopHeartbeat])

  // Effect: Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, but keep heartbeat running
        // Connection will be detected as stale if heartbeat stops
      } else {
        // Page is visible again, ensure heartbeat is running if available
        if (isAvailable && token && !heartbeatIntervalRef.current) {
          startHeartbeat()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAvailable, token, startHeartbeat])

  // Effect: Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      handleDisconnect()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      handleDisconnect()
    }
  }, [handleDisconnect])

  return {
    toggleAvailability,
    updateMeetingStatus,
    startHeartbeat,
    stopHeartbeat,
    handleDisconnect,
  }
}
```

### 2. Use the Hook in Your Doctor Dashboard Component

Example usage in a doctor dashboard component:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useDoctorAvailability } from '@/hooks/useDoctorAvailability'

export default function DoctorDashboard() {
  const [isAvailable, setIsAvailable] = useState(false)
  const [isInMeeting, setIsInMeeting] = useState(false)
  const [token, setToken] = useState<string | null>(null)

  // Get token from your auth system
  useEffect(() => {
    // Replace with your actual token retrieval logic
    const storedToken = localStorage.getItem('token')
    setToken(storedToken)
  }, [])

  const {
    toggleAvailability,
    updateMeetingStatus,
  } = useDoctorAvailability({
    token: token || '',
    isAvailable,
    onAvailabilityChange: setIsAvailable,
  })

  // Load initial availability status
  useEffect(() => {
    if (token) {
      // Fetch current doctor status
      fetch('/api/doctor/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.data?.isAvailable !== undefined) {
            setIsAvailable(data.data.isAvailable)
          }
          if (data.data?.isInMeeting !== undefined) {
            setIsInMeeting(data.data.isInMeeting)
          }
        })
        .catch(console.error)
    }
  }, [token])

  const handleToggleAvailability = async () => {
    try {
      await toggleAvailability()
    } catch (error) {
      console.error('Failed to toggle availability:', error)
      // Show error message to user
    }
  }

  const handleMeetingStart = async () => {
    try {
      await updateMeetingStatus(true)
      setIsInMeeting(true)
    } catch (error) {
      console.error('Failed to update meeting status:', error)
    }
  }

  const handleMeetingEnd = async () => {
    try {
      await updateMeetingStatus(false)
      setIsInMeeting(false)
    } catch (error) {
      console.error('Failed to update meeting status:', error)
    }
  }

  return (
    <div className="doctor-dashboard">
      <h1>Doctor Dashboard</h1>

      <div className="availability-section">
        <h2>Availability</h2>
        <label>
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={handleToggleAvailability}
          />
          Available for appointments
        </label>
        <p>
          Status: {isAvailable ? 'Available' : 'Unavailable'}
        </p>
      </div>

      <div className="meeting-section">
        <h2>Meeting Status</h2>
        <p>In Meeting: {isInMeeting ? 'Yes' : 'No'}</p>
        <button onClick={handleMeetingStart} disabled={isInMeeting}>
          Start Meeting
        </button>
        <button onClick={handleMeetingEnd} disabled={!isInMeeting}>
          End Meeting
        </button>
      </div>
    </div>
  )
}
```

### 3. Alternative: Simpler Implementation with useEffect

If you prefer a simpler approach without a custom hook:

```typescript
'use client'

import { useEffect, useRef, useState } from 'react'

export function useSimpleAvailability(token: string) {
  const [isAvailable, setIsAvailable] = useState(false)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Toggle availability
  const toggleAvailability = async () => {
    const response = await fetch('/api/doctor/availability/toggle', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    const data = await response.json()
    setIsAvailable(data.data?.isAvailable ?? false)
  }

  // Start heartbeat when available
  useEffect(() => {
    if (!isAvailable || !token) {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
      return
    }

    // Send heartbeat immediately
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/doctor/connection/heartbeat', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      } catch (error) {
        console.error('Heartbeat failed:', error)
        setIsAvailable(false) // Stop availability on error
      }
    }

    sendHeartbeat()

    // Then send every 10 seconds
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, 10000)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
    }
  }, [isAvailable, token])

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/doctor/connection/disconnect', JSON.stringify({}))
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return { isAvailable, setIsAvailable, toggleAvailability }
}
```

## Key Points

1. **Heartbeat Interval**: Send heartbeats every 10 seconds when doctor is available
2. **Connection Tracking**: Backend automatically marks doctor as unavailable if no heartbeat for 30 seconds
3. **Page Unload**: Use `navigator.sendBeacon` or `fetch` with `keepalive: true` for disconnect signal
4. **Error Handling**: Stop heartbeat and set availability to false on heartbeat failures
5. **Page Visibility**: Continue sending heartbeats even when tab is in background

## Testing

1. Toggle availability ON - heartbeat should start immediately
2. Close the browser tab - within 30 seconds, availability should be set to false
3. Toggle availability OFF - heartbeat should stop
4. Check network tab - you should see heartbeat requests every 10 seconds

## Troubleshooting

- **Heartbeat not sending**: Check that token is valid and API base URL is correct
- **Availability not updating**: Check browser console for errors
- **Disconnect not working**: Ensure `navigator.sendBeacon` is supported or use `fetch` with `keepalive: true`

