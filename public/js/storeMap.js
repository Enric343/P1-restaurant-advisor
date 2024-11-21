import { initMap, addStoreMarker, centerMap } from './modules/mapUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    const map = initMap('map');
    addStoreMarker(map, store.name, rating, store.address);
    centerMap(map, store.address, 15);
});