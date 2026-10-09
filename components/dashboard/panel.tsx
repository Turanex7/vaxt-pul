import { cn } from '@/lib/utils'

export function Panel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-card p-5 text-card-foreground shadow-[0_1px_2px_rgba(30,27,75,0.04),0_8px_24px_-12px_rgba(30,27,75,0.12)] ring-1 ring-border/70 md:p-6',
        className,
      )}
      {...props}
    />
  )
}

export function SectionHeading({
  id,
  title,
  description,
  action,
}: {
  id: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-2xl font-semibold tracking-tight text-balance">
          {title}
        </h2>
        {description && <p className="mt-1 text-muted-foreground text-pretty">{description}</p>}
      </div>
      {action}
    </div>
  )
}
