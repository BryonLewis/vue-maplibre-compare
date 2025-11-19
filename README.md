# vue-maplibre-compare

A Vue 3 component for comparing MapLibre maps side-by-side with a draggable slider. Perfect for visualizing differences between map styles or showing before/after comparisons.

## Features

- 🗺️ Side-by-side map comparison with smooth dragging slider
- 🎨 Support for different MapLibre styles on each side
- 🔧 Layer visibility control for both maps
- 📱 Touch and mouse support
- ⚡ Built with Vue 3 and TypeScript
- 🔄 Synchronized map movements (pan, zoom, rotate, pitch)

## Installation

```bash
npm install vue-maplibre-compare maplibre-gl
```

## Usage

### As a Vue Plugin

```typescript
import { createApp } from 'vue'
import MapComparePlugin from 'vue-maplibre-compare'
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

const styleA = 'https://demotiles.maplibre.org/style.json'
const styleB = 'https://demotiles.maplibre.org/style.json'
const layersA = ref(['water', 'roads'])  // Optional: specify which layers to show
const layersB = ref(['water', 'buildings'])
</script>
```

## Props

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

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

