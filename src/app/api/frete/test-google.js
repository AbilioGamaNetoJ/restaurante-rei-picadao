const dotenv = require('dotenv');
dotenv.config();
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

async function geocodeAddress(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:BR&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK") return null;
  return data.results[0].geometry.location;
}

async function calculateDistance(origin, destination) {
  const url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
  const payload = {
    origins: [{ waypoint: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } } }],
    destinations: [{ waypoint: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } } }],
    travelMode: "DRIVE",
    routingPreference: "BALANCED",
    units: "METRIC",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
      "X-Goog-FieldMask": "distanceMeters,status",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return data[0].distanceMeters / 1000;
}

async function test() {
  const storeAddress = "R. Francisco Jacinto de Melo, 1449 - Areias, São José - SC, 88113-300";
  const customerAddressWithNeighborhood = "Rua José Victor da Rosa, 100 - Areias, São José - SC, 88117-405, Brazil";
  const customerAddressWithoutNeighborhood = "Rua José Victor da Rosa, 100 - São José - SC, 88117-405, Brazil";


  console.log("Geocoding store...");
  const origin = await geocodeAddress(storeAddress);
  console.log("Origin:", origin);

  console.log("\nTesting WITH neighborhood...");
  const dest1 = await geocodeAddress(customerAddressWithNeighborhood);
  console.log("Destination 1:", dest1);
  if (dest1) {
    const dist1 = await calculateDistance(origin, dest1);
    console.log("Distance 1:", dist1, "km");
  }

  console.log("\nTesting WITHOUT neighborhood (current bug)...");
  const dest2 = await geocodeAddress(customerAddressWithoutNeighborhood);
  console.log("Destination 2:", dest2);
  if (dest2) {
    const dist2 = await calculateDistance(origin, dest2);
    console.log("Distance 2:", dist2, "km");
  }
}

test();
