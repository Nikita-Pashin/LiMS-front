import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

const palette = [
  ['Background', '#0F1115', '#0f1115', undefined],
  ['Surface', '#181C23', '#181c23', undefined],
  ['Card', '#252B36', '#252b36', undefined],
  ['Accent', '#18C37E', '#18c37e', '#07130d'],
  ['Primary text', '#F5F7FA', '#f5f7fa', '#151922'],
  ['Secondary text', '#A5ACB8', '#a5acb8', '#151922'],
  ['Border', '#343B49', '#343b49', undefined],
  ['Light theme bg', '#F4F6F8', '#f4f6f8', '#151922'],
  ['Success', '#3CCB7F', '#3ccb7f', '#07130d'],
  ['Warning', '#D8A545', '#d8a545', '#2a1d05'],
  ['Error', '#E05C5C', '#e05c5c', '#230808'],
  ['Info', '#6EA8FE', '#6ea8fe', '#06101f'],
] as const;

const meta = {
  title: 'LiMS Design System/Overview',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

function StoryShell({ children }: { children: React.ReactNode }) {
  return <div className="lms-story">{children}</div>;
}

function Section({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <section className="lms-section">
      <div className="lms-section-title">
        <h2>{title}</h2>
        <p>{copy}</p>
      </div>
      <div className="lms-canvas-grid">{children}</div>
    </section>
  );
}

function Panel({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="lms-panel">
      <div className="lms-panel-title">
        <h3>{title}</h3>
        {caption ? <span className="lms-caption">{caption}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Button({
  children,
  variant,
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  return (
    <button className={['lms-btn', variant].filter(Boolean).join(' ')} disabled={disabled} type="button">
      {children}
    </button>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: 'done' | 'warn' | 'info' | 'error';
}) {
  return <span className={['lms-badge', tone].filter(Boolean).join(' ')}>{children}</span>;
}

function PaletteGrid() {
  return (
    <div className="lms-grid-4">
      {palette.map(([name, value, tone, color]) => (
        <div
          className={value === '#F4F6F8' ? 'lms-swatch light' : 'lms-swatch'}
          key={name}
          style={{ '--tone': tone, color } as React.CSSProperties}
        >
          <span>{name}</span>
          <code>{value}</code>
        </div>
      ))}
    </div>
  );
}

function Typography() {
  return (
    <div className="lms-type-sample">
      <p className="lms-display-sample">Small actions. Every day. For years.</p>
      <p className="lms-body-sample">
        LiMS помогает видеть следующий спокойный шаг, удерживать ритм и понимать, где жизнь движется вперед без лишнего шума.
      </p>
      <div className="lms-scale">
        <div className="lms-scale-row">
          <b>Display</b>
          <span style={{ fontSize: 34, lineHeight: 1.1, letterSpacing: '-.03em' }}>Фокус дня</span>
          <span>48-86</span>
        </div>
        <div className="lms-scale-row">
          <b>H2</b>
          <span style={{ fontSize: 28, lineHeight: 1.15, letterSpacing: '-.02em' }}>Система областей</span>
          <span>24-32</span>
        </div>
        <div className="lms-scale-row">
          <b>Body</b>
          <span>Последовательность важнее интенсивности.</span>
          <span>15-17</span>
        </div>
        <div className="lms-scale-row">
          <b>Label</b>
          <span style={{ letterSpacing: '.08em', textTransform: 'uppercase' }}>Сегодня</span>
          <span>11-12</span>
        </div>
      </div>
    </div>
  );
}

function ControlsDemo() {
  const [switchOn, setSwitchOn] = useState(true);

  return (
    <div className="lms-grid-2">
      <Panel caption="default / hover / disabled" title="Кнопки">
        <div className="lms-stack">
          <div className="lms-row">
            <Button variant="primary">
              <span aria-hidden="true" className="lms-icon plus" />
              Отметить шаг
            </Button>
            <Button>План на день</Button>
            <Button variant="ghost">Отложить</Button>
          </div>
          <div className="lms-row">
            <Button variant="danger">Сбросить</Button>
            <Button disabled>Недоступно</Button>
          </div>
        </div>
      </Panel>
      <Panel caption="checkbox / radio / switch" title="Выбор">
        <div className="lms-stack">
          <label className="lms-choice">
            <span className="lms-box on" />
            Утренний шаг завершен
          </label>
          <label className="lms-choice">
            <span className="lms-box" />
            Вечерняя рефлексия
          </label>
          <label className="lms-choice">
            <span className="lms-radio on" />
            Мягкий режим
          </label>
          <label className="lms-choice">
            <span className="lms-radio" />
            Строгий режим
          </label>
          <div className="lms-row">
            <span className="lms-label">Напоминания</span>
            <button
              aria-label={switchOn ? 'Включено' : 'Выключено'}
              className={switchOn ? 'lms-switch on' : 'lms-switch'}
              onClick={() => setSwitchOn((value) => !value)}
              type="button"
            />
          </div>
        </div>
      </Panel>
    </div>
  );
}

function FormsDemo() {
  return (
    <div className="lms-grid-2">
      <div className="lms-panel lms-stack">
        <div className="lms-field-group">
          <label htmlFor="focus">Фокус дня</label>
          <input className="lms-input" id="focus" defaultValue="30 минут глубокого чтения" />
          <span className="lms-help">Один конкретный шаг, который можно завершить сегодня.</span>
        </div>
        <div className="lms-field-group">
          <label htmlFor="area">Область</label>
          <select className="lms-select" id="area">
            <option>Здоровье</option>
            <option>Работа</option>
            <option>Отношения</option>
          </select>
        </div>
      </div>
      <div className="lms-panel lms-stack">
        <div className="lms-field-group">
          <label htmlFor="reflection">Короткая рефлексия</label>
          <textarea className="lms-textarea" defaultValue="Сегодня важно сохранить ритм, а не увеличивать нагрузку." id="reflection" />
        </div>
        <div className="lms-row">
          <span className="lms-chip active">Активно</span>
          <span className="lms-chip">Черновик</span>
          <span className="lms-chip">Архив</span>
        </div>
      </div>
    </div>
  );
}

function NavigationDemo() {
  const tabCopy = {
    day: 'День показывает один следующий шаг и текущую дисциплину без перегруза.',
    week: 'Неделя помогает увидеть ритм и не делать выводы по одному неудачному дню.',
    year: 'Год показывает долгую траекторию без давления и соревновательных механик.',
  };
  const [tab, setTab] = useState<keyof typeof tabCopy>('day');

  return (
    <div className="lms-grid-2">
      <Panel caption="рабочее состояние" title="Tabs">
        <div aria-label="Период" className="lms-tabs" role="tablist">
          {Object.entries({ day: 'День', week: 'Неделя', year: 'Год' }).map(([key, label]) => (
            <button
              className={tab === key ? 'lms-tab active' : 'lms-tab'}
              key={key}
              onClick={() => setTab(key as keyof typeof tabCopy)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <p className="lms-body-sample" style={{ marginTop: 16 }}>{tabCopy[tab]}</p>
      </Panel>
      <Panel caption="active item" title="Sidebar">
        <nav aria-label="Демо навигации" className="lms-nav-demo">
          <a className="lms-nav-item active" href="#today">
            <span>Сегодня</span>
            <Badge tone="done">72%</Badge>
          </a>
          <a className="lms-nav-item" href="#areas">
            <span>Области жизни</span>
            <span>8</span>
          </a>
          <a className="lms-nav-item" href="#journal">
            <span>Журнал</span>
            <span>24</span>
          </a>
          <a className="lms-nav-item" href="#system">
            <span>Система</span>
            <span />
          </a>
        </nav>
      </Panel>
    </div>
  );
}

function CardsDemo() {
  return (
    <div className="lms-grid-3">
      <article className="lms-product-card">
        <div>
          <Badge tone="done">Сегодня</Badge>
          <h3 style={{ marginTop: 14 }}>Следующий шаг</h3>
          <p>Закрыть один шаг по здоровью до 21:00, без расширения плана.</p>
        </div>
        <div aria-label="Прогресс 72%" className="lms-progress">
          <span style={{ '--value': '72%' } as React.CSSProperties} />
        </div>
      </article>
      <article className="lms-product-card">
        <div>
          <Badge tone="info">Область</Badge>
          <h3 style={{ marginTop: 14 }}>Глубокая работа</h3>
          <p>Два спокойных блока в неделю. Текущий ритм устойчив.</p>
        </div>
        <div className="lms-row">
          <span className="lms-avatar">NP</span>
          <span className="lms-caption">ответственный ритм</span>
        </div>
      </article>
      <article className="lms-product-card">
        <div>
          <Badge tone="warn">Внимание</Badge>
          <h3 style={{ marginTop: 14 }}>Сон</h3>
          <p>Три поздних отбоя подряд. Система предлагает снизить вечернюю нагрузку.</p>
        </div>
        <Button variant="ghost">Скорректировать</Button>
      </article>
    </div>
  );
}

function DataDemo() {
  const [doneOnly, setDoneOnly] = useState(false);
  const rows = [
    ['done', 'Утренняя прогулка', 'Здоровье', <Badge tone="done">Завершено</Badge>, '08:20'],
    ['open', 'Финальный обзор дня', 'Рефлексия', <span className="lms-chip">Открыто</span>, '21:00'],
    ['done', 'Фокус-блок чтения', 'Развитие', <Badge tone="done">Завершено</Badge>, '18:10'],
  ] as const;

  return (
    <div className="lms-canvas-grid">
      <div className="lms-grid-2">
        <Panel caption="completed days" title="Недельный ритм">
          <div aria-label="График ритма недели" className="lms-mini-chart">
            {[62, 78, 42, 88, 36, 70, 48].map((height, index) => (
              <span
                className={index === 2 || index === 4 || index === 6 ? 'lms-bar' : 'lms-bar done'}
                key={height + index}
                style={{ '--h': `${height}%` } as React.CSSProperties}
              />
            ))}
          </div>
        </Panel>
        <Panel caption="month view" title="Календарь">
          <div aria-label="Календарь" className="lms-calendar">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => <span className="lms-day label" key={day}>{day}</span>)}
            {Array.from({ length: 14 }, (_, index) => index + 1).map((day) => {
              const className = ['lms-day', day === 5 ? 'active' : '', [2, 3, 8, 10, 13].includes(day) ? 'marked' : '']
                .filter(Boolean)
                .join(' ');
              return <span className={className} key={day}>{day}</span>;
            })}
          </div>
        </Panel>
      </div>
      <Panel title="Журнал действий">
        <div className="lms-panel-title">
          <span className="lms-caption">action log</span>
          <Button variant="ghost">{doneOnly ? 'Показать все' : 'Показать завершенные'}</Button>
        </div>
        <button className="lms-btn ghost" onClick={() => setDoneOnly((value) => !value)} type="button">
          {doneOnly ? 'Фильтр включен' : 'Фильтр выключен'}
        </button>
        <table className="lms-table" style={{ marginTop: 14 }}>
          <thead>
            <tr>
              <th>Шаг</th>
              <th>Область</th>
              <th>Статус</th>
              <th>Время</th>
            </tr>
          </thead>
          <tbody>
            {rows.filter(([status]) => !doneOnly || status === 'done').map(([, step, area, status, time]) => (
              <tr key={step}>
                <td>{step}</td>
                <td>{area}</td>
                <td>{status}</td>
                <td>{time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function FeedbackDemo() {
  const [toastVisible, setToastVisible] = useState(false);

  return (
    <div className="lms-grid-2">
      <div className="lms-panel">
        <div className="lms-dialog">
          <h3>Завершить день?</h3>
          <p>LiMS сохранит выполненные шаги и предложит один спокойный фокус на завтра.</p>
          <div className="lms-row">
            <button className="lms-btn primary" onClick={() => setToastVisible(true)} type="button">Завершить</button>
            <Button variant="ghost">Оставить открытым</Button>
          </div>
        </div>
      </div>
      <div className="lms-panel lms-stack">
        <div className={toastVisible ? 'lms-toast' : 'lms-toast hidden'}>
          <span className="lms-dot" />
          <span>День сохранен. Завтра начнется с одного шага.</span>
        </div>
        <div className="lms-tooltip-wrap">
          <Button>Показать подсказку</Button>
          <span className="lms-tooltip">Подсказки короткие и появляются только рядом с действием.</span>
        </div>
        <div className="lms-row">
          <Badge tone="done">Success</Badge>
          <Badge tone="warn">Warning</Badge>
          <Badge tone="info">Info</Badge>
          <Badge tone="error">Error</Badge>
        </div>
      </div>
    </div>
  );
}

function StatesDemo() {
  return (
    <div className="lms-grid-3">
      <div className="lms-state">
        <div>
          <h3>Пока нет записей</h3>
          <p>Добавьте первый маленький шаг, чтобы система начала видеть ритм.</p>
        </div>
      </div>
      <div className="lms-state">
        <div>
          <div className="lms-spinner" />
          <h3>Сохранение</h3>
          <p>LiMS обновляет день и не меняет план без подтверждения.</p>
        </div>
      </div>
      <div className="lms-state">
        <div className="lms-skeleton">
          <span className="lms-sk" style={{ width: '72%' }} />
          <span className="lms-sk" style={{ width: '100%' }} />
          <span className="lms-sk" style={{ width: '84%' }} />
          <span className="lms-sk" style={{ width: '56%' }} />
        </div>
      </div>
    </div>
  );
}

function MotionDemo() {
  return (
    <div className="lms-grid-3">
      <div className="lms-motion-card">
        <div className="lms-motion-demo" />
        <h3>Soft settle</h3>
        <p className="lms-body-sample">Translate 8px, opacity 86-100%, без bounce.</p>
        <div className="lms-token-line">
          <span>duration</span>
          <span>180-240ms</span>
        </div>
      </div>
      <div className="lms-motion-card">
        <h3>Focus ring</h3>
        <input className="lms-input" defaultValue="Активное поле" />
        <p className="lms-body-sample">Акцент появляется только на текущем действии.</p>
        <div className="lms-token-line">
          <span>easing</span>
          <span>cubic-bezier(.2,.8,.2,1)</span>
        </div>
      </div>
      <div className="lms-motion-card">
        <h3>Layer change</h3>
        <div className="lms-progress">
          <span style={{ '--value': '64%' } as React.CSSProperties} />
        </div>
        <p className="lms-body-sample">Прогресс меняется плавно, без celebratory эффектов.</p>
        <div className="lms-token-line">
          <span>distance</span>
          <span>4-8px</span>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <>
      <header className="lms-top">
        <div aria-label="LiMS" className="lms-brand">
          <span aria-hidden="true" className="lms-mark" />
          <span>
            <strong>LiMS</strong>
            <span>Life Management System</span>
          </span>
        </div>
        <a className="lms-back" href="#foundations">К системе</a>
      </header>
      <section className="lms-hero">
        <div>
          <p className="lms-eyebrow">Design system canvas</p>
          <h1 className="lms-title">Палитра и компоненты LiMS.</h1>
          <p className="lms-lead">
            Единый layout для импорта в Figma: фундаментальные токены, типографика, контролы, формы, навигация,
            карточки, данные, feedback-состояния и motion-принципы в одной системной сетке.
          </p>
        </div>
        <aside aria-label="Правила системы" className="lms-system-card">
          <h2>Позиция интерфейса</h2>
          <div className="lms-rule"><b>Тон</b><span>спокойный, премиальный, без мотивационного шума</span></div>
          <div className="lms-rule"><b>Акцент</b><span>emerald только для активного прогресса и завершения</span></div>
          <div className="lms-rule"><b>Форма</b><span>12-18px radii, тонкие границы, мягкая глубина</span></div>
          <div className="lms-rule"><b>Движение</b><span>fade/translate, natural easing, без bounce-эффектов</span></div>
        </aside>
      </section>
    </>
  );
}

export const FullCanvas: Story = {
  name: 'Full design system canvas',
  render: () => (
    <div className="lms-canvas">
      <div className="lms-page">
        <Hero />
        <Section copy="Темная основа доминирует. Зеленый не декорирует экран, а сообщает о прогрессе." title="Палитра">
          <PaletteGrid />
        </Section>
        <Section copy="Иерархия строится размером, весом и интервалом, а не избытком цвета." title="Типографика">
          <Typography />
        </Section>
        <Section copy="Primary появляется только там, где пользователь завершает или подтверждает прогресс." title="Контролы">
          <ControlsDemo />
        </Section>
        <Section copy="Поля не соревнуются с контентом: темная подложка, понятный label, короткая помощь." title="Формы">
          <FormsDemo />
        </Section>
        <Section copy="Структура похожа на операционную систему: день, области, журнал, настройки." title="Навигация">
          <NavigationDemo />
        </Section>
        <Section copy="Карточки описывают систему жизни: фокус, область, прогресс, статус." title="Карточки">
          <CardsDemo />
        </Section>
        <Section copy="Таблицы, графики и календарь показывают поведение без выдуманных метрик." title="Данные">
          <DataDemo />
        </Section>
        <Section copy="Диалоги, toast и tooltip подтверждают действие, но не превращают прогресс в игру." title="Feedback">
          <FeedbackDemo />
        </Section>
        <Section copy="Пустое, загрузочное и skeleton-состояния сохраняют спокойную интонацию." title="Состояния">
          <StatesDemo />
        </Section>
        <Section copy="Движение поддерживает ощущение контроля: коротко, мягко, без вознаграждающих вспышек." title="Motion">
          <MotionDemo />
        </Section>
      </div>
    </div>
  ),
};

export const Foundations: Story = {
  render: () => (
    <StoryShell>
      <div className="lms-canvas-grid">
        <PaletteGrid />
        <Typography />
      </div>
    </StoryShell>
  ),
};

export const Controls: Story = {
  render: () => (
    <StoryShell>
      <ControlsDemo />
    </StoryShell>
  ),
};

export const Forms: Story = {
  render: () => (
    <StoryShell>
      <FormsDemo />
    </StoryShell>
  ),
};

export const Navigation: Story = {
  render: () => (
    <StoryShell>
      <NavigationDemo />
    </StoryShell>
  ),
};

export const Cards: Story = {
  render: () => (
    <StoryShell>
      <CardsDemo />
    </StoryShell>
  ),
};

export const Data: Story = {
  render: () => (
    <StoryShell>
      <DataDemo />
    </StoryShell>
  ),
};

export const Feedback: Story = {
  render: () => (
    <StoryShell>
      <FeedbackDemo />
    </StoryShell>
  ),
};

export const States: Story = {
  render: () => (
    <StoryShell>
      <StatesDemo />
    </StoryShell>
  ),
};

export const Motion: Story = {
  render: () => (
    <StoryShell>
      <MotionDemo />
    </StoryShell>
  ),
};
