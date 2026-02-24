import { useState, useEffect } from 'react'
import api from '@/lib/api'
import { IUser } from '@/types'

export function useUser() {
  const [user, setUser] = useState<IUser | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me')
        setUser(res.data)
      } catch {
        setUser(null)
      }
    }
    fetchUser()
  }, [])

  return { user }
}