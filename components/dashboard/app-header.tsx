import Image from 'next/image'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AppHeader({ onAdd, onReset }: { onAdd: () => void; onReset: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <Image src="/paypulse-mark.png" alt="PayPulse" width={52} height={46} priority />
          <span className="text-xl font-semibold tracking-tight">PayPulse</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onReset}>
            Demo datasını sıfırla
          </Button>
          <Button onClick={onAdd}>
            <Plus data-icon="inline-start" className="size-5" aria-hidden="true" />
            Əlavə et
          </Button>
        </div>
      </div>
    </header>
  )
}
