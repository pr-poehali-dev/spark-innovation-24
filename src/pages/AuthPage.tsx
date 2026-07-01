import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import Icon from '@/components/ui/icon'

export default function AuthPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [nick, setNick] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!nick.trim() || !password.trim()) return
    setLoading(true)
    setError('')
    const err = mode === 'login'
      ? await login(nick.trim(), password)
      : await register(nick.trim(), password)
    setLoading(false)
    if (err) { setError(err); return }
    navigate('/friends')
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Icon name="Users" size={32} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-1">
            {mode === 'login' ? 'Войти в аккаунт' : 'Создать аккаунт'}
          </h1>
          <p className="text-neutral-400 text-sm">
            {mode === 'login' ? 'Чтобы добавлять друзей и писать в личку' : 'Нужен аккаунт для личных сообщений'}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-sm text-neutral-400 mb-1 block">Игровой ник</label>
            <Input
              value={nick}
              onChange={e => setNick(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="ProGamer228"
              maxLength={30}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm text-neutral-400 mb-1 block">Пароль</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Минимум 4 символа"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading || !nick.trim() || !password.trim()}
            className="w-full bg-red-500 hover:bg-red-600 text-white border-0 disabled:opacity-40"
          >
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Button>

          <button
            onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError('') }}
            className="w-full text-center text-sm text-neutral-400 hover:text-white transition-colors"
          >
            {mode === 'login' ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-neutral-500 hover:text-white text-sm transition-colors">
            ← На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
