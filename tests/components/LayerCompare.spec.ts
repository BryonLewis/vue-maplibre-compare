import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { mount } from '@vue/test-utils';
import type { StyleSpecification } from 'maplibre-gl';
import LayerCompare from '../../src/components/LayerCompare.vue';

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

describe('LayerCompare', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with required props', () => {
    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: mockStyle,
      },
    });

    // LayerCompare wraps MapCompare, so we check for the container
    expect(wrapper.find('.map-compare-container').exists()).toBe(true);
  });

  it('accepts string style URL', () => {
    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: 'https://example.com/style.json',
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('accepts StyleSpecification object', () => {
    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: mockStyle,
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('passes the same style to both MapCompare maps', () => {
    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: mockStyle,
      },
    });

    const mapCompare = wrapper.findComponent({ name: 'MapCompare' });
    expect(mapCompare.exists()).toBe(true);
    expect(mapCompare.props('mapStyleA')).toEqual(mockStyle);
    expect(mapCompare.props('mapStyleB')).toEqual(mockStyle);
  });

  it('applies default center prop', () => {
    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: mockStyle,
      },
    });

    expect(wrapper.props('camera')?.center).toEqual([0, 0]);
  });

  it('applies custom center prop', () => {
    const center: [number, number] = [-74.5, 40];
    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: mockStyle,
        camera: {
          center, zoom: 1, bearing: 0, pitch: 0,
        },
      },
    });

    expect(wrapper.props('camera')?.center).toEqual(center);
  });

  it('applies default zoom prop', () => {
    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: mockStyle,
      },
    });

    expect(wrapper.props('camera')?.zoom).toBe(0);
  });

  it('applies custom zoom prop', () => {
    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: mockStyle,
        camera: {
          center: [0, 0], zoom: 10, bearing: 0, pitch: 0,
        },
      },
    });

    expect(wrapper.props('camera')?.zoom).toBe(10);
  });

  it('applies default swiper options', () => {
    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: mockStyle,
      },
    });

    const swiperOptions = wrapper.props('swiperOptions');
    expect(swiperOptions).toBeDefined();
    expect(swiperOptions?.thickness).toBe(4);
    expect(swiperOptions?.orientation).toBe('vertical');
    expect(swiperOptions?.grabThickness).toBe(20);
    expect(swiperOptions?.handleSize).toBe(40);
  });

  it('applies custom swiper options', () => {
    const customOptions = {
      thickness: 6,
      orientation: 'horizontal' as const,
      grabThickness: 30,
      handleSize: 50,
    };

    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: mockStyle,
        swiperOptions: customOptions,
      },
    });

    expect(wrapper.props('swiperOptions')).toEqual(customOptions);
  });

  it('handles empty mapLayersA and mapLayersB', () => {
    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: mockStyle,
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

    const wrapper = mount(LayerCompare, {
      props: {
        mapStyle: mockStyle,
        mapLayersA: layersA,
        mapLayersB: layersB,
      },
    });

    expect(wrapper.props('mapLayersA')).toEqual(layersA);
    expect(wrapper.props('mapLayersB')).toEqual(layersB);
  });

  it('passes all props to MapCompare component', () => {
    const props = {
      mapStyle: mockStyle,
      mapLayersA: ['layer1'],
      mapLayersB: ['layer2'],
      camera: {
        center: [-74.5, 40] as [number, number],
        zoom: 10,
        bearing: 45,
        pitch: 30,
      },
      swiperOptions: {
        thickness: 5,
        orientation: 'horizontal' as const,
      },
    };

    const wrapper = mount(LayerCompare, { props });
    const mapCompare = wrapper.findComponent({ name: 'MapCompare' });

    expect(mapCompare.props('mapStyleA')).toEqual(props.mapStyle);
    expect(mapCompare.props('mapStyleB')).toEqual(props.mapStyle);
    expect(mapCompare.props('mapLayersA')).toEqual(props.mapLayersA);
    expect(mapCompare.props('mapLayersB')).toEqual(props.mapLayersB);
    expect(mapCompare.props('camera')).toEqual({
      center: props.camera.center,
      zoom: props.camera.zoom,
      bearing: props.camera.bearing,
      pitch: props.camera.pitch,
    });
    expect(mapCompare.props('swiperOptions')).toEqual(props.swiperOptions);
  });
});
