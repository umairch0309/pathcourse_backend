import adminRouter from '~/routes/admin'
import agoraRouter from '~/routes/agora'
import appointmentRouter from '~/routes/appointment'
import authRouter from '~/routes/auth'
import doctorRouter from '~/routes/doctor'
import doctorProfileRouter from '~/routes/doctor-profile'
import doctorProfileCompleteRouter from '~/routes/doctor-profile-complete'
import educationRouter from '~/routes/education'
import enterpriseRouter from '~/routes/enterprise'
import filesRouter from '~/routes/files'
import notificationRouter from '~/routes/notification'
import adminNotificationRouter from '~/routes/admin-notification'
import permissionRouter from '~/routes/permission'
import roleRouter from '~/routes/role'
import servicePricingRouter from '~/routes/service-pricing'
import teamMemberRouter from '~/routes/team-member'
import userRouter from '~/routes/user'
import userQueryRouter from '~/routes/user-query'
import type { AppOpenAPI } from '~/types'

export function registerRoutes(app: AppOpenAPI) {
  return app
    .route('/api', authRouter)
    .route('/api', userRouter)
    .route('/api', servicePricingRouter)
    .route('/api', userQueryRouter)
    .route('/api', filesRouter)
    .route('/api', doctorRouter)
    .route('/api', educationRouter)
    .route('/api', doctorProfileRouter)
    .route('/api', doctorProfileCompleteRouter)
    .route('/api', enterpriseRouter)
    .route('/api', appointmentRouter)
    .route('/api', agoraRouter)
    .route('/api', notificationRouter)
    .route('/api', adminNotificationRouter)
    .route('/api', roleRouter)
    .route('/api', permissionRouter)
    .route('/api', teamMemberRouter)
    .route('/api', adminRouter) // chained router.
}
