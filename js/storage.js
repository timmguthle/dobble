const STORAGE_KEY = "dobble-training-statistics";

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
