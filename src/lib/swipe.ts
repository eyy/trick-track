import type { Action } from 'svelte/action';

interface SwipeOptions {
  onLeft?: () => void;
  onRight?: () => void;
  threshold?: number;
}

/**
 * Horizontal swipe on a row. Drag past `threshold` px left/right to fire the
 * matching handler. Ignores drags that start on a button, gives way to vertical
 * scrolling, and stays inert when no handlers are supplied (e.g. a row being edited).
 */
export const swipe: Action<HTMLElement, SwipeOptions> = (node, options) => {
  let opts = options ?? {};
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let active = false;

  function down(e: PointerEvent) {
    if (!opts.onLeft && !opts.onRight) return;
    // Element (not HTMLElement) so drags starting on an icon button's inline <svg> are caught too.
    if (e.target instanceof Element && e.target.closest('button, input, textarea')) return;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    active = true;
  }

  function move(e: PointerEvent) {
    if (!active) return;
    dx = e.clientX - startX;
    // Defer to vertical scrolling.
    if (Math.abs(e.clientY - startY) > Math.abs(dx)) {
      reset();
      return;
    }
    node.style.transition = 'none';
    node.style.transform = `translateX(${dx}px)`;
  }

  function up() {
    if (!active) return;
    const moved = dx;
    reset();
    const t = opts.threshold ?? 80;
    if (moved <= -t) opts.onLeft?.();
    else if (moved >= t) opts.onRight?.();
  }

  function reset() {
    active = false;
    node.style.transition = '';
    node.style.transform = '';
  }

  node.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  // pointercancel (gesture reinterpreted as scroll, OS interrupt) must also snap back,
  // or the row stays stuck translated.
  window.addEventListener('pointercancel', reset);

  return {
    update(next: SwipeOptions) {
      opts = next ?? {};
    },
    destroy() {
      node.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', reset);
    },
  };
};
