document.addEventListener('DOMContentLoaded', () => {
  const el = document.getElementById('ping');
  if (el) el.textContent = window.electronAPI?.ping?.() || 'ready';
});