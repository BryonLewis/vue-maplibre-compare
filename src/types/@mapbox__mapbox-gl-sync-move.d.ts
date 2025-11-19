declare module '@mapbox/mapbox-gl-sync-move' {
  import type { Map } from 'maplibre-gl';
  
  /**
   * Synchronizes the movement of two MapLibre GL maps.
   * When one map is moved (panned, zoomed, rotated, etc.), the other map will move in sync.
   * 
   * @param mapA - The first map instance
   * @param mapB - The second map instance
   * @returns A cleanup function that removes the synchronization
   */
  function syncMove(mapA: Map, mapB: Map): () => void;
  
  export default syncMove;
}

