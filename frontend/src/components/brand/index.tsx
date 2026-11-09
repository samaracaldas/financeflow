'use client'

import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatAmount, formatCurrency, MONTHS } from '@/lib/format'
import { MONEY_COLORS } from '@/lib/palette'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

/* ---------- marca ---------- */

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className="guilloche size-7 rounded-full bg-note-100 ring-1 ring-note-100/30 [--guilloche-opacity:0.45]"
      />
      <span className="text-[17px] font-semibold tracking-tight text-foreground">FinancesFlow</span>
    </span>
  )
}

/* ---------- dinheiro ---------- */

interface MoneyProps {
  value: number
  type?: 'income' | 'expense'
  /** mostra "R$" (padrão) ou só o número */
  symbol?: boolean
  className?: string
}

/** Entrada em verde com "+", saída em tinta com "−". */
export function Money({ value, type, symbol = true, className }: MoneyProps) {
  const text = symbol ? formatCurrency(value) : formatAmount(value)
  if (value === 0) type = undefined
  const sign = type === 'income' ? '+' : type === 'expense' ? '−' : ''
  return (
    <span className={cn('money whitespace-nowrap', type === 'income' && 'text-income', type === 'expense' && 'text-expense', className)}>
      {sign && <span aria-hidden>{sign}{' '}</span>}
      {sign && <span className="sr-only">{type === 'income' ? 'entrada de ' : 'saída de '}</span>}
      {text}
    </span>
  )
}

/* ---------- cartão com gravura ---------- */

interface NoteCardProps {
  label: string
  value: number
  color: string
  children?: React.ReactNode
  className?: string
}

/** O saldo impresso como uma cédula: cor da nota + gravura guilhoché. */
export function NoteCard({ label, value, color, children, className }: NoteCardProps) {
  return (
    <section
      className={cn('guilloche rounded-xl px-6 py-5 text-white', className)}
      style={{ backgroundColor: color }}
    >
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/85">{label}</p>
      <p className="money mt-1 text-[clamp(1.75rem,3.2vw,2.4rem)] font-medium leading-tight">
        {formatCurrency(value)}
      </p>
      {children && <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/90">{children}</div>}
    </section>
  )
}

/* ---------- barra empilhada ---------- */

export interface StackItem {
  name: string
  value: number
  color: string
}

/** Uma barra só, dividida por categoria, com legenda em porcentagem. */
export function SpendStack({ items, total, empty, legend = true }: { items: StackItem[]; total: number; empty: string; legend?: boolean }) {
  if (items.length === 0 || total <= 0) {
    return <p className="rounded-lg border border-dashed px-4 py-5 text-sm text-muted-foreground">{empty}</p>
  }
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex h-3.5 gap-[2px] overflow-hidden rounded-[3px]" role="img" aria-label={items.map((i) => `${i.name} ${Math.round((i.value / total) * 100)}%`).join(', ')}>
        {items.map((item) => (
          <div key={item.name} style={{ flexGrow: item.value, backgroundColor: item.color }} title={`${item.name}: ${formatCurrency(item.value)}`} />
        ))}
      </div>
      {legend && <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-muted-foreground">
        {items.map((item) => (
          <li key={item.name} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: item.color }} />
            <span className="text-foreground">{item.name}</span>
            <span className="money text-xs">{Math.round((item.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>}
    </div>
  )
}

/* ---------- cabeçalho de página ---------- */

export function PageHeader({ title, description, children }: { title: string; description?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

/* ---------- seção sem caixa ---------- */

export function Section({ title, aside, children, className }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('flex min-w-0 flex-col gap-3', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {aside && <div className="text-xs text-muted-foreground">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

/* ---------- período ---------- */

interface PeriodPickerProps {
  year: number
  years: number[]
  onYear: (y: number) => void
  month: string
  onMonth: (m: string) => void
  allowAllMonths?: boolean
}

export function PeriodPicker({ year, years, onYear, month, onMonth, allowAllMonths = true }: PeriodPickerProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-md border bg-card">
        <Button variant="ghost" size="icon" className="size-9 rounded-r-none" onClick={() => onYear(year - 1)} aria-label="Ano anterior">
          <ChevronLeft />
        </Button>
        <Select value={String(year)} onValueChange={(v) => onYear(Number(v))}>
          <SelectTrigger className="money h-9 w-[100px] gap-1 rounded-none border-0 border-x px-3 shadow-none" aria-label="Ano">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from(new Set([...years, year])).sort((a, b) => b - a).map((y) => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="size-9 rounded-l-none" onClick={() => onYear(year + 1)} aria-label="Próximo ano">
          <ChevronRight />
        </Button>
      </div>
      <Select value={month} onValueChange={onMonth}>
        <SelectTrigger className="h-9 w-40 bg-card" aria-label="Mês">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowAllMonths && <SelectItem value="all">Ano inteiro</SelectItem>}
          {MONTHS.map((m) => (
            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/* ---------- seletor de cor ---------- */

export function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const current = MONEY_COLORS.find((c) => c.value.toLowerCase() === value.toLowerCase())
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Cor">
        {MONEY_COLORS.map((c) => {
          const selected = c.value.toLowerCase() === value.toLowerCase()
          return (
            <button
              key={c.value}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={c.label}
              title={c.label}
              onClick={() => onChange(c.value)}
              className={cn(
                'guilloche grid size-9 place-items-center rounded-md text-white outline-none transition-shadow [--guilloche-opacity:0.35]',
                'focus-visible:ring-[3px] focus-visible:ring-ring/50',
                selected && 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
              )}
              style={{ backgroundColor: c.value }}
            >
              {selected && <Check className="size-4" />}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">{current?.label ?? 'Cor personalizada'}</p>
    </div>
  )
}

/* ---------- alerta de erro ---------- */

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
      {children}
    </p>
  )
}

/* ---------- alternância entrada/saída ---------- */

export function TypeToggle({ value, onChange }: { value: 'income' | 'expense'; onChange: (v: 'income' | 'expense') => void }) {
  return (
    <div className="grid grid-cols-2 rounded-md border bg-muted p-0.5" role="radiogroup" aria-label="Tipo">
      {(['income', 'expense'] as const).map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          onClick={() => onChange(t)}
          className={cn(
            'h-8 rounded-[5px] text-sm font-medium text-muted-foreground outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
            value === t && 'bg-card text-foreground shadow-sm',
            value === t && t === 'income' && 'text-income'
          )}
        >
          {t === 'income' ? 'Entrada' : 'Saída'}
        </button>
      ))}
    </div>
  )
}
