<script lang="ts">
import { defineComponent, ref, computed, PropType, watch } from 'vue'
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
    layerOrder: {
      type: String as PropType<'topmost' | 'bottommost'>,
      default: 'topmost',
    },
  },
  setup(props) {
    const center: [number, number] = [-74.1847, 43.1339]

    // Generate GeoJSON points distributed around the center point
    const generatePoints = (count: number, center: [number, number], radius: number = 0.1) => {
      const points: GeoJSON.Feature<GeoJSON.Point, { id: number; name: string }>[] = []
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
        } as GeoJSON.Feature<GeoJSON.Point, { id: number; name: string }>)
      }
      return {
        type: 'FeatureCollection',
        features: points as GeoJSON.Feature<GeoJSON.Point, { id: number; name: string }>[]
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

    // Color state for GeoJSON layers
    const pointsColor = ref('#ef4444')
    const polygonsFillColor = ref('#3b82f6')
    const polygonsOutlineColor = ref('#1e40af')

    // Color picker dialog state
    const showColorDialog = ref(false)

    // Map Editor dialog state
    const showMapEditorDialog = ref(false)
    
    // Track which layers are enabled in the mapStyle
    const layerEnabled = ref<Record<string, boolean>>({
      'osm-tiles': true,
      'naip-imagery-tiles': true,
      'polygons-layer': true,
      'polygons-outline': true,
      'points-layer': true,
    })

    // Store original layer definitions for restoration
    const originalLayers = [
      {
        id: 'osm-tiles',
        type: 'raster' as const,
        source: 'osm',
        minzoom: 0,
        maxzoom: 19,
      },
      {
        id: 'naip-imagery-tiles',
        type: 'raster' as const,
        source: 'naip-imagery',
      },
      {
        id: 'polygons-layer',
        type: 'fill' as const,
        source: 'polygons-source',
        paint: {
          'fill-color': polygonsFillColor.value,
          'fill-opacity': 0.6,
        },
      },
      {
        id: 'polygons-outline',
        type: 'line' as const,
        source: 'polygons-source',
        paint: {
          'line-color': polygonsOutlineColor.value,
          'line-width': 2,
        },
      },
      {
        id: 'points-layer',
        type: 'circle' as const,
        source: 'points-source',
        paint: {
          'circle-radius': 8,
          'circle-color': pointsColor.value,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      },
    ]

    // Store map sources separately
    const mapSources = {
      osm: {
        type: 'raster' as const,
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
      },
      'naip-imagery': {
        type: 'raster' as const,
        tiles: [
          'https://gis.apfo.usda.gov/arcgis/rest/services/NAIP/USDA_CONUS_PRIME/ImageServer/tile/{z}/{y}/{x}?blankTile=false',
        ],
        tileSize: 256,
      },
      'points-source': {
        type: 'geojson' as const,
        data: pointsGeoJSON,
      } as GeoJSONSourceSpecification,
      'polygons-source': {
        type: 'geojson' as const,
        data: polygonsGeoJSON,
      } as GeoJSONSourceSpecification,
    }

    // Function to create mapStyle with current layers
    const createMapStyle = (): StyleSpecification => {
      const updatedLayers = originalLayers
        .filter(layer => layerEnabled.value[layer.id])
        .map(layer => {
          // Update colors if needed
          if (layer.id === 'points-layer' && layer.type === 'circle') {
            return {
              ...layer,
              paint: {
                ...layer.paint,
                'circle-color': pointsColor.value,
              }
            }
          }
          if (layer.id === 'polygons-layer' && layer.type === 'fill') {
            return {
              ...layer,
              paint: {
                ...layer.paint,
                'fill-color': polygonsFillColor.value,
              }
            }
          }
          if (layer.id === 'polygons-outline' && layer.type === 'line') {
            return {
              ...layer,
              paint: {
                ...layer.paint,
                'line-color': polygonsOutlineColor.value,
              }
            }
          }
          return { ...layer }
        })

      return {
        version: 8,
        name: 'Multi-Layer Map',
        sources: { ...mapSources },
        layers: updatedLayers,
      }
    }

    // Create a single map style with multiple sources
    const mapStyle = ref<StyleSpecification>(createMapStyle())

    // Function to update mapStyle layers based on enabled state and colors
    const updateMapStyleLayers = () => {
      // Create a completely new mapStyle object to ensure reactivity
      mapStyle.value = createMapStyle()
    }

    // Watch for color changes and update mapStyle
    watch([pointsColor, polygonsFillColor, polygonsOutlineColor], () => {
      updateMapStyleLayers()
    })

    // Watch for layer enabled/disabled changes and update mapStyle
    watch(layerEnabled, () => {
      updateMapStyleLayers()
    }, { deep: true })

    // Define all available layers
    const allLayers = [
      { id: 'osm-tiles', name: 'OpenStreetMap Tiles' },
      { id: 'naip-imagery-tiles', name: 'NAIP Imagery' },
      { id: 'polygons-layer', name: 'Polygons Fill' },
      { id: 'polygons-outline', name: 'Polygons Outline' },
      { id: 'points-layer', name: 'Points' },
    ]


    // Layer order arrays for manual reordering (Map A and Map B)
    const layerOrderA = ref<string[]>([...allLayers.map(l => l.id)])
    const layerOrderB = ref<string[]>([...allLayers.map(l => l.id)])

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

    // Helper function to get ordered layers based on visibility and order mode
    const getOrderedLayers = (
      visibility: Record<string, boolean>,
      order: string[],
    ) => {
      // Get visible layers
      return order.filter(layerId => visibility[layerId])
    }

    // Create a map for quick layer lookup
    const layerMap = new Map(allLayers.map(layer => [layer.id, layer]))

    // Computed arrays of layers in the order specified by layerOrderA and layerOrderB
    const orderedLayersA = computed(() => {
      return layerOrderA.value
        .map(layerId => layerMap.get(layerId))
        .filter((layer): layer is typeof allLayers[0] => layer !== undefined)
    })

    const orderedLayersB = computed(() => {
      return layerOrderB.value
        .map(layerId => layerMap.get(layerId))
        .filter((layer): layer is typeof allLayers[0] => layer !== undefined)
    })

    // Computed arrays of visible layer IDs for Map A and Map B
    const mapLayersA = computed(() => {
      return getOrderedLayers(layerVisibilityA.value, layerOrderA.value)
    })

    const mapLayersB = computed(() => {
      return getOrderedLayers(layerVisibilityB.value, layerOrderB.value)
    })

    const toggleLayerA = (layerId: string) => {
      layerVisibilityA.value[layerId] = !layerVisibilityA.value[layerId]
    }

    const toggleLayerB = (layerId: string) => {
      layerVisibilityB.value[layerId] = !layerVisibilityB.value[layerId]
    }

    // Functions to reorder layers
    const moveLayerUp = (layerId: string, map: 'A' | 'B') => {
      const order = map === 'A' ? layerOrderA : layerOrderB
      const index = order.value.indexOf(layerId)
      if (index > 0) {
        const newOrder = [...order.value]
        ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
        order.value = newOrder
      }
    }

    const moveLayerDown = (layerId: string, map: 'A' | 'B') => {
      const order = map === 'A' ? layerOrderA : layerOrderB
      const index = order.value.indexOf(layerId)
      if (index < order.value.length - 1) {
        const newOrder = [...order.value]
        ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
        order.value = newOrder
      }
    }

    // Color picker functions
    const openColorDialog = () => {
      showColorDialog.value = true
    }

    const closeColorDialog = () => {
      showColorDialog.value = false
    }

    // Map Editor functions
    const openMapEditorDialog = () => {
      showMapEditorDialog.value = true
    }

    const closeMapEditorDialog = () => {
      showMapEditorDialog.value = false
    }

    const toggleLayerEnabled = (layerId: string) => {
      layerEnabled.value[layerId] = !layerEnabled.value[layerId]
    }

      return {
      mapStyle,
      allLayers,
      orderedLayersA,
      orderedLayersB,
      layerVisibilityA,
      layerVisibilityB,
      mapLayersA,
      mapLayersB,
      toggleLayerA,
      toggleLayerB,
      center,
      layerOrderA,
      layerOrderB,
      moveLayerUp,
      moveLayerDown,
      pointsColor,
      polygonsFillColor,
      polygonsOutlineColor,
      showColorDialog,
      openColorDialog,
      closeColorDialog,
      showMapEditorDialog,
      openMapEditorDialog,
      closeMapEditorDialog,
      layerEnabled,
      toggleLayerEnabled,
    }
  }
})
</script>

<template>
  <div class="demo-layer-compare">
    <div class="controls">
      <div class="controls-header">
        <h2>Layer Compare Demo</h2>
        <div class="header-buttons">
          <button class="map-editor-button" @click="openMapEditorDialog()" title="Map Editor">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>Map Editor</span>
          </button>
          <button class="color-dialog-button" @click="openColorDialog()" title="Edit Layer Colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span>Colors</span>
          </button>
        </div>
      </div>
      <div class="control-groups">
        <div class="control-group">
        <h3>Map A Layers</h3>
        <div class="layer-list">
          <div
            v-for="layer in orderedLayersA"
            :key="`a-${layer.id}`"
            class="layer-item"
          >
            <div class="layer-item-content" @click="toggleLayerA(layer.id)">
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
            <div class="layer-controls">
              <button
                class="order-button"
                @click.stop="moveLayerUp(layer.id, 'A')"
                :disabled="layerOrderA.indexOf(layer.id) === 0"
                title="Move up"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
              <button
                class="order-button"
                @click.stop="moveLayerDown(layer.id, 'A')"
                :disabled="layerOrderA.indexOf(layer.id) === layerOrderA.length - 1"
                title="Move down"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="control-group">
        <h3>Map B Layers</h3>
        <div class="layer-list">
          <div
            v-for="layer in orderedLayersB"
            :key="`b-${layer.id}`"
            class="layer-item"
          >
            <div class="layer-item-content" @click="toggleLayerB(layer.id)">
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
            <div class="layer-controls">
              <button
                class="order-button"
                @click.stop="moveLayerUp(layer.id, 'B')"
                :disabled="layerOrderB.indexOf(layer.id) === 0"
                title="Move up"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
              <button
                class="order-button"
                @click.stop="moveLayerDown(layer.id, 'B')"
                :disabled="layerOrderB.indexOf(layer.id) === layerOrderB.length - 1"
                title="Move down"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

    </div>

    <!-- Color Picker Dialog -->
    <div v-if="showColorDialog" class="color-dialog-overlay" @click="closeColorDialog">
      <div class="color-dialog" @click.stop>
        <div class="color-dialog-header">
          <h3>GeoJSON Layer Colors</h3>
          <button class="close-button" @click="closeColorDialog">×</button>
        </div>
        <div class="color-dialog-body">
          <div class="color-picker-item">
            <label>Points Color</label>
            <div class="color-picker-controls">
              <input
                type="color"
                :value="pointsColor"
                @input="pointsColor = ($event.target as HTMLInputElement).value"
                class="color-input"
              />
              <input
                type="text"
                :value="pointsColor"
                @input="pointsColor = ($event.target as HTMLInputElement).value"
                class="color-text-input"
                placeholder="#000000"
              />
            </div>
          </div>
          <div class="color-picker-item">
            <label>Polygons Fill Color</label>
            <div class="color-picker-controls">
              <input
                type="color"
                :value="polygonsFillColor"
                @input="polygonsFillColor = ($event.target as HTMLInputElement).value"
                class="color-input"
              />
              <input
                type="text"
                :value="polygonsFillColor"
                @input="polygonsFillColor = ($event.target as HTMLInputElement).value"
                class="color-text-input"
                placeholder="#000000"
              />
            </div>
          </div>
          <div class="color-picker-item">
            <label>Polygons Outline Color</label>
            <div class="color-picker-controls">
              <input
                type="color"
                :value="polygonsOutlineColor"
                @input="polygonsOutlineColor = ($event.target as HTMLInputElement).value"
                class="color-input"
              />
              <input
                type="text"
                :value="polygonsOutlineColor"
                @input="polygonsOutlineColor = ($event.target as HTMLInputElement).value"
                class="color-text-input"
                placeholder="#000000"
              />
            </div>
          </div>
          <div class="color-dialog-actions">
            <button class="dialog-button dialog-button-primary" @click="closeColorDialog">Done</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Editor Dialog -->
    <div v-if="showMapEditorDialog" class="color-dialog-overlay" @click="closeMapEditorDialog">
      <div class="color-dialog" @click.stop>
        <div class="color-dialog-header">
          <h3>Map Editor</h3>
          <button class="close-button" @click="closeMapEditorDialog">×</button>
        </div>
        <div class="map-editor-body">
          <p class="map-editor-description">Enable or disable layers in the map style. Disabled layers will be removed from both maps.</p>
          <div class="map-editor-layer-list">
            <div
              v-for="layer in allLayers"
              :key="layer.id"
              class="map-editor-layer-item"
            >
              <label class="map-editor-layer-label">
                <input
                  type="checkbox"
                  :checked="layerEnabled[layer.id]"
                  @change="toggleLayerEnabled(layer.id)"
                  class="map-editor-checkbox"
                />
                <span class="map-editor-layer-name">{{ layer.name }}</span>
              </label>
            </div>
          </div>
          <div class="color-dialog-actions">
            <button class="dialog-button dialog-button-primary" @click="closeMapEditorDialog">Done</button>
          </div>
        </div>
      </div>
    </div>

    <div class="info">
      <p><strong>Instructions:</strong> Toggle layer visibility using the eye icons. Use the up/down arrows to reorder layers. Click the settings button to change layer order mode. Click and drag the slider to compare the two map views. Use your mouse or touch to pan, zoom, and rotate both maps simultaneously.</p>
    </div>

    <div class="map-container">
      <LayerCompare
        :mapStyle="mapStyle"
        :mapLayersA="mapLayersA"
        :mapLayersB="mapLayersB"
        :camera="{center, zoom: 9, bearing: 0, pitch: 0}"
        :swiperOptions="swiperOptions"
        :layerOrder="layerOrder"
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
  flex-direction: column;
  gap: 15px;
  padding: 15px 20px;
  background: #ecf0f1;
  border-bottom: 1px solid #bdc3c7;
}

.controls-header {
  margin-bottom: 5px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.controls-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.map-editor-button,
.color-dialog-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  cursor: pointer;
  color: #2c3e50;
  font-size: 13px;
  transition: all 0.2s;
}

.map-editor-button:hover,
.color-dialog-button:hover {
  background: #f8f9fa;
  border-color: #3498db;
  color: #3498db;
}

.map-editor-button svg,
.color-dialog-button svg {
  flex-shrink: 0;
}

.control-groups {
  display: flex;
  gap: 20px;
}

.controls-header h2 {
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
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
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: white;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  transition: all 0.2s;
}

.layer-item:hover {
  background: #f8f9fa;
  border-color: #3498db;
}

.layer-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  cursor: pointer;
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

.layer-controls {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.order-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 20px;
  padding: 0;
  background: transparent;
  border: 1px solid #bdc3c7;
  border-radius: 2px;
  cursor: pointer;
  color: #2c3e50;
  transition: all 0.2s;
}

.order-button:hover:not(:disabled) {
  background: #3498db;
  border-color: #3498db;
  color: white;
}

.order-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
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
  margin: 0;
}

.map-container {
  flex: 1;
  position: relative;
  min-height: 500px;
}

.color-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.color-dialog {
  background: white;
  border-radius: 8px;
  padding: 20px;
  min-width: 300px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.color-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.color-dialog-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  color: #95a5a6;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-button:hover {
  background: #ecf0f1;
  color: #2c3e50;
}

.color-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.color-picker-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-picker-item label {
  font-size: 13px;
  font-weight: 500;
  color: #2c3e50;
}

.color-picker-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.color-input {
  width: 80px;
  height: 50px;
  border: 2px solid #bdc3c7;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.color-text-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 13px;
  color: #2c3e50;
  font-family: monospace;
}

.color-text-input:focus {
  outline: none;
  border-color: #3498db;
}

.color-dialog-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.dialog-button {
  padding: 8px 16px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.dialog-button-primary {
  background: #3498db;
  color: white;
  border-color: #3498db;
}

.dialog-button-primary:hover {
  background: #2980b9;
  border-color: #2980b9;
}

.map-editor-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.map-editor-description {
  font-size: 13px;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.5;
}

.map-editor-layer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-editor-layer-item {
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  transition: all 0.2s;
}

.map-editor-layer-item:hover {
  background: #e9ecef;
  border-color: #bdc3c7;
}

.map-editor-layer-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.map-editor-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3498db;
}

.map-editor-layer-name {
  font-size: 14px;
  color: #2c3e50;
  font-weight: 500;
}
</style>

