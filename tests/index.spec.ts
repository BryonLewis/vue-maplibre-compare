/* eslint-disable vue/one-component-per-file */
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { createApp } from 'vue';
// eslint-disable-next-line import/extensions
import MapComparePlugin, { MapCompare, LayerCompare } from '@/index';

describe('index.ts exports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports MapCompare component', () => {
    expect(MapCompare).toBeDefined();
    expect(MapCompare.name).toBe('MapCompare');
  });

  it('exports LayerCompare component', () => {
    expect(LayerCompare).toBeDefined();
    expect(LayerCompare.name).toBe('LayerCompare');
  });

  it('exports MapComparePlugin', () => {
    expect(MapComparePlugin).toBeDefined();
    expect(MapComparePlugin.install).toBeDefined();
    expect(typeof MapComparePlugin.install).toBe('function');
  });

  it('installs plugin correctly', () => {
    const app = createApp({
      template: '<div>Test</div>',
    });

    app.use(MapComparePlugin);

    // Check if components are registered
    expect(app.component('MapCompare')).toBeDefined();
    expect(app.component('LayerCompare')).toBeDefined();
  });

  it('registers components with correct names', () => {
    const app = createApp({
      template: '<div>Test</div>',
    });

    app.use(MapComparePlugin);

    const mapCompareComponent = app.component('MapCompare');
    const layerCompareComponent = app.component('LayerCompare');

    expect(mapCompareComponent).toBe(MapCompare);
    expect(layerCompareComponent).toBe(LayerCompare);
  });
});
