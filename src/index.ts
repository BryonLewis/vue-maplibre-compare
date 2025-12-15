import type { Plugin } from 'vue';
import MapCompare from './components/MapCompare.vue';
import ToggleCompare from './components/ToggleCompare.vue';

export { MapCompare, ToggleCompare };

export type { MapCompareProps } from './components/MapCompare.vue';
export type { ToggleCompareProps } from './components/ToggleCompare.vue';

// Install function for Vue plugin
export const MapComparePlugin: Plugin = {
  install(app) {
    app.component('MapCompare', MapCompare);
    app.component('ToggleCompare', ToggleCompare);
  },
};

export default MapComparePlugin;
