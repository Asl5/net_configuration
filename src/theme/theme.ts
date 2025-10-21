export function setThemeVars(vars: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, val]) => {
    root.style.setProperty(`--${key}`, val);
  });
}

export function getOverrides(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem('themeOverrides') || '{}'); }
  catch { return {}; }
}

export function saveOverrides(vars: Record<string, string>) {
  const prev = getOverrides();
  const merged = { ...prev, ...vars };
  localStorage.setItem('themeOverrides', JSON.stringify(merged));
}

export function applySavedOverrides() {
  const overrides = getOverrides();
  if (overrides && Object.keys(overrides).length) setThemeVars(overrides);
}

export function setThemeName(name: string) {
  document.documentElement.setAttribute('data-theme', name);
}

export function resetOverrides() {
  localStorage.removeItem('themeOverrides');
}
