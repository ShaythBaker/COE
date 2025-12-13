import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const MapLocationPicker = ({ latitude, longitude, onChange }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const DEFAULT_LAT = 31.903211;
  const DEFAULT_LNG = 35.909068;

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/shayth1/cmj2k5mnh006o01sdgiau2k2h",
        center: [longitude || DEFAULT_LNG, latitude || DEFAULT_LAT],

        pitch: 10, // pitch in degrees
        bearing: -1, // bearing in degrees
        zoom: 5,
      });

      // Add click handler
      mapRef.current.on("click", (e) => {
        const { lng, lat } = e.lngLat;

        // Move marker
        if (!markerRef.current) {
          markerRef.current = new mapboxgl.Marker({ color: "red" })
            .setLngLat([lng, lat])
            .addTo(mapRef.current);
        } else {
          markerRef.current.setLngLat([lng, lat]);
        }

        if (onChange) onChange({ lat, lng });
      });
    }
  }, []);

  // Update marker if form changes
  useEffect(() => {
    if (!mapRef.current) return;

    const lat = latitude || DEFAULT_LAT;
    const lng = longitude || DEFAULT_LNG;

    if (!markerRef.current) {
      markerRef.current = new mapboxgl.Marker({ color: "red" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }

    mapRef.current.setCenter([lng, lat]);
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
