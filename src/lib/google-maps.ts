export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY not configured.");

  // Add country and region hints for better accuracy in Brazil
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:BR&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.error("Geocoding API error:", data);
      return null;
    }

    // Check if the result is actually in the expected area (optional, but good for debugging)
    const location = data.results[0].geometry.location;
    console.log(`Geocoded "${address}" to:`, location);
    
    return {
      lat: location.lat,
      lng: location.lng,
    };
  } catch (error) {
    console.error("Failed to geocode address:", error);
    return null;
  }
}

export async function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distanceKm: number; durationMin: number } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_MAPS_API_KEY not configured.");

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
    routingPreference: "TRAFFIC_AWARE", // More reliable for distance matrix
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
    console.log("Routes API response:", JSON.stringify(data, null, 2));

    if (!Array.isArray(data) || data.length === 0) {
      console.error("Routes API error: Not an array or empty.");
      return null;
    }

    const route = data[0];
    
    if (route.status?.code && route.status.code !== 0) {
      console.error("Route error:", route.status);
      return null;
    }

    if (!route.duration || route.distanceMeters === undefined) {
      console.error("Route error: Missing duration or distance data in response.", route);
      return null;
    }

    // Convert duration "1234s" to minutes
    const durationSeconds = parseInt(route.duration.replace("s", ""), 10);
    const durationMin = Math.round(durationSeconds / 60);
    
    // Convert distanceMeters to km
    const distanceKm = route.distanceMeters / 1000;

    return {
      distanceKm,
      durationMin,
    };
  } catch (error) {
    console.error("Failed to calculate distance:", error);
    return null;
  }
}
