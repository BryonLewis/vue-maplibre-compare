<template>
  <div class="map-compare-container" ref="containerRef">
    <div class="map-compare-wrapper">
      <div ref="mapARef" class="map map-a"></div>
      <div ref="mapBRef" class="map map-b"></div>
      <div 
        class="map-compare-slider" 
        :style="{ left: sliderPosition + '%' }"
        @mousedown="startDrag"
        @touchstart.passive="startDrag"
      >
        <div class="slider-handle"></div>
      </div>
      <div class="clip-container" :style="{ clip: clipPath }">
        <div ref="mapBClipRef" class="map map-b-clip"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import maplibregl, { Map as MaplibreMap, StyleSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export interface MapCompareProps {
  mapStyleA: string | StyleSpecification
  mapStyleB: string | StyleSpecification
  mapLayersA?: string[]
  mapLayersB?: string[]
  center?: [number, number]
  zoom?: number
  bearing?: number
  pitch?: number
}

const props = withDefaults(defineProps<MapCompareProps>(), {
  mapLayersA: () => [],
  mapLayersB: () => [],
  center: () => [0, 0],
  zoom: 1,
  bearing: 0,
  pitch: 0
})

const containerRef = ref<HTMLElement>()
const mapARef = ref<HTMLElement>()
const mapBRef = ref<HTMLElement>()
const mapBClipRef = ref<HTMLElement>()

let mapA: MaplibreMap | null = null
let mapB: MaplibreMap | null = null
let isDragging = false

const sliderPosition = ref(50)

const clipPath = computed(() => {
  return `rect(0, 999em, 999em, ${sliderPosition.value}%)`
})

const initializeMaps = () => {
  if (!mapARef.value || !mapBRef.value || !mapBClipRef.value) return

  // Initialize Map A
  mapA = new maplibregl.Map({
    container: mapARef.value,
    style: props.mapStyleA,
    center: props.center,
    zoom: props.zoom,
    bearing: props.bearing,
    pitch: props.pitch
  })

  // Initialize Map B (clipped version)
  mapB = new maplibregl.Map({
    container: mapBClipRef.value,
    style: props.mapStyleB,
    center: props.center,
    zoom: props.zoom,
    bearing: props.bearing,
    pitch: props.pitch
  })

  // Sync map movements
  const syncMaps = (source: MaplibreMap, target: MaplibreMap) => {
    target.jumpTo({
      center: source.getCenter(),
      zoom: source.getZoom(),
      bearing: source.getBearing(),
      pitch: source.getPitch()
    })
  }

  mapA.on('move', () => {
    if (mapB) syncMaps(mapA!, mapB)
  })

  mapB.on('move', () => {
    if (mapA) syncMaps(mapB!, mapA)
  })

  // Apply layer visibility after maps are loaded
  mapA.on('load', () => {
    updateLayerVisibility('A')
  })

  mapB.on('load', () => {
    updateLayerVisibility('B')
  })
}

const updateLayerVisibility = (mapType: 'A' | 'B') => {
  const map = mapType === 'A' ? mapA : mapB
  const enabledLayers = mapType === 'A' ? props.mapLayersA : props.mapLayersB
  
  if (!map || !map.isStyleLoaded()) return

  const style = map.getStyle()
  if (!style || !style.layers) return

  // Disable all layers first if specific layers are provided
  if (enabledLayers && enabledLayers.length > 0) {
    style.layers.forEach(layer => {
      if (enabledLayers.includes(layer.id)) {
        map.setLayoutProperty(layer.id, 'visibility', 'visible')
      } else {
        map.setLayoutProperty(layer.id, 'visibility', 'none')
      }
    })
  }
}

const startDrag = (e: MouseEvent | TouchEvent) => {
  e.preventDefault()
  isDragging = true
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchmove', onDrag)
  document.addEventListener('touchend', stopDrag)
}

const onDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging || !containerRef.value) return
  
  const containerRect = containerRef.value.getBoundingClientRect()
  let clientX: number
  
  if (e instanceof MouseEvent) {
    clientX = e.clientX
  } else {
    clientX = e.touches[0].clientX
  }
  
  const x = clientX - containerRect.left
  const percentage = Math.max(0, Math.min(100, (x / containerRect.width) * 100))
  sliderPosition.value = percentage
}

const stopDrag = () => {
  isDragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', stopDrag)
}

// Watch for layer changes
watch(() => props.mapLayersA, () => {
  updateLayerVisibility('A')
}, { deep: true })

watch(() => props.mapLayersB, () => {
  updateLayerVisibility('B')
}, { deep: true })

onMounted(() => {
  initializeMaps()
})

onBeforeUnmount(() => {
  if (mapA) {
    mapA.remove()
    mapA = null
  }
  if (mapB) {
    mapB.remove()
    mapB = null
  }
  stopDrag()
})
</script>

<style scoped>
.map-compare-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.map-compare-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.map {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.map-a {
  z-index: 1;
}

.map-b {
  z-index: 0;
  visibility: hidden;
}

.clip-container {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2;
  overflow: hidden;
}

.map-b-clip {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.map-compare-slider {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 3;
  width: 4px;
  margin-left: -2px;
  background: white;
  cursor: ew-resize;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
}

.slider-handle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  margin-left: -20px;
  margin-top: -20px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-handle::before,
.slider-handle::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
}

.slider-handle::before {
  left: 8px;
  border-width: 6px 8px 6px 0;
  border-color: transparent #666 transparent transparent;
}

.slider-handle::after {
  right: 8px;
  border-width: 6px 0 6px 8px;
  border-color: transparent transparent transparent #666;
}
</style>
