"use client";

import {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import {
  CameraControls,
  useTexture,
  shaderMaterial,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import type { MapPoint } from "@/types/map";
import { SearchResultMarker } from "./SearchResultMarker";

// ============================================================
// 常量
// ============================================================

const EARTH_RADIUS = 2;
const ATMOSPHERE_RADIUS = 2.1;
const MARKER_3D_RADIUS = 2.04;

const PLANE_WIDTH = EARTH_RADIUS * Math.PI * 2; // 4π ≈ 12.57
const PLANE_HEIGHT = EARTH_RADIUS * Math.PI; // 2π ≈ 6.28
const MARKER_PLANE_Z = 0.02;

const YUNNAN_LAT = 25;
const YUNNAN_LNG = 102;

const EARTH_TEXTURE_URL =
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";

type ViewMode = "globe" | "flat";

// ============================================================
// 搜索目标类型（由外部 AmapSearch 选中后传入）
// ============================================================

export interface SearchTarget {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
}

// ============================================================
// 坐标转换
// ============================================================

/** 经纬度 → 球面 3D 坐标 */
function latLngToGlobe(
  lat: number,
  lng: number,
  radius: number
): [number, number, number] {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lng + 180);
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

/** 经纬度 → 平面 equirectangular 坐标 */
function latLngToPlane(lat: number, lng: number): [number, number, number] {
  const x = (lng / 180) * (PLANE_WIDTH / 2);
  const y = (lat / 90) * (PLANE_HEIGHT / 2);
  return [x, y, MARKER_PLANE_Z];
}

/** 沿径向向外偏移，用于弹窗定位 */
function radialOffset(
  pos: [number, number, number],
  offset: number
): [number, number, number] {
  const len = Math.sqrt(pos[0] ** 2 + pos[1] ** 2 + pos[2] ** 2);
  if (len === 0) return [pos[0], pos[1], pos[2] + offset];
  const factor = (len + offset) / len;
  return [pos[0] * factor, pos[1] * factor, pos[2] * factor];
}

// ============================================================
// 大气 Shader
// ============================================================

const AtmosphereMaterial = shaderMaterial(
  { uColor: new THREE.Color("#4da6ff"), uIntensity: 0.3 },
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(mat3(modelMatrix) * normal);
      vPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 uColor;
    uniform float uIntensity;
    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = 1.0 - abs(dot(viewDir, vNormal));
      fresnel = pow(fresnel, 3.0);
      gl_FragColor = vec4(uColor, fresnel * uIntensity);
    }
  `
);

extend({ AtmosphereMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    atmosphereMaterial: THREE.ShaderMaterial &
      Partial<{ uColor: THREE.Color; uIntensity: number }>;
  }
}

// ============================================================
// Atmosphere（仅 Globe 模式）
// ============================================================

function Atmosphere() {
  return (
    <mesh scale={ATMOSPHERE_RADIUS}>
      <sphereGeometry args={[1, 64, 64]} />
      {/* @ts-expect-error atmosphereMaterial registered via extend */}
      <atmosphereMaterial transparent depthWrite={false} />
    </mesh>
  );
}

// ============================================================
// 类型标签
// ============================================================

const TYPE_LABELS: Record<MapPoint["type"], string> = {
  visited: "已去过",
  highlight: "精选",
  wishlist: "想去",
};

// ============================================================
// MarkerDot — 标记点（含点击交互）
// ============================================================

interface MarkerDotProps {
  position: [number, number, number];
  color: string;
  borderColor: string;
  onClick: () => void;
}

function MarkerDot({ position, color, borderColor, onClick }: MarkerDotProps) {
  const [hovered, setHovered] = useState(false);
  const scale = hovered ? 1.5 : 1;

  return (
    <group position={position}>
      {/* 隐形点击区域 */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <mesh scale={scale}>
        <ringGeometry args={[0.04, 0.06, 32]} />
        <meshBasicMaterial
          color={hovered ? "#ffffff" : borderColor}
          side={THREE.DoubleSide}
          transparent
          opacity={hovered ? 1 : 0.6}
        />
      </mesh>
      <mesh scale={scale}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshBasicMaterial color={hovered ? "#ffffff" : color} />
      </mesh>
    </group>
  );
}

// ============================================================
// 弹窗（复用）
// ============================================================

function MarkerPopup({
  point,
  position3D,
  onClose,
}: {
  point: MapPoint;
  position3D: [number, number, number];
  onClose: () => void;
}) {
  const popupPos = useMemo(
    () => radialOffset(position3D, 0.35),
    [position3D]
  );
  const typeLabel = TYPE_LABELS[point.type];
  const typeColor =
    point.type === "visited"
      ? "bg-orange-500/30 text-orange-300 border-orange-400/40"
      : point.type === "highlight"
        ? "bg-pink-500/30 text-pink-300 border-pink-400/40"
        : "bg-white/10 text-white/50 border-white/20";

  return (
    <Html position={popupPos} center distanceFactor={8} occlude>
      <div
        className="bg-black/90 backdrop-blur-xl rounded-xl px-4 py-3 text-white shadow-2xl border border-white/10 min-w-[160px] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 text-white/70 hover:text-white flex items-center justify-center text-xs leading-none transition-colors"
          aria-label="关闭"
        >
          ×
        </button>
        <h3 className="text-sm font-bold mb-1.5 pr-3">{point.name}</h3>
        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border ${typeColor}`}>
          {typeLabel}
        </span>
        {point.trip_id && (
          <a
            href={`/trips/${point.trip_id}`}
            className="block mt-2 text-[11px] text-orange-400 hover:text-orange-300 transition-colors"
          >
            查看旅行记录 →
          </a>
        )}
      </div>
    </Html>
  );
}

// ============================================================
// Globe 视图
// ============================================================

function GlobeView({
  points,
  onSelect,
  texture,
}: {
  points: MapPoint[];
  onSelect: (point: MapPoint, pos3D: [number, number, number]) => void;
  texture: THREE.Texture;
}) {
  const yunnanPos = useMemo(
    () => latLngToGlobe(YUNNAN_LAT, YUNNAN_LNG, MARKER_3D_RADIUS + 0.01),
    []
  );
  const ringRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);

  const yunnanPoint: MapPoint = useMemo(
    () => ({
      id: "yunnan",
      trip_id: null,
      name: "云南",
      latitude: YUNNAN_LAT,
      longitude: YUNNAN_LNG,
      type: "visited" as const,
      sort_order: 0,
    }),
    []
  );

  // 云南脉冲动画
  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const t = elapsedRef.current;
    if (ringRef.current) {
      const s = 1 + Math.sin(t * 2.5) * 0.4;
      ringRef.current.scale.setScalar(s);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.9 - Math.sin(t * 2.5) * 0.3;
    }
  });

  const markers = useMemo(() => {
    return points.map((p) => {
      const pos3D = latLngToGlobe(p.latitude, p.longitude, MARKER_3D_RADIUS);
      const color =
        p.type === "visited"
          ? "#fb923c"
          : p.type === "highlight"
            ? "#f472b6"
            : "rgba(255,255,255,0.6)";
      const bColor =
        p.type === "visited"
          ? "#fdba74"
          : p.type === "highlight"
            ? "#f9a8d4"
            : "rgba(255,255,255,0.3)";
      return { key: p.id, point: p, pos3D, color, bColor };
    });
  }, [points]);

  return (
    <>
      {/* 地球球体 */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial map={texture} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* 大气光晕 */}
      <Atmosphere />

      {/* DB 标记点 */}
      {markers.map((m) => (
        <MarkerDot
          key={m.key}
          position={m.pos3D}
          color={m.color}
          borderColor={m.bColor}
          onClick={() => onSelect(m.point, m.pos3D)}
        />
      ))}

      {/* 云南脉冲标记 */}
      <group position={yunnanPos}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect(yunnanPoint, yunnanPos);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        <mesh ref={ringRef}>
          <ringGeometry args={[0.06, 0.09, 32]} />
          <meshBasicMaterial
            color="#fb923c"
            side={THREE.DoubleSide}
            transparent
            opacity={0.7}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#fb923c" />
        </mesh>
        <mesh>
          <ringGeometry args={[0.08, 0.12, 32]} />
          <meshBasicMaterial
            color="#fdba74"
            side={THREE.DoubleSide}
            transparent
            opacity={0.35}
          />
        </mesh>
      </group>
    </>
  );
}

// ============================================================
// Flat 平面视图
// ============================================================

function FlatView({
  points,
  onSelect,
  texture,
}: {
  points: MapPoint[];
  onSelect: (point: MapPoint, pos3D: [number, number, number]) => void;
  texture: THREE.Texture;
}) {
  const yunnanPos = useMemo(
    () => latLngToPlane(YUNNAN_LAT, YUNNAN_LNG),
    []
  );

  const yunnanPoint: MapPoint = useMemo(
    () => ({
      id: "yunnan",
      trip_id: null,
      name: "云南",
      latitude: YUNNAN_LAT,
      longitude: YUNNAN_LNG,
      type: "visited" as const,
      sort_order: 0,
    }),
    []
  );

  const markers = useMemo(() => {
    return points.map((p) => {
      const pos = latLngToPlane(p.latitude, p.longitude);
      const color =
        p.type === "visited"
          ? "#fb923c"
          : p.type === "highlight"
            ? "#f472b6"
            : "rgba(255,255,255,0.6)";
      const bColor =
        p.type === "visited"
          ? "#fdba74"
          : p.type === "highlight"
            ? "#f9a8d4"
            : "rgba(255,255,255,0.3)";
      return { key: p.id, point: p, pos, color, bColor };
    });
  }, [points]);

  return (
    <>
      {/* 平面地图 */}
      <mesh>
        <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
        <meshStandardMaterial map={texture} roughness={0.6} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* DB 标记点 */}
      {markers.map((m) => (
        <MarkerDot
          key={m.key}
          position={m.pos}
          color={m.color}
          borderColor={m.bColor}
          onClick={() => onSelect(m.point, m.pos)}
        />
      ))}

      {/* 云南标记（静态高亮，无脉冲） */}
      <group position={yunnanPos}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onSelect(yunnanPoint, yunnanPos);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial visible={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.06, 0.09, 32]} />
          <meshBasicMaterial
            color="#fb923c"
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#fb923c" />
        </mesh>
      </group>
    </>
  );
}

// ============================================================
// 场景 — 根据 viewMode 切换
// ============================================================

interface SceneProps {
  points: MapPoint[];
  viewMode: ViewMode;
  searchTarget?: SearchTarget | null;
  onClearSearch?: () => void;
}

function EarthScene({
  points,
  viewMode,
  searchTarget,
  onClearSearch,
}: SceneProps) {
  const cameraControlsRef = useRef<CameraControls>(null);
  const texture = useTexture(EARTH_TEXTURE_URL);
  const prevModeRef = useRef<ViewMode>(viewMode);

  const [selected, setSelected] = useState<{
    point: MapPoint;
    pos3D: [number, number, number];
  } | null>(null);

  // 切换视图时动画过渡相机
  const prevMode = prevModeRef.current;
  if (prevMode !== viewMode) {
    prevModeRef.current = viewMode;
    // 延迟执行确保 CameraControls 已挂载
    setTimeout(() => {
      if (viewMode === "flat") {
        cameraControlsRef.current?.setLookAt(0, 0, 10, 0, 0, 0, true);
      } else {
        cameraControlsRef.current?.setLookAt(2.5, 1.2, 5, 0, 0, 0, true);
      }
    }, 0);
  }

  const handleSelect = useCallback(
    (point: MapPoint, pos3D: [number, number, number]) => {
      setSelected({ point, pos3D });

      // 相机飞行聚焦
      const target = new THREE.Vector3(pos3D[0], pos3D[1], pos3D[2]);
      let camPos: THREE.Vector3;

      if (viewMode === "flat") {
        camPos = new THREE.Vector3(pos3D[0], pos3D[1], 5);
      } else {
        const dir = target.clone().normalize();
        camPos = dir.multiplyScalar(4.5);
      }

      cameraControlsRef.current?.setLookAt(
        camPos.x,
        camPos.y,
        camPos.z,
        target.x,
        target.y,
        target.z,
        true
      );
    },
    [viewMode]
  );

  const handleClose = useCallback(() => {
    setSelected(null);
    if (viewMode === "flat") {
      cameraControlsRef.current?.setLookAt(0, 0, 10, 0, 0, 0, true);
    } else {
      cameraControlsRef.current?.setLookAt(2.5, 1.2, 5, 0, 0, 0, true);
    }
  }, [viewMode]);

  const handleBgClick = useCallback(() => {
    if (selected) handleClose();
  }, [selected, handleClose]);

  // ── 外部搜索目标：变化时相机平滑飞行 ──
  useEffect(() => {
    if (!searchTarget || !cameraControlsRef.current) return;

    const targetPos: [number, number, number] =
      viewMode === "flat"
        ? latLngToPlane(searchTarget.latitude, searchTarget.longitude)
        : latLngToGlobe(
            searchTarget.latitude,
            searchTarget.longitude,
            MARKER_3D_RADIUS
          );

    const target = new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]);
    let camPos: THREE.Vector3;
    if (viewMode === "flat") {
      camPos = new THREE.Vector3(targetPos[0], targetPos[1], 5);
    } else {
      const dir = target.clone().normalize();
      camPos = dir.multiplyScalar(4.5);
    }

    cameraControlsRef.current.setLookAt(
      camPos.x,
      camPos.y,
      camPos.z,
      target.x,
      target.y,
      target.z,
      true
    );
  }, [searchTarget, viewMode]);

  // ── 搜索结果 3D 坐标（用于渲染标记） ──
  const searchMarkerPos = useMemo<[number, number, number] | null>(() => {
    if (!searchTarget) return null;
    return viewMode === "flat"
      ? latLngToPlane(searchTarget.latitude, searchTarget.longitude)
      : latLngToGlobe(
          searchTarget.latitude,
          searchTarget.longitude,
          MARKER_3D_RADIUS
        );
  }, [searchTarget, viewMode]);

  return (
    <>
      <ambientLight intensity={0.3} />
      {viewMode === "flat" ? (
        <directionalLight position={[0, 0, 2]} intensity={1.5} />
      ) : (
        <>
          <directionalLight position={[5, 3, 5]} intensity={1.2} />
          <directionalLight position={[-3, -1, -2]} intensity={0.3} />
        </>
      )}

      {/* 背景点击面 */}
      <mesh onClick={handleBgClick} visible={false}>
        {viewMode === "flat" ? (
          <planeGeometry args={[PLANE_WIDTH * 2, PLANE_HEIGHT * 2]} />
        ) : (
          <sphereGeometry args={[EARTH_RADIUS - 0.01, 64, 64]} />
        )}
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* 主视图 */}
      {viewMode === "flat" ? (
        <FlatView points={points} onSelect={handleSelect} texture={texture} />
      ) : (
        <GlobeView points={points} onSelect={handleSelect} texture={texture} />
      )}

      {/* 弹窗 */}
      {selected && (
        <MarkerPopup
          point={selected.point}
          position3D={selected.pos3D}
          onClose={handleClose}
        />
      )}

      {/* 搜索结果标记（青色脉冲） */}
      {searchTarget && searchMarkerPos && (
        <SearchResultMarker
          position={searchMarkerPos}
          name={searchTarget.name}
          onClose={onClearSearch ?? (() => {})}
        />
      )}

      {/* 相机控制 */}
      <CameraControls
        ref={cameraControlsRef}
        minDistance={viewMode === "flat" ? 3 : 3.5}
        maxDistance={viewMode === "flat" ? 18 : 12}
        dollySpeed={0.8}
        truckSpeed={0}
      />
    </>
  );
}

// ============================================================
// 外层容器
// ============================================================

interface EarthGlobeProps {
  points: MapPoint[];
  className?: string;
  /** 外部搜索飞行目标（由父组件管理） */
  searchTarget?: SearchTarget | null;
  /** 清除搜索回调 */
  onClearSearch?: () => void;
}

export function EarthGlobe({
  points,
  className,
  searchTarget,
  onClearSearch,
}: EarthGlobeProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("globe");

  return (
    <div className={className} style={{ background: "#000010" }}>
      <Canvas
        camera={{ position: [2.5, 1.2, 5], fov: 40 }}
        gl={{ antialias: true, alpha: false }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={null}>
          <EarthScene
            points={points}
            viewMode={viewMode}
            searchTarget={searchTarget}
            onClearSearch={onClearSearch}
          />
        </Suspense>
      </Canvas>

      {/* 加载提示 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="text-white/20 text-sm animate-pulse">地球加载中...</p>
      </div>

      {/* ── 右上角视图切换按钮 ── */}
      <div className="absolute top-20 right-4 z-10 flex gap-1 bg-black/75 backdrop-blur-xl rounded-lg border border-white/10 p-1">
        <button
          onClick={() => setViewMode("globe")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
            viewMode === "globe"
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
          aria-label="地球立体视图"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <ellipse cx="12" cy="12" rx="4" ry="10" />
            <path d="M2 12h20" />
          </svg>
          立体
        </button>
        <button
          onClick={() => setViewMode("flat")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-colors ${
            viewMode === "flat"
              ? "bg-white/15 text-white"
              : "text-white/40 hover:text-white/70"
          }`}
          aria-label="平面地图视图"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 3v18" />
          </svg>
          平面
        </button>
      </div>
    </div>
  );
}
