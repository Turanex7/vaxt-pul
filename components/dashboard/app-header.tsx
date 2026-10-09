import { Plus, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AppHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <WalletCards className="size-5" aria-hidden="true" />
          </span>
          <span className="text-xl font-semibold tracking-tight">Vaxt &amp; Pul</span>
        </div>
        <Button onClick={onAdd}>
          <Plus data-icon="inline-start" className="size-5" aria-hidden="true" />
          Əlavə et
        </Button>
      </div>
    </header>
  )
}
