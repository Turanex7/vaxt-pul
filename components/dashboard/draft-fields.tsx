'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, CATEGORY_IDS, REPEAT_LABELS } from '@/lib/format'
import type { CategoryId, PaymentDraft, Repeat } from '@/lib/mock-data'

const categoryItems = CATEGORY_IDS.map((id) => ({ value: id, label: CATEGORIES[id].label }))
const repeatItems = (Object.keys(REPEAT_LABELS) as Repeat[]).map((r) => ({ value: r, label: REPEAT_LABELS[r] }))

const fieldClass = 'h-11 rounded-xl text-base md:text-base'

export function DraftFields({
  idPrefix,
  draft,
  onChange,
}: {
  idPrefix: string
  draft: PaymentDraft
  onChange: (next: PaymentDraft) => void
}) {
  const set = <K extends keyof PaymentDraft>(key: K, value: PaymentDraft[K]) => onChange({ ...draft, [key]: value })

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-name`} className="text-base">Ad</Label>
        <Input
          id={`${idPrefix}-name`}
          className={fieldClass}
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-amount`} className="text-base">Məbləğ (AZN)</Label>
        <Input
          id={`${idPrefix}-amount`}
          className={fieldClass}
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={Number.isNaN(draft.amount) ? '' : draft.amount}
          onChange={(e) => set('amount', e.target.valueAsNumber)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-date`} className="text-base">Tarix</Label>
        <Input
          id={`${idPrefix}-date`}
          className={fieldClass}
          type="date"
          value={draft.nextDate}
          onChange={(e) => set('nextDate', e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-category`} className="text-base">Kateqoriya</Label>
        <Select
          items={categoryItems}
          value={draft.category}
          onValueChange={(v) => v && set('category', v as CategoryId)}
        >
          <SelectTrigger id={`${idPrefix}-category`} className="h-11 w-full rounded-xl text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryItems.map((item) => (
              <SelectItem key={item.value} value={item.value} className="py-2 text-base">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${idPrefix}-repeat`} className="text-base">Təkrar</Label>
        <Select items={repeatItems} value={draft.repeat} onValueChange={(v) => v && set('repeat', v as Repeat)}>
          <SelectTrigger id={`${idPrefix}-repeat`} className="h-11 w-full rounded-xl text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {repeatItems.map((item) => (
              <SelectItem key={item.value} value={item.value} className="py-2 text-base">
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function isDraftValid(d: PaymentDraft): boolean {
  return d.name.trim().length > 0 && Number.isFinite(d.amount) && d.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(d.nextDate)
}
