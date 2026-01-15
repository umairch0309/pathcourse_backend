import { cors } from 'hono/cors'
import { registerRoutes } from '~/app'
import { auth } from '~/lib/auth'
import configureOpenAPI from '~/lib/configure-open-api'
import createApp from '~/lib/create-app'
import { doctorConnectionTracker } from '~/lib/doctor-connection-tracker'
import { DOCTOR_SERVICES } from '~/services/doctor.service'
import { ORIGINS } from './config/origins'

// parseENV()
const app = createApp()

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
app.use(
  '*', // or replace with "*" to enable cors for all routes
  cors({
    origin: ORIGINS, // replace with your origin
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT', 'PATCH'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
)

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

console.log('Auth reference available at http://localhost:8080/api/auth/reference')
console.log('API reference available at http://localhost:8080/reference')
console.log('Doctor connection tracker started - checking for stale connections every 10 seconds')

export default {
  fetch: app.fetch,
  port: Bun.env.PORT_NO,
}
