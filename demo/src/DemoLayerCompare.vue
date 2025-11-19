<script lang="ts">
import { defineComponent, ref, computed, PropType } from 'vue'
import { LayerCompare } from '../../src/index'
import type { StyleSpecification, GeoJSONSourceSpecification } from 'maplibre-gl'
import type { SwiperOptions } from '../../src/components/MapCompare.vue'

export default defineComponent({
  name: 'DemoLayerCompare',
  components: {
    LayerCompare
  },
  props: {
    swiperOptions: {
      type: Object as PropType<SwiperOptions>,
      required: true,
    },
  },
  setup() {
    const center: [number, number] = [-74.1847, 43.1339]

    // Generate GeoJSON points distributed around the center point
    const generatePoints = (count: number, center: [number, number], radius: number = 0.1) => {
      const points = []
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const distance = radius * (0.5 + Math.random() * 0.5)
        const lat = center[1] + distance * Math.cos(angle)
        const lon = center[0] + distance * Math.sin(angle) / Math.cos(center[1] * Math.PI / 180)
        points.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          properties: {
            id: i + 1,
            name: `Point ${i + 1}`
          }
        })
      }
      return {
        type: 'FeatureCollection' as const,
        features: points
      }
    }

    // Generate GeoJSON polygons distributed around the center point
    const generatePolygons = (count: number, center: [number, number], radius: number = 0.15) => {
      const polygons = []
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const distance = radius * (0.6 + Math.random() * 0.4)
        const lat = center[1] + distance * Math.cos(angle)
        const lon = center[0] + distance * Math.sin(angle) / Math.cos(center[1] * Math.PI / 180)
        const size = 0.01 * (0.5 + Math.random() * 0.5)
        
        // Create a square polygon
        const polygon = {
          type: 'Feature' as const,
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [lon - size, lat - size],
              [lon + size, lat - size],
              [lon + size, lat + size],
              [lon - size, lat + size],
              [lon - size, lat - size]
            ]]
          },
          properties: {
            id: i + 1,
            name: `Polygon ${i + 1}`
          }
        }
        polygons.push(polygon)
      }
      return {
        type: 'FeatureCollection' as const,
        features: polygons
      }
    }

    const pointsGeoJSON = generatePoints(8, center)
    const polygonsGeoJSON = generatePolygons(6, center)

    // Create a single map style with multiple sources
    const mapStyle: StyleSpecification = {
      version: 8,
      name: 'Multi-Layer Map',
      sources: {
        osm: {
          type: 'raster',
          tiles: [
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
        'naip-imagery': {
          type: 'raster',
          tiles: [
            'https://gis.apfo.usda.gov/arcgis/rest/services/NAIP/USDA_CONUS_PRIME/ImageServer/tile/{z}/{y}/{x}?blankTile=false',
          ],
          tileSize: 256,
        },
        'points-source': {
          type: 'geojson',
          data: pointsGeoJSON,
        } as GeoJSONSourceSpecification,
        'polygons-source': {
          type: 'geojson',
          data: polygonsGeoJSON,
        } as GeoJSONSourceSpecification,
      },
      layers: [
        {
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19,
        },
        {
          id: 'naip-imagery-tiles',
          type: 'raster',
          source: 'naip-imagery',
        },
        {
          id: 'polygons-layer',
          type: 'fill',
          source: 'polygons-source',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.6,
          },
        },
        {
          id: 'polygons-outline',
          type: 'line',
          source: 'polygons-source',
          paint: {
            'line-color': '#1e40af',
            'line-width': 2,
          },
        },
        {
          id: 'points-layer',
          type: 'circle',
          source: 'points-source',
          paint: {
            'circle-radius': 8,
            'circle-color': '#ef4444',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        },
      ]
    }

    // Define all available layers
    const allLayers = [
      { id: 'osm-tiles', name: 'OpenStreetMap Tiles' },
      { id: 'naip-imagery-tiles', name: 'NAIP Imagery' },
      { id: 'polygons-layer', name: 'Polygons Fill' },
      { id: 'polygons-outline', name: 'Polygons Outline' },
      { id: 'points-layer', name: 'Points' },
    ]

    // Layer visibility state for Map A and Map B
    const layerVisibilityA = ref<Record<string, boolean>>({
      'osm-tiles': true,
      'naip-imagery-tiles': false,
      'polygons-layer': true,
      'polygons-outline': true,
      'points-layer': true,
    })

    const layerVisibilityB = ref<Record<string, boolean>>({
      'osm-tiles': false,
      'naip-imagery-tiles': true,
      'polygons-layer': true,
      'polygons-outline': true,
      'points-layer': true,
    })

    // Computed arrays of visible layer IDs for Map A and Map B
    const mapLayersA = computed(() => {
      return allLayers
        .filter(layer => layerVisibilityA.value[layer.id])
        .map(layer => layer.id)
    })

    const mapLayersB = computed(() => {
      return allLayers
        .filter(layer => layerVisibilityB.value[layer.id])
        .map(layer => layer.id)
    })

    const toggleLayerA = (layerId: string) => {
      layerVisibilityA.value[layerId] = !layerVisibilityA.value[layerId]
    }

    const toggleLayerB = (layerId: string) => {
      layerVisibilityB.value[layerId] = !layerVisibilityB.value[layerId]
    }

    return {
      mapStyle,
      allLayers,
      layerVisibilityA,
      layerVisibilityB,
      mapLayersA,
      mapLayersB,
      toggleLayerA,
      toggleLayerB,
      center,
    }
  }
})
</script>

<template>
  <div class="demo-layer-compare">
    <div class="controls">
      <div class="control-group">
        <h3>Map A Layers</h3>
        <div class="layer-list">
          <div
            v-for="layer in allLayers"
            :key="`a-${layer.id}`"
            class="layer-item"
            @click="toggleLayerA(layer.id)"
          >
            <span class="visibility-icon" :class="{ visible: layerVisibilityA[layer.id] }">
              <svg v-if="layerVisibilityA[layer.id]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </span>
            <span class="layer-name">{{ layer.name }}</span>
          </div>
        </div>
      </div>

      <div class="control-group">
        <h3>Map B Layers</h3>
        <div class="layer-list">
          <div
            v-for="layer in allLayers"
            :key="`b-${layer.id}`"
            class="layer-item"
            @click="toggleLayerB(layer.id)"
          >
            <span class="visibility-icon" :class="{ visible: layerVisibilityB[layer.id] }">
              <svg v-if="layerVisibilityB[layer.id]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </span>
            <span class="layer-name">{{ layer.name }}</span>
          </div>
        </div>
      </div>

    </div>

    <div class="info">
      <p><strong>Instructions:</strong> Toggle layer visibility using the eye icons. Click and drag the slider to compare the two map views. Use your mouse or touch to pan, zoom, and rotate both maps simultaneously.</p>
    </div>

    <div class="map-container">
      <LayerCompare
        :mapStyle="mapStyle"
        :mapLayersA="mapLayersA"
        :mapLayersB="mapLayersB"
        :center="center"
        :zoom="9"
        :bearing="0"
        :pitch="0"
        :swiperOptions="swiperOptions"
      />
    </div>
  </div>
</template>

<style scoped>
.demo-layer-compare {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.controls {
  display: flex;
  gap: 20px;
  padding: 15px 20px;
  background: #ecf0f1;
  border-bottom: 1px solid #bdc3c7;
}

.control-group {
  flex: 1;
}

.control-group h3 {
  margin-bottom: 12px;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.layer-item:hover {
  background: #f8f9fa;
  border-color: #3498db;
}

.visibility-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: #95a5a6;
  flex-shrink: 0;
}

.visibility-icon.visible {
  color: #27ae60;
}

.layer-name {
  font-size: 13px;
  color: #2c3e50;
  user-select: none;
}

.info {
  padding: 12px 20px;
  background: #fff3cd;
  border-bottom: 1px solid #ffc107;
  color: #856404;
}

.info p {
  font-size: 13px;
  line-height: 1.5;
}

.map-container {
  flex: 1;
  position: relative;
  min-height: 500px;
}
</style>

