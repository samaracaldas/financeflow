'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Download, FileSpreadsheet, FileText, Calendar,
  TrendingUp, TrendingDown, Scale, ChevronLeft,
  ChevronRight, Landmark, ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useTransactions, useCategories, useAccounts } from '@/lib/hooks'
import { ICategory, IAccount } from '@/types'

const MONTHS = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
]

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const CURRENT_YEAR = new Date().getFullYear()

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export default function ReportsPage() {
  const { transactions } = useTransactions()
  const { categories } = useCategories()
  const { accounts } = useAccounts()

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(now.getMonth() + 1).padStart(2, '0')
  )

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map((t) => parseInt(t.date.substring(0, 4))))
    years.add(CURRENT_YEAR)
    return Array.from(years).sort((a, b) => b - a)
  }, [transactions])

  const monthKey = `${selectedYear}-${selectedMonth}`
  const monthLabel = `${MONTHS.find((m) => m.value === selectedMonth)?.label} de ${selectedYear}`

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .filter((t) => t.date.startsWith(monthKey))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [transactions, monthKey])

  const stats = useMemo(() => {
    const totalIncome = filteredTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = filteredTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
  }, [filteredTransactions])

  const categoryBreakdown = useMemo(() => {
    const income: Record<string, { name: string; total: number; color: string; count: number }> = {}
    const expense: Record<string, { name: string; total: number; color: string; count: number }> = {}

    filteredTransactions.forEach((tx) => {
      const cat = tx.category as (ICategory & { color?: string }) | undefined
      const name = cat?.name ?? 'Sem categoria'
      const color = cat?.color ?? '#94a3b8'
      const target = tx.type === 'income' ? income : expense
      const key = cat?._id ?? 'none'

      if (!target[key]) target[key] = { name, total: 0, color, count: 0 }
      target[key].total += tx.amount
      target[key].count += 1
    })

    return {
      income: Object.values(income).sort((a, b) => b.total - a.total),
      expense: Object.values(expense).sort((a, b) => b.total - a.total),
    }
  }, [filteredTransactions])

  const accountBreakdown = useMemo(() => {
    const breakdown: Record<string, { name: string; color: string; income: number; expense: number; count: number }> = {}

    filteredTransactions.forEach((tx) => {
      const acc = tx.account as (IAccount & { color?: string }) | undefined
      const key = acc?._id ?? 'none'
      const name = acc?.name ?? 'Sem conta'
      const color = acc?.color ?? '#94a3b8'

      if (!breakdown[key]) breakdown[key] = { name, color, income: 0, expense: 0, count: 0 }
      if (tx.type === 'income') breakdown[key].income += tx.amount
      else breakdown[key].expense += tx.amount
      breakdown[key].count += 1
    })

    return Object.values(breakdown).sort((a, b) => (b.income + b.expense) - (a.income + a.expense))
  }, [filteredTransactions])

  const yearlyOverview = useMemo(() => {
    return MONTH_SHORT.map((label, i) => {
      const mk = `${selectedYear}-${String(i + 1).padStart(2, '0')}`
      const monthTx = transactions.filter((t) => t.date.startsWith(mk))
      const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { label, income, expense, balance: income - expense }
    })
  }, [transactions, selectedYear])

  const yearTotals = useMemo(() =>
    yearlyOverview.reduce(
      (acc, m) => ({ income: acc.income + m.income, expense: acc.expense + m.expense, balance: acc.balance + m.balance }),
      { income: 0, expense: 0, balance: 0 }
    )
  , [yearlyOverview])

  const exportCSV = useCallback(() => {
    const headers = ['Data', 'Tipo', 'Título', 'Categoria', 'Conta', 'Valor', 'Descrição']
    const rows = filteredTransactions.map((tx) => {
      const cat = tx.category as ICategory | undefined
      const acc = tx.account as IAccount | undefined
      return [
        new Date(tx.date).toLocaleDateString('pt-BR'),
        tx.type === 'income' ? 'Receita' : 'Despesa',
        `"${tx.title.replace(/"/g, '""')}"`,
        cat?.name ?? '',
        acc?.name ?? '',
        tx.amount.toFixed(2).replace('.', ','),
        `"${(tx.description || '').replace(/"/g, '""')}"`,
      ]
    })

    const bom = '\uFEFF'
    const csvContent = bom + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `financeflow-${monthKey}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [filteredTransactions, monthKey])

  const exportYearCSV = useCallback(() => {
    const headers = ['Data', 'Tipo', 'Título', 'Categoria', 'Conta', 'Valor', 'Descrição']
    const yearTx = [...transactions]
      .filter((t) => t.date.startsWith(`${selectedYear}`))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const rows = yearTx.map((tx) => {
      const cat = tx.category as ICategory | undefined
      const acc = tx.account as IAccount | undefined
      return [
        new Date(tx.date).toLocaleDateString('pt-BR'),
        tx.type === 'income' ? 'Receita' : 'Despesa',
        `"${tx.title.replace(/"/g, '""')}"`,
        cat?.name ?? '',
        acc?.name ?? '',
        tx.amount.toFixed(2).replace('.', ','),
        `"${(tx.description || '').replace(/"/g, '""')}"`,
      ]
    })

    const bom = '\uFEFF'
    const csvContent = bom + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `financeflow-${selectedYear}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }, [transactions, selectedYear])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Análise detalhada e exportação de dados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSelectedYear((y) => y - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-24 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSelectedYear((y) => y + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Resumo de {monthLabel}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Receitas</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(stats.totalIncome)}</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Despesas</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(stats.totalExpense)}</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Saldo</p>
                  <p className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(stats.balance)}
                  </p>
                </div>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${stats.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Scale className={`w-5 h-5 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-500'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
              Receitas por Categoria
            </CardTitle>
            <Badge variant="secondary">{formatCurrency(stats.totalIncome)}</Badge>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.income.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma receita neste período</p>
            ) : (
              <div className="flex flex-col gap-3">
                {categoryBreakdown.income.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">({item.count})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(item.total / stats.totalIncome) * 100}%`, backgroundColor: item.color }} />
                      </div>
                      <span className="text-sm font-medium text-foreground w-28 text-right">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-red-500" />
              Despesas por Categoria
            </CardTitle>
            <Badge variant="secondary">{formatCurrency(stats.totalExpense)}</Badge>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.expense.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa neste período</p>
            ) : (
              <div className="flex flex-col gap-3">
                {categoryBreakdown.expense.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-foreground">{item.name}</span>
                      <span className="text-xs text-muted-foreground">({item.count})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(item.total / stats.totalExpense) * 100}%`, backgroundColor: item.color }} />
                      </div>
                      <span className="text-sm font-medium text-foreground w-28 text-right">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account Breakdown */}
      {accountBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Landmark className="w-4 h-4" />
              Movimentação por Conta - {monthLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {accountBreakdown.map((item) => (
                <div key={item.name} className="flex flex-col gap-2 p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">{item.count} tx</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Entradas</span>
                    <span className="text-green-600 font-medium">{formatCurrency(item.income)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Saídas</span>
                    <span className="text-red-500 font-medium">{formatCurrency(item.expense)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Yearly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Resumo Anual - {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead className="text-right">Receitas</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearlyOverview.map((m) => (
                  <TableRow key={m.label}>
                    <TableCell className="font-medium">{m.label}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(m.income)}</TableCell>
                    <TableCell className="text-right text-red-500">{formatCurrency(m.expense)}</TableCell>
                    <TableCell className={`text-right font-semibold ${m.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatCurrency(m.balance)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2 border-foreground/20">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold text-green-600">{formatCurrency(yearTotals.income)}</TableCell>
                  <TableCell className="text-right font-bold text-red-500">{formatCurrency(yearTotals.expense)}</TableCell>
                  <TableCell className={`text-right font-bold ${yearTotals.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(yearTotals.balance)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-3 p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-foreground">Exportar Mensal (CSV)</p>
                  <p className="text-xs text-muted-foreground">{monthLabel} — {filteredTransactions.length} transação(ões)</p>
                </div>
              </div>
              <Button variant="outline" className="gap-2" onClick={exportCSV} disabled={filteredTransactions.length === 0}>
                <Download className="w-4 h-4" />
                Baixar CSV do mês
              </Button>
            </div>
            <div className="flex flex-col gap-3 p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Exportar Anual (CSV)</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedYear} — {transactions.filter((t) => t.date.startsWith(`${selectedYear}`)).length} transação(ões)
                  </p>
                </div>
              </div>
              <Button variant="outline" className="gap-2" onClick={exportYearCSV} disabled={transactions.filter((t) => t.date.startsWith(`${selectedYear}`)).length === 0}>
                <Download className="w-4 h-4" />
                Baixar CSV do ano
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Detalhamento — {monthLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação neste período.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const cat = tx.category as (ICategory & { color?: string }) | undefined
                    const acc = tx.account as (IAccount & { color?: string }) | undefined
                    return (
                      <TableRow key={tx._id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(tx.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium text-sm max-w-[200px] truncate">{tx.title}</TableCell>
                        <TableCell>
                          {cat && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color ?? '#94a3b8' }} />
                              <span className="text-xs">{cat.name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {acc && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: acc.color ?? '#94a3b8' }} />
                              <span className="text-xs">{acc.name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={`text-right text-sm font-medium whitespace-nowrap ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}