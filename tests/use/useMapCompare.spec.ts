import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import maplibregl from 'maplibre-gl';
import { useMapCompare } from '../../src/use/useMapCompare';

describe('useMapCompare', () => {
  let mapA: maplibregl.Map;
  let mapB: maplibregl.Map;
  let container: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Create mock maps
    mapA = new maplibregl.Map({
      container: document.createElement('div'),
      style: { version: 8, sources: {}, layers: [] },
    });

    mapB = new maplibregl.Map({
      container: document.createElement('div'),
      style: { version: 8, sources: {}, layers: [] },
    });
  });

  it('creates an instance with default options', () => {
    const instance = useMapCompare(mapA, mapB, container);

    expect(instance).toBeDefined();
    expect(instance.initialize).toBeDefined();
    expect(instance.unmount).toBeDefined();
    expect(instance.setSlider).toBeDefined();
    expect(instance.on).toBeDefined();
    expect(instance.off).toBeDefined();
  });

  it('creates an instance with custom options', () => {
    const instance = useMapCompare(mapA, mapB, container, {
      orientation: 'horizontal',
      mousemove: true,
    });

    expect(instance).toBeDefined();
  });

  it('initializes the slider', () => {
    const instance = useMapCompare(mapA, mapB, container);

    expect(() => instance.initialize()).not.toThrow();
  });

  it('does not initialize twice', () => {
    const instance = useMapCompare(mapA, mapB, container);

    instance.initialize();
    instance.initialize(); // Should not throw or create duplicate elements

    const swipers = container.querySelectorAll('.compare-swiper-vertical, .compare-swiper-horizontal');
    expect(swipers.length).toBeLessThanOrEqual(1);
  });

  it('sets slider position', () => {
    const instance = useMapCompare(mapA, mapB, container);
    instance.initialize();

    expect(() => instance.setSlider(400)).not.toThrow();
  });

  it('handles event listeners', () => {
    const instance = useMapCompare(mapA, mapB, container);
    const handler = vi.fn();

    instance.on('slideend', handler);
    instance.off('slideend', handler);

    // Should not throw
    expect(handler).not.toHaveBeenCalled();
  });

  it('unmounts cleanly', () => {
    const instance = useMapCompare(mapA, mapB, container);
    instance.initialize();

    expect(() => instance.unmount()).not.toThrow();
  });

  it('handles unmount when not initialized', () => {
    const instance = useMapCompare(mapA, mapB, container);

    expect(() => instance.unmount()).not.toThrow();
  });

  it('works with string container selector', () => {
    container.id = 'test-container';
    document.body.appendChild(container);

    const instance = useMapCompare(mapA, mapB, '#test-container');

    expect(() => instance.initialize()).not.toThrow();
  });

  it('throws error for invalid container', () => {
    const instance = useMapCompare(mapA, mapB, '#non-existent-container');

    expect(() => instance.initialize()).toThrow('Invalid container element');
  });

  it('handles horizontal orientation', () => {
    const instance = useMapCompare(mapA, mapB, container, {
      orientation: 'horizontal',
    });
    instance.initialize();

    const swiper = container.querySelector('.compare-swiper-horizontal');
    expect(swiper).toBeTruthy();
  });

  it('handles vertical orientation', () => {
    const instance = useMapCompare(mapA, mapB, container, {
      orientation: 'vertical',
    });
    instance.initialize();

    const swiper = container.querySelector('.compare-swiper-vertical');
    expect(swiper).toBeTruthy();
  });
});
