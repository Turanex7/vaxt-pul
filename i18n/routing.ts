import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['az', 'en', 'ru'],
  defaultLocale: 'az',
  localePrefix: 'always',
  localeCookie: { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365 },
})

export type AppLocale = (typeof routing.locales)[number]
