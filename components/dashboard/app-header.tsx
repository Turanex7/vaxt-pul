import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/language-switcher'

export function AppHeader({ onAdd, onReset }: { onAdd: () => void; onReset: () => void }) {
  const t = useTranslations('common')
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Image src="/paypulse-mark.png" alt="PayPulse" width={62} height={55} priority />
          <span className="text-xl font-semibold tracking-tight">PayPulse</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={onReset}>
            {t('reset')}
          </Button>
          <Button onClick={onAdd}>
            <Plus data-icon="inline-start" className="size-5" aria-hidden="true" />
            {t('add')}
          </Button>
        </div>
      </div>
    </header>
  )
}
