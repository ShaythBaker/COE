import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MapLocationPicker = ({ latitude, longitude, onChange }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const geocoderRef = useRef(null);

  const didIntroRef = useRef(false);

  const DEFAULT_LAT = 31.903211;
  const DEFAULT_LNG = 35.909068;

  // Helper: set/move marker
  const setMarker = (map, lng, lat) => {
    if (!markerRef.current) {
      markerRef.current = new mapboxgl.Marker({ color: "red" })
        .setLngLat([lng, lat])
        .addTo(map);
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }
  };

  useEffect(() => {
    if (mapRef.current) return;

    const targetLat = latitude || DEFAULT_LAT;
    const targetLng = longitude || DEFAULT_LNG;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/shayth1/cmj2k5mnh006o01sdgiau2k2h",

      // Start from globe view
      center: [0, 20],
      zoom: 1.2,
      pitch: 0,
      bearing: 0,

      // Globe projection (Mapbox GL v2+)
      projection: "globe",
    });

    mapRef.current = map;

    // Controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add Search (Geocoder)
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl,
      marker: false,
      placeholder: "Search location...",
    });
    geocoderRef.current = geocoder;
    map.addControl(geocoder, "top-left");

    // Optional: fog for nicer globe atmosphere (if supported)
    map.on("style.load", () => {
      try {
        map.setFog({
          range: [0.5, 10],
          color: "white",
          "horizon-blend": 0.2,
        });
      } catch (e) {
        // ignore if not supported by your mapbox version/style
      }
    });

    // Handle geocoder results
    geocoder.on("result", (e) => {
      const [lng, lat] = e.result.center;

      setMarker(map, lng, lat);
      onChange?.({ lat, lng });

      // Smooth cinematic fly
      map.flyTo({
        center: [lng, lat],
        zoom: 18,
        pitch: 60,
        bearing: -20,
        duration: 3500,
        curve: 1.6,
        speed: 1.2,
        essential: true,
      });

      // Mark intro as done (so props effect can move map later)
      didIntroRef.current = true;
    });

    // Click to pick location
    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;

      setMarker(map, lng, lat);
      onChange?.({ lat, lng });

      // once user interacts, consider intro done
      didIntroRef.current = true;
    });

    // Cinematic intro: globe -> target -> landscape
    map.on("load", () => {
      // First fly from globe to target
      map.flyTo({
        center: [targetLng, targetLat],
        zoom: 18,
        pitch: 60,
        bearing: -20,
        duration: 6500,
        curve: 1.7,
        speed: 1.1,
        essential: true,
      });

      // After the fly finishes, drop marker and do a small settle/scroll
      map.once("moveend", () => {
        // switch to mercator for normal map navigation (optional but recommended)
        try {
          map.setProjection("mercator");
        } catch (e) {}

        setMarker(map, targetLng, targetLat);

        map.easeTo({
          center: [targetLng + 0.0003, targetLat],
          duration: 1600,
          pitch: 55,
          bearing: -10,
          easing: (t) => t,
        });

        didIntroRef.current = true;
      });
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // If parent changes lat/lng (form inputs), update marker + camera
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // don't fight the intro animation
    if (!didIntroRef.current) return;

    const lat = latitude || DEFAULT_LAT;
    const lng = longitude || DEFAULT_LNG;

    setMarker(map, lng, lat);

    map.flyTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 16),
      duration: 900,
      essential: true,
    });
  }, [latitude, longitude]);

  return (
    <div
      ref={mapContainer}
      style={{
        height: "350px",
        width: "100%",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
};

export default MapLocationPicker;
