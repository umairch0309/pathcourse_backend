import { createRouter } from '~/lib/create-app'
import { AGORA_ROUTES_HANDLER } from './agora.handlers'
import { AGORA_ROUTES } from './agora.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(AGORA_ROUTES).forEach(([key, route]) => {
  router.openapi(route, AGORA_ROUTES_HANDLER[key as keyof typeof AGORA_ROUTES_HANDLER])
})

export default router
