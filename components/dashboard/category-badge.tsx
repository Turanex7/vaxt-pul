import { CATEGORIES } from '@/lib/format'
import type { CategoryId } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function CategoryDot({ category, className }: { category: CategoryId; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-2.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: CATEGORIES[category].color }}
    />
  )
}

export function CategoryBadge({ category }: { category: CategoryId }) {
  const t = useTranslations('categories')
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm font-medium whitespace-nowrap text-foreground/80">
      <CategoryDot category={category} />
      {t(category)}
    </span>
  )
}
import { useTranslations } from 'next-intl'
