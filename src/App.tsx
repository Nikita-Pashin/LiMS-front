import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TasksPage } from './components/TasksPage';
import { TokenPage } from './components/TokenPage';
import { clearToken, getStoredToken, storeToken } from './lib/tokenStorage';
import {
  TaskItem,
  fetchSubtasksTree,
  fetchTasksForDate,
  filterTasksByCompletion,
  setWeeekTaskCompleted,
  startWeeekTaskTimer,
  stopWeeekTaskTimer,
} from './lib/weeekApi';

type AppPath = '/' | '/tasks';
type ActiveTaskTimer = {
  task: TaskItem;
  startedAt: number;
};

const APP_BASE_PATH = normalizeBasePath(import.meta.env.BASE_URL);

function normalizeBasePath(baseUrl: string): string {
  if (!baseUrl || baseUrl === '/') {
    return '';
  }
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function getAppPathFromLocation(): AppPath {
  const { pathname } = window.location;
  const withoutBase = APP_BASE_PATH && pathname.startsWith(APP_BASE_PATH)
    ? pathname.slice(APP_BASE_PATH.length) || '/'
    : pathname;

  return withoutBase === '/tasks' ? '/tasks' : '/';
}

function toBrowserPath(path: AppPath): string {
  return `${APP_BASE_PATH}${path === '/' ? '/' : path}`;
}

function setTaskCompletedInTree(
  source: TaskItem[],
  taskId: string,
  completed: boolean,
): TaskItem[] {
  return source.map((task) => {
    if (task.id === taskId) {
      return { ...task, completed };
    }
    if (task.subtasks.length === 0) {
      return task;
    }
    return {
      ...task,
      subtasks: setTaskCompletedInTree(task.subtasks, taskId, completed),
    };
  });
}

function setActiveTimerInTree(
  source: TaskItem[],
  taskId: string,
  startedAt: number | null,
): TaskItem[] {
  return source.map((task) => ({
    ...task,
    activeTimerStartedAt: task.id === taskId ? startedAt : null,
    subtasks: setActiveTimerInTree(task.subtasks, taskId, startedAt),
  }));
}

function findActiveTaskTimer(source: TaskItem[]): ActiveTaskTimer | null {
  for (const task of source) {
    if (task.activeTimerStartedAt !== null) {
      return {
        task,
        startedAt: task.activeTimerStartedAt,
      };
    }

    const subtaskTimer = findActiveTaskTimer(task.subtasks);
    if (subtaskTimer) {
      return subtaskTimer;
    }
  }

  return null;
}

export default function App() {
  const [path, setPath] = useState<AppPath>(() => getAppPathFromLocation());
  const [token, setToken] = useState(() => getStoredToken());
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [tasksError, setTasksError] = useState('');
  const [timerError, setTimerError] = useState('');
  const [timerTaskIdInFlight, setTimerTaskIdInFlight] = useState('');
  const [activeTaskTimer, setActiveTaskTimer] = useState<ActiveTaskTimer | null>(null);
  const [taskDateKey, setTaskDateKey] = useState(() => formatLocalDateKey(new Date()));
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const subtasksContextDateRef = useRef(taskDateKey);
  const activeTaskTimerRef = useRef<ActiveTaskTimer | null>(null);

  const visibleTasks = useMemo(
    () => filterTasksByCompletion(tasks, showCompletedTasks),
    [tasks, showCompletedTasks],
  );

  useEffect(() => {
    subtasksContextDateRef.current = taskDateKey;
  }, [taskDateKey]);

  useEffect(() => {
    activeTaskTimerRef.current = activeTaskTimer;
  }, [activeTaskTimer]);

  useEffect(() => {
    const handlePopState = () => setPath(getAppPathFromLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!token && path !== '/') {
      navigate('/');
    }
  }, [token, path]);

  useEffect(() => {
    if (path !== '/tasks' || !token) {
      return;
    }
    void loadTasks(token, taskDateKey);
  }, [path, token, taskDateKey]);

  function navigate(nextPath: AppPath) {
    const browserPath = toBrowserPath(nextPath);
    if (window.location.pathname !== browserPath) {
      window.history.pushState({}, '', browserPath);
    }
    setPath(nextPath);
  }

  async function handleSubmitToken(candidateToken: string) {
    const value = candidateToken.trim();
    if (!value) {
      setAuthError('Введите токен перед сохранением.');
      return;
    }

    setAuthError('');
    setAuthLoading(true);
    try {
      storeToken(value);
      setToken(value);
      navigate('/tasks');
    } catch {
      setAuthError('Не удалось сохранить токен. Повторите попытку.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadTasks(currentToken: string, dateKey: string) {
    setTasksLoading(true);
    setTasksError('');
    const day = parseLocalDateKey(dateKey);
    if (Number.isNaN(day.getTime())) {
      setTasksLoading(false);
      setTasksError('Некорректная дата.');
      setTasks([]);
      return;
    }
    try {
      const result = await fetchTasksForDate(currentToken, day);
      setTasks(result);
      setActiveTaskTimer(findActiveTaskTimer(result));
      void loadSubtasksInBackground(currentToken, result, dateKey);
    } catch {
      setTasksError('Не удалось загрузить задачи из Weeek API.');
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  const handleTaskCompleteChange = useCallback(async (taskId: string, completed: boolean) => {
    if (!token) {
      return;
    }
    setTasks((prev) => setTaskCompletedInTree(prev, taskId, completed));
    try {
      await setWeeekTaskCompleted(token, taskId, completed);
    } catch {
      setTasks((prev) => setTaskCompletedInTree(prev, taskId, !completed));
    }
  }, [token]);

  const handleStartTaskTimer = useCallback(async (task: TaskItem) => {
    if (!token || timerTaskIdInFlight) {
      return;
    }
    if (activeTaskTimerRef.current?.task.id === task.id) {
      return;
    }

    setTimerError('');
    setTimerTaskIdInFlight(task.id);
    try {
      const previousTimer = activeTaskTimerRef.current;
      if (previousTimer && previousTimer.task.id !== task.id) {
        await stopWeeekTaskTimer(token, previousTimer.task.id);
      }
      await startWeeekTaskTimer(token, task.id);
      const startedAt = Date.now();
      setTasks((prev) => setActiveTimerInTree(prev, task.id, startedAt));
      setActiveTaskTimer({
        task: {
          ...task,
          activeTimerStartedAt: startedAt,
        },
        startedAt,
      });
    } catch {
      setTimerError('Не удалось запустить таймер задачи.');
    } finally {
      setTimerTaskIdInFlight('');
    }
  }, [timerTaskIdInFlight, token]);

  const handleStopTaskTimer = useCallback(async () => {
    const currentTimer = activeTaskTimerRef.current;
    if (!token || !currentTimer || timerTaskIdInFlight) {
      return;
    }

    setTimerError('');
    setTimerTaskIdInFlight(currentTimer.task.id);
    try {
      await stopWeeekTaskTimer(token, currentTimer.task.id);
      setTasks((prev) => setActiveTimerInTree(prev, currentTimer.task.id, null));
      setActiveTaskTimer(null);
    } catch {
      setTimerError('Не удалось остановить таймер задачи.');
    } finally {
      setTimerTaskIdInFlight('');
    }
  }, [timerTaskIdInFlight, token]);

  function updateTaskById(
    source: TaskItem[],
    targetId: string,
    updater: (task: TaskItem) => TaskItem,
  ): TaskItem[] {
    return source.map((task) => {
      if (task.id === targetId) {
        return updater(task);
      }
      if (task.subtasks.length === 0) {
        return task;
      }
      return {
        ...task,
        subtasks: updateTaskById(task.subtasks, targetId, updater),
      };
    });
  }

  async function loadSubtasksInBackground(
    currentToken: string,
    roots: TaskItem[],
    dateKeyWhenStarted: string,
  ) {
    const rootsWithSubtasks = roots.filter((root) => root.subTaskIds.length > 0);
    if (rootsWithSubtasks.length === 0) {
      return;
    }

    await Promise.all(
      rootsWithSubtasks.map(async (root) => {
        try {
          const subtasks = await fetchSubtasksTree(currentToken, root.subTaskIds);
          if (subtasksContextDateRef.current !== dateKeyWhenStarted) {
            return;
          }
          setTasks((previous) => {
            const nextTasks = updateTaskById(previous, root.id, (task) => ({
              ...task,
              subtasks,
              subtasksLoading: false,
            }));
            const nextTimer = findActiveTaskTimer(nextTasks);
            if (nextTimer) {
              setActiveTaskTimer(nextTimer);
            }
            return nextTasks;
          });
        } catch {
          if (subtasksContextDateRef.current !== dateKeyWhenStarted) {
            return;
          }
          setTasks((previous) =>
            updateTaskById(previous, root.id, (task) => ({
              ...task,
              subtasksLoading: false,
            })),
          );
        }
      }),
    );
  }

  function handleResetToken() {
    clearToken();
    setToken('');
    setTasks([]);
    setTasksError('');
    setTimerError('');
    setActiveTaskTimer(null);
    navigate('/');
  }

  const content = useMemo(() => {
    if (path === '/tasks' && token) {
      return (
        <TasksPage
          tasks={visibleTasks}
          isLoading={tasksLoading}
          errorMessage={tasksError}
          selectedDateKey={taskDateKey}
          onDateKeyChange={setTaskDateKey}
          showCompletedTasks={showCompletedTasks}
          onShowCompletedTasksChange={setShowCompletedTasks}
          onReload={() => loadTasks(token, taskDateKey)}
          onResetToken={handleResetToken}
          onTaskCompleteChange={handleTaskCompleteChange}
          activeTaskTimer={activeTaskTimer}
          timerTaskIdInFlight={timerTaskIdInFlight}
          timerErrorMessage={timerError}
          onStartTaskTimer={handleStartTaskTimer}
          onStopTaskTimer={handleStopTaskTimer}
        />
      );
    }

    return (
      <TokenPage
        initialToken={token}
        isSubmitting={authLoading}
        errorMessage={authError}
        onSubmitToken={handleSubmitToken}
      />
    );
  }, [
    authError,
    authLoading,
    path,
    showCompletedTasks,
    taskDateKey,
    visibleTasks,
    tasksError,
    tasksLoading,
    token,
    activeTaskTimer,
    timerError,
    timerTaskIdInFlight,
    handleTaskCompleteChange,
    handleStartTaskTimer,
    handleStopTaskTimer,
  ]);

  return (
    <main style={mainStyle}>{content}</main>
  );
}

function formatLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const mainStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#020617',
  padding: '24px',
  fontFamily: 'Arial, sans-serif',
};
