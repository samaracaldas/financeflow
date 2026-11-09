import { useState, useEffect } from 'react'
import axios from 'axios'
import api from '@/lib/api'
import { IUser } from '@/types'

export function useUser() {
  const [user, setUser] = useState<IUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me')
        setUser(res.data)
      } catch (err) {
        setUser(null)
        if (axios.isAxiosError(err) && err.response?.status === 401) setUnauthorized(true)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  return { user, loading, unauthorized }
}
