
export function addTileLayer(map) {
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}


export function addMarker(map, name, rating, coordinates) {
    // Crear el marcador en las coordenadas especificadas
    const marker = L.marker(coordinates).addTo(map);

    // Texto adicional que quieres mostrar en el popup
    const popupContent = `
        <b>${name}</b><br>
        Puntuación: ${rating}/5<br>
    `;

    // Asignar el contenido del popup al marcador
    marker.bindPopup(popupContent);
    marker.openPopup();
}


// Usar el geocodificador para obtener latitud y longitud
const geocoder = L.Control.Geocoder.nominatim();

export async function getCoordinates(address) {
    return new Promise((resolve, reject) => {
        geocoder.geocode(address, function(results) {
            const result = results[0];
            if (result) {
                const lat = result.center.lat;
                const lng = result.center.lng;
                resolve([lat, lng]);
            } else {
                reject("Dirección no encontrada");
            }
        });
    });
}


export async function centerMap(map, address, zoom) {
    const coordinates = await getCoordinates(address); 
    map.setView(coordinates, zoom);
}


export function initMap(mapId) {
    let map = L.map(mapId); // Crear un mapa en el div con id 'map'
    addTileLayer(map); // Añadir capa de mapa base

    return map;
}


export async function addStoreMarker(map, name, rating, address) {
    try {
        const coordinates = await getCoordinates(address);  
        
        // Añadir un marcador en una posición inicial
        addMarker(map, name, rating, coordinates); 
    } catch (error) {
        console.error("Error al obtener las coordenadas:", error);
    }
}
