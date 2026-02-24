'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useCategories } from '@/lib/hooks'
import { ICategory } from '@/types'
import api from '@/lib/api'

const COLOR_OPTIONS = [
  '#2ba84a', '#17a2b8', '#6f42c1', '#dc3545',
  '#e83e8c', '#fd7e14', '#6c757d', '#795548',
  '#007bff', '#28a745', '#ffc107', '#20c997',
]

interface CategoryFormData {
  name: string
  type: 'income' | 'expense'
  color: string
}

const EMPTY_FORM: CategoryFormData = {
  name: '',
  type: 'income',
  color: COLOR_OPTIONS[0],
}

export default function CategoriesPage() {
  const { categories, loading, refetch } = useCategories()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<CategoryFormData>(EMPTY_FORM)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [error, setError] = useState('')

  const incomeCategories = categories.filter((c) => (c as ICategory & { type?: string }).type === 'income')
  const expenseCategories = categories.filter((c) => (c as ICategory & { type?: string }).type === 'expense')
  const uncategorized = categories.filter((c) => !(c as ICategory & { type?: string }).type)

  const openNew = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setIsDialogOpen(true)
  }

  const openEdit = (cat: ICategory) => {
    setEditingId(cat._id)
    setForm({
      name: cat.name,
      type: (cat as ICategory & { type?: 'income' | 'expense' }).type ?? 'income',
      color: (cat as ICategory & { color?: string }).color ?? COLOR_OPTIONS[0],
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setError('')
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, form)
      } else {
        await api.post('/categories', form)
      }
      setIsDialogOpen(false)
      setEditingId(null)
      setForm(EMPTY_FORM)
      refetch()
    } catch {
      setError('Erro ao salvar categoria')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`)
      setDeleteConfirm(null)
      refetch()
    } catch {
      setError('Erro ao deletar categoria')
    }
  }

  const renderCategoryList = (cats: ICategory[], title: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Tag className="w-4 h-4" />
          {title}
          <Badge variant="secondary" className="ml-auto">{cats.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria cadastrada.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {cats.map((cat) => (
              <div key={cat._id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: (cat as ICategory & { color?: string }).color ?? '#6c757d' }}
                  />
                  <p className="text-sm font-medium text-foreground">{cat.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(cat._id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) return <p className="text-muted-foreground">Carregando...</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">Organize suas transações com categorias personalizadas</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderCategoryList(incomeCategories, 'Receitas')}
        {renderCategoryList(expenseCategories, 'Despesas')}
      </div>

      {uncategorized.length > 0 && renderCategoryList(uncategorized, 'Sem tipo')}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Atualize os dados da categoria.' : 'Crie uma nova categoria para suas transações.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Marketing"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'income' | 'expense' })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
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
            <DialogTitle>Excluir categoria?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita.
            </DialogDescription>
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