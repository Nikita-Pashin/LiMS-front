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
} from './lib/weeekApi';

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

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [token, setToken] = useState(() => getStoredToken());
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [authLoading, setAuthLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [tasksError, setTasksError] = useState('');
  const [taskDateKey, setTaskDateKey] = useState(() => formatLocalDateKey(new Date()));
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const subtasksContextDateRef = useRef(taskDateKey);

  const visibleTasks = useMemo(
    () => filterTasksByCompletion(tasks, showCompletedTasks),
    [tasks, showCompletedTasks],
  );

  useEffect(() => {
    subtasksContextDateRef.current = taskDateKey;
  }, [taskDateKey]);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
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

  function navigate(nextPath: '/' | '/tasks') {
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
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
          setTasks((previous) =>
            updateTaskById(previous, root.id, (task) => ({
              ...task,
              subtasks,
              subtasksLoading: false,
            })),
          );
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
    handleTaskCompleteChange,
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
