/* eslint-disable vue/one-component-per-file */
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { createApp } from 'vue';
// eslint-disable-next-line import/extensions
import MapComparePlugin, { MapCompare, ToggleCompare } from '@/index';

describe('index.ts exports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports MapCompare component', () => {
    expect(MapCompare).toBeDefined();
    expect(MapCompare.name).toBe('MapCompare');
  });

  it('exports ToggleCompare component', () => {
    expect(ToggleCompare).toBeDefined();
    expect(ToggleCompare.name).toBe('ToggleCompare');
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
    expect(app.component('ToggleCompare')).toBeDefined();
  });

  it('registers components with correct names', () => {
    const app = createApp({
      template: '<div>Test</div>',
    });

    app.use(MapComparePlugin);

    const mapCompareComponent = app.component('MapCompare');
    const toggleCompareComponent = app.component('ToggleCompare');

    expect(mapCompareComponent).toBe(MapCompare);
    expect(toggleCompareComponent).toBe(ToggleCompare);
  });
});
