/**
 * Cron job to automatically mark appointments as NO_SHOW
 * if 20 minutes have passed since scheduledAt and they're still BOOKED
 */

import { APPOINTMENT_SERVICES } from '~/services/appointment.service'

class AppointmentNoShowCron {
  private checkInterval: NodeJS.Timeout | null = null
  private readonly checkIntervalMs = 5 * 60 * 1000 // Check every 5 minutes

  /**
   * Start the cron job to check for no-show appointments
   */
  start(): void {
    if (this.checkInterval) {
      console.log('[No-Show Cron] Already running')
      return
    }

    console.log('[No-Show Cron] Starting - will check every 5 minutes for appointments past 20-minute mark')

    // Run immediately on start
    this.checkNoShowAppointments()

    // Then run every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkNoShowAppointments()
    }, this.checkIntervalMs)
  }

  /**
   * Stop the cron job
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('[No-Show Cron] Stopped')
    }
  }

  /**
   * Check and mark no-show appointments
   */
  private async checkNoShowAppointments(): Promise<void> {
    try {
      const result = await APPOINTMENT_SERVICES.markNoShowAppointments()
      if (result.marked > 0) {
        console.log(
          `[No-Show Cron] Check completed at ${new Date().toISOString()} - Marked ${result.marked} appointment(s) as NO_SHOW`
        )
      }
    } catch (error) {
      console.error('[No-Show Cron] Error checking for no-show appointments:', error)
    }
  }
}

// Export singleton instance
export const appointmentNoShowCron = new AppointmentNoShowCron()

