const separator = document.querySelector('.separator');
const leftNav = document.querySelector('.left-nav');
let isResizing = false;

separator.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isResizing = true;
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
});

function onMouseMove(e) {
  if (!isResizing) return;
  leftNav.style.width = `${e.clientX}px`;
}

function onMouseUp() {
  isResizing = false;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);
}
