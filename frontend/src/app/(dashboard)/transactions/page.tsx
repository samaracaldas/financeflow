'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, Pencil, Trash2, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useTransactions, useCategories, useAccounts } from '@/lib/hooks'
import { ITransaction } from '@/types'
import api, { getErrorMessage } from '@/lib/api'
import { formatDay, pluralize } from '@/lib/format'
import { FALLBACK_COLOR } from '@/lib/palette'
import { cn } from '@/lib/utils'
import { ErrorNote, Money, PageHeader, PeriodPicker, TypeToggle } from '@/components/brand'

interface TransactionFormData {
  title: string
  amount: string
  type: 'income' | 'expense'
  category: string
  account: string
  date: string
  description: string
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const emptyForm = (): TransactionFormData => ({
  title: '', amount: '', type: 'income', category: '', account: '', date: today(), description: '',
})

const dayHeading = (day: string) => {
  const text = formatDay(day, { weekday: 'long', day: 'numeric', month: 'long' })
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const TYPE_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'income', label: 'Entradas' },
  { value: 'expense', label: 'Saídas' },
] as const

export default function TransactionsPage() {
  const { transactions, loading, refetch } = useTransactions()
  const { categories } = useCategories()
  const { accounts } = useAccounts()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TransactionFormData>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState<string>('all')
  const [filterAccount, setFilterAccount] = useState<string>('all')

  const [deleteTarget, setDeleteTarget] = useState<ITransaction | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)
  const [error, setError] = useState('')

  const years = useMemo(() => Array.from(new Set(transactions.map((t) => Number(t.date.substring(0, 4))))), [transactions])
  const formCategories = categories.filter((c) => c.type === form.type)

  const filtered = useMemo(() => {
    const prefix = month === 'all' ? `${year}` : `${year}-${month}`
    const q = search.trim().toLowerCase()
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .filter((t) => {
        if (!t.date.startsWith(prefix)) return false
        if (filterType !== 'all' && t.type !== filterType) return false
        if (filterAccount !== 'all' && t.account?._id !== filterAccount) return false
        if (!q) return true
        return (
          t.title.toLowerCase().includes(q) ||
          t.category?.name.toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q)
        )
      })
  }, [transactions, filterType, year, month, filterAccount, search])

  const totals = useMemo(() => ({
    income: filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    expense: filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
  }), [filtered])

  // Agrupa por dia, como um extrato
  const days = useMemo(() => {
    const groups: { day: string; items: ITransaction[]; net: number }[] = []
    filtered.forEach((tx) => {
      const day = tx.date.substring(0, 10)
      let group = groups[groups.length - 1]
      if (!group || group.day !== day) {
        group = { day, items: [], net: 0 }
        groups.push(group)
      }
      group.items.push(tx)
      group.net += tx.type === 'income' ? tx.amount : -tx.amount
    })
    return groups
  }, [filtered])

  const isFiltering = search !== '' || filterType !== 'all' || month !== 'all' || filterAccount !== 'all'

  const openNew = () => {
    setEditingId(null)
    setForm(emptyForm())
    setFormError('')
    setIsDialogOpen(true)
  }

  const openEdit = (tx: ITransaction) => {
    setEditingId(tx._id)
    setForm({
      title: tx.title,
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category?._id ?? '',
      account: tx.account?._id ?? '',
      date: tx.date.substring(0, 10),
      description: tx.description ?? '',
    })
    setFormError('')
    setIsDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(form.amount.replace(',', '.'))
    if (form.title.trim().length < 2) return setFormError('Descreva a transação com pelo menos 2 letras.')
    if (isNaN(amount) || amount <= 0) return setFormError('Informe um valor maior que zero.')
    if (!form.category) return setFormError('Escolha uma categoria.')
    if (!form.date) return setFormError('Informe a data.')

    setFormError('')
    setSaving(true)
    try {
      const payload = { ...form, title: form.title.trim(), amount }
      if (editingId) await api.put(`/transactions/${editingId}`, payload)
      else await api.post('/transactions', payload)
      setIsDialogOpen(false)
      setEditingId(null)
      refetch()
    } catch (err) {
      setFormError(getErrorMessage(err, 'Não foi possível salvar a transação.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/transactions/${deleteTarget._id}`)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setDeleteTarget(null)
      setError(getErrorMessage(err, 'Não foi possível excluir a transação.'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Transações"
        description={
          loading ? 'Carregando…' : (
            <>
              {pluralize(filtered.length, 'transação', 'transações')} ·{' '}
              <Money value={totals.income} type="income" /> · <Money value={totals.expense} type="expense" />
            </>
          )
        }
      >
        <Button onClick={openNew}>
          <Plus />
          Nova transação
        </Button>
      </PageHeader>

      {error && <ErrorNote>{error}</ErrorNote>}

      {/* Filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar transação"
            aria-label="Buscar transações"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 bg-card pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-md border bg-card p-0.5" role="radiogroup" aria-label="Tipo">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.value}
                role="radio"
                aria-checked={filterType === f.value}
                onClick={() => setFilterType(f.value)}
                className={cn(
                  'h-8 rounded-[5px] px-3 text-sm text-muted-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  filterType === f.value && 'bg-accent font-medium text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <PeriodPicker year={year} years={years} onYear={setYear} month={month} onMonth={setMonth} />
          <Select value={filterAccount} onValueChange={setFilterAccount}>
            <SelectTrigger className="h-9 w-44 bg-card" aria-label="Conta"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map((acc) => <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Extrato */}
      {loading ? null : days.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {isFiltering ? 'Nenhuma transação com esses filtros.' : 'Nenhuma transação registrada ainda.'}
          </p>
          {!isFiltering && (
            <Button onClick={openNew} variant="outline" className="mt-4"><Plus />Registrar a primeira</Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {days.map((group) => (
            <section key={group.day} aria-label={formatDay(group.day, { day: 'numeric', month: 'long' })}>
              <header className="flex items-center justify-between border-b bg-muted/60 px-4 py-1.5 text-xs text-muted-foreground sm:px-5">
                <span className="font-medium text-foreground">
                  {dayHeading(group.day)}
                </span>
                <span>Saldo do dia <Money value={group.net} className="text-foreground" /></span>
              </header>
              <ul>
                {group.items.map((tx) => {
                  const hasNotes = !!tx.description?.trim()
                  return (
                    <li key={tx._id} className="group border-b last:border-b-0">
                      <div className="grid grid-cols-[6px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2.5 sm:px-5">
                        <span className="h-8 w-1.5 rounded-[2px]" style={{ backgroundColor: tx.category?.color ?? FALLBACK_COLOR }} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{tx.title}</p>
                          <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                            <span>{tx.category?.name ?? 'Sem categoria'}</span>
                            {tx.account && <><span aria-hidden>·</span><span>{tx.account.name}</span></>}
                            {hasNotes && (
                              <button
                                onClick={() => setExpandedNotes(expandedNotes === tx._id ? null : tx._id)}
                                aria-expanded={expandedNotes === tx._id}
                                className="ml-1 inline-flex items-center gap-1 rounded px-1 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                              >
                                <StickyNote className="size-3" />
                                {expandedNotes === tx._id ? 'Ocultar observação' : 'Observação'}
                              </button>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Money value={tx.amount} type={tx.type} className="text-sm" />
                          <div className="flex opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => openEdit(tx)} aria-label={`Editar ${tx.title}`}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(tx)} aria-label={`Excluir ${tx.title}`}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {expandedNotes === tx._id && hasNotes && (
                        <p className="mx-4 mb-3 ml-[34px] whitespace-pre-wrap rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground sm:ml-[38px]">
                          {tx.description}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Nova / editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <form onSubmit={handleSave} className="flex flex-col gap-5" noValidate>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar transação' : 'Nova transação'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Altere o que precisar e salve.' : 'Registre uma venda, um pagamento ou qualquer movimento de dinheiro.'}
              </DialogDescription>
            </DialogHeader>

            <TypeToggle value={form.type} onChange={(type) => setForm({ ...form, type, category: '' })} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tx-title">Descrição</Label>
              <Input id="tx-title" placeholder={form.type === 'income' ? 'Ex.: Venda de bolos' : 'Ex.: Conta de luz'} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tx-amount">Valor (R$)</Label>
                <Input id="tx-amount" inputMode="decimal" placeholder="0,00" className="money" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tx-date">Data</Label>
                <Input id="tx-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="w-full" aria-label="Categoria"><SelectValue placeholder="Escolha" /></SelectTrigger>
                  <SelectContent>
                    {formCategories.length === 0 && (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">
                        Nenhuma categoria de {form.type === 'income' ? 'entrada' : 'saída'}. Crie uma em Categorias.
                      </p>
                    )}
                    {formCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        <span className="size-2.5 rounded-[2px]" style={{ backgroundColor: cat.color ?? FALLBACK_COLOR }} />
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Conta</Label>
                <Select value={form.account} onValueChange={(v) => setForm({ ...form, account: v })}>
                  <SelectTrigger className="w-full" aria-label="Conta"><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tx-notes">Observação <span className="font-normal text-muted-foreground">(opcional)</span></Label>
              <Textarea id="tx-notes" rows={2} className="resize-none" placeholder="Forma de pagamento, nota fiscal, cliente…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {formError && <ErrorNote>{formError}</ErrorNote>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{editingId ? 'Salvar alterações' : 'Registrar transação'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Excluir */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir esta transação?</DialogTitle>
            <DialogDescription>
              {deleteTarget && <>“{deleteTarget.title}”, de <Money value={deleteTarget.amount} />. Não dá para desfazer.</>}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir transação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
