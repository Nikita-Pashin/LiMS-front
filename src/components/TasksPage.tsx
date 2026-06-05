import { CSSProperties } from 'react';
import { TaskItem } from '../lib/weeekApi';

type TasksPageProps = {
  tasks: TaskItem[];
  isLoading: boolean;
  errorMessage: string;
  selectedDateKey: string;
  onDateKeyChange: (dateKey: string) => void;
  showCompletedTasks: boolean;
  onShowCompletedTasksChange: (value: boolean) => void;
  onReload: () => Promise<void>;
  onResetToken: () => void;
  onTaskCompleteChange: (taskId: string, completed: boolean) => void;
};

export function TasksPage({
  tasks,
  isLoading,
  errorMessage,
  selectedDateKey,
  onDateKeyChange,
  showCompletedTasks,
  onShowCompletedTasksChange,
  onReload,
  onResetToken,
  onTaskCompleteChange,
}: TasksPageProps) {
  const titleDateLabel = formatRuDateLabel(selectedDateKey);
  const isToday = selectedDateKey === formatLocalDateKey(new Date());

  return (
    <section style={wrapperStyle}>
      <div style={toolbarStyle}>
        <label style={dateLabelStyle} htmlFor="tasks-date">
          Дата
        </label>
        <input
          id="tasks-date"
          type="date"
          value={selectedDateKey}
          onChange={(event) => onDateKeyChange(event.target.value)}
          style={dateInputStyle}
        />
        <label style={filterLabelStyle}>
          <input
            type="checkbox"
            checked={showCompletedTasks}
            onChange={(event) => onShowCompletedTasksChange(event.target.checked)}
            style={filterCheckboxStyle}
          />
          Показывать выполненные
        </label>
      </div>
      <header style={headerStyle}>
        <h1 style={titleStyle}>
          {isToday ? 'Задачи на сегодня' : `Задачи на ${titleDateLabel}`}
        </h1>
        <button type="button" onClick={onResetToken} style={secondaryButtonStyle}>
          Сбросить токен
        </button>
      </header>

      {isLoading ? <p style={mutedTextStyle}>Загрузка задач...</p> : null}

      {!isLoading && errorMessage ? (
        <div style={errorBlockStyle}>
          <p style={errorTextStyle}>{errorMessage}</p>
          <button type="button" onClick={onReload} style={primaryButtonStyle}>
            Повторить
          </button>
        </div>
      ) : null}

      {!isLoading && !errorMessage && tasks.length === 0 ? (
        <p style={mutedTextStyle}>
          {isToday ? 'На сегодня задач нет' : `На ${titleDateLabel} задач нет`}
        </p>
      ) : null}

      {!isLoading && !errorMessage && tasks.length > 0 ? (
        <ul style={listStyle}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              level={0}
              onTaskCompleteChange={onTaskCompleteChange}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatRuDateLabel(isoDateKey: string): string {
  const [y, m, d] = isoDateKey.split('-');
  if (!y || !m || !d) {
    return isoDateKey;
  }
  return `${d}.${m}.${y}`;
}

type TaskCardProps = {
  task: TaskItem;
  level: number;
  onTaskCompleteChange: (taskId: string, completed: boolean) => void;
};

function TaskCard({ task, level, onTaskCompleteChange }: TaskCardProps) {
  return (
    <li
      style={{
        ...itemStyle,
        marginLeft: level > 0 ? `${Math.min(level * 18, 54)}px` : 0,
        borderLeft: level > 0 ? '3px solid #1d4ed8' : itemStyle.borderLeft,
      }}
    >
      <div style={taskRowStyle}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={(event) => onTaskCompleteChange(task.id, event.target.checked)}
          style={checkboxStyle}
          aria-label={task.completed ? 'Отметить невыполненной' : 'Отметить выполненной'}
        />
        <span style={{ ...taskTitleStyle, ...(task.completed ? completedTitleStyle : {}) }}>
          {task.title}
        </span>
      </div>
      {task.subtasksLoading ? <p style={loadingSubtasksStyle}>Загрузка подзадач...</p> : null}

      {!task.subtasksLoading && task.subtasks.length > 0 ? (
        <ul style={subtasksListStyle}>
          {task.subtasks.map((subtask) => (
            <TaskCard
              key={subtask.id}
              task={subtask}
              level={level + 1}
              onTaskCompleteChange={onTaskCompleteChange}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

const wrapperStyle: CSSProperties = {
  width: '100%',
  maxWidth: '800px',
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 16px 40px rgba(2, 6, 23, 0.45)',
};

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '16px',
  flexWrap: 'wrap',
  width: '100%',
};

const dateLabelStyle: CSSProperties = {
  color: '#94a3b8',
  fontSize: '14px',
  fontWeight: 600,
};

const dateInputStyle: CSSProperties = {
  background: '#020617',
  border: '1px solid #334155',
  borderRadius: '10px',
  padding: '8px 12px',
  color: '#f8fafc',
  fontSize: '14px',
  fontFamily: 'inherit',
  colorScheme: 'dark',
};

const filterLabelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  marginLeft: 'auto',
  color: '#cbd5e1',
  fontSize: '14px',
  cursor: 'pointer',
  userSelect: 'none',
};

const filterCheckboxStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  accentColor: '#3b82f6',
  cursor: 'pointer',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '12px',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '28px',
  color: '#f8fafc',
};

const listStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '16px 0 0',
  display: 'grid',
  gap: '12px',
};

const subtasksListStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '10px 0 0',
  display: 'grid',
  gap: '10px',
};

const itemStyle: CSSProperties = {
  border: '1px solid #334155',
  borderRadius: '12px',
  padding: '12px',
  background: '#020617',
};

const taskRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
};

const checkboxStyle: CSSProperties = {
  marginTop: '3px',
  width: '18px',
  height: '18px',
  flexShrink: 0,
  accentColor: '#3b82f6',
  cursor: 'pointer',
};

const taskTitleStyle: CSSProperties = {
  margin: 0,
  color: '#f1f5f9',
  fontWeight: 700,
  flex: 1,
  lineHeight: 1.35,
};

const completedTitleStyle: CSSProperties = {
  textDecoration: 'line-through',
  opacity: 0.55,
};

const loadingSubtasksStyle: CSSProperties = {
  margin: '8px 0 0',
  color: '#93c5fd',
  fontSize: '13px',
};

const mutedTextStyle: CSSProperties = {
  color: '#94a3b8',
};

const errorBlockStyle: CSSProperties = {
  marginTop: '10px',
  display: 'grid',
  gap: '10px',
  justifyItems: 'start',
};

const errorTextStyle: CSSProperties = {
  margin: 0,
  color: '#fca5a5',
};

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: '10px',
  padding: '10px 14px',
  fontWeight: 700,
  color: '#e0f2fe',
  background: '#1d4ed8',
  cursor: 'pointer',
};

const secondaryButtonStyle: CSSProperties = {
  border: '1px solid #334155',
  borderRadius: '10px',
  padding: '9px 12px',
  fontWeight: 600,
  color: '#e2e8f0',
  background: '#0b1220',
  cursor: 'pointer',
};
