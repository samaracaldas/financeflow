'use client'

import { useState, useMemo } from 'react'
import {
  Plus, Pencil, Trash2, Landmark,
  Wallet, CreditCard, Building2, CircleDot,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useAccounts, useTransactions } from '@/lib/hooks'
import { IAccount } from '@/types'
import api from '@/lib/api'

const ACCOUNT_TYPE_LABELS: Record<IAccount['type'], string> = {
  cash: 'Dinheiro',
  bank: 'Banco',
  card: 'Cartão',
  other: 'Outro',
}

const ACCOUNT_TYPE_ICONS: Record<IAccount['type'], React.ElementType> = {
  cash: Wallet,
  bank: Building2,
  card: CreditCard,
  other: CircleDot,
}

const COLOR_OPTIONS = [
  '#2ba84a', '#17a2b8', '#007bff', '#6f42c1',
  '#e83e8c', '#dc3545', '#fd7e14', '#ffc107',
  '#6c757d', '#795548', '#20c997', '#28a745',
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

interface AccountFormData {
  name: string
  type: IAccount['type']
  color: string
  initialBalance: string
}

const EMPTY_FORM: AccountFormData = {
  name: '',
  type: 'bank',
  color: COLOR_OPTIONS[2],
  initialBalance: '0',
}

export default function AccountsPage() {
  const { accounts, loading, refetch } = useAccounts()
  const { transactions } = useTransactions()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AccountFormData>(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState('')

  const accountBalances = useMemo(() => {
    const balances: Record<string, { income: number; expense: number; balance: number }> = {}

    accounts.forEach((acc) => {
      balances[acc._id] = { income: 0, expense: 0, balance: acc.initialBalance }
    })

    transactions.forEach((tx) => {
      const accId = tx.account?._id
      if (!accId || !balances[accId]) return
      if (tx.type === 'income') {
        balances[accId].income += tx.amount
        balances[accId].balance += tx.amount
      } else {
        balances[accId].expense += tx.amount
        balances[accId].balance -= tx.amount
      }
    })

    return balances
  }, [accounts, transactions])

  const totalBalance = useMemo(() =>
    Object.values(accountBalances).reduce((sum, b) => sum + b.balance, 0)
  , [accountBalances])

  const openNew = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsDialogOpen(true)
  }

  const openEdit = (acc: IAccount) => {
    setEditingId(acc._id)
    setForm({
      name: acc.name,
      type: acc.type,
      color: acc.color,
      initialBalance: acc.initialBalance.toString(),
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        color: form.color,
        initialBalance: parseFloat(form.initialBalance) || 0,
      }
      if (editingId) {
        await api.put(`/accounts/${editingId}`, payload)
      } else {
        await api.post('/accounts', payload)
      }
      setIsDialogOpen(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      refetch()
    } catch {
      setError('Erro ao salvar conta')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/accounts/${id}`)
      setDeleteConfirm(null)
      refetch()
    } catch {
      setError('Erro ao deletar conta')
    }
  }

  const getAccountTxCount = (accountId: string) =>
    transactions.filter((t) => t.account?._id === accountId).length

  if (loading) return <p className="text-muted-foreground">Carregando...</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Contas</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas contas e formas de pagamento</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Conta
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Total Balance Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground font-medium">Saldo Total (todas as contas)</p>
              <p className={`text-3xl font-bold mt-1 ${totalBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <Landmark className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Cards */}
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma conta cadastrada. Clique em &quot;Nova Conta&quot; para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const balance = accountBalances[acc._id]
            const Icon = ACCOUNT_TYPE_ICONS[acc.type]
            const txCount = getAccountTxCount(acc._id)
            return (
              <Card key={acc._id} className="relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: acc.color }} />
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ backgroundColor: acc.color + '20' }}>
                        <Icon className="w-5 h-5" style={{ color: acc.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{acc.name}</p>
                        <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[acc.type]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(acc)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(acc._id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Saldo atual</span>
                      <span className={`text-lg font-bold ${(balance?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {formatCurrency(balance?.balance ?? 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Entradas</span>
                      <span className="text-green-600 font-medium">{formatCurrency(balance?.income ?? 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Saídas</span>
                      <span className="text-red-500 font-medium">{formatCurrency(balance?.expense ?? 0)}</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <Badge variant="secondary" className="text-[10px]">
                        {txCount} transação(ões)
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os dados da conta.' : 'Adicione uma nova conta ou forma de pagamento.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>Nome</Label>
              <Input placeholder="Ex: Banco Inter" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as IAccount['type'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="bank">Banco</SelectItem>
                    <SelectItem value="card">Cartão</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Saldo Inicial (R$)</Label>
                <Input type="number" step="0.01" placeholder="0,00" value={form.initialBalance} onChange={(e) => setForm({ ...form, initialBalance: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === color ? 'border-foreground scale-110' : 'border-transparent hover:border-muted-foreground'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm({ ...form, color })}
                  >
                    <span className="sr-only">Cor {color}</span>
                  </button>
                ))}
              </div>
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
            <DialogTitle>Excluir conta?</DialogTitle>
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