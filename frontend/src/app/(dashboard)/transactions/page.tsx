'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Search, ArrowUpRight, ArrowDownRight,
  Pencil, Trash2, Filter, Calendar, StickyNote, Landmark,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { useTransactions, useCategories, useAccounts } from '@/lib/hooks'
import { ITransaction, ICategory } from '@/types'
import api from '@/lib/api'

const MONTHS = [
  { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' },
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

interface TransactionFormData {
  title: string
  amount: string
  type: 'income' | 'expense'
  category: string
  account: string
  date: string
  description: string
}

const EMPTY_FORM: TransactionFormData = {
  title: '',
  amount: '',
  type: 'income',
  category: '',
  account: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
}

export default function TransactionsPage() {
  const { transactions, loading, refetch } = useTransactions()
  const { categories } = useCategories()
  const { accounts } = useAccounts()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<TransactionFormData>(EMPTY_FORM)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterMonth, setFilterMonth] = useState<string>('all')
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)
  const [error, setError] = useState('')

  const filteredCategories = (categories as (ICategory & { type?: string })[]).filter(
    (c) => c.type === form.type
  )

  const filteredTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((t) => {
        if (filterType !== 'all' && t.type !== filterType) return false
        if (filterMonth !== 'all') {
          const txMonth = t.date.substring(5, 7)
          if (txMonth !== filterMonth) return false
        }
        if (filterAccount !== 'all' && t.account?._id !== filterAccount) return false
        if (search) {
          const q = search.toLowerCase()
          return (
            t.title.toLowerCase().includes(q) ||
            t.category?.name.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q))
          )
        }
        return true
      })
  }, [transactions, filterType, filterMonth, filterAccount, search])

  const openNew = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
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
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const amount = parseFloat(form.amount)
    if (!form.title || isNaN(amount) || amount <= 0 || !form.category || !form.date) return
    setError('')

    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}`, { ...form, amount })
      } else {
        await api.post('/transactions', { ...form, amount })
      }
      setIsDialogOpen(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      refetch()
    } catch {
      setError('Erro ao salvar transação')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`)
      setDeleteConfirm(null)
      refetch()
    } catch {
      setError('Erro ao deletar transação')
    }
  }

  if (loading) return <p className="text-muted-foreground">Carregando...</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Transações</h1>
          <p className="text-sm text-muted-foreground">Registre e gerencie suas entradas e saídas</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Transação
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | 'income' | 'expense')}>
              <SelectTrigger className="w-full sm:w-36">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full sm:w-40">
                <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os meses</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAccount} onValueChange={setFilterAccount}>
              <SelectTrigger className="w-full sm:w-40">
                <Landmark className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {filteredTransactions.length} transação(ões)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
            {filteredTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {search || filterType !== 'all' || filterMonth !== 'all' || filterAccount !== 'all'
                  ? 'Nenhuma transação encontrada com os filtros aplicados.'
                  : "Nenhuma transação registrada ainda. Clique em 'Nova Transação' para começar!"}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredTransactions.map((tx) => {
                  const hasNotes = tx.description && tx.description.trim().length > 0
                  return (
                    <div key={tx._id}>
                      <div className="flex items-center justify-between py-3 px-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full ${tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {tx.type === 'income'
                              ? <ArrowUpRight className="w-4 h-4 text-green-600" />
                              : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{tx.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                {new Date(tx.date).toLocaleDateString('pt-BR')}
                              </span>
                              {tx.category && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0" style={{
                                  backgroundColor: (tx.category as ICategory & { color?: string }).color + '20',
                                  color: (tx.category as ICategory & { color?: string }).color,
                                }}>
                                  {tx.category.name}
                                </Badge>
                              )}
                              {tx.account && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {tx.account.name}
                                </Badge>
                              )}
                              {hasNotes && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => setExpandedNotes(expandedNotes === tx._id ? null : tx._id)}
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <StickyNote className="w-3 h-3" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver descrição</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                            {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tx)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(tx._id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {expandedNotes === tx._id && hasNotes && (
                        <div className="ml-12 mr-3 mt-1 mb-2 px-3 py-2 rounded-md bg-muted/50 border border-border">
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{tx.description}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Transação' : 'Nova Transação'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os dados da transação.' : 'Preencha os campos abaixo para registrar uma nova transação.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'income' | 'expense', category: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Data</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Título</Label>
              <Input placeholder="Ex: Venda de produto" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" min="0" placeholder="0,00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: (cat as ICategory & { color?: string }).color ?? '#6c757d' }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Conta</Label>
              <Select value={form.account} onValueChange={(v) => setForm({ ...form, account: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma conta" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Observações, detalhes do pagamento, etc."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir transação?</DialogTitle>
            <DialogDescription>Esta ação não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}