import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Icon from '@/components/ui/icon'
import { useAuth } from '@/hooks/useAuth'

const API_URL = 'https://functions.poehali.dev/5347ac9f-cd87-411b-8e28-8c15aa58c188'
const NICK_KEY = 'rp_stran_chat_nick'

interface Message {
  id: number
  author: string
  text: string | null
  image_url: string | null
  created_at: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

export default function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [nick, setNick] = useState(() => user?.nick || localStorage.getItem(NICK_KEY) || '')
  const [nickSet, setNickSet] = useState(() => !!(user?.nick || localStorage.getItem(NICK_KEY)))
  const [nickInput, setNickInput] = useState('')
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const lastIdRef = useRef<number>(0)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(API_URL)
      const raw = await res.json()
      const data: Message[] = typeof raw === 'string' ? JSON.parse(raw) : raw
      const sorted = [...data].reverse()
      setMessages(sorted)
      if (sorted.length > 0) {
        const newLastId = sorted[sorted.length - 1].id
        if (newLastId !== lastIdRef.current) {
          lastIdRef.current = newLastId
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 4000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setImage(result)
      setImagePreview(result)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleNickSave = () => {
    const n = nickInput.trim().slice(0, 30)
    if (!n) return
    localStorage.setItem(NICK_KEY, n)
    setNick(n)
    setNickSet(true)
  }

  const handleSend = async () => {
    if (!text.trim() && !image) return
    setSending(true)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: nick, text: text.trim() || null, image: image || undefined }),
      })
      const raw = await res.json()
      const msg: Message = typeof raw === 'string' ? JSON.parse(raw) : raw
      setMessages(prev => [...prev, msg])
      setText('')
      setImage(null)
      setImagePreview(null)
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Экран выбора ника
  if (!nickSet) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <Icon name="MessageCircle" size={32} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Чат игроков</h1>
            <p className="text-neutral-400 text-sm">Введи свой ник чтобы войти в чат</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <label className="text-sm text-neutral-400 mb-2 block">Твой игровой ник</label>
            <Input
              value={nickInput}
              onChange={e => setNickInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNickSave()}
              placeholder="Например: ProGamer228"
              maxLength={30}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mb-4"
              autoFocus
            />
            <Button
              onClick={handleNickSave}
              disabled={!nickInput.trim()}
              className="w-full bg-red-500 hover:bg-red-600 text-white border-0 disabled:opacity-40"
            >
              Войти в чат
            </Button>
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

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link to="/" className="text-neutral-400 hover:text-white transition-colors">
          <Icon name="ArrowLeft" size={18} />
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
            <Icon name="MessageCircle" size={16} className="text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">Чат РП СТРАН</p>
            <p className="text-xs text-neutral-500">Обновляется автоматически</p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.removeItem(NICK_KEY); setNickSet(false); setNick('') }}
          className="text-neutral-500 hover:text-white transition-colors text-xs flex items-center gap-1"
        >
          <Icon name="LogOut" size={14} />
          {nick}
        </button>
      </header>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <Icon name="MessageCircle" size={44} className="mx-auto mb-3 opacity-30" />
            <p>Пока нет сообщений</p>
            <p className="text-sm mt-1">Напиши первым!</p>
          </div>
        )}
        {messages.map((m, i) => {
          const isMe = m.author === nick
          const prevDate = i > 0 ? formatDate(messages[i - 1].created_at) : null
          const curDate = formatDate(m.created_at)
          const showDate = curDate !== prevDate

          return (
            <div key={m.id}>
              {showDate && (
                <div className="text-center my-2">
                  <span className="text-xs text-white/25 bg-white/5 px-3 py-1 rounded-full">{curDate}</span>
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!isMe && (
                    <span className="text-xs text-red-400 font-semibold px-1">{m.author}</span>
                  )}
                  <div className={`rounded-2xl overflow-hidden ${
                    isMe
                      ? 'bg-red-500/80 text-white rounded-tr-sm'
                      : 'bg-white/10 text-white rounded-tl-sm'
                  }`}>
                    {m.image_url && (
                      <img
                        src={m.image_url}
                        alt="фото"
                        className="max-w-full max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setLightbox(m.image_url!)}
                      />
                    )}
                    {m.text && (
                      <p className="px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                    )}
                  </div>
                  <span className="text-xs text-white/25 px-1">{formatTime(m.created_at)}</span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 py-2 border-t border-white/10 flex items-center gap-3 bg-white/3 flex-shrink-0">
          <div className="relative">
            <img src={imagePreview} alt="preview" className="h-16 w-16 object-cover rounded-lg" />
            <button
              onClick={removeImage}
              className="absolute -top-1 -right-1 bg-black rounded-full p-0.5 border border-white/20 hover:text-red-400"
            >
              <Icon name="X" size={12} />
            </button>
          </div>
          <span className="text-xs text-neutral-400">Фото прикреплено</span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 px-4 py-3 flex items-end gap-2 flex-shrink-0">
        <button
          onClick={() => fileRef.current?.click()}
          className="text-neutral-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5 flex-shrink-0"
        >
          <Icon name="ImagePlus" size={20} />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Написать сообщение..."
          className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
        />
        <Button
          onClick={handleSend}
          disabled={sending || (!text.trim() && !image)}
          className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl px-3 disabled:opacity-40 flex-shrink-0"
        >
          <Icon name="Send" size={18} />
        </Button>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 text-white/60 hover:text-white">
            <Icon name="X" size={28} />
          </button>
          <img src={lightbox} alt="fullsize" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  )
}