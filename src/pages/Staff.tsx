import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'

const plans = [
  {
    role: 'Модератор',
    color: 'blue',
    icon: 'Shield',
    price: '299 ₽',
    period: '/ месяц',
    features: [
      'Бан и мут игроков',
      'Доступ к логам чата',
      'Тег [MODER] в игре',
      'Роль в Discord',
    ],
  },
  {
    role: 'Администратор',
    color: 'red',
    icon: 'Star',
    price: '599 ₽',
    period: '/ месяц',
    popular: true,
    features: [
      'Все права модератора',
      'Управление игровым миром',
      'Телепорт и слежка',
      'Тег [ADMIN] в игре',
      'Доступ к панели управления',
    ],
  },
  {
    role: 'Старший Админ',
    color: 'blue',
    icon: 'Crown',
    price: '899 ₽',
    period: '/ месяц',
    features: [
      'Все права администратора',
      'Управление персоналом',
      'Настройка сервера',
      'Тег [SADMIN] в игре',
      'Прямая связь с владельцем',
    ],
  },
]

export default function Staff() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm">
          <Icon name="ArrowLeft" size={16} />
          На главную
        </Link>
        <h1 className="text-xl font-bold">
          <span className="text-blue-500">Команда</span> сервера
        </h1>
        <div className="w-28" />
      </header>

      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Купи <span className="text-red-500">админку</span> или <span className="text-blue-500">модерку</span>
          </h2>
          <p className="text-neutral-400 text-lg max-w-xl mx-auto">
            Получи расширенные права, уникальный тег и управляй сервером вместе с нами.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.role}
              className={`relative rounded-2xl border p-6 flex flex-col transition-all hover:scale-[1.02] ${
                plan.popular
                  ? 'border-red-500/60 bg-red-500/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  ПОПУЛЯРНОЕ
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                plan.color === 'red' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
              }`}>
                <Icon name={plan.icon as 'Shield'} size={24} />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{plan.role}</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className={`text-3xl font-bold ${plan.color === 'red' ? 'text-red-400' : 'text-blue-400'}`}>
                  {plan.price}
                </span>
                <span className="text-neutral-500 text-sm pb-1">{plan.period}</span>
              </div>

              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-neutral-300">
                    <Icon name="Check" size={14} className={plan.color === 'red' ? 'text-red-400' : 'text-blue-400'} />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full border-0 font-semibold ${
                  plan.color === 'red'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Купить {plan.role}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-neutral-600 text-sm mt-10">
          Есть вопросы? Напиши нам в Discord или Telegram.
        </p>
      </div>
    </div>
  )
}