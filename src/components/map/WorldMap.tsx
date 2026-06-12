"use client";

import { useState, useRef, useCallback } from "react";
import Map, {
  Marker,
  Popup,
  MapRef,
  NavigationControl,
  Source,
  Layer,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import type { MapPoint } from "@/types/map";
import { YunnanMarker } from "./YunnanOverlay";
import {
  YUNNAN_GEOJSON,
  YUNNAN_COLORS,
  EARTH_DEFAULT_VIEW,
  GLOBE_FOG,
} from "@/lib/map-constants";

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
      pitch: 45,
      bearing: 0,
      duration: 2500,
      curve: 1.5,
    });
  }, []);

  const resetView = useCallback(() => {
    mapRef.current?.flyTo({
      center: [EARTH_DEFAULT_VIEW.longitude, EARTH_DEFAULT_VIEW.latitude],
      zoom: EARTH_DEFAULT_VIEW.zoom,
      pitch: EARTH_DEFAULT_VIEW.pitch,
      bearing: EARTH_DEFAULT_VIEW.bearing,
      duration: 2000,
      curve: 1.2,
    });
  }, []);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full bg-white/5 rounded-xl border border-white/10">
        <p className="text-white/40 text-sm">Mapbox Token 未配置</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className || "h-[600px] w-full"}`}>
      <Map
        ref={mapRef}
        mapboxAccessToken={token}
        // ── 3D Globe 投影 ──
        projection="globe"
        // ── 大气层 + 星空效果 ──
        fog={GLOBE_FOG}
        initialViewState={{
          longitude: EARTH_DEFAULT_VIEW.longitude,
          latitude: EARTH_DEFAULT_VIEW.latitude,
          zoom: EARTH_DEFAULT_VIEW.zoom,
          pitch: EARTH_DEFAULT_VIEW.pitch,
          bearing: EARTH_DEFAULT_VIEW.bearing,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        attributionControl={false}
        // ── 交互手势 ──
        dragRotate
        touchZoomRotate
        touchPitch
        scrollZoom
        doubleClickZoom
        pitchWithRotate={false}
      >
        <NavigationControl position="bottom-right" />

        {/* ── 云南区域 GeoJSON 填充层 ── */}
        <Source id="yunnan" type="geojson" data={YUNNAN_GEOJSON}>
          {/* 半透明填充 */}
          <Layer
            id="yunnan-fill"
            type="fill"
            paint={{
              "fill-color": YUNNAN_COLORS.fill,
              "fill-opacity": YUNNAN_COLORS.fillOpacity,
              "fill-outline-color": YUNNAN_COLORS.border,
            }}
          />
          {/* 发光边框 */}
          <Layer
            id="yunnan-glow"
            type="line"
            paint={{
              "line-color": YUNNAN_COLORS.glow,
              "line-width": 2,
              "line-opacity": 0.8,
              "line-blur": 4,
            }}
          />
        </Source>

        {/* ── 云南脉冲标记 ── */}
        <YunnanMarker />

        {/* ── 数据库中的地图标记点 ── */}
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

      {/* ── 复位视角按钮 ── */}
      <button
        onClick={resetView}
        className="absolute top-20 right-4 z-10 flex items-center gap-1.5 px-3 py-2 text-xs text-white/60 hover:text-white/90 bg-black/75 backdrop-blur-xl rounded-lg border border-white/10 hover:border-white/20 transition-colors"
        aria-label="复位地球视角"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        复位视角
      </button>
    </div>
  );
}
