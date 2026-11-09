'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/format'
import { NOTE } from '@/lib/palette'

export interface CashflowPoint {
  label: string
  income: number
  expense: number
}

const AXIS = { fontSize: 11, fill: '#5d6578', fontFamily: 'var(--font-martian), monospace' }

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const income = payload.find((p) => p.dataKey === 'income')?.value ?? 0
  const expense = payload.find((p) => p.dataKey === 'expense')?.value ?? 0
  return (
    <div className="rounded-md border bg-card px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold">{label}</p>
      <p className="flex justify-between gap-4"><span className="text-muted-foreground">Entradas</span><span className="money">{formatCurrency(income)}</span></p>
      <p className="flex justify-between gap-4"><span className="text-muted-foreground">Saídas</span><span className="money">{formatCurrency(expense)}</span></p>
      <p className="mt-1 flex justify-between gap-4 border-t pt-1 font-medium"><span>Saldo</span><span className="money">{formatCurrency(income - expense)}</span></p>
    </div>
  )
}

export function CashflowChart({ data, height = 240 }: { data: CashflowPoint[]; height?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} barGap={2} barCategoryGap="22%" margin={{ top: 4, right: 0, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e3e4e8" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS}
            width={44}
            tickFormatter={(v: number) => (v === 0 ? '0' : `${Math.round(v / 1000)}k`)}
          />
          <Tooltip cursor={{ fill: '#eef1f7' }} content={<ChartTooltip />} />
          <Bar dataKey="income" name="Entradas" fill={NOTE.blue} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="expense" name="Saídas" fill={NOTE.ochre} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[2px] bg-note-100" />Entradas</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-[2px] bg-note-50" />Saídas</span>
      </div>
    </div>
  )
}
