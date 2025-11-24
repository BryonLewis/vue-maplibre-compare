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
  const setPosition = (pos: number) => {
    if (!bounds.value || !controlContainer.value) return;

    const limit = isHorizontal ? bounds.value.height : bounds.value.width;
    const posX = Math.min(pos, limit);

    // Move the swiper handle
    const transform = isHorizontal
      ? `translate(0, ${posX}px)`
      : `translate(${posX}px, 0)`;
    controlContainer.value.style.transform = transform;

    const containerA = mapA.getContainer();
    const containerB = mapB.getContainer();

    if (isHorizontal) {
      // Horizontal (up/down)
      // A = top part, B = bottom part
      containerA.style.clipPath = `inset(0 0 calc(100% - ${posX}px) 0)`;
      containerB.style.clipPath = `inset(${posX}px 0 0 0)`;
    } else {
      // Vertical (left/right)
      // A = left part, B = right part
      containerA.style.clipPath = `inset(0 calc(100% - ${posX}px) 0 0)`;
      containerB.style.clipPath = `inset(0 0 0 ${posX}px)`;
    }

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

    // Set inline styles to ensure proper dimensions
    // The element is created dynamically, so CSS might not apply immediately
    controlContainer.value.style.position = 'absolute';
    controlContainer.value.style.top = '0';
    controlContainer.value.style.left = '0';
    controlContainer.value.style.width = '100%';
    controlContainer.value.style.height = '100%';
    controlContainer.value.style.zIndex = '2';
    controlContainer.value.style.pointerEvents = 'none';

    swiper.value = document.createElement('div');
    swiper.value.className = isHorizontal
      ? 'compare-swiper-horizontal'
      : 'compare-swiper-vertical';

    // Set inline styles for swiper to ensure proper dimensions
    // The element is created dynamically, so CSS might not apply immediately
    if (isHorizontal) {
      // Horizontal swiper (top/bottom split)
      swiper.value.style.position = 'absolute';
      swiper.value.style.left = '0';
      swiper.value.style.right = '0';
      swiper.value.style.height = 'var(--swiper-grab-thickness, 4px)';
      swiper.value.style.marginTop = 'calc(var(--swiper-grab-thickness, 4px) * -0.5)';
      swiper.value.style.cursor = 'ns-resize';
    } else {
      // Vertical swiper (left/right split)
      swiper.value.style.position = 'absolute';
      swiper.value.style.top = '0';
      swiper.value.style.bottom = '0';
      swiper.value.style.width = 'var(--swiper-grab-thickness, 4px)';
      swiper.value.style.marginLeft = 'calc(var(--swiper-grab-thickness, 4px) * -0.5)';
      swiper.value.style.cursor = 'ew-resize';
    }
    swiper.value.style.pointerEvents = 'auto';
    swiper.value.style.userSelect = 'none';
    swiper.value.style.webkitUserSelect = 'none';

    controlContainer.value.appendChild(swiper.value);
    targetEl.appendChild(controlContainer.value);

    // Ensure styles are applied after DOM insertion
    // Re-apply styles in case they were overridden
    if (controlContainer.value) {
      controlContainer.value.style.position = 'absolute';
      controlContainer.value.style.top = '0';
      controlContainer.value.style.left = '0';
      controlContainer.value.style.width = '100%';
      controlContainer.value.style.height = '100%';
      controlContainer.value.style.zIndex = '2';
      controlContainer.value.style.pointerEvents = 'none';
    }
    // Re-apply swiper styles after DOM insertion
    if (swiper.value) {
      if (isHorizontal) {
        swiper.value.style.position = 'absolute';
        swiper.value.style.left = '0';
        swiper.value.style.right = '0';
        swiper.value.style.height = 'var(--swiper-grab-thickness, 4px)';
        swiper.value.style.marginTop = 'calc(var(--swiper-grab-thickness, 4px) * -0.5)';
        swiper.value.style.cursor = 'ns-resize';
      } else {
        swiper.value.style.position = 'absolute';
        swiper.value.style.top = '0';
        swiper.value.style.bottom = '0';
        swiper.value.style.width = 'var(--swiper-grab-thickness, 4px)';
        swiper.value.style.marginLeft = 'calc(var(--swiper-grab-thickness, 4px) * -0.5)';
        swiper.value.style.cursor = 'ew-resize';
      }
      swiper.value.style.pointerEvents = 'auto';
    }

    bounds.value = mapB.getContainer().getBoundingClientRect();

    // Ensure container has valid dimensions before proceeding
    // If dimensions are 0, trigger resize and retry
    const dimension = isHorizontal ? bounds.value.height : bounds.value.width;
    if (dimension === 0) {
      // Trigger resize on both maps to ensure they have proper dimensions
      mapA.resize();
      mapB.resize();
      // Recalculate bounds after resize
      bounds.value = mapB.getContainer().getBoundingClientRect();
    }

    const startPos = (isHorizontal ? bounds.value.height : bounds.value.width) / 2;

    setPosition(startPos);

    // Sync move
    clearSync = syncMove(mapA, mapB);

    resizeHandler = () => {
      bounds.value = mapB.getContainer().getBoundingClientRect();
      // Re-apply styles in case they were reset during resize
      if (controlContainer.value) {
        controlContainer.value.style.position = 'absolute';
        controlContainer.value.style.top = '0';
        controlContainer.value.style.left = '0';
        controlContainer.value.style.width = '100%';
        controlContainer.value.style.height = '100%';
        controlContainer.value.style.zIndex = '2';
        controlContainer.value.style.pointerEvents = 'none';
      }
      // Re-apply swiper styles
      if (swiper.value) {
        if (isHorizontal) {
          swiper.value.style.position = 'absolute';
          swiper.value.style.left = '0';
          swiper.value.style.right = '0';
          swiper.value.style.height = 'var(--swiper-grab-thickness, 4px)';
          swiper.value.style.marginTop = 'calc(var(--swiper-grab-thickness, 4px) * -0.5)';
          swiper.value.style.cursor = 'ns-resize';
        } else {
          swiper.value.style.position = 'absolute';
          swiper.value.style.top = '0';
          swiper.value.style.bottom = '0';
          swiper.value.style.width = 'var(--swiper-grab-thickness, 4px)';
          swiper.value.style.marginLeft = 'calc(var(--swiper-grab-thickness, 4px) * -0.5)';
          swiper.value.style.cursor = 'ew-resize';
        }
        swiper.value.style.pointerEvents = 'auto';
      }
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
      a.style.clipPath = '';
      a.removeEventListener('mousemove', onMove);
    }
    if (b) {
      b.style.clipPath = '';
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
