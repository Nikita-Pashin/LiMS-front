const DEFAULT_BASE_URL = 'https://api.weeek.net/public/v1';
const TASK_ENDPOINT_CANDIDATES = ['/tasks', '/tm/tasks', '/task'];

type UnknownRecord = Record<string, unknown>;
type ParsedTask = {
  item: TaskItem;
  subTaskIds: string[];
};

export type TaskItem = {
  id: string;
  parentId: string | null;
  title: string;
  completed: boolean;
  subTaskIds: string[];
  subtasksLoading: boolean;
  subtasks: TaskItem[];
};

function formatAsApiDate(input: Date): string {
  const day = String(input.getDate()).padStart(2, '0');
  const month = String(input.getMonth() + 1).padStart(2, '0');
  const year = input.getFullYear();
  return `${day}.${month}.${year}`;
}

function normalizeToApiDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
  }

  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return formatAsApiDate(date);
  }

  return '';
}

function getBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_WEEEK_API_BASE_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  return DEFAULT_BASE_URL;
}

async function request(path: string, token: string): Promise<Response> {
  return fetch(`${getBaseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
}

function postJson(path: string, token: string, body: unknown = {}): Promise<Response> {
  return fetch(`${getBaseUrl()}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body ?? {}),
  });
}

/** Mark task completed (POST …/complete) or return to active (POST …/return). */
export async function setWeeekTaskCompleted(
  token: string,
  taskId: string,
  completed: boolean,
): Promise<void> {
  const id = encodeURIComponent(taskId);
  const path = completed ? `/tm/tasks/${id}/complete` : `/tm/tasks/${id}/return`;
  const response = await postJson(path, token, {});
  if (!response.ok) {
    throw new Error(`Weeek API ${completed ? 'complete' : 'return'} failed: ${response.status}`);
  }
}

function buildPathWithQuery(path: string, query: Record<string, string | number>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    params.set(key, String(value));
  }
  return `${path}?${params.toString()}`;
}

function pickArrayPayload(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is UnknownRecord => typeof item === 'object' && item !== null);
  }
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const source = payload as UnknownRecord;
  const candidates = [source.tasks, source.data, source.items, source.result];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter((item): item is UnknownRecord => typeof item === 'object' && item !== null);
    }
  }

  return [];
}

function getDateValue(task: UnknownRecord): string {
  const candidates = [
    task.date,
    task.dueDate,
    task.due_date,
    task.deadline,
    task.deadlineAt,
    task.startDate,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return new Date(candidate).toISOString();
    }
    if (typeof candidate === 'object' && candidate !== null) {
      const nested = candidate as UnknownRecord;
      const nestedCandidates = [nested.date, nested.start, nested.value, nested.datetime];
      for (const nestedCandidate of nestedCandidates) {
        if (typeof nestedCandidate === 'string' && nestedCandidate.trim()) {
          return nestedCandidate;
        }
      }
    }
  }
  return '';
}

function isRawTaskCompleted(task: UnknownRecord): boolean {
  const done = task.completed ?? task.isCompleted ?? task.done;
  if (typeof done === 'boolean') {
    return done;
  }

  const status = task.status ?? task.state;
  if (typeof status === 'string') {
    const s = status.toLowerCase().trim();
    if (s === 'done' || s === 'completed' || s === 'complete' || s === 'finished') {
      return true;
    }
  }

  if (task.completedAt != null || task.completed_at != null) {
    return true;
  }

  const progress = task.progress ?? task.percent;
  if (typeof progress === 'number' && progress >= 100) {
    return true;
  }

  return false;
}

function extractSubTaskIds(task: UnknownRecord): string[] {
  const raw = task.subTasks ?? task.subtasks ?? [];
  if (!Array.isArray(raw)) {
    return [];
  }

  const ids: string[] = [];
  for (const entry of raw) {
    if (typeof entry === 'string' || typeof entry === 'number') {
      ids.push(String(entry));
      continue;
    }
    if (typeof entry === 'object' && entry !== null) {
      const objectEntry = entry as UnknownRecord;
      const candidate = objectEntry.id ?? objectEntry.taskId ?? objectEntry._id;
      if (typeof candidate === 'string' || typeof candidate === 'number') {
        ids.push(String(candidate));
      }
    }
  }

  return ids;
}

function toParsedTask(task: UnknownRecord): ParsedTask | null {
  const idRaw = task.id ?? task._id ?? task.uuid;
  const parentIdRaw = task.parentId ?? task.parent_id ?? task.parentTaskId ?? null;
  const titleRaw = task.title ?? task.name ?? task.text;

  if (typeof idRaw !== 'string' && typeof idRaw !== 'number') {
    return null;
  }
  if (typeof titleRaw !== 'string' || !titleRaw.trim()) {
    return null;
  }

  return {
    item: {
      id: String(idRaw),
      parentId:
        typeof parentIdRaw === 'string' || typeof parentIdRaw === 'number'
          ? String(parentIdRaw)
          : null,
      title: titleRaw.trim(),
      completed: isRawTaskCompleted(task),
      subTaskIds: extractSubTaskIds(task),
      subtasksLoading: false,
      subtasks: [],
    },
    subTaskIds: extractSubTaskIds(task),
  };
}

function pickTaskPayload(payload: unknown): UnknownRecord | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const source = payload as UnknownRecord;
  const candidates = [source.task, source.data, source.result, source.item];
  for (const candidate of candidates) {
    if (typeof candidate === 'object' && candidate !== null && !Array.isArray(candidate)) {
      return candidate as UnknownRecord;
    }
  }

  if ('id' in source || 'title' in source || 'name' in source || 'text' in source) {
    return source;
  }

  return null;
}

async function fetchTaskById(token: string, id: string): Promise<ParsedTask | null> {
  const response = await request(`/tm/tasks/${id}`, token);
  if (!response.ok) {
    return null;
  }

  const payload: unknown = await response.json();
  const taskObject = pickTaskPayload(payload);
  if (!taskObject) {
    return null;
  }

  return toParsedTask(taskObject);
}

async function hydrateSubtasksByIds(
  token: string,
  task: TaskItem,
  subTaskIds: string[],
  parsedById: Map<string, ParsedTask>,
  resolvedById: Map<string, Promise<ParsedTask | null>>,
  visiting: Set<string>,
): Promise<void> {
  if (visiting.has(task.id)) {
    return;
  }
  visiting.add(task.id);

  if (subTaskIds.length === 0) {
    task.subtasks = [];
    visiting.delete(task.id);
    return;
  }

  for (const subTaskId of subTaskIds) {
    if (!resolvedById.has(subTaskId)) {
      resolvedById.set(subTaskId, fetchTaskById(token, subTaskId));
    }
  }

  const parsedList = await Promise.all(subTaskIds.map((id) => resolvedById.get(id)!));

  const pairs: Array<{ child: TaskItem; subIds: string[] }> = [];
  for (let i = 0; i < subTaskIds.length; i++) {
    const parsed = parsedList[i];
    if (!parsed || parsed.item.id === task.id) {
      continue;
    }
    parsedById.set(parsed.item.id, parsed);
    pairs.push({
      child: { ...parsed.item, subtasks: [] },
      subIds: parsed.subTaskIds,
    });
  }

  await Promise.all(
    pairs.map(({ child, subIds }) =>
      hydrateSubtasksByIds(token, child, subIds, parsedById, resolvedById, visiting),
    ),
  );

  task.subtasks = pairs.map((p) => p.child);
  visiting.delete(task.id);
}

export async function fetchSubtasksTree(
  token: string,
  subTaskIds: string[],
): Promise<TaskItem[]> {
  if (subTaskIds.length === 0) {
    return [];
  }

  const parsedById = new Map<string, ParsedTask>();
  const resolvedById = new Map<string, Promise<ParsedTask | null>>();

  for (const subTaskId of subTaskIds) {
    if (!resolvedById.has(subTaskId)) {
      resolvedById.set(subTaskId, fetchTaskById(token, subTaskId));
    }
  }

  const parsedRoots = await Promise.all(subTaskIds.map((id) => resolvedById.get(id)!));

  const trees = await Promise.all(
    parsedRoots.map(async (parsed) => {
      if (!parsed) {
        return null;
      }
      parsedById.set(parsed.item.id, parsed);
      const root: TaskItem = {
        ...parsed.item,
        subtasks: [],
        subtasksLoading: false,
      };
      await hydrateSubtasksByIds(
        token,
        root,
        parsed.subTaskIds,
        parsedById,
        resolvedById,
        new Set<string>(),
      );
      return root;
    }),
  );

  return trees.filter((item): item is TaskItem => item !== null);
}

export function filterTasksByCompletion(tasks: TaskItem[], showCompleted: boolean): TaskItem[] {
  if (showCompleted) {
    return tasks;
  }
  return tasks
    .filter((task) => !task.completed)
    .map((task) => ({
      ...task,
      subtasks: filterTasksByCompletion(task.subtasks, showCompleted),
    }));
}

export async function fetchTasksForDate(token: string, day: Date): Promise<TaskItem[]> {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const startDate = formatAsApiDate(start);
  const endDate = formatAsApiDate(end);
  const allTasks: UnknownRecord[] = [];
  let hasMore = true;
  let offset = 0;
  const statuses: string[] = [];

  while (hasMore) {
    let response: Response | null = null;

    for (const endpoint of TASK_ENDPOINT_CANDIDATES) {
      const path = buildPathWithQuery(endpoint, {
        offset,
        startDate,
        endDate,
        sortBy: 'priority',
      });
      const candidate = await request(path, token);
      statuses.push(`${path}: ${candidate.status}`);
      if (candidate.ok) {
        response = candidate;
        break;
      }
      if (candidate.status !== 404) {
        response = candidate;
        break;
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Failed to fetch tasks. Tried ${statuses.join(', ')}`);
    }

    const payload: unknown = await response.json();
    const pageTasks = pickArrayPayload(payload);
    allTasks.push(...pageTasks);

    if (typeof payload === 'object' && payload !== null && 'hasMore' in payload) {
      hasMore = Boolean((payload as UnknownRecord).hasMore);
    } else {
      hasMore = pageTasks.length > 0;
    }

    // API uses offset-based pagination.
    offset += pageTasks.length;
    if (pageTasks.length === 0) {
      hasMore = false;
    }
  }

  const parsedById = new Map<string, ParsedTask>();
  const orderedParsed: ParsedTask[] = [];
  for (const task of allTasks) {
    const normalizedDate = normalizeToApiDate(getDateValue(task));
    if (normalizedDate !== startDate) {
      continue;
    }

    const parsed = toParsedTask(task);
    if (parsed) {
      if (!parsedById.has(parsed.item.id)) {
        parsedById.set(parsed.item.id, parsed);
        orderedParsed.push(parsed);
      }
    }
  }

  const rootParsed: ParsedTask[] = [];
  for (const parsed of orderedParsed) {
    if (parsed.item.parentId && parsedById.has(parsed.item.parentId)) {
      continue;
    }
    rootParsed.push(parsed);
  }

  const rootTasks: TaskItem[] = [];
  for (const parsed of rootParsed) {
    const root: TaskItem = {
      ...parsed.item,
      subtasks: [],
      subtasksLoading: parsed.subTaskIds.length > 0,
    };
    if (root.parentId && parsedById.has(root.parentId)) {
      // Root list should only contain true root entities.
    } else {
      rootTasks.push(root);
    }
  }

  return rootTasks;
}
