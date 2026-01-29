import prisma from '~/lib/prisma'

export const APPOINTMENT_NOTES_SERVICES = {
  upsertForAppointment: async (data: {
    appointmentId: string
    doctorId: string
    notes: string
  }) => {
    // Verify appointment exists and belongs to doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      select: { doctorId: true },
    })

    if (!appointment) {
      throw new Error('Appointment not found')
    }

    if (appointment.doctorId !== data.doctorId) {
      throw new Error('You do not have permission to add notes for this appointment')
    }

    const result = await prisma.appointmentNotes.upsert({
      where: { appointmentId: data.appointmentId },
      update: {
        notes: data.notes,
      },
      create: {
        appointmentId: data.appointmentId,
        doctorId: data.doctorId,
        notes: data.notes,
      },
    })

    return result
  },

  getByAppointmentId: async (data: { appointmentId: string; doctorId: string }) => {
    // Verify appointment exists and belongs to doctor
    const appointment = await prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      select: { doctorId: true },
    })

    if (!appointment) {
      throw new Error('Appointment not found')
    }

    if (appointment.doctorId !== data.doctorId) {
      throw new Error('You do not have permission to view notes for this appointment')
    }

    const notes = await prisma.appointmentNotes.findUnique({
      where: { appointmentId: data.appointmentId },
    })

    return notes
  },
}
