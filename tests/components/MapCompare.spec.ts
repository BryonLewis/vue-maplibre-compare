import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { mount } from '@vue/test-utils';
import type { StyleSpecification } from 'maplibre-gl';
import MapCompare from '../../src/components/MapCompare.vue';

const mockStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#ffffff' },
    },
  ],
};

describe('MapCompare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with required props', () => {
    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
      },
    });

    expect(wrapper.find('.map-compare-container').exists()).toBe(true);
    expect(wrapper.find('.map-a').exists()).toBe(true);
    expect(wrapper.find('.map-b').exists()).toBe(true);
  });

  it('accepts string style URLs', () => {
    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: 'https://example.com/style.json',
        mapStyleB: 'https://example.com/style.json',
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('accepts StyleSpecification objects', () => {
    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('applies default center prop', () => {
    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
      },
    });

    expect(wrapper.props('camera')?.center).toEqual([0, 0]);
  });

  it('applies custom center prop', () => {
    const center: [number, number] = [-74.5, 40];
    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
        camera: {
          center, zoom: 1, bearing: 0, pitch: 0,
        },
      },
    });

    expect(wrapper.props('camera')?.center).toEqual(center);
  });

  it('applies default zoom prop', () => {
    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
      },
    });

    expect(wrapper.props('camera')?.zoom).toBe(1);
  });

  it('applies custom zoom prop', () => {
    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
        camera: {
          center: [0, 0], zoom: 10, bearing: 0, pitch: 0,
        },
      },
    });

    expect(wrapper.props('camera')?.zoom).toBe(10);
  });

  it('applies default swiper options', () => {
    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
      },
    });

    const { swiperOpts } = wrapper.vm;
    expect(swiperOpts.thickness).toBe(4);
    // grabThickness defaults to 4 in computed, but prop default is 20, so it uses prop default
    expect(swiperOpts.grabThickness).toBe(20);
    expect(swiperOpts.handleSize).toBe(40);
    expect(swiperOpts.lineColor).toBe('white');
    expect(swiperOpts.handleColor).toBe('white');
  });

  it('applies custom swiper options', () => {
    const customOptions = {
      thickness: 6,
      orientation: 'horizontal' as const,
      grabThickness: 30,
      handleSize: 50,
      lineColor: '#ff0000',
      handleColor: '#00ff00',
    };

    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
        swiperOptions: customOptions,
      },
    });

    const { swiperOpts } = wrapper.vm;
    expect(swiperOpts.thickness).toBe(6);
    expect(swiperOpts.grabThickness).toBe(30);
    expect(swiperOpts.handleSize).toBe(50);
    expect(swiperOpts.lineColor).toBe('#ff0000');
    expect(swiperOpts.handleColor).toBe('#00ff00');
    // Check orientation via props
    expect(wrapper.props('swiperOptions')?.orientation).toBe('horizontal');
  });

  it('applies swiper CSS variables', () => {
    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
        swiperOptions: {
          thickness: 5,
          grabThickness: 25,
          handleSize: 45,
          lineColor: '#ffffff',
          handleColor: '#000000',
        },
      },
    });

    const container = wrapper.find('.map-compare-container');
    const style = container.attributes('style');

    expect(style).toContain('--swiper-thickness: 5px');
    expect(style).toContain('--swiper-grab-thickness: 25px');
    expect(style).toContain('--swiper-handle-size: 45px');
    expect(style).toContain('--swiper-line-color: #ffffff');
    expect(style).toContain('--swiper-handle-color: #000000');
  });

  it('handles empty mapLayersA and mapLayersB', () => {
    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
        mapLayersA: [],
        mapLayersB: [],
      },
    });

    expect(wrapper.props('mapLayersA')).toEqual([]);
    expect(wrapper.props('mapLayersB')).toEqual([]);
  });

  it('handles custom mapLayersA and mapLayersB', () => {
    const layersA = ['layer1', 'layer2'];
    const layersB = ['layer1', 'layer3'];

    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
        mapLayersA: layersA,
        mapLayersB: layersB,
      },
    });

    expect(wrapper.props('mapLayersA')).toEqual(layersA);
    expect(wrapper.props('mapLayersB')).toEqual(layersB);
  });

  it('renders custom icon slot when provided', () => {
    const wrapper = mount(MapCompare, {
      props: {
        mapStyleA: mockStyle,
        mapStyleB: mockStyle,
      },
      slots: {
        icon: '<div class="custom-icon">Custom Icon</div>',
      },
    });

    // Note: The icon slot is teleported, so we check if hasIconSlot is true
    expect(wrapper.vm.hasIconSlot).toBe(true);
  });
});
