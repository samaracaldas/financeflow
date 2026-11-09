'use client'

import { useCallback, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableFooter,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useTransactions } from '@/lib/hooks'
import { ITransaction } from '@/types'
import { MONTH_SHORT, formatDay, monthLabel, pluralize } from '@/lib/format'
import { FALLBACK_COLOR } from '@/lib/palette'
import { Money, PageHeader, PeriodPicker, Section, SpendStack } from '@/components/brand'
import { cn } from '@/lib/utils'

const NOW = new Date()
const CURRENT_YEAR = NOW.getFullYear()

interface Breakdown { name: string; value: number; color: string; count: number }

function breakdown(list: ITransaction[]): Breakdown[] {
  const map: Record<string, Breakdown> = {}
  list.forEach((tx) => {
    const key = tx.category?._id ?? 'none'
    map[key] ??= { name: tx.category?.name ?? 'Sem categoria', value: 0, color: tx.category?.color ?? FALLBACK_COLOR, count: 0 }
    map[key].value += tx.amount
    map[key].count += 1
  })
  return Object.values(map).sort((a, b) => b.value - a.value)
}

function downloadCSV(rows: ITransaction[], filename: string) {
  const headers = ['Data', 'Tipo', 'Título', 'Categoria', 'Conta', 'Valor', 'Descrição']
  const quote = (s: string) => `"${s.replace(/"/g, '""')}"`
  const lines = rows.map((tx) => [
    formatDay(tx.date, { day: '2-digit', month: '2-digit', year: 'numeric' }),
    tx.type === 'income' ? 'Entrada' : 'Saída',
    quote(tx.title),
    quote(tx.category?.name ?? ''),
    quote(tx.account?.name ?? ''),
    tx.amount.toFixed(2).replace('.', ','),
    quote(tx.description ?? ''),
  ].join(';'))
  const blob = new Blob(['﻿' + [headers.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function CategoryList({ items, total, type }: { items: Breakdown[]; total: number; type: 'income' | 'expense' }) {
  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <li key={item.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b py-2 text-sm last:border-0">
          <span className="flex min-w-0 items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
            <span className="truncate">{item.name}</span>
            <span className="text-xs text-muted-foreground">{pluralize(item.count, 'transação', 'transações')}</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="money w-10 text-right text-xs text-muted-foreground">{Math.round((item.value / total) * 100)}%</span>
            <Money value={item.value} type={type} className="w-[120px] text-right" />
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function ReportsPage() {
  const { transactions, loading } = useTransactions()
  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState(String(NOW.getMonth() + 1).padStart(2, '0'))

  const years = useMemo(() => Array.from(new Set(transactions.map((t) => Number(t.date.substring(0, 4))))), [transactions])
  const monthKey = `${year}-${month}`
  const periodLabel = `${monthLabel(month)} de ${year}`

  const monthTx = useMemo(
    () => transactions.filter((t) => t.date.startsWith(monthKey)).sort((a, b) => a.date.localeCompare(b.date)),
    [transactions, monthKey]
  )
  const yearTx = useMemo(
    () => transactions.filter((t) => t.date.startsWith(`${year}`)).sort((a, b) => a.date.localeCompare(b.date)),
    [transactions, year]
  )

  const incomeTx = monthTx.filter((t) => t.type === 'income')
  const expenseTx = monthTx.filter((t) => t.type === 'expense')
  const income = incomeTx.reduce((s, t) => s + t.amount, 0)
  const expense = expenseTx.reduce((s, t) => s + t.amount, 0)
  const incomeBreakdown = useMemo(() => breakdown(incomeTx), [incomeTx])
  const expenseBreakdown = useMemo(() => breakdown(expenseTx), [expenseTx])

  const byAccount = useMemo(() => {
    const map: Record<string, { name: string; color: string; income: number; expense: number; count: number }> = {}
    monthTx.forEach((tx) => {
      const key = tx.account?._id ?? 'none'
      map[key] ??= { name: tx.account?.name ?? 'Sem conta', color: tx.account?.color ?? FALLBACK_COLOR, income: 0, expense: 0, count: 0 }
      if (tx.type === 'income') map[key].income += tx.amount
      else map[key].expense += tx.amount
      map[key].count += 1
    })
    return Object.values(map).sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
  }, [monthTx])

  const yearly = useMemo(() => MONTH_SHORT.map((label, i) => {
    const mk = `${year}-${String(i + 1).padStart(2, '0')}`
    const txs = yearTx.filter((t) => t.date.startsWith(mk))
    const inc = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { key: String(i + 1).padStart(2, '0'), label, income: inc, expense: exp, balance: inc - exp }
  }), [yearTx, year])

  const yearTotals = yearly.reduce((a, m) => ({ income: a.income + m.income, expense: a.expense + m.expense, balance: a.balance + m.balance }), { income: 0, expense: 0, balance: 0 })

  const exportMonth = useCallback(() => downloadCSV(monthTx, `financesflow-${monthKey}.csv`), [monthTx, monthKey])
  const exportYear = useCallback(() => downloadCSV(yearTx, `financesflow-${year}.csv`), [yearTx, year])

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title="Relatórios" description={`Fechamento de ${periodLabel.toLowerCase()} e visão do ano.`}>
        <PeriodPicker year={year} years={years} onYear={setYear} month={month} onMonth={setMonth} allowAllMonths={false} />
      </PageHeader>

      {/* Fechamento do mês */}
      <section aria-label={`Resumo de ${periodLabel}`} className="grid overflow-hidden rounded-xl border bg-card sm:grid-cols-3">
        {[
          { label: 'Entradas', node: <Money value={income} type="income" /> },
          { label: 'Saídas', node: <Money value={expense} type="expense" /> },
          { label: 'Saldo do mês', node: <Money value={income - expense} className={income - expense < 0 ? 'text-destructive' : ''} /> },
        ].map((s, i) => (
          <div key={s.label} className={cn('flex flex-col gap-1 px-5 py-4', i > 0 && 'border-t sm:border-l sm:border-t-0')}>
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className="text-xl font-medium">{s.node}</span>
          </div>
        ))}
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <Section title="De onde veio o dinheiro" aside={pluralize(incomeTx.length, 'entrada', 'entradas')}>
          <SpendStack items={incomeBreakdown} total={income} empty="Nenhuma entrada neste mês." legend={false} />
          {incomeBreakdown.length > 0 && <CategoryList items={incomeBreakdown} total={income} type="income" />}
        </Section>
        <Section title="Para onde foi o dinheiro" aside={pluralize(expenseTx.length, 'saída', 'saídas')}>
          <SpendStack items={expenseBreakdown} total={expense} empty="Nenhuma saída neste mês." legend={false} />
          {expenseBreakdown.length > 0 && <CategoryList items={expenseBreakdown} total={expense} type="expense" />}
        </Section>
      </div>

      {byAccount.length > 0 && (
        <Section title="Movimento por conta">
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Conta</TableHead>
                  <TableHead className="text-right">Transações</TableHead>
                  <TableHead className="text-right">Entradas</TableHead>
                  <TableHead className="text-right">Saídas</TableHead>
                  <TableHead className="pr-5 text-right">Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byAccount.map((a) => (
                  <TableRow key={a.name}>
                    <TableCell className="pl-5">
                      <span className="flex items-center gap-2"><span className="h-4 w-1.5 rounded-[2px]" style={{ backgroundColor: a.color }} />{a.name}</span>
                    </TableCell>
                    <TableCell className="money text-right">{a.count}</TableCell>
                    <TableCell className="text-right"><Money value={a.income} symbol={false} type="income" /></TableCell>
                    <TableCell className="text-right"><Money value={a.expense} symbol={false} type="expense" /></TableCell>
                    <TableCell className="pr-5 text-right"><Money value={a.income - a.expense} symbol={false} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Section>
      )}

      <Section title={`Mês a mês em ${year}`}>
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Mês</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="pr-5 text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearly.map((m) => (
                <TableRow key={m.label} className={cn(m.key === month && 'bg-accent/60')}>
                  <TableCell className="pl-5 font-medium">
                    <button onClick={() => setMonth(m.key)} className="rounded outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label={`Ver ${monthLabel(m.key)}`}>
                      {m.label}
                    </button>
                  </TableCell>
                  <TableCell className="text-right"><Money value={m.income} symbol={false} className="text-muted-foreground" /></TableCell>
                  <TableCell className="text-right"><Money value={m.expense} symbol={false} className="text-muted-foreground" /></TableCell>
                  <TableCell className="pr-5 text-right"><Money value={m.balance} symbol={false} className={m.balance < 0 ? 'text-destructive' : ''} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="pl-5 font-semibold">Total do ano</TableCell>
                <TableCell className="text-right"><Money value={yearTotals.income} symbol={false} type="income" /></TableCell>
                <TableCell className="text-right"><Money value={yearTotals.expense} symbol={false} type="expense" /></TableCell>
                <TableCell className="pr-5 text-right font-semibold"><Money value={yearTotals.balance} /></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Section>

      <Section title={`Transações de ${periodLabel.toLowerCase()}`} aside={pluralize(monthTx.length, 'transação', 'transações')}>
        {loading ? null : monthTx.length === 0 ? (
          <p className="rounded-xl border border-dashed px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma transação neste mês.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="pr-5 text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthTx.map((tx) => (
                  <TableRow key={tx._id}>
                    <TableCell className="money pl-5 text-xs text-muted-foreground">{formatDay(tx.date)}</TableCell>
                    <TableCell className="max-w-[260px] truncate font-medium">{tx.title}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-xs"><span className="size-2 rounded-[2px]" style={{ backgroundColor: tx.category?.color ?? FALLBACK_COLOR }} />{tx.category?.name ?? 'Sem categoria'}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{tx.account?.name ?? '—'}</TableCell>
                    <TableCell className="pr-5 text-right"><Money value={tx.amount} type={tx.type} symbol={false} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Section>

      <Section title="Exportar planilha">
        <div className="flex flex-col gap-3 rounded-xl border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            CSV separado por ponto e vírgula, abre direto no Excel e no Google Planilhas.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportMonth} disabled={monthTx.length === 0}><Download />{monthLabel(month)} ({monthTx.length})</Button>
            <Button variant="outline" onClick={exportYear} disabled={yearTx.length === 0}><Download />Ano de {year} ({yearTx.length})</Button>
          </div>
        </div>
      </Section>
    </div>
  )
}
