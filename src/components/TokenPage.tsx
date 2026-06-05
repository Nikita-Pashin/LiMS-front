import { CSSProperties, FormEvent, useState } from 'react';

type TokenPageProps = {
  initialToken: string;
  isSubmitting: boolean;
  errorMessage: string;
  onSubmitToken: (token: string) => Promise<void>;
};

export function TokenPage({
  initialToken,
  isSubmitting,
  errorMessage,
  onSubmitToken,
}: TokenPageProps) {
  const [token, setToken] = useState(initialToken);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmitToken(token);
  }

  return (
    <section style={cardStyle}>
      <h1 style={titleStyle}>Подключение к Weeek API</h1>
      <p style={textStyle}>
        Введите персональный токен Weeek. Пока токен не сохранен, доступна только эта
        страница.
      </p>

      <form onSubmit={handleSubmit} style={formStyle}>
        <label htmlFor="token" style={labelStyle}>
          API Token
        </label>
        <input
          id="token"
          type="password"
          autoComplete="off"
          placeholder="Bearer token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          style={inputStyle}
          required
        />
        <button type="submit" disabled={isSubmitting} style={buttonStyle}>
          {isSubmitting ? 'Проверка...' : 'Сохранить и продолжить'}
        </button>
      </form>

      {errorMessage ? <p style={errorStyle}>{errorMessage}</p> : null}
    </section>
  );
}

const cardStyle: CSSProperties = {
  width: '100%',
  maxWidth: '680px',
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 16px 40px rgba(2, 6, 23, 0.45)',
};

const titleStyle: CSSProperties = {
  margin: '0 0 12px',
  fontSize: '28px',
  color: '#f8fafc',
};

const textStyle: CSSProperties = {
  margin: '0 0 20px',
  color: '#94a3b8',
  lineHeight: 1.5,
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
};

const labelStyle: CSSProperties = {
  color: '#e2e8f0',
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  width: '100%',
  border: '1px solid #334155',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '14px',
  background: '#020617',
  color: '#f8fafc',
};

const buttonStyle: CSSProperties = {
  marginTop: '6px',
  border: 'none',
  borderRadius: '10px',
  padding: '11px 14px',
  fontSize: '14px',
  fontWeight: 700,
  color: '#e0f2fe',
  background: '#1d4ed8',
  cursor: 'pointer',
};

const errorStyle: CSSProperties = {
  margin: '14px 0 0',
  color: '#fca5a5',
};
