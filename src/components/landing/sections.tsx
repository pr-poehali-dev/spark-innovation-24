import { Badge } from "@/components/ui/badge"
import type { Section } from "@/types"

export const sections: Section[] = [
  {
    id: 'hero',
    subtitle: <Badge variant="outline" className="text-white border-white">Сервер онлайн</Badge>,
    title: (
      <>
        <span className="text-red-500">РП</span>{' '}
        <span className="text-blue-500">СТРАН</span>
      </>
    ),
    content: 'Погрузись в живой ролевой мир. Строй карьеру, зарабатывай и стань частью истории сервера.',
    buttons: [
      { text: 'Магазин', href: '#', color: 'red' },
      { text: 'Купить админку / модерку', href: '#', color: 'blue' },
    ],
  },
  {
    id: 'shop',
    title: (
      <>
        <span className="text-red-500">Магазин</span> сервера
      </>
    ),
    content: 'Покупай и продавай игровые вещи, донат-предметы и уникальные привилегии. Всё для комфортной игры в одном месте.',
    buttons: [
      { text: 'Перейти в магазин', href: '#', color: 'red' },
    ],
  },
  {
    id: 'staff',
    title: (
      <>
        Стань частью <span className="text-blue-500">команды</span>
      </>
    ),
    content: 'Хочешь больше возможностей? Купи админку или модерку и помогай развивать сервер, следи за порядком и получай уважение игроков.',
    buttons: [
      { text: 'Купить админку / модерку', href: '#', color: 'blue' },
    ],
  },
  {
    id: 'features',
    title: (
      <>
        Почему <span className="text-red-500">мы</span>?
      </>
    ),
    content: 'Стабильный онлайн, честная администрация, продуманная экономика и активное сообщество. Здесь каждый найдёт свою роль.',
  },
  {
    id: 'join',
    title: (
      <>
        Заходи <span className="text-blue-500">прямо</span> <span className="text-red-500">сейчас</span>
      </>
    ),
    content: 'Твоя история начинается здесь. Присоединяйся к РП СТРАН и стань легендой сервера.',
    buttons: [
      { text: 'Магазин', href: '#', color: 'red' },
      { text: 'Купить админку / модерку', href: '#', color: 'blue' },
    ],
  },
]
