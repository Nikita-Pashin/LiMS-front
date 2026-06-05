export function WelcomeCard() {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: '560px',
        background: '#ffffff',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          padding: '6px 12px',
          borderRadius: '999px',
          background: '#e8f0ff',
          color: '#1d4ed8',
          fontSize: '14px',
          fontWeight: 700,
          marginBottom: '16px',
        }}
      >
        Personal OS
      </div>

      <h1
        style={{
          margin: '0 0 12px',
          fontSize: '32px',
          lineHeight: 1.1,
          color: '#0f172a',
        }}
      >
        Базовый frontend-проект готов
      </h1>

      <p
        style={{
          margin: 0,
          fontSize: '16px',
          lineHeight: 1.6,
          color: '#475569',
        }}
      >
        Следующим шагом можем добавить модели, Zustand store и первый dashboard
        для личной системы управления задачами и направлениями.
      </p>
    </div>
  );
}
