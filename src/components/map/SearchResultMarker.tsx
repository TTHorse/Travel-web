"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface SearchResultMarkerProps {
  position: [number, number, number];
  name: string;
  onClose: () => void;
}

/**
 * 搜索结果脉冲标记 — 区别于普通标记点，使用更醒目的青色动画
 */
export function SearchResultMarker({
  position,
  name,
  onClose,
}: SearchResultMarkerProps) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const elapsedRef = useRef(0);

  // 外圈脉冲动画
  useFrame((_, delta) => {
    elapsedRef.current += delta;
    const t = elapsedRef.current;
    if (outerRingRef.current) {
      const scale = 1 + Math.sin(t * 3) * 0.6;
      outerRingRef.current.scale.setScalar(scale);
      const mat = outerRingRef.current
        .material as THREE.MeshBasicMaterial;
      mat.opacity = 0.8 - Math.sin(t * 3) * 0.4;
    }
  });

  // 径向偏移定位弹窗
  const popupPos = useMemo(() => {
    const len = Math.sqrt(
      position[0] ** 2 + position[1] ** 2 + position[2] ** 2
    );
    if (len === 0)
      return [position[0], position[1], position[2] + 0.35] as const;
    const factor = (len + 0.35) / len;
    return [
      position[0] * factor,
      position[1] * factor,
      position[2] * factor,
    ] as const;
  }, [position]);

  return (
    <group position={position}>
      {/* 外圈脉冲 */}
      <mesh ref={outerRingRef}>
        <ringGeometry args={[0.06, 0.1, 32]} />
        <meshBasicMaterial
          color="#22d3ee"
          side={THREE.DoubleSide}
          transparent
          opacity={0.7}
        />
      </mesh>
      {/* 实心核心 */}
      <mesh>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshBasicMaterial color="#22d3ee" />
      </mesh>
      {/* 内圈 */}
      <mesh>
        <ringGeometry args={[0.04, 0.07, 32]} />
        <meshBasicMaterial
          color="#67e8f9"
          side={THREE.DoubleSide}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* 名称标签 */}
      <Html position={popupPos} center distanceFactor={8}>
        <div className="bg-cyan-500/20 backdrop-blur-md border border-cyan-400/40 rounded-lg px-3 py-1.5 whitespace-nowrap select-none">
          <p className="text-xs font-semibold text-cyan-300">{name}</p>
          <button
            onClick={onClose}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white/20 hover:bg-white/40 text-white/70 hover:text-white flex items-center justify-center text-xs leading-none transition-colors"
            aria-label="清除搜索结果"
          >
            ×
          </button>
        </div>
      </Html>
    </group>
  );
}
