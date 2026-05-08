
const apiKey = "AIzaSyBXqNUkRvxcjvyF2m-GSf15uQOXH2Fa7Lc";
const storeAddress = "R. Francisco Jacinto de Melo, 1449 - Areias, São José - SC, 88113-300";

async function testGeocode() {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(storeAddress)}&key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Geocode response:", JSON.stringify(data, null, 2));
    
    if (data.status === "OK") {
      const loc = data.results[0].geometry.location;
      console.log(`LAT: ${loc.lat}, LNG: ${loc.lng}`);
    }
  } catch (error) {
    console.error("Failed to geocode address:", error);
  }
}

testGeocode();
