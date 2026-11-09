'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useTransactions, useAccounts } from '@/lib/hooks'
import { MONTH_SHORT, formatDay, monthLabel, pluralize } from '@/lib/format'
import { FALLBACK_COLOR, NOTE } from '@/lib/palette'
import { Money, NoteCard, PageHeader, PeriodPicker, Section, SpendStack } from '@/components/brand'
import { CashflowChart } from '@/components/brand/cashflow-chart'

const NOW = new Date()
const CURRENT_YEAR = NOW.getFullYear()
const CURRENT_MONTH = String(NOW.getMonth() + 1).padStart(2, '0')

export default function DashboardPage() {
  const { transactions, loading } = useTransactions()
  const { accounts } = useAccounts()

  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState<string>(CURRENT_MONTH)

  const years = useMemo(
    () => Array.from(new Set(transactions.map((t) => Number(t.date.substring(0, 4))))),
    [transactions]
  )

  const prefix = month === 'all' ? `${year}` : `${year}-${month}`
  const periodTitle = month === 'all' ? `${year}` : `${monthLabel(month)} de ${year}`

  const inPeriod = useMemo(
    () => transactions.filter((t) => t.date.startsWith(prefix)),
    [transactions, prefix]
  )

  const totals = useMemo(() => {
    const income = inPeriod.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = inPeriod.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expense, balance: income - expense }
  }, [inPeriod])

  const spend = useMemo(() => {
    const by: Record<string, { name: string; value: number; color: string }> = {}
    inPeriod.filter((t) => t.type === 'expense').forEach((t) => {
      const key = t.category?._id ?? 'none'
      by[key] ??= { name: t.category?.name ?? 'Sem categoria', value: 0, color: t.category?.color ?? FALLBACK_COLOR }
      by[key].value += t.amount
    })
    return Object.values(by).sort((a, b) => b.value - a.value)
  }, [inPeriod])

  const yearly = useMemo(
    () => MONTH_SHORT.map((label, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`
      const txs = transactions.filter((t) => t.date.startsWith(key))
      return {
        label,
        income: txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    }),
    [transactions, year]
  )

  // Saldo atual de cada conta (todo o histórico, não só o período)
  const accountBalances = useMemo(
    () => accounts
      .map((acc) => {
        const moved = transactions
          .filter((t) => t.account?._id === acc._id)
          .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
        return { ...acc, balance: acc.initialBalance + moved }
      })
      .sort((a, b) => b.balance - a.balance),
    [accounts, transactions]
  )

  const recent = useMemo(
    () => [...inPeriod].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [inPeriod]
  )

  const hasYearData = yearly.some((m) => m.income > 0 || m.expense > 0)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={periodTitle}
        description={loading ? 'Carregando transações…' : `${pluralize(inPeriod.length, 'transação', 'transações')} no período`}
      >
        <PeriodPicker year={year} years={years} onYear={setYear} month={month} onMonth={setMonth} />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <NoteCard
          label={month === 'all' ? 'Saldo do ano' : 'Saldo do mês'}
          value={totals.balance}
          color={totals.balance < 0 ? NOTE.red : NOTE.blue}
        >
          <span>Entradas <b className="money font-medium">{totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></span>
          <span>Saídas <b className="money font-medium">{totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></span>
        </NoteCard>

        <section className="flex flex-col rounded-xl border bg-card px-5 py-4" aria-label="Saldo por conta">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Onde está o dinheiro</h2>
            <Link href="/accounts" className="text-xs text-muted-foreground hover:text-foreground">Contas</Link>
          </div>
          {accountBalances.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre uma conta para ver o saldo de cada uma.</p>
          ) : (
            <ul className="flex flex-col">
              {accountBalances.slice(0, 4).map((acc) => (
                <li key={acc._id} className="flex items-center gap-2.5 border-b py-2 text-sm last:border-0">
                  <span className="h-4 w-1.5 rounded-[2px]" style={{ backgroundColor: acc.color }} />
                  <span className="min-w-0 flex-1 truncate">{acc.name}</span>
                  <Money value={acc.balance} className={acc.balance < 0 ? 'text-destructive' : ''} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Section title="Para onde foi o dinheiro" aside={<Money value={totals.expense} />}>
        <SpendStack items={spend} total={totals.expense} empty="Nenhuma saída registrada neste período." />
      </Section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Section title={`Entradas e saídas em ${year}`}>
          {hasYearData ? (
            <CashflowChart data={yearly} height={230} />
          ) : (
            <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhuma transação em {year}.
            </p>
          )}
        </Section>

        <Section
          title="Últimas transações"
          aside={<Link href="/transactions" className="inline-flex items-center gap-1 hover:text-foreground">Ver todas <ArrowRight className="size-3" /></Link>}
        >
          {recent.length === 0 ? (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Nada lançado neste período.{' '}
              <Link href="/transactions" className="font-medium text-foreground underline underline-offset-4">Registrar transação</Link>
            </div>
          ) : (
            <ul className="flex flex-col">
              {recent.map((tx) => (
                <li key={tx._id} className="grid grid-cols-[6px_minmax(0,1fr)_auto] items-center gap-3 border-b py-2.5 last:border-0">
                  <span className="h-7 w-1.5 rounded-[2px]" style={{ backgroundColor: tx.category?.color ?? FALLBACK_COLOR }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{tx.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      <span className="money">{formatDay(tx.date)}</span> · {tx.category?.name ?? 'Sem categoria'}
                    </span>
                  </span>
                  <Money value={tx.amount} type={tx.type} className="text-sm" />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  )
}
