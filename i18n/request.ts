import { getRequestConfig } from 'next-intl/server'
import { routing, type AppLocale } from './routing'

const messages = {
  az: () => import('../messages/az.json').then((module) => module.default),
  en: () => import('../messages/en.json').then((module) => module.default),
  ru: () => import('../messages/ru.json').then((module) => module.default),
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = routing.locales.includes(requested as AppLocale)
    ? (requested as AppLocale)
    : routing.defaultLocale

  return { locale, messages: await messages[locale](), timeZone: 'UTC' }
})
