import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { ITransaction } from '@/types'

export function useTransactions() {
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions')
      setTransactions(res.data)
    } catch {
      setError('Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  return { transactions, loading, error, refetch: fetchTransactions }
}