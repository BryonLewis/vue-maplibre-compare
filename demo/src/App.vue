<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import DemoMapCompare from './DemoMapCompare.vue'
import DemoLayerCompare from './DemoLayerCompare.vue'
import type { SwiperOptions } from '../../src/components/MapCompare.vue'

type DemoMode = 'map-compare' | 'layer-compare'

export default defineComponent({
  name: 'App',
  components: {
    DemoMapCompare,
    DemoLayerCompare
  },
  setup() {
    const demoMode = ref<DemoMode>('map-compare')
    const showSwiperSettings = ref(false)
    const showLayerSettings = ref(false)
    const layerOrder = ref<'topmost' | 'bottommost'>('topmost')

    // Swiper options with defaults
    const swiperOptions = ref<SwiperOptions>({
      thickness: 4,
      orientation: 'vertical',
      grabThickness: 20,
      handleSize: 40,
      lineColor: '#ffffff',
      handleColor: '#ffffff',
      handleShadowColor: 'rgba(0, 0, 0, 0.3)',
      arrowColor: '#666666',
      darkMode: false,
    })

    // Computed swiper options that excludes color properties when darkMode is enabled
    const computedSwiperOptions = computed((): SwiperOptions => {
      if (swiperOptions.value.darkMode) {
        // When darkMode is true, exclude color properties
        const { lineColor, handleColor, handleShadowColor, arrowColor, ...rest } = swiperOptions.value
        return rest as SwiperOptions
      }
      return swiperOptions.value
    })

    // Helper function to extract hex color from CSS color string
    const getHexColor = (color: string | undefined): string => {
      if (!color) return '#000000'
      // If it's already a hex color, return it
      if (color.startsWith('#')) return color
      // If it's rgba/rgb, try to convert (simplified - just return a default)
      // For rgba, we'll just return black as color picker doesn't support alpha
      if (color.startsWith('rgba') || color.startsWith('rgb')) {
        // Extract RGB values (simplified parsing)
        const match = color.match(/\d+/g)
        if (match && match.length >= 3) {
          const r = parseInt(match[0]).toString(16).padStart(2, '0')
          const g = parseInt(match[1]).toString(16).padStart(2, '0')
          const b = parseInt(match[2]).toString(16).padStart(2, '0')
          return `#${r}${g}${b}`
        }
      }
      return '#000000'
    }

    const updateColorFromPicker = (property: 'lineColor' | 'handleColor' | 'handleShadowColor' | 'arrowColor', value: string) => {
      if (swiperOptions.value) {
        (swiperOptions.value as any)[property] = value
      }
    }

    return {
      demoMode,
      swiperOptions,
      computedSwiperOptions,
      showSwiperSettings,
      showLayerSettings,
      layerOrder,
      getHexColor,
      updateColorFromPicker,
    }
  }
})
</script>

<template>
  <div id="app">
    <div class="demo-selector">
      <div class="selector-buttons">
        <button
          class="selector-button"
          :class="{ active: demoMode === 'map-compare' }"
          @click="demoMode = 'map-compare'"
        >
          Map Compare
        </button>
        <button
          class="selector-button"
          :class="{ active: demoMode === 'layer-compare' }"
          @click="demoMode = 'layer-compare'"
        >
          Layer Compare
        </button>
      </div>
      <div class="settings-buttons">
        <button 
          v-if="demoMode === 'layer-compare'"
          class="settings-button" 
          @click="showLayerSettings = true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"></path>
          </svg>
          Layer Settings
        </button>
        <button class="settings-button" @click="showSwiperSettings = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
          </svg>
          Swiper Settings
        </button>
      </div>
    </div>

    <div class="demo-content">
      <DemoMapCompare v-if="demoMode === 'map-compare'" :swiperOptions="computedSwiperOptions" />
      <DemoLayerCompare v-else-if="demoMode === 'layer-compare'" :swiperOptions="computedSwiperOptions" :layerOrder="layerOrder" />
    </div>

    <!-- Swiper Settings Modal -->
    <div v-if="showSwiperSettings" class="modal-overlay" @click.self="showSwiperSettings = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Swiper Settings</h2>
          <button class="close-button" @click="showSwiperSettings = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>
              <input type="checkbox" v-model="swiperOptions.darkMode" />
              <span style="margin-left: 8px;">Dark Mode</span>
            </label>
          </div>

          <div class="form-group">
            <label>Orientation</label>
            <select v-model="swiperOptions.orientation">
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>

          <div class="form-group">
            <label>Thickness (px)</label>
            <input type="number" v-model.number="swiperOptions.thickness" min="1" max="20" />
          </div>

          <div class="form-group">
            <label>Grab Thickness (px)</label>
            <input type="number" v-model.number="swiperOptions.grabThickness" min="1" max="50" />
          </div>

          <div class="form-group">
            <label>Handle Size (px)</label>
            <input type="number" v-model.number="swiperOptions.handleSize" min="10" max="100" />
          </div>

          <div class="form-group">
            <label>Line Color</label>
            <div class="color-input-group">
              <input 
                type="text" 
                v-model="swiperOptions.lineColor" 
                placeholder="#ffffff" 
                :disabled="swiperOptions.darkMode"
              />
              <input 
                type="color" 
                :value="getHexColor(swiperOptions.lineColor)" 
                @input="updateColorFromPicker('lineColor', ($event.target as HTMLInputElement).value)" 
                :disabled="swiperOptions.darkMode"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Handle Color</label>
            <div class="color-input-group">
              <input 
                type="text" 
                v-model="swiperOptions.handleColor" 
                placeholder="#ffffff" 
                :disabled="swiperOptions.darkMode"
              />
              <input 
                type="color" 
                :value="getHexColor(swiperOptions.handleColor)" 
                @input="updateColorFromPicker('handleColor', ($event.target as HTMLInputElement).value)" 
                :disabled="swiperOptions.darkMode"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Handle Shadow Color</label>
            <div class="color-input-group">
              <input 
                type="text" 
                v-model="swiperOptions.handleShadowColor" 
                placeholder="rgba(0, 0, 0, 0.3)" 
                :disabled="swiperOptions.darkMode"
              />
              <input 
                type="color" 
                :value="getHexColor(swiperOptions.handleShadowColor)" 
                @input="updateColorFromPicker('handleShadowColor', ($event.target as HTMLInputElement).value)" 
                :disabled="swiperOptions.darkMode"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Arrow Color</label>
            <div class="color-input-group">
              <input 
                type="text" 
                v-model="swiperOptions.arrowColor" 
                placeholder="#666666" 
                :disabled="swiperOptions.darkMode"
              />
              <input 
                type="color" 
                :value="getHexColor(swiperOptions.arrowColor)" 
                @input="updateColorFromPicker('arrowColor', ($event.target as HTMLInputElement).value)" 
                :disabled="swiperOptions.darkMode"
              />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="reset-button" @click="swiperOptions = {
            thickness: 4,
            orientation: 'vertical',
            grabThickness: 20,
            handleSize: 40,
            lineColor: '#ffffff',
            handleColor: '#ffffff',
            handleShadowColor: 'rgba(0, 0, 0, 0.3)',
            arrowColor: '#666666',
            darkMode: false,
          }">Reset to Defaults</button>
          <button class="close-button-primary" @click="showSwiperSettings = false">Close</button>
        </div>
      </div>
    </div>

    <!-- Layer Settings Modal -->
    <div v-if="showLayerSettings" class="modal-overlay" @click.self="showLayerSettings = false">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Layer Compare Settings</h2>
          <button class="close-button" @click="showLayerSettings = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="layer-order">Layer Order:</label>
            <select id="layer-order" v-model="layerOrder">
              <option value="topmost">Topmost</option>
              <option value="bottommost">Bottommost</option>
            </select>
            <p style="margin-top: 8px; font-size: 12px; color: #7f8c8d; line-height: 1.5;">
              Controls the order in which layers are rendered. Topmost renders layers with the topmost layer first, while bottommost renders layers with the bottommost layer first.
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="close-button-primary" @click="showLayerSettings = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

#app {
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20px;
  background: #2c3e50;
  color: white;
  text-align: center;
}

.header h1 {
  margin-bottom: 10px;
  font-size: 28px;
}

.header p {
  color: #ecf0f1;
  font-size: 14px;
}

.demo-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0;
  padding: 0;
  background: #34495e;
  border-bottom: 2px solid #2c3e50;
}

.selector-buttons {
  display: flex;
  flex: 1;
}

.selector-button {
  flex: 1;
  padding: 12px 24px;
  background: #34495e;
  color: #ecf0f1;
  border: none;
  border-right: 1px solid #2c3e50;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.selector-button:last-child {
  border-right: none;
}

.selector-button:hover {
  background: #3d566e;
  color: white;
}

.selector-button.active {
  background: #3498db;
  color: white;
}

.selector-button.active:hover {
  background: #2980b9;
}

.settings-buttons {
  display: flex;
  border-left: 1px solid #2c3e50;
}

.settings-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: #27ae60;
  color: white;
  border: none;
  border-right: 1px solid #2c3e50;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.settings-button:last-child {
  border-right: none;
}

.settings-button:hover {
  background: #229954;
}

.demo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-overlay {
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

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #2c3e50;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  color: #7f8c8d;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input[type="number"],
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 14px;
}

.color-input-group {
  display: flex;
  gap: 8px;
}

.color-input-group input[type="text"] {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  font-size: 14px;
}

.color-input-group input[type="color"] {
  width: 50px;
  height: 40px;
  border: 1px solid #bdc3c7;
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3498db;
}

.form-group input:disabled,
.form-group input[type="color"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.form-group label input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.reset-button,
.close-button-primary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-button {
  background: #e74c3c;
  color: white;
}

.reset-button:hover {
  background: #c0392b;
}

.close-button-primary {
  background: #3498db;
  color: white;
}

.close-button-primary:hover {
  background: #2980b9;
}
</style>
