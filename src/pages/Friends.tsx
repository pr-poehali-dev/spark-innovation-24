import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth, FRIENDS_URL, DM_URL, AUTH_URL } from '@/hooks/useAuth'
import Icon from '@/components/ui/icon'

interface Friend {
  user_id: number
  nick: string
  status: string
  incoming: boolean
}

interface DmMsg {
  id: number
  from_user_id: number
  to_user_id: number
  text: string | null
  image_url: string | null
  is_read: boolean
  created_at: string
}

interface SearchResult {
  user_id: number
  nick: string
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

export default function Friends() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [friends, setFriends] = useState<Friend[]>([])
  const [activeChat, setActiveChat] = useState<Friend | null>(null)
  const [messages, setMessages] = useState<DmMsg[]>([])
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState<Record<string, number>>({})
  const [lightbox, setLightbox] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [tab, setTab] = useState<'friends' | 'search'>('friends')

  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) navigate('/auth')
  }, [user, navigate])

  const loadFriends = useCallback(async () => {
    if (!user) return
    const res = await fetch(`${FRIENDS_URL}?action=list&user_id=${user.user_id}`)
    const raw = await res.json()
    const data: Friend[] = typeof raw === 'string' ? JSON.parse(raw) : raw
    setFriends(data)
  }, [user])

  const loadUnread = useCallback(async () => {
    if (!user) return
    const res = await fetch(`${DM_URL}?action=unread&user_id=${user.user_id}`)
    const raw = await res.json()
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw
    setUnread(data)
  }, [user])

  useEffect(() => {
    loadFriends()
    loadUnread()
    const iv = setInterval(() => { loadFriends(); loadUnread() }, 5000)
    return () => clearInterval(iv)
  }, [loadFriends, loadUnread])

  const loadHistory = useCallback(async (friendId: number) => {
    if (!user) return
    const res = await fetch(`${DM_URL}?action=history&from_user_id=${user.user_id}&to_user_id=${friendId}`)
    const raw = await res.json()
    const data: DmMsg[] = typeof raw === 'string' ? JSON.parse(raw) : raw
    setMessages(data)
    setUnread(prev => { const n = { ...prev }; delete n[String(friendId)]; return n })
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [user])

  const openChat = (f: Friend) => {
    setActiveChat(f)
    loadHistory(f.user_id)
    const iv = setInterval(() => loadHistory(f.user_id), 4000)
    return () => clearInterval(iv)
  }

  useEffect(() => {
    if (!activeChat) return
    const iv = setInterval(() => loadHistory(activeChat.user_id), 4000)
    return () => clearInterval(iv)
  }, [activeChat, loadHistory])

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const r = ev.target?.result as string
      setImage(r); setImagePreview(r)
    }
    reader.readAsDataURL(file)
  }

  const sendMessage = async () => {
    if (!user || !activeChat || (!text.trim() && !image)) return
    setSending(true)
    try {
      const res = await fetch(`${DM_URL}?action=send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_user_id: user.user_id, to_user_id: activeChat.user_id, text: text.trim() || null, image: image || undefined }),
      })
      const raw = await res.json()
      const msg: DmMsg = typeof raw === 'string' ? JSON.parse(raw) : raw
      setMessages(prev => [...prev, msg])
      setText(''); setImage(null); setImagePreview(null)
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } finally {
      setSending(false)
    }
  }

  const sendFriendRequest = async (toId: number) => {
    if (!user) return
    await fetch(`${FRIENDS_URL}?action=add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_user_id: user.user_id, to_user_id: toId }),
    })
    await loadFriends()
    setTab('friends')
    setSearchQuery('')
    setSearchResults([])
  }

  const acceptRequest = async (fromId: number) => {
    if (!user) return
    await fetch(`${FRIENDS_URL}?action=accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_user_id: fromId, to_user_id: user.user_id }),
    })
    await loadFriends()
  }

  const declineRequest = async (fromId: number) => {
    if (!user) return
    await fetch(`${FRIENDS_URL}?action=decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_user_id: fromId, to_user_id: user.user_id }),
    })
    await loadFriends()
  }

  const doSearch = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`${AUTH_URL}?action=search&nick=${encodeURIComponent(q)}`)
      const raw = await res.json()
      const data: SearchResult[] = typeof raw === 'string' ? JSON.parse(raw) : raw
      setSearchResults(data.filter(r => r.user_id !== user?.user_id))
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => doSearch(searchQuery), 400)
    return () => clearTimeout(t)
  }, [searchQuery])

  const acceptedFriends = friends.filter(f => f.status === 'accepted')
  const incomingRequests = friends.filter(f => f.status === 'pending' && f.incoming)
  const outgoingRequests = friends.filter(f => f.status === 'pending' && !f.incoming)
  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0)

  if (!user) return null

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link to="/" className="text-neutral-400 hover:text-white transition-colors">
          <Icon name="ArrowLeft" size={18} />
        </Link>
        <div className="flex-1">
          <p className="font-semibold text-sm">Друзья</p>
          <p className="text-xs text-neutral-500">@{user.nick}</p>
        </div>
        {totalUnread > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{totalUnread}</span>
        )}
        <button onClick={() => { logout(); navigate('/') }} className="text-neutral-500 hover:text-white transition-colors">
          <Icon name="LogOut" size={16} />
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`flex flex-col border-r border-white/10 flex-shrink-0 ${activeChat ? 'hidden md:flex w-72' : 'flex w-full md:w-72'}`}>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setTab('friends')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'friends' ? 'text-white border-b-2 border-red-500' : 'text-neutral-400'}`}
            >
              Друзья {incomingRequests.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{incomingRequests.length}</span>}
            </button>
            <button
              onClick={() => setTab('search')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'search' ? 'text-white border-b-2 border-blue-500' : 'text-neutral-400'}`}
            >
              Найти
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {tab === 'search' && (
              <div className="p-3">
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Введи ник игрока..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mb-3"
                  autoFocus
                />
                {searching && <p className="text-center text-neutral-500 text-sm py-4">Поиск...</p>}
                {!searching && searchQuery && searchResults.length === 0 && (
                  <p className="text-center text-neutral-500 text-sm py-4">Никого не найдено</p>
                )}
                {searchResults.map(r => {
                  const alreadyFriend = friends.find(f => f.user_id === r.user_id)
                  return (
                    <div key={r.user_id} className="flex items-center justify-between py-2.5 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                          {r.nick[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{r.nick}</span>
                      </div>
                      {alreadyFriend ? (
                        <span className="text-xs text-neutral-500">
                          {alreadyFriend.status === 'accepted' ? 'Друг' : 'Заявка'}
                        </span>
                      ) : (
                        <Button
                          onClick={() => sendFriendRequest(r.user_id)}
                          size="sm"
                          className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 border-0 text-xs h-7"
                        >
                          + Добавить
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'friends' && (
              <div>
                {/* Входящие заявки */}
                {incomingRequests.length > 0 && (
                  <div className="p-3 border-b border-white/10">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Заявки в друзья</p>
                    {incomingRequests.map(f => (
                      <div key={f.user_id} className="flex items-center gap-2 py-2">
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400 text-xs font-bold flex-shrink-0">
                          {f.nick[0].toUpperCase()}
                        </div>
                        <span className="text-sm flex-1">{f.nick}</span>
                        <button onClick={() => acceptRequest(f.user_id)} className="text-green-400 hover:text-green-300 p-1">
                          <Icon name="Check" size={16} />
                        </button>
                        <button onClick={() => declineRequest(f.user_id)} className="text-red-400 hover:text-red-300 p-1">
                          <Icon name="X" size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Исходящие заявки */}
                {outgoingRequests.length > 0 && (
                  <div className="p-3 border-b border-white/10">
                    <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Отправленные</p>
                    {outgoingRequests.map(f => (
                      <div key={f.user_id} className="flex items-center gap-2 py-2 opacity-50">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                          {f.nick[0].toUpperCase()}
                        </div>
                        <span className="text-sm flex-1">{f.nick}</span>
                        <span className="text-xs text-neutral-500">Ожидание</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Друзья */}
                {acceptedFriends.length === 0 && incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                  <div className="text-center py-12 text-white/20 px-4">
                    <Icon name="Users" size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Нет друзей</p>
                    <p className="text-xs mt-1">Найди игроков во вкладке «Найти»</p>
                  </div>
                )}

                {acceptedFriends.map(f => {
                  const uCount = unread[String(f.user_id)] || 0
                  return (
                    <button
                      key={f.user_id}
                      onClick={() => openChat(f)}
                      className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition-colors border-b border-white/5 ${activeChat?.user_id === f.user_id ? 'bg-white/10' : ''}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold flex-shrink-0">
                        {f.nick[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium flex-1 text-left">{f.nick}</span>
                      {uCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {uCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        {activeChat ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chat header */}
            <div className="border-b border-white/10 px-4 py-3 flex items-center gap-3 flex-shrink-0">
              <button onClick={() => setActiveChat(null)} className="md:hidden text-neutral-400 hover:text-white">
                <Icon name="ArrowLeft" size={18} />
              </button>
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold">
                {activeChat.nick[0].toUpperCase()}
              </div>
              <span className="font-semibold">{activeChat.nick}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {messages.length === 0 && (
                <div className="text-center py-12 text-white/20">
                  <Icon name="MessageCircle" size={36} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Начни разговор!</p>
                </div>
              )}
              {messages.map((m, i) => {
                const isMe = m.from_user_id === user.user_id
                const prevDate = i > 0 ? formatDate(messages[i - 1].created_at) : null
                const curDate = formatDate(m.created_at)
                return (
                  <div key={m.id}>
                    {curDate !== prevDate && (
                      <div className="text-center my-2">
                        <span className="text-xs text-white/25 bg-white/5 px-3 py-1 rounded-full">{curDate}</span>
                      </div>
                    )}
                    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-2xl overflow-hidden ${isMe ? 'bg-red-500/80 rounded-tr-sm' : 'bg-white/10 rounded-tl-sm'}`}>
                          {m.image_url && (
                            <img src={m.image_url} alt="фото" className="max-w-full max-h-56 object-cover cursor-pointer hover:opacity-90" onClick={() => setLightbox(m.image_url!)} />
                          )}
                          {m.text && <p className="px-3 py-2 text-sm whitespace-pre-wrap break-words">{m.text}</p>}
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
              <div className="px-4 py-2 border-t border-white/10 flex items-center gap-3 flex-shrink-0">
                <div className="relative">
                  <img src={imagePreview} alt="preview" className="h-14 w-14 object-cover rounded-lg" />
                  <button onClick={() => { setImage(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="absolute -top-1 -right-1 bg-black rounded-full p-0.5 border border-white/20">
                    <Icon name="X" size={10} />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-white/10 px-4 py-3 flex items-end gap-2 flex-shrink-0">
              <button onClick={() => fileRef.current?.click()} className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-white/5">
                <Icon name="ImagePlus" size={20} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              <Input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Написать..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl"
              />
              <Button
                onClick={sendMessage}
                disabled={sending || (!text.trim() && !image)}
                className="bg-red-500 hover:bg-red-600 text-white border-0 rounded-xl px-3 disabled:opacity-40"
              >
                <Icon name="Send" size={18} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-white/20">
            <div className="text-center">
              <Icon name="MessageCircle" size={48} className="mx-auto mb-3 opacity-20" />
              <p>Выбери друга для переписки</p>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white"><Icon name="X" size={28} /></button>
          <img src={lightbox} alt="full" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </div>
  )
}
