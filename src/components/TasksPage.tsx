import { CSSProperties, useEffect, useState } from 'react';
import { TaskItem } from '../lib/weeekApi';

type ActiveTaskTimer = {
  task: TaskItem;
  startedAt: number;
};
type TaskViewMode = 'default' | 'compact';

type TasksPageProps = {
  tasks: TaskItem[];
  isLoading: boolean;
  errorMessage: string;
  selectedDateKey: string;
  onDateKeyChange: (dateKey: string) => void;
  showCompletedTasks: boolean;
  onShowCompletedTasksChange: (value: boolean) => void;
  taskViewMode: TaskViewMode;
  onTaskViewModeChange: (value: TaskViewMode) => void;
  onReload: () => Promise<void>;
  onResetToken: () => void;
  onTaskCompleteChange: (taskId: string, completed: boolean) => void;
  activeTaskTimer: ActiveTaskTimer | null;
  timerTaskIdInFlight: string;
  timerErrorMessage: string;
  onStartTaskTimer: (task: TaskItem) => void;
  onStopTaskTimer: () => void;
};

export function TasksPage({
  tasks,
  isLoading,
  errorMessage,
  selectedDateKey,
  onDateKeyChange,
  showCompletedTasks,
  onShowCompletedTasksChange,
  taskViewMode,
  onTaskViewModeChange,
  onReload,
  onResetToken,
  onTaskCompleteChange,
  activeTaskTimer,
  timerTaskIdInFlight,
  timerErrorMessage,
  onStartTaskTimer,
  onStopTaskTimer,
}: TasksPageProps) {
  const titleDateLabel = formatRuDateLabel(selectedDateKey);
  const isToday = selectedDateKey === formatLocalDateKey(new Date());
  const isCompactView = taskViewMode === 'compact';
  const displayTasks = isCompactView ? flattenTasks(tasks) : tasks;

  return (
    <section style={{ ...wrapperStyle, ...(isCompactView ? compactWrapperStyle : {}) }}>
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
        <div style={viewModeControlStyle}>
          <button
            type="button"
            onClick={() => onTaskViewModeChange('default')}
            style={{
              ...viewModeButtonStyle,
              ...(taskViewMode === 'default' ? activeViewModeButtonStyle : {}),
            }}
          >
            Обычный
          </button>
          <button
            type="button"
            onClick={() => onTaskViewModeChange('compact')}
            style={{
              ...viewModeButtonStyle,
              ...(taskViewMode === 'compact' ? activeViewModeButtonStyle : {}),
            }}
          >
            Компактный
          </button>
        </div>
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
        <ul style={isCompactView ? compactListStyle : listStyle}>
          {displayTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isCompactView={isCompactView}
              activeTaskTimer={activeTaskTimer}
              timerTaskIdInFlight={timerTaskIdInFlight}
              onTaskCompleteChange={onTaskCompleteChange}
              onStartTaskTimer={onStartTaskTimer}
              onStopTaskTimer={onStopTaskTimer}
            />
          ))}
        </ul>
      ) : null}

      {timerErrorMessage ? <p style={timerErrorStyle}>{timerErrorMessage}</p> : null}

      {activeTaskTimer ? (
        <ActiveTimerBar
          activeTaskTimer={activeTaskTimer}
          isStopping={timerTaskIdInFlight === activeTaskTimer.task.id}
          onStopTaskTimer={onStopTaskTimer}
        />
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

function flattenTasks(source: TaskItem[]): TaskItem[] {
  return source.flatMap((task) => [
    {
      ...task,
      subtasks: [],
    },
    ...flattenTasks(task.subtasks),
  ]);
}

type TaskCardProps = {
  task: TaskItem;
  isCompactView: boolean;
  activeTaskTimer: ActiveTaskTimer | null;
  timerTaskIdInFlight: string;
  onTaskCompleteChange: (taskId: string, completed: boolean) => void;
  onStartTaskTimer: (task: TaskItem) => void;
  onStopTaskTimer: () => void;
};

function TaskCard({
  task,
  isCompactView,
  activeTaskTimer,
  timerTaskIdInFlight,
  onTaskCompleteChange,
  onStartTaskTimer,
  onStopTaskTimer,
}: TaskCardProps) {
  const isTimerActive = activeTaskTimer?.task.id === task.id;
  const isTimerBusy = timerTaskIdInFlight === task.id;

  return (
    <li
      style={{
        ...itemStyle,
        ...(isCompactView ? compactItemStyle : {}),
        ...(isTimerActive ? activeItemStyle : {}),
        marginBottom: isCompactView ? '12px' : undefined,
        breakInside: isCompactView ? 'avoid' : undefined,
        pageBreakInside: isCompactView ? 'avoid' : undefined,
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
        {isTimerActive ? (
          <button
            type="button"
            onClick={onStopTaskTimer}
            disabled={isTimerBusy}
            style={stopTimerButtonStyle}
          >
            {isTimerBusy ? 'Остановка...' : 'Остановить'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStartTaskTimer(task)}
            disabled={Boolean(timerTaskIdInFlight)}
            style={startTimerButtonStyle}
          >
            {isTimerBusy ? 'Запуск...' : 'Таймер'}
          </button>
        )}
      </div>
      {task.subtasksLoading ? <p style={loadingSubtasksStyle}>Загрузка подзадач...</p> : null}

      {!isCompactView && !task.subtasksLoading && task.subtasks.length > 0 ? (
        <ul style={subtasksListStyle}>
          {task.subtasks.map((subtask) => (
            <TaskCard
              key={subtask.id}
              task={subtask}
              isCompactView={isCompactView}
              activeTaskTimer={activeTaskTimer}
              timerTaskIdInFlight={timerTaskIdInFlight}
              onTaskCompleteChange={onTaskCompleteChange}
              onStartTaskTimer={onStartTaskTimer}
              onStopTaskTimer={onStopTaskTimer}
            />
          ))}
        </ul>
      ) : null}

    </li>
  );
}

function ActiveTimerBar({
  activeTaskTimer,
  isStopping,
  onStopTaskTimer,
}: {
  activeTaskTimer: ActiveTaskTimer;
  isStopping: boolean;
  onStopTaskTimer: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div style={activeTimerBarStyle}>
      <div style={activeTimerContentStyle}>
        <div style={activeTimerMetaStyle}>
          <span style={activeTimerLabelStyle}>Таймер задачи</span>
          <strong style={activeTimerTitleStyle}>{activeTaskTimer.task.title}</strong>
        </div>
        <span style={activeTimerTimeStyle}>
          {formatElapsedTime(now - activeTaskTimer.startedAt)}
        </span>
        <button
          type="button"
          onClick={onStopTaskTimer}
          disabled={isStopping}
          style={activeTimerStopButtonStyle}
        >
          {isStopping ? 'Остановка...' : 'Остановить'}
        </button>
      </div>
    </div>
  );
}

function formatElapsedTime(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
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

const compactWrapperStyle: CSSProperties = {
  maxWidth: 'none',
  minHeight: 'calc(100vh - 48px)',
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

const viewModeControlStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '2px',
  padding: '3px',
  border: '1px solid #334155',
  borderRadius: '10px',
  background: '#020617',
};

const viewModeButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: '7px',
  padding: '7px 10px',
  color: '#94a3b8',
  background: 'transparent',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
};

const activeViewModeButtonStyle: CSSProperties = {
  color: '#f8fafc',
  background: '#1d4ed8',
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

const compactListStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '16px 0 0',
  columnWidth: '300px',
  columnGap: '12px',
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

const compactItemStyle: CSSProperties = {
  display: 'inline-block',
  width: '100%',
  padding: '10px',
  borderRadius: '10px',
};

const activeItemStyle: CSSProperties = {
  borderColor: '#22c55e',
  boxShadow: '0 0 0 1px rgba(34, 197, 94, 0.35)',
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
  overflowWrap: 'anywhere',
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

const startTimerButtonStyle: CSSProperties = {
  border: '1px solid #2563eb',
  borderRadius: '10px',
  padding: '7px 10px',
  fontWeight: 700,
  color: '#dbeafe',
  background: '#1e3a8a',
  cursor: 'pointer',
  flexShrink: 0,
};

const stopTimerButtonStyle: CSSProperties = {
  ...startTimerButtonStyle,
  borderColor: '#b91c1c',
  color: '#fee2e2',
  background: '#7f1d1d',
};

const timerErrorStyle: CSSProperties = {
  margin: '16px 0 0',
  color: '#fca5a5',
};

const activeTimerBarStyle: CSSProperties = {
  position: 'fixed',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 20,
  padding: '12px 24px',
  background: 'rgba(2, 6, 23, 0.96)',
  borderTop: '1px solid #334155',
  boxShadow: '0 -16px 40px rgba(2, 6, 23, 0.45)',
};

const activeTimerContentStyle: CSSProperties = {
  width: '100%',
  maxWidth: '800px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const activeTimerMetaStyle: CSSProperties = {
  minWidth: 0,
  flex: 1,
  display: 'grid',
  gap: '2px',
};

const activeTimerLabelStyle: CSSProperties = {
  color: '#86efac',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
};

const activeTimerTitleStyle: CSSProperties = {
  color: '#f8fafc',
  fontSize: '15px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const activeTimerTimeStyle: CSSProperties = {
  minWidth: '72px',
  color: '#f8fafc',
  fontVariantNumeric: 'tabular-nums',
  fontWeight: 800,
  textAlign: 'right',
};

const activeTimerStopButtonStyle: CSSProperties = {
  ...stopTimerButtonStyle,
  padding: '9px 12px',
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
