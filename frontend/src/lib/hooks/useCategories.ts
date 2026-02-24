import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { ICategory } from '@/types'

export function useCategories() {
  const [categories, setCategories] = useState<ICategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data)
    } catch {
      setError('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return { categories, loading, error, refetch: fetchCategories }
}