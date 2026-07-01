import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Icon from '@/components/ui/icon'

interface Listing {
  id: number
  title: string
  price: string
  description: string
  image: string | null
}

export default function Shop() {
  const [listings, setListings] = useState<Listing[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setImage(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleAdd = () => {
    if (!title.trim() || !price.trim()) return
    setListings(prev => [{
      id: Date.now(),
      title,
      price,
      description,
      image,
    }, ...prev])
    setTitle('')
    setPrice('')
    setDescription('')
    setImage(null)
    setShowForm(false)
  }

  const handleDelete = (id: number) => {
    setListings(prev => prev.filter(l => l.id !== id))
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
          <span className="text-red-500">Магазин</span> игровых вещей
        </h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-red-500 hover:bg-red-600 text-white border-0"
          size="sm"
        >
          <Icon name="Plus" size={16} />
          Продать вещь
        </Button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Форма добавления */}
        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">
            <h2 className="text-lg font-semibold mb-6 text-white">Новое объявление</h2>

            {/* Загрузка фото */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/20 rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer hover:border-red-500/50 transition-colors mb-5 overflow-hidden"
            >
              {image ? (
                <img src={image} alt="preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <Icon name="ImagePlus" size={36} className="text-white/30 mb-2" />
                  <span className="text-white/40 text-sm">Нажми чтобы загрузить фото</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm text-neutral-400 mb-1 block">Название вещи</label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Например: АК-47 Редкий скин"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div>
                <label className="text-sm text-neutral-400 mb-1 block">Цена</label>
                <Input
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="Например: 500 руб."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="text-sm text-neutral-400 mb-1 block">Описание (необязательно)</label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Состояние, условия обмена..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleAdd} className="bg-red-500 hover:bg-red-600 text-white border-0">
                Разместить объявление
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Отмена
              </Button>
            </div>
          </div>
        )}

        {/* Список объявлений */}
        {listings.length === 0 && !showForm && (
          <div className="text-center py-24 text-white/30">
            <Icon name="ShoppingBag" size={56} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">Пока нет объявлений</p>
            <p className="text-sm mt-1">Стань первым — продай игровую вещь</p>
            <Button
              onClick={() => setShowForm(true)}
              className="mt-6 bg-red-500 hover:bg-red-600 text-white border-0"
            >
              Разместить объявление
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {listings.map(l => (
            <div key={l.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-red-500/40 transition-colors group">
              <div className="h-44 bg-white/5 relative overflow-hidden">
                {l.image
                  ? <img src={l.image} alt={l.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-white/20"><Icon name="Image" size={40} /></div>
                }
                <button
                  onClick={() => handleDelete(l.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-1 hover:text-red-400 text-white"
                >
                  <Icon name="X" size={14} />
                </button>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-white text-sm leading-tight">{l.title}</h3>
                  <span className="text-red-400 font-bold text-sm whitespace-nowrap">{l.price}</span>
                </div>
                {l.description && <p className="text-white/40 text-xs mt-2 line-clamp-2">{l.description}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
