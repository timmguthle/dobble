const STORAGE_KEY = "dobble-training-statistics";
const MEMORY_TIME_KEY = "dobble-memory-time";
const TIME_ATTACK_BEST_KEY = "dobble-time-attack-best";

export function loadResults() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function appendResult(result) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...loadResults(), result]));
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
}

export function clearResults() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // See appendResult.
  }
}

export function loadMemoryTime() {
  try {
    return Number(localStorage.getItem(MEMORY_TIME_KEY)) || null;
  } catch {
    return null;
  }
}

export function saveMemoryTime(seconds) {
  try {
    localStorage.setItem(MEMORY_TIME_KEY, String(seconds));
  } catch {
    // See appendResult.
  }
}

export function loadTimeAttackBest() {
  try {
    return Number(localStorage.getItem(TIME_ATTACK_BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveTimeAttackBest(score) {
  try {
    localStorage.setItem(TIME_ATTACK_BEST_KEY, String(score));
  } catch {
    // See appendResult.
  }
}
