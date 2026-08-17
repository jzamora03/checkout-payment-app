export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveState<T>(key: string, state: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    // almacenamiento no disponible; se ignora
  }
}

export function clearState(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignorar
  }
}