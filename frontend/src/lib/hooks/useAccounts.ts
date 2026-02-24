import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { IAccount } from '@/types'

export function useAccounts() {
  const [accounts, setAccounts] = useState<IAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts')
      setAccounts(res.data)
    } catch {
      setError('Erro ao carregar contas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  return { accounts, loading, error, refetch: fetchAccounts }
}