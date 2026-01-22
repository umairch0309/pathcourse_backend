import { cors } from 'hono/cors'
import { registerRoutes } from '~/app'
import { appointmentNoShowCron } from '~/lib/appointment-no-show-cron'
import { auth } from '~/lib/auth'
import configureOpenAPI from '~/lib/configure-open-api'
import createApp from '~/lib/create-app'
import { doctorConnectionTracker } from '~/lib/doctor-connection-tracker'
import { DOCTOR_SERVICES } from '~/services/doctor.service'
import { ORIGINS } from './config/origins'

// parseENV()
const app = createApp()

// CORS must be configured FIRST to handle preflight OPTIONS requests
app.use(
  '*',
  cors({
    origin: ORIGINS,
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cookie',
      'Set-Cookie',
    ],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT', 'PATCH'],
    exposeHeaders: ['Content-Length', 'Set-Cookie'],
    maxAge: 86400, // 24 hours for preflight cache
    credentials: true,
  })
)

// Authentication middleware (runs after CORS)
app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    c.set('user', null)
    c.set('session', null)
    return next()
  }
  c.set('user', session.user)
  c.set('session', session.session)
  return next()
})

// Register custom routes first (before better-auth catch-all)
registerRoutes(app)

// Register better-auth handler for its own routes (must be after custom routes)
app.on(['POST', 'GET'], '/api/auth/*', c => {
  return auth.handler(c.req.raw)
})
configureOpenAPI(app)
// Start stale connection checker for doctors
// This automatically sets isAvailable to false when doctors disconnect
doctorConnectionTracker.startStaleConnectionChecker(async (userId: string) => {
  try {
    await DOCTOR_SERVICES.handleDisconnection(userId)
    console.log(`Doctor ${userId} disconnected - availability set to unavailable`)
  } catch (error) {
    console.error(`Error handling disconnection for doctor ${userId}:`, error)
  }
})

// Start appointment no-show cron job
// This automatically marks appointments as NO_SHOW if 20 minutes have passed since scheduledAt
appointmentNoShowCron.start()

console.log('Auth reference available at http://localhost:8080/api/auth/reference')
console.log('API reference available at http://localhost:8080/reference')
console.log('Doctor connection tracker started - checking for stale connections every 15 seconds')
console.log(
  'Appointment no-show cron job started - checking every 5 minutes for appointments past 20-minute mark'
)

export default {
  fetch: app.fetch,
  port: Bun.env.PORT_NO,
}
