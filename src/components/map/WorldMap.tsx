"use client";

import { useState, useRef, useCallback } from "react";
import Map, { Marker, Popup, MapRef, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapPoint } from "@/types/map";

interface WorldMapProps {
  points: MapPoint[];
  className?: string;
}

export function WorldMap({ points, className }: WorldMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<MapPoint | null>(null);

  const flyToPoint = useCallback((point: MapPoint) => {
    mapRef.current?.flyTo({
      center: [point.longitude, point.latitude],
      zoom: 8,
      duration: 2000,
    });
  }, []);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full bg-white/5 rounded-xl border border-white/10">
        <p className="text-white/40 text-sm">
          Mapbox Token 未配置
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className || "h-[600px] w-full"}`}>
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        initialViewState={{
          longitude: 100,
          latitude: 20,
          zoom: 1.5,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" />

        {points.map((point) => (
          <Marker
            key={point.id}
            longitude={point.longitude}
            latitude={point.latitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupInfo(point);
            }}
          >
            <button
              onClick={() => flyToPoint(point)}
              className="w-3 h-3 rounded-full cursor-pointer border-2 transition-transform hover:scale-150 block"
              style={{
                backgroundColor:
                  point.type === "visited"
                    ? "#fb923c"
                    : point.type === "highlight"
                    ? "#f472b6"
                    : "rgba(255,255,255,0.3)",
                borderColor:
                  point.type === "visited"
                    ? "#fdba74"
                    : point.type === "highlight"
                    ? "#f9a8d4"
                    : "rgba(255,255,255,0.5)",
              }}
              aria-label={point.name}
            />
          </Marker>
        ))}

        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton={false}
          >
            <div className="p-2 text-black">
              <p className="font-medium text-sm">{popupInfo.name}</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
