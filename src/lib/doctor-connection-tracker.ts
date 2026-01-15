/**
 * Doctor Connection Tracker
 * Tracks active doctor connections and automatically manages availability
 * when doctors disconnect (close tab/website)
 */

interface DoctorConnection {
  userId: string
  lastHeartbeat: Date
  connectionId: string
}

class DoctorConnectionTracker {
  private connections: Map<string, DoctorConnection> = new Map()
  private heartbeatTimeout: number = 30000 // 30 seconds - if no heartbeat for 30s, consider disconnected
  private checkInterval: NodeJS.Timeout | null = null

  /**
   * Register or update a doctor connection
   */
  registerConnection(userId: string, connectionId: string): void {
    this.connections.set(userId, {
      userId,
      lastHeartbeat: new Date(),
      connectionId,
    })
  }

  /**
   * Update heartbeat for a doctor connection
   * If connection doesn't exist, it will be created with the provided connectionId
   * If no connectionId is provided and connection doesn't exist, generate one
   */
  updateHeartbeat(userId: string, connectionId?: string): void {
    const connection = this.connections.get(userId)
    if (connection) {
      connection.lastHeartbeat = new Date()
      // Update connectionId if provided
      if (connectionId) {
        connection.connectionId = connectionId
      }
    } else {
      // Connection doesn't exist, create it
      // Generate connectionId if not provided
      const finalConnectionId = connectionId || `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.registerConnection(userId, finalConnectionId)
    }
  }

  /**
   * Remove a doctor connection (explicit disconnect)
   */
  removeConnection(userId: string): void {
    this.connections.delete(userId)
  }

  /**
   * Check if a doctor is connected
   */
  isConnected(userId: string): boolean {
    const connection = this.connections.get(userId)
    if (!connection) {
      return false
    }

    const now = new Date()
    const timeSinceLastHeartbeat = now.getTime() - connection.lastHeartbeat.getTime()

    // If last heartbeat was more than timeout ago, consider disconnected
    return timeSinceLastHeartbeat < this.heartbeatTimeout
  }

  /**
   * Get all stale connections (no heartbeat for more than timeout)
   */
  getStaleConnections(): string[] {
    const now = new Date()
    const staleUserIds: string[] = []

    Array.from(this.connections.entries()).forEach(([userId, connection]) => {
      const timeSinceLastHeartbeat = now.getTime() - connection.lastHeartbeat.getTime()
      // Only mark as stale if it's been more than timeout AND at least 5 seconds have passed
      // This prevents marking connections as stale immediately after registration
      if (timeSinceLastHeartbeat >= this.heartbeatTimeout && timeSinceLastHeartbeat >= 5000) {
        staleUserIds.push(userId)
      }
    })

    return staleUserIds
  }

  /**
   * Start background job to check for stale connections
   */
  startStaleConnectionChecker(
    onStaleConnection: (userId: string) => Promise<void>
  ): void {
    // Check every 15 seconds for stale connections (less frequent to reduce race conditions)
    this.checkInterval = setInterval(async () => {
      const staleConnections = this.getStaleConnections()

      for (const userId of staleConnections) {
        // Triple-check the connection is still stale before removing
        // This prevents race conditions where a heartbeat arrives during processing
        const connection = this.connections.get(userId)
        if (connection) {
          const now = new Date()
          const timeSinceLastHeartbeat = now.getTime() - connection.lastHeartbeat.getTime()

          // Only proceed if REALLY stale (add 10 second buffer to be very safe)
          // This means connection must be stale for at least 40 seconds (30s timeout + 10s buffer)
          if (timeSinceLastHeartbeat >= this.heartbeatTimeout + 10000) {
            // Remove from active connections
            this.connections.delete(userId)

            // Call callback to handle disconnection
            try {
              await onStaleConnection(userId)
            } catch (error) {
              console.error(`Error handling stale connection for user ${userId}:`, error)
            }
          } else {
            // Connection was updated recently, skip it
            console.log(`Connection for user ${userId} was updated recently (${Math.round(timeSinceLastHeartbeat / 1000)}s ago), skipping stale check`)
          }
        } else {
          // Connection was already removed, skip
          console.log(`Connection for user ${userId} was already removed, skipping stale check`)
        }
      }
    }, 15000) // Check every 15 seconds (less frequent)
  }

  /**
   * Stop the background checker
   */
  stopStaleConnectionChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Set heartbeat timeout (in milliseconds)
   */
  setHeartbeatTimeout(timeout: number): void {
    this.heartbeatTimeout = timeout
  }
}

// Singleton instance
export const doctorConnectionTracker = new DoctorConnectionTracker()

