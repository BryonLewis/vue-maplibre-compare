# vue-maplibre-compare

A Vue 3 component for comparing MapLibre maps side-by-side with a draggable slider. Perfect for visualizing differences between map styles or showing before/after comparisons.

## Features

- Side-by-side map comparison with smooth dragging slider
- Support for different MapLibre styles on each side
- Layer visibility control for both maps
- Touch and mouse support
- Built with Vue 3 and TypeScript using `defineComponent`
- Synchronized map movements (pan, zoom, rotate, pitch)
- Two components: `MapCompare` (different styles) and `LayerCompare` (same style, different layers)

## Demo

**[Live Demo](https://bryonlewis.github.io/vue-maplibre-compare/)** - Try it out in your browser!


![Map comparison with customizable swiper](docs/images/demo.png)

*Comparing two different map styles side-by-side with customizable swiper options*

## Installation

```bash
npm install vue-maplibre-compare maplibre-gl
```

**Important:** Don't forget to import the component styles and MapLibre GL CSS:

```typescript
import 'vue-maplibre-compare/dist/style.css'
import 'maplibre-gl/dist/maplibre-gl.css'
```

## Usage

### As a Vue Plugin

```typescript
import { createApp } from 'vue'
import MapComparePlugin from 'vue-maplibre-compare'
import 'vue-maplibre-compare/dist/style.css'
import App from './App.vue'

const app = createApp(App)
app.use(MapComparePlugin)
app.mount('#app')
```

### As a Component

```vue
<template>
  <div style="width: 100%; height: 600px;">
    <MapCompare
      :mapStyleA="styleA"
      :mapStyleB="styleB"
      :mapLayersA="layersA"
      :mapLayersB="layersB"
      :center="[-74.5, 40]"
      :zoom="9"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MapCompare } from 'vue-maplibre-compare'
import 'vue-maplibre-compare/dist/style.css'

const styleA = 'https://demotiles.maplibre.org/style.json'
const styleB = 'https://demotiles.maplibre.org/style.json'

// Optional: specify which layers to show on each map
// If empty or not provided, all layers are shown
const layersA = ref(['water', 'roads', 'buildings'])
const layersB = ref(['water', 'buildings'])  // roads hidden on map B
</script>
```

### With Inline Styles

You can also pass MapLibre `StyleSpecification` objects directly:

```vue
<script setup lang="ts">
import { MapCompare } from 'vue-maplibre-compare'
import type { StyleSpecification } from 'maplibre-gl'

const blueStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#1e3a8a' }
    }
  ]
}

const redStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#991b1b' }
    }
  ]
}
</script>

<template>
  <MapCompare
    :mapStyleA="blueStyle"
    :mapStyleB="redStyle"
    :center="[0, 0]"
    :zoom="2"
  />
</template>
```

### LayerCompare Component

The `LayerCompare` component uses a single map style and shows different layers on each side:

```vue
<template>
  <div style="width: 100%; height: 600px;">
    <LayerCompare
      :mapStyle="'https://demotiles.maplibre.org/style.json'"
      :mapLayersA="['water', 'roads']"
      :mapLayersB="['water', 'buildings', 'parks']"
      :center="[-74.5, 40]"
      :zoom="9"
    />
  </div>
</template>

<script setup lang="ts">
import { LayerCompare } from 'vue-maplibre-compare'
import 'vue-maplibre-compare/dist/style.css'
</script>
```

## Components

### MapCompare

Compare two different map styles side-by-side.

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `mapStyleA` | `string \| StyleSpecification` | Yes | - | MapLibre style for left/first map |
| `mapStyleB` | `string \| StyleSpecification` | Yes | - | MapLibre style for right/second map |
| `mapLayersA` | `string[]` | No | `[]` | Array of layer IDs to enable in map A. If empty, all layers are shown |
| `mapLayersB` | `string[]` | No | `[]` | Array of layer IDs to enable in map B. If empty, all layers are shown |
| `center` | `[number, number]` | No | `[0, 0]` | Initial map center coordinates [lng, lat] |
| `zoom` | `number` | No | `1` | Initial zoom level |
| `bearing` | `number` | No | `0` | Initial bearing (rotation) in degrees |
| `pitch` | `number` | No | `0` | Initial pitch (tilt) in degrees |
| `swiperOptions` | `SwiperOptions` | No | `default` | Configuration object for the swiper appearance and behavior |

### SwiperOptions Interface

```typescript
interface SwiperOptions {
  thickness?: number;          // Width of the visible line (default: 4)
  orientation: 'vertical' | 'horizontal'; // Orientation of the slider
  grabThickness?: number;      // Width of the interactive area (default: 20)
  handleSize?: number;         // Diameter of the handle circle (default: 40)
  lineColor?: string;          // Color of the divider line (default: 'white')
  handleColor?: string;        // Color of the handle circle (default: 'white')
  handleShadowColor?: string;  // Color of the handle shadow
  arrowColor?: string;         // Color of the arrows
}
```

### PMTiles Support

The component now includes built-in support for the `pmtiles` protocol. You can use `pmtiles://` URLs directly in your style sources.


### LayerCompare

Compare the same map style with different layer visibility on each side.

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `mapStyle` | `string \| StyleSpecification` | Yes | - | MapLibre style for both maps |
| `mapLayersA` | `string[]` | No | `[]` | Array of layer IDs to enable in map A. If empty, all layers are shown |
| `mapLayersB` | `string[]` | No | `[]` | Array of layer IDs to enable in map B. If empty, all layers are shown |
| `center` | `[number, number]` | No | `[0, 0]` | Initial map center coordinates [lng, lat] |
| `zoom` | `number` | No | `1` | Initial zoom level |
| `bearing` | `number` | No | `0` | Initial bearing (rotation) in degrees |
| `pitch` | `number` | No | `0` | Initial pitch (tilt) in degrees |
| `swiperOptions` | `SwiperOptions` | No | `default` | Configuration object for the swiper appearance and behavior |

## Development

### Setup

```bash
git clone <repository-url>
cd vue-maplibre-compare
npm install
```

### Run Demo

```bash
npm run dev
```

This will start a development server at `http://localhost:3000` with a demo application showing the component in action.

### Build Library

```bash
npm run build
```

This will create the distributable library files in the `dist` directory.


