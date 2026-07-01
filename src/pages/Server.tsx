import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Icon from '@/components/ui/icon'

const SERVER_IP = '1234-0JdP.aternos.me:42108'
const API_URL = 'https://functions.poehali.dev/ac71765e-10c4-4696-a2c4-c0676b837874'

const NEWS = [
  { date: '01.07.2026', title: 'Открытие сервера!', text: 'Добро пожаловать на РП СТРАН! Сервер официально открыт для всех игроков.' },
  { date: '01.07.2026', title: 'Добавлен магазин вещей', text: 'Теперь можно покупать и продавать игровые вещи прямо на сайте.' },
  { date: '01.07.2026', title: 'Доступна покупка привилегий', text: 'Открыт раздел с админкой и модеркой. Присоединяйся к команде!' },
]

interface Comment {
  id: number
  author: string
  text: string
  created_at: string
}

export default function Server() {
  const [copied, setCopied] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [author, setAuthor] = useState('')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then(data => setComments(typeof data === 'string' ? JSON.parse(data) : data))
      .catch(() => {})
  }, [])

  const copyIp = () => {
    navigator.clipboard.writeText(SERVER_IP)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendComment = async () => {
    if (!author.trim() || !text.trim()) return
    setSending(true)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: author.trim(), text: text.trim() }),
      })
      const raw = await res.json()
      const comment: Comment = typeof raw === 'string' ? JSON.parse(raw) : raw
      setComments(prev => [comment, ...prev])
      setText('')
    } finally {
      setSending(false)
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} />
          На главную
        </Link>
        <h1 className="text-xl font-bold">
          <span className="text-red-500">РП</span> <span className="text-blue-500">СТРАН</span>
        </h1>
        <div className="w-28" />
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">

        {/* IP блок */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex-1">
            <p className="text-neutral-400 text-sm mb-1">IP-адрес сервера</p>
            <p className="text-2xl md:text-3xl font-mono font-bold text-white">{SERVER_IP}</p>
          </div>
          <Button
            onClick={copyIp}
            size="lg"
            className={`transition-all border-0 font-semibold ${copied ? 'bg-green-600 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
          >
            <Icon name={copied ? 'Check' : 'Copy'} size={18} />
            {copied ? 'Скопировано!' : 'Скопировать IP'}
          </Button>
        </div>

        {/* Новости */}
        <div>
          <h2 className="text-2xl font-bold mb-5">
            Что <span className="text-blue-500">нового</span>
          </h2>
          <div className="space-y-4">
            {NEWS.map((n, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-blue-400 text-xs font-mono">{n.date}</span>
                  <h3 className="font-semibold text-white">{n.title}</h3>
                </div>
                <p className="text-neutral-400 text-sm">{n.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Чат / комментарии */}
        <div>
          <h2 className="text-2xl font-bold mb-5">
            <span className="text-red-500">Чат</span> игроков
          </h2>

          {/* Форма */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <div className="flex gap-3 mb-3">
              <Input
                value={author}
                onChange={e => setAuthor(e.target.value)}
                placeholder="Твой ник"
                maxLength={50}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 w-40"
              />
            </div>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Напиши комментарий..."
              maxLength={500}
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none mb-3"
            />
            <Button
              onClick={sendComment}
              disabled={sending || !author.trim() || !text.trim()}
              className="bg-red-500 hover:bg-red-600 text-white border-0 disabled:opacity-40"
            >
              <Icon name="Send" size={16} />
              {sending ? 'Отправка...' : 'Отправить'}
            </Button>
          </div>

          {/* Список комментариев */}
          {comments.length === 0 ? (
            <div className="text-center py-12 text-white/30">
              <Icon name="MessageCircle" size={44} className="mx-auto mb-3 opacity-30" />
              <p>Пока нет комментариев. Будь первым!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-400 font-semibold text-sm">{c.author}</span>
                    <span className="text-white/20 text-xs">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-neutral-300 text-sm">{c.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
