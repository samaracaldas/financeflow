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
import { useCategories, useTransactions } from '@/lib/hooks'
import { ICategory } from '@/types'
import api, { getErrorMessage } from '@/lib/api'
import { pluralize } from '@/lib/format'
import { FALLBACK_COLOR, MONEY_COLORS } from '@/lib/palette'
import { ColorPicker, ErrorNote, Money, PageHeader, TypeToggle } from '@/components/brand'

interface CategoryFormData {
  name: string
  type: 'income' | 'expense'
  color: string
}

const CURRENT_YEAR = new Date().getFullYear()

export default function CategoriesPage() {
  const { categories, loading, refetch } = useCategories()
  const { transactions } = useTransactions()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryFormData>({ name: '', type: 'expense', color: MONEY_COLORS[0].value })
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null)
  const [error, setError] = useState('')

  // Total e quantidade no ano corrente, por categoria
  const usage = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {}
    transactions.filter((t) => t.date.startsWith(`${CURRENT_YEAR}`)).forEach((t) => {
      const id = t.category?._id
      if (!id) return
      map[id] ??= { total: 0, count: 0 }
      map[id].total += t.amount
      map[id].count += 1
    })
    return map
  }, [transactions])

  const groups = useMemo(() => {
    const sort = (list: ICategory[]) => [...list].sort((a, b) => (usage[b._id]?.total ?? 0) - (usage[a._id]?.total ?? 0))
    return [
      { type: 'income' as const, title: 'Entradas', hint: 'De onde vem o dinheiro', items: sort(categories.filter((c) => c.type === 'income')) },
      { type: 'expense' as const, title: 'Saídas', hint: 'Para onde vai o dinheiro', items: sort(categories.filter((c) => c.type === 'expense')) },
    ]
  }, [categories, usage])

  const openNew = (type: 'income' | 'expense' = 'expense') => {
    const used = new Set(categories.map((c) => c.color.toLowerCase()))
    const nextColor = MONEY_COLORS.find((c) => !used.has(c.value))?.value ?? MONEY_COLORS[0].value
    setEditingId(null)
    setForm({ name: '', type, color: nextColor })
    setFormError('')
    setIsDialogOpen(true)
  }

  const openEdit = (cat: ICategory) => {
    setEditingId(cat._id)
    setForm({ name: cat.name, type: cat.type, color: cat.color ?? FALLBACK_COLOR })
    setFormError('')
    setIsDialogOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.name.trim().length < 2) return setFormError('Dê um nome com pelo menos 2 letras.')
    setFormError('')
    try {
      const payload = { ...form, name: form.name.trim() }
      if (editingId) await api.put(`/categories/${editingId}`, payload)
      else await api.post('/categories', payload)
      setIsDialogOpen(false)
      setEditingId(null)
      refetch()
    } catch (err) {
      setFormError(getErrorMessage(err, 'Não foi possível salvar a categoria.'))
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.delete(`/categories/${deleteTarget._id}`)
      setDeleteTarget(null)
      refetch()
    } catch (err) {
      setDeleteTarget(null)
      setError(getErrorMessage(err, 'Não foi possível excluir a categoria.'))
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Categorias" description={`Agrupe as transações para saber o que mais vende e o que mais pesa. Totais de ${CURRENT_YEAR}.`}>
        <Button onClick={() => openNew()}><Plus />Nova categoria</Button>
      </PageHeader>

      {error && <ErrorNote>{error}</ErrorNote>}

      {loading ? null : (
        <div className="grid gap-8 lg:grid-cols-2">
          {groups.map((group) => (
            <section key={group.type} className="flex min-w-0 flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold">
                  {group.title} <span className="text-sm font-normal text-muted-foreground">· {group.hint}</span>
                </h2>
                <span className="text-xs text-muted-foreground">{pluralize(group.items.length, 'categoria', 'categorias')}</span>
              </div>

              {group.items.length === 0 ? (
                <div className="rounded-xl border border-dashed px-5 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma categoria de {group.title.toLowerCase()}.{' '}
                  <button onClick={() => openNew(group.type)} className="font-medium text-foreground underline underline-offset-4">Criar uma</button>
                </div>
              ) : (
                <ul className="overflow-hidden rounded-xl border bg-card">
                  {group.items.map((cat) => {
                    const u = usage[cat._id]
                    return (
                      <li key={cat._id} className="group grid grid-cols-[6px_minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 last:border-b-0 sm:px-5">
                        <span className="h-8 w-1.5 rounded-[2px]" style={{ backgroundColor: cat.color ?? FALLBACK_COLOR }} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">{pluralize(u?.count ?? 0, 'transação', 'transações')}</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Money value={u?.total ?? 0} type={cat.type} className="text-sm" />
                          <div className="flex opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => openEdit(cat)} aria-label={`Editar ${cat.name}`}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(cat)} aria-label={`Excluir ${cat.name}`}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave} className="flex flex-col gap-5" noValidate>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Altere o que precisar e salve.' : 'Ex.: Vendas no balcão, Fornecedores, Aluguel.'}
              </DialogDescription>
            </DialogHeader>
            <TypeToggle value={form.type} onChange={(type) => setForm({ ...form, type })} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cat-name">Nome</Label>
              <Input id="cat-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Cor</Label>
              <ColorPicker value={form.color} onChange={(color) => setForm({ ...form, color })} />
            </div>
            {formError && <ErrorNote>{formError}</ErrorNote>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingId ? 'Salvar alterações' : 'Criar categoria'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir a categoria “{deleteTarget?.name}”?</DialogTitle>
            <DialogDescription>As transações dela continuam registradas, mas aparecem como “Sem categoria”. Não dá para desfazer.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir categoria</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
