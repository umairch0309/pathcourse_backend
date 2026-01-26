import { Server as Engine } from '@socket.io/bun-engine'
import { serve } from 'bun'
import { cors } from 'hono/cors'
import { Server } from 'socket.io'
import { registerRoutes } from '~/app'
import { appointmentNoShowCron } from '~/lib/appointment-no-show-cron'
import { auth } from '~/lib/auth'
import configureOpenAPI from '~/lib/configure-open-api'
import createApp from '~/lib/create-app'
import { doctorConnectionTracker } from '~/lib/doctor-connection-tracker'
import { DOCTOR_SERVICES } from '~/services/doctor.service'
import { configureChatSocket } from '~/sockets/chat-socket'
import { ORIGINS } from './config/origins'

// Initialize Socket.IO server
const io = new Server({
  cors: {
    origin: ORIGINS,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
})
const engine = new Engine()
io.bind(engine)

// Configure chat socket events (appointment-based chat)
configureChatSocket(io)

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
console.log('Socket.IO server configured for real-time chat')
console.log('Doctor connection tracker started - checking for stale connections every 15 seconds')
console.log(
  'Appointment no-show cron job started - checking every 5 minutes for appointments past 20-minute mark'
)

const { websocket } = engine.handler()

serve({
  port: Bun.env.PORT_NO || 3000,
  fetch(req, server) {
    const url = new URL(req.url)
    // Handle Socket.IO requests
    if (url.pathname.startsWith('/socket.io/')) {
      try {
        // Handle Socket.IO requests through the engine
        // This handles both HTTP polling and WebSocket upgrades
        return engine.handleRequest(req, server)
      } catch (error) {
        console.error('[Socket.IO] Error handling request:', error)
        return new Response('Socket.IO error', { status: 500 })
      }
    }
    // Handle all other requests with Hono app
    return app.fetch(req, server)
  },
  websocket,
})

console.log(`Server running on port ${Bun.env.PORT_NO || 3000}`)
console.log(`Socket.IO available at ws://localhost:${Bun.env.PORT_NO || 3000}/socket.io/`)
