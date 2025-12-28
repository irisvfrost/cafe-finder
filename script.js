let map;
let userMarker = null;
let placesService = null;
let infoWindow = null;

const locateBtn = document.getElementById("locateBtn");
const findBtn = document.getElementById("findBtn");
const resultsList = document.getElementById("resultsList");

let placeMarkers = [];

function initMapOnceLoaded() {
  // Google Maps script loads async; this waits until google.maps is available
  const wait = setInterval(() => {
    if (window.google && google.maps) {
      clearInterval(wait);
      initMap();
    }
  }, 50);
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 42.3601, lng: -71.0589 }, // default: Boston
    zoom: 13,
  });

  infoWindow = new google.maps.InfoWindow();
  placesService = new google.maps.places.PlacesService(map);
}

function clearResults() {
  resultsList.innerHTML = "";
  placeMarkers.forEach((m) => m.setMap(null));
  placeMarkers = [];
}

function setUserLocation(latLng) {
  map.setCenter(latLng);
  map.setZoom(14);

  if (userMarker) userMarker.setMap(null);
  userMarker = new google.maps.Marker({
    position: latLng,
    map,
    title: "You are here",
  });

  findBtn.disabled = false;
}

function addResultToList(place, index) {
  const li = document.createElement("li");
  const name = place.name ?? "Unnamed place";
  const rating = place.rating ? `⭐ ${place.rating}` : "No rating";
  const address = place.vicinity ?? "Address unavailable";

  li.innerHTML = `
    <strong>${index + 1}. ${name}</strong>
    <div class="meta">${rating} • ${address}</div>
  `;

  li.style.cursor = "pointer";
  li.addEventListener("click", () => {
    if (place.geometry?.location) {
      map.panTo(place.geometry.location);
      map.setZoom(16);
      infoWindow.setContent(`<strong>${name}</strong><br/>${address}`);
      infoWindow.open(map);
    }
  });

  resultsList.appendChild(li);
}

function findCafesNearby() {
  if (!userMarker) return;

  clearResults();

  const request = {
    location: userMarker.getPosition(),
    radius: 1500, // meters
    type: "cafe",
    openNow: false,
  };

  // Nearby Search in the Places Library (Maps JS)
  placesService.nearbySearch(request, (results, status) => {
    if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
      resultsList.innerHTML = `<li>Could not load results (${status}).</li>`;
      return;
    }

    results.forEach((place, i) => {
      addResultToList(place, i);

      if (place.geometry?.location) {
        const marker = new google.maps.Marker({
          map,
          position: place.geometry.location,
          title: place.name,
        });

        marker.addListener("click", () => {
          const address = place.vicinity ?? "";
          infoWindow.setContent(`<strong>${place.name}</strong><br/>${address}`);
          infoWindow.open(map, marker);
        });

        placeMarkers.push(marker);
      }
    });
  });
}

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    },
    () => alert("Could not get your location. Please allow location access.")
  );
});

findBtn.addEventListener("click", findCafesNearby);

initMapOnceLoaded();
