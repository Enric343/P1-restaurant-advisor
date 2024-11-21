import { initMap, addStoreMarker, centerMap } from './modules/mapUtils.js';

document.addEventListener('DOMContentLoaded', () => {
    const map = initMap('map');

    centerMap(map, mapValues[0].address, 15); // centra el mapa en la primera dirección
   
    mapValues.forEach(({ name, rating, address }) => {
        addStoreMarker(map, name, rating, address);
    });
});