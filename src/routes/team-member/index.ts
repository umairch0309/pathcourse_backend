import { createRouter } from '~/lib/create-app'
import { TEAM_MEMBER_ROUTES_HANDLER } from './team-member.handlers'
import { TEAM_MEMBER_ROUTES } from './team-member.routes'

const router = createRouter()

// Use forEach method to register all routes
Object.entries(TEAM_MEMBER_ROUTES).forEach(([key, route]) => {
  router.openapi(route, TEAM_MEMBER_ROUTES_HANDLER[key as keyof typeof TEAM_MEMBER_ROUTES_HANDLER])
})

export default router
