const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API;

export async function geocodeAddress(address) {
  if (!GOOGLE_API_KEY) {
    console.error("Google Maps API Key missing");
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else {
      console.warn("Geocoding failed:", data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error("Error during geocoding:", error);
    throw error;
  }
}
export async function getDistanceMatrix(origin, destination) {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=bicycling&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error("Error during distance matrix calculation:", error);
    throw error;
  }
}
