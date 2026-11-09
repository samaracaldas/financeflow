'use client'

import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import api, { getErrorMessage } from '@/lib/api'
import { pluralize } from '@/lib/format'
import { MONEY_COLORS, NOTE } from '@/lib/palette'
import { ColorPicker, ErrorNote, Money, NoteCard, PageHeader } from '@/components/brand'

const ACCOUNT_TYPE_LABELS: Record<IAccount['type'], string> = {
  cash: 'Dinheiro em caixa',
  bank: 'Conta bancária',
  card: 'Cartão de crédito',
  other: 'Outra',
}

interface AccountFormData {
  name: string
  type: IAccount['type']
  color: string
  initialBalance: string
}

const EMPTY_FORM: AccountFormData = { name: '', type: 'bank', color: MONEY_COLORS[0].value, initialBalance: '0' }

export default function AccountsPage() {
  const { accounts, loading, refetch } = useAccounts()
  const { transactions } = useTransactions()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<AccountFormData>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<IAccount | null>(null)
  const [error, setError] = useState('')

  const stats = useMemo(() => {
    const map: Record<string, { income: number; expense: number; balance: number; count: number }> = {}
    accounts.forEach((acc) => { map[acc._id] = { income: 0, expense: 0, balance: acc.initialBalance, count: 0 } })
    transactions.forEach((tx) => {
      const s = tx.account?._id ? map[tx.account._id] : undefined
      if (!s) return
      s.count += 1
      if (tx.type === 'income') { s.income += tx.amount; s.balance += tx.amount }
      else { s.expense += tx.amount; s.balance -= tx.amount }
    })
    return map
  }, [accounts, transactions])

  const totalBalance = Object.values(stats).reduce((sum, s) => sum + s.balance, 0)

  const openNew = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setIsDialogOpen(true)
  }

  const openEdit = (acc: IAccount) => {
    setEditingId(acc._id)
    setForm({ name: acc.name, type: acc.type, color: acc.color, initialBalance: acc.initialBalance.toString() })
    setFormError('')
    setIsDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.name.trim().length < 2) return setFormError('Dê um nome com pelo menos 2 letras.')
    setFormError('')
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        color: form.color,
        initialBalance: parseFloat(form.initialBalance.replace(',', '.')) || 0,
      }
      if (editingId) await api.put(`/accounts/${editingId}`, payload)
      else await api.post('/accounts', payload)
      setIsDialogOpen(false)
      setEditingId(null)
      refetch()
    } catch (err) {
      setFormError(getErrorMessage(err, 'Não foi possível salvar a conta.'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/accounts/${deleteTarget._id}`)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setDeleteTarget(null)
      setError(getErrorMessage(err, 'Não foi possível excluir a conta.'))
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Contas" description="Onde o dinheiro do negócio fica guardado: banco, caixa, cartão.">
        <Button onClick={openNew}><Plus />Nova conta</Button>
      </PageHeader>

      {error && <ErrorNote>{error}</ErrorNote>}

      <NoteCard label="Saldo somando todas as contas" value={totalBalance} color={totalBalance < 0 ? NOTE.red : NOTE.sepia}>
        <span>{pluralize(accounts.length, 'conta', 'contas')}</span>
      </NoteCard>

      {loading ? null : accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada. Comece pela conta do banco ou pelo caixa da loja.</p>
          <Button onClick={openNew} variant="outline" className="mt-4"><Plus />Cadastrar conta</Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((acc) => {
            const s = stats[acc._id]
            return (
              <li key={acc._id} className="flex flex-col overflow-hidden rounded-xl border bg-card">
                <div className="guilloche guilloche-soft flex items-start justify-between gap-2 px-5 py-4 text-white" style={{ backgroundColor: acc.color }}>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{acc.name}</p>
                    <p className="text-xs text-white/85">{ACCOUNT_TYPE_LABELS[acc.type]}</p>
                  </div>
                  <div className="-mr-2 -mt-1 flex">
                    <Button variant="ghost" size="icon" className="size-8 text-white/85 hover:bg-white/15 hover:text-white" onClick={() => openEdit(acc)} aria-label={`Editar ${acc.name}`}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-white/85 hover:bg-white/15 hover:text-white" onClick={() => setDeleteTarget(acc)} aria-label={`Excluir ${acc.name}`}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-3 px-5 py-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo atual</p>
                    <Money value={s?.balance ?? 0} className={`text-xl font-medium ${(s?.balance ?? 0) < 0 ? 'text-destructive' : ''}`} />
                  </div>
                  <dl className="grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                    <div><dt className="text-muted-foreground">Entradas</dt><dd><Money value={s?.income ?? 0} type="income" /></dd></div>
                    <div><dt className="text-muted-foreground">Saídas</dt><dd><Money value={s?.expense ?? 0} type="expense" /></dd></div>
                  </dl>
                  <p className="text-xs text-muted-foreground">
                    {pluralize(s?.count ?? 0, 'transação', 'transações')} · saldo inicial <Money value={acc.initialBalance} />
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave} className="flex flex-col gap-5" noValidate>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar conta' : 'Nova conta'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Altere o que precisar e salve.' : 'Cadastre um lugar onde o dinheiro entra ou sai.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="acc-name">Nome</Label>
              <Input id="acc-name" placeholder="Ex.: Conta PJ, Caixa da loja" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as IAccount['type'] })}>
                  <SelectTrigger className="w-full" aria-label="Tipo"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACCOUNT_TYPE_LABELS) as IAccount['type'][]).map((t) => (
                      <SelectItem key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="acc-initial">Saldo inicial (R$)</Label>
                <Input id="acc-initial" inputMode="decimal" className="money" placeholder="0,00" value={form.initialBalance} onChange={(e) => setForm({ ...form, initialBalance: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cor</Label>
              <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
            </div>
            {formError && <ErrorNote>{formError}</ErrorNote>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingId ? 'Salvar alterações' : 'Cadastrar conta'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir a conta “{deleteTarget?.name}”?</DialogTitle>
            <DialogDescription>As transações dela continuam registradas, mas ficam sem conta. Não dá para desfazer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir conta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
