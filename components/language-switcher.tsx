'use client'

import { useLocale, useTranslations } from 'next-intl'
import { routing, type AppLocale } from '@/i18n/routing'
import { usePathname, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale
  const t = useTranslations('language')
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div role="group" aria-label={t('label')} className="inline-flex shrink-0 rounded-full border border-border bg-card p-0.5">
      {routing.locales.map((item) => (
        <button
          key={item}
          type="button"
          aria-pressed={locale === item}
          onClick={() => router.replace(pathname, { locale: item })}
          className={cn(
            'rounded-full px-2 py-1 text-xs font-semibold transition-colors sm:px-2.5',
            locale === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
          )}
        >
          {t(item)}
        </button>
      ))}
    </div>
  )
}
