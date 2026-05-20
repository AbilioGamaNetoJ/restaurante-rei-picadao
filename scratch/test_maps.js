
const dotenv = require('dotenv');
dotenv.config();
const apiKey = process.env.GOOGLE_MAPS_API_KEY;
const origin = { lat: -27.4285, lng: -48.4593 };
const destination = { lat: -27.4285, lng: -48.4833 }; // Approx 2.4km away

async function testDistance() {
  const url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";
  
  const payload = {
    origins: [
      {
        waypoint: {
          location: {
            latLng: {
              latitude: origin.lat,
              longitude: origin.lng,
            },
          },
        },
      },
    ],
    destinations: [
      {
        waypoint: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng,
            },
          },
        },
      },
    ],
    travelMode: "DRIVE",
    routingPreference: "ROUTING_PREFERENCE_UNSPECIFIED",
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
    console.log("Routes API response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Failed to calculate distance:", error);
  }
}

testDistance();
