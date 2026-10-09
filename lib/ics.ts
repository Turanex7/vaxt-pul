import { CATEGORIES, formatAmount, parseISO, toISO } from './format'
import type { Payment } from './mock-data'

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function addDay(isoDate: string): string {
  const date = parseISO(isoDate)
  date.setDate(date.getDate() + 1)
  return toISO(date).replace(/-/g, '')
}

function alarm(trigger: string, description: string): string[] {
  return [
    'BEGIN:VALARM',
    `TRIGGER:${trigger}`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeIcsText(description)}`,
    'END:VALARM',
  ]
}

export function buildIcs(payment: Payment): string {
  const isDocument = payment.category === 'sigorta'
  const summary = `${payment.name} — ${formatAmount(payment.amount).replace(/ AZN$/, '')} AZN`
  const description = `PayPulse ödəniş xatırlatması — ${CATEGORIES[payment.category].label}`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PayPulse//Payment Reminder//AZ',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}@paypulse`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;VALUE=DATE:${payment.nextDate.replace(/-/g, '')}`,
    `DTEND;VALUE=DATE:${addDay(payment.nextDate)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
  ]

  if (payment.repeat === 'monthly') lines.push('RRULE:FREQ=MONTHLY')
  if (payment.repeat === 'yearly') lines.push('RRULE:FREQ=YEARLY')
  lines.push(...alarm('-P1D', `${payment.name} ödənişinə 1 gün qalıb.`))
  if (isDocument) lines.push(...alarm('-P7D', `${payment.name} son tarixinə 7 gün qalıb.`))
  lines.push('END:VEVENT', 'END:VCALENDAR')

  return `${lines.join('\r\n')}\r\n`
}
