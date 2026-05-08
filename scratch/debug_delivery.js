const dotenv = require('dotenv');


dotenv.config();

async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY not configured.");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:BR&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.error("Geocoding API error:", data);
      return null;
    }

    const location = data.results[0].geometry.location;
    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: data.results[0].formatted_address
    };
  } catch (error) {
    console.error("Failed to geocode address:", error);
    return null;
  }
}

async function calculateDistance(origin, destination) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
  
  const payload = {
    origins: [{ waypoint: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } } }],
    destinations: [{ waypoint: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } } }],
    travelMode: "DRIVE",
    units: "METRIC",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "originIndex,destinationIndex,duration,distanceMeters,status",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Failed to calculate distance:", error);
    return null;
  }
}

async function test() {
  const storeAddress = "R. Francisco Jacinto de Melo, 1449 - Areias, São José - SC, 88113-300";
  const customerAddress = "Rua José Victor da Rosa, 100, São José - SC"; // Should be very close

  console.log("Geocoding store...");
  const storeGeo = await geocodeAddress(storeAddress);
  console.log("Store Geo:", storeGeo);

  console.log("\nGeocoding customer...");
  const customerGeo = await geocodeAddress(customerAddress);
  console.log("Customer Geo:", customerGeo);

  if (storeGeo && customerGeo) {
    console.log("\nCalculating distance...");
    const dist = await calculateDistance(storeGeo, customerGeo);
    console.log("Distance Data:", JSON.stringify(dist, null, 2));
    
    if (dist && dist[0] && dist[0].distanceMeters) {
        console.log(`\nResult: ${(dist[0].distanceMeters / 1000).toFixed(2)} km`);
    }
  }
}

test();
