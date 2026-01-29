import { createRouter } from '~/lib/create-app'
import { ADMIN_NOTIFICATION_ROUTES_HANDLER } from '~/routes/admin-notification/admin-notification.handlers'
import { ADMIN_NOTIFICATION_ROUTES } from '~/routes/admin-notification/admin-notification.routes'

const router = createRouter()

Object.entries(ADMIN_NOTIFICATION_ROUTES).forEach(([key, route]) => {
  router.openapi(route, ADMIN_NOTIFICATION_ROUTES_HANDLER[key as keyof typeof ADMIN_NOTIFICATION_ROUTES_HANDLER])
})

export default router


