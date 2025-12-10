import { createMiddleware } from 'hono/factory'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { HttpError } from '~/lib/error'
import type { AppBindings } from '~/types'

export const isAuthenticated = createMiddleware<AppBindings>(async (c, next) => {
  const user = c.get('user')

  if (!user) {
    throw new HttpError('invalid user', HttpStatusCodes.FORBIDDEN)
  }
  await next()
})
