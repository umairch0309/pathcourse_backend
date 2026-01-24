import { createRouter } from '~/lib/create-app'
import { NOTIFICATION_ROUTES_HANDLER } from '~/routes/notification/notification.handlers'
import { NOTIFICATION_ROUTES } from '~/routes/notification/notification.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(NOTIFICATION_ROUTES).forEach(([key, route]) => {
  router.openapi(route, NOTIFICATION_ROUTES_HANDLER[key as keyof typeof NOTIFICATION_ROUTES_HANDLER])
})

export default router

