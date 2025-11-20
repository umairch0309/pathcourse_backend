import { createAccessControl } from 'better-auth/plugins/access'
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access'

const statement = {
  ...defaultStatements,
  doctor: ['create', 'share', 'update', 'delete', 'read'],
  appointment: ['create', 'share', 'update', 'delete', 'read'],
  timeslot: ['create', 'share', 'update', 'delete', 'read'],
  patient: ['create', 'share', 'update', 'delete', 'read'],
  prescription: ['create', 'share', 'update', 'delete', 'read'],
  medicalRecord: ['create', 'share', 'update', 'delete', 'read'],
  category: ['create', 'share', 'update', 'delete', 'read'],
  agora: ['create', 'share', 'update', 'delete', 'read'],
} as const

export const ac = createAccessControl(statement)
export const admin = ac.newRole({
  ...adminAc.statements,
  doctor: ['create', 'share', 'update', 'delete', 'read'],
  appointment: ['create', 'share', 'update', 'delete', 'read'],
  patient: ['create', 'share', 'update', 'delete', 'read'],
  category: ['create', 'share', 'update', 'delete', 'read'],
})

export const doctor = ac.newRole({
  doctor: ['create', 'share', 'update', 'delete', 'read'],
  appointment: ['create', 'share', 'update', 'delete', 'read'],
  timeslot: ['create', 'share', 'update', 'delete', 'read'],
  patient: ['read'],
  prescription: ['create', 'share', 'update', 'delete', 'read'],
  medicalRecord: ['create', 'share', 'update', 'delete', 'read'],
  category: ['read'],
  agora: ['create', 'share', 'update', 'delete', 'read'],
})
export const patient = ac.newRole({
  appointment: ['create', 'share', 'update', 'delete', 'read'],
  timeslot: ['read'],
  patient: ['create', 'share', 'update', 'delete', 'read'],
  prescription: ['read'],
  medicalRecord: ['read'],
  category: ['read'],
  agora: ['create', 'share', 'update', 'delete', 'read'],
})
export const guest = ac.newRole({
  user: ['update', 'get'],
})
