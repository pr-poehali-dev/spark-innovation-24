import { useState, useCallback } from 'react'

const AUTH_KEY = 'rp_stran_user'

export const AUTH_URL = 'https://functions.poehali.dev/b4b15c2b-9af3-420a-bac7-16449cc4d3a4'
export const FRIENDS_URL = 'https://functions.poehali.dev/cbf89a6a-47ee-485a-9f7c-f3024c2b2ba3'
export const DM_URL = 'https://functions.poehali.dev/ac196711-e371-44a6-a820-58850bb99ed5'

export interface AuthUser {
  user_id: number
  nick: string
  token: string
}

function loadUser(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(loadUser)

  const login = useCallback(async (nick: string, password: string): Promise<string | null> => {
    const res = await fetch(`${AUTH_URL}?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, password }),
    })
    const raw = await res.json()
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!res.ok) return data.error || 'Ошибка входа'
    localStorage.setItem(AUTH_KEY, JSON.stringify(data))
    setUser(data)
    return null
  }, [])

  const register = useCallback(async (nick: string, password: string): Promise<string | null> => {
    const res = await fetch(`${AUTH_URL}?action=register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick, password }),
    })
    const raw = await res.json()
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!res.ok) {
      if (data.error === 'nick_taken') return 'Этот ник уже занят'
      if (data.error === 'password_short') return 'Пароль минимум 4 символа'
      return data.error || 'Ошибка регистрации'
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(data))
    setUser(data)
    return null
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }, [])

  return { user, login, register, logout }
}
