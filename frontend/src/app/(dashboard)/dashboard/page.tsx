'use client'

import { useMemo, useState } from 'react'
import {
  TrendingUp, TrendingDown, Scale,
  ArrowUpRight, ArrowDownRight, Calendar,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useTransactions, useCategories, useAccounts } from '@/lib/hooks'

const MONTHS = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
]

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const PIE_COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#f97316', '#fb923c']

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

const CURRENT_YEAR = new Date().getFullYear()


export default function DashboardPage() {
  const { transactions } = useTransactions()
  const { categories } = useCategories()

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map((t) => new Date(t.date).getFullYear()))
    years.add(CURRENT_YEAR)
    return Array.from(years).sort((a, b) => b - a)
  }, [transactions])

  const selectedMonthKey = selectedMonth !== 'all' ? `${selectedYear}-${selectedMonth}` : null

  const stats = useMemo(() => {
    const filtered = transactions.filter((t) => {
      const date = t.date.substring(0, 10)
      if (selectedMonthKey) return date.startsWith(selectedMonthKey)
      return date.startsWith(`${selectedYear}`)
    })

    const totalIncome = filtered.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const balance = totalIncome - totalExpense

    return { totalIncome, totalExpense, balance }
  }, [transactions, selectedYear, selectedMonthKey])

  const yearlyChartData = useMemo(() => {
    return MONTH_SHORT.map((label, i) => {
      const monthKey = `${selectedYear}-${String(i + 1).padStart(2, '0')}`
      const monthTx = transactions.filter((t) => t.date.substring(0, 10).startsWith(monthKey))
      const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { label, income, expense }
    })
  }, [transactions, selectedYear])

  const expenseByCategory = useMemo(() => {
    const filtered = transactions.filter((t) => {
      if (t.type !== 'expense') return false
      const date = t.date.substring(0, 10)
      if (selectedMonthKey) return date.startsWith(selectedMonthKey)
      return date.startsWith(`${selectedYear}`)
    })

    const byCategory: Record<string, { name: string; value: number }> = {}

    filtered.forEach((t) => {
      const catName = t.category?.name ?? 'Sem categoria'
      const catId = t.category?._id ?? 'unknown'
      if (!byCategory[catId]) byCategory[catId] = { name: catName, value: 0 }
      byCategory[catId].value += t.amount
    })

    return Object.values(byCategory)
  }, [transactions, categories, selectedYear, selectedMonthKey])

  const recentTransactions = useMemo(() => {
    const filtered = transactions.filter((t) => {
      const date = t.date.substring(0, 10)
      if (selectedMonthKey) return date.startsWith(selectedMonthKey)
      return date.startsWith(`${selectedYear}`)
    })
    return [...filtered]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [transactions, selectedYear, selectedMonthKey])

  const periodLabel = selectedMonth !== 'all'
    ? `${MONTHS.find((m) => m.value === selectedMonth)?.label} de ${selectedYear}`
    : `${selectedYear}`

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Resumo de {periodLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSelectedYear((y) => y - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-24 h-9">
                <SelectValue />
              </SelectTrigger>
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
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Fluxo de Caixa - {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            {yearlyChartData.some((m) => m.income > 0 || m.expense > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={yearlyChartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number | undefined) => formatCurrency(value ?? 0)} />
                  <Bar dataKey="income" name="Receitas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Despesas" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Nenhuma transação registrada ainda
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" nameKey="name">
                  {expenseByCategory.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => formatCurrency(value ?? 0)} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Nenhuma despesa neste período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Transações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {recentTransactions.map((tx) => (
                <div key={tx._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {tx.type === 'income'
                        ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                        : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('pt-BR')}
                        </span>
                        {tx.category && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {tx.category.name}
                          </Badge>
                        )}
                        {tx.account && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {tx.account.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma transação registrada. Comece adicionando sua primeira transação!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}