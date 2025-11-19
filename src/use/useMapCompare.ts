// useMapCompare.ts
import { ref } from 'vue';
import syncMove from '@mapbox/mapbox-gl-sync-move';
import maplibregl from 'maplibre-gl';

// Simple browser-compatible event emitter
class EventEmitter {
  private events: Map<string, Array<(...args: any[]) => void>> = new Map();

  on(type: string, fn: (...args: any[]) => void) {
    const handlers = this.events.get(type) || [];
    handlers.push(fn);
    this.events.set(type, handlers);
  }

  off(type: string, fn: (...args: any[]) => void) {
    const handlers = this.events.get(type);
    if (handlers) {
      const index = handlers.indexOf(fn);
      if (index > -1) {
        handlers.splice(index, 1);
        if (handlers.length === 0) {
          this.events.delete(type);
        } else {
          this.events.set(type, handlers);
        }
      }
    }
  }

  emit(type: string, ...args: any[]) {
    const handlers = this.events.get(type);
    if (handlers) {
      handlers.forEach((fn) => fn(...args));
    }
  }
}

export interface UseMapCompareOptions {
  orientation?: 'vertical' | 'horizontal';
  mousemove?: boolean;
}

export function useMapCompare(
  mapA: maplibregl.Map,
  mapB: maplibregl.Map,
  container: string | HTMLElement | null,
  options: UseMapCompareOptions = {},
) {
  const opts = {
    orientation: 'vertical',
    mousemove: false,
    ...options,
  };

  const isHorizontal = opts.orientation === 'horizontal';

  const swiper = ref<HTMLDivElement | null>(null);
  const controlContainer = ref<HTMLDivElement | null>(null);
  const bounds = ref<DOMRect | null>(null);
  const currentPosition = ref<number | null>(null);

  const ev = new EventEmitter();
  let clearSync: (() => void) | null = null;
  let resizeHandler: (() => void) | null = null;
  let isInitialized = false;

  // ------------------------
  // Helpers
  // ------------------------
  const setPosition = (x: number) => {
    if (!bounds.value || !controlContainer.value) return;

    const limit = isHorizontal ? bounds.value.height : bounds.value.width;
    const posX = Math.min(x, limit);

    const transform = isHorizontal
      ? `translate(0, ${posX}px)`
      : `translate(${posX}px, 0)`;

    controlContainer.value.style.transform = transform;

    // Clip the maps
    const clipA = isHorizontal
      ? `rect(0, 999em, ${posX}px, 0)`
      : `rect(0, ${posX}px, ${bounds.value.height}px, 0)`;

    const clipB = isHorizontal
      ? `rect(${posX}px, 999em, ${bounds.value.height}px, 0)`
      : `rect(0, 999em, ${bounds.value.height}px, ${posX}px)`;

    const containerA = mapA.getContainer();
    const containerB = mapB.getContainer();
    containerA.style.clip = clipA;
    containerB.style.clip = clipB;

    currentPosition.value = posX;
  };

  const getX = (e: any) => {
    const event = e.touches ? e.touches[0] : e;
    const x = event.clientX - (bounds.value?.left ?? 0);
    return Math.min(Math.max(x, 0), bounds.value?.width ?? 0);
  };

  const getY = (e: any) => {
    const event = e.touches ? e.touches[0] : e;
    const y = event.clientY - (bounds.value?.top ?? 0);
    return Math.min(Math.max(y, 0), bounds.value?.height ?? 0);
  };

  // ------------------------
  // Event handlers
  // ------------------------
  const onMove = (e: any) => {
    // Prevent default to avoid text selection
    e.preventDefault();

    if (opts.mousemove) {
      controlContainer.value!.style.pointerEvents = e.touches ? 'auto' : 'none';
      swiper.value!.style.pointerEvents = e.touches ? 'auto' : 'none';
    }

    if (isHorizontal) {
      setPosition(getY(e));
    } else {
      setPosition(getX(e));
    }
  };

  const restoreSelection = () => {
    // Restore text selection
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.mozUserSelect = '';
    document.body.style.msUserSelect = '';
  };

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onMouseUp);
    restoreSelection();
    ev.emit('slideend', { currentPosition: currentPosition.value });
  };

  const onTouchEnd = () => {
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onTouchEnd);
    restoreSelection();
    ev.emit('slideend', { currentPosition: currentPosition.value });
  };

  const onDown = (e: any) => {
    // Prevent default behavior to avoid text selection
    e.preventDefault();

    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    document.body.style.msUserSelect = 'none';

    if (e.touches) {
      document.addEventListener('touchmove', onMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
    } else {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  // ------------------------
  // Initialization
  // ------------------------
  const initialize = () => {
    if (isInitialized || !container) return;

    const targetEl = typeof container === 'string'
      ? (document.querySelector(container) as HTMLElement)
      : container;

    if (!targetEl) throw new Error('Invalid container element for map compare.');

    isInitialized = true;

    // Build DOM
    controlContainer.value = document.createElement('div');
    controlContainer.value.className = isHorizontal
      ? 'maplibre-compare maplibre-compare-horizontal'
      : 'maplibre-compare';

    swiper.value = document.createElement('div');
    swiper.value.className = isHorizontal
      ? 'compare-swiper-horizontal'
      : 'compare-swiper-vertical';

    controlContainer.value.appendChild(swiper.value);
    targetEl.appendChild(controlContainer.value);

    bounds.value = mapB.getContainer().getBoundingClientRect();

    const startPos = (isHorizontal ? bounds.value.height : bounds.value.width) / 2;

    setPosition(startPos);

    // Sync move
    clearSync = syncMove(mapA, mapB);

    resizeHandler = () => {
      bounds.value = mapB.getContainer().getBoundingClientRect();
      if (currentPosition.value) setPosition(currentPosition.value);
    };
    mapB.on('resize', resizeHandler);

    // Events
    if (opts.mousemove) {
      mapA.getContainer().addEventListener('mousemove', onMove);
      mapB.getContainer().addEventListener('mousemove', onMove);
    }

    swiper.value.addEventListener('mousedown', onDown);
    swiper.value.addEventListener('touchstart', onDown);
  };

  const unmount = () => {
    if (!isInitialized) return;

    isInitialized = false;

    clearSync?.();
    if (resizeHandler) {
      mapB.off('resize', resizeHandler);
    }

    const a = mapA.getContainer();
    const b = mapB.getContainer();

    if (a) {
      a.style.clip = '';
      a.removeEventListener('mousemove', onMove);
    }
    if (b) {
      b.style.clip = '';
      b.removeEventListener('mousemove', onMove);
    }

    swiper.value?.removeEventListener('mousedown', onDown);
    swiper.value?.removeEventListener('touchstart', onDown);

    controlContainer.value?.remove();

    swiper.value = null;
    controlContainer.value = null;
    bounds.value = null;
    currentPosition.value = null;
  };

  // ------------------------
  // Public API
  // ------------------------
  return {
    /** Manually initialize the slider (useful when called after maps are ready) */
    initialize,

    /** Unmount the slider */
    unmount,

    /** Manually set slider position */
    setSlider: (x: number) => setPosition(x),

    /** Listen to events (`slideend`) */
    on: (type: string, fn: (...a: any[]) => void) => {
      ev.on(type, fn);
    },

    /** Remove event */
    off: (type: string, fn: (...a: any[]) => void) => {
      ev.off(type, fn);
    },
  };
}
