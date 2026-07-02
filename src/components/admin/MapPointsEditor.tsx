"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import type { MapPoint } from "@/types/map";

interface MapPointsEditorProps {
  value: MapPoint[];
  onChange: (points: MapPoint[]) => void;
}

const TYPE_OPTIONS: { value: MapPoint["type"]; label: string }[] = [
  { value: "visited", label: "已去过" },
  { value: "highlight", label: "精选" },
  { value: "wishlist", label: "想去" },
];

function emptyPoint(): MapPoint {
  return {
    id: crypto.randomUUID(),
    trip_id: null,
    name: "",
    latitude: 0,
    longitude: 0,
    type: "visited",
    sort_order: 0,
  };
}

export function MapPointsEditor({ value, onChange }: MapPointsEditorProps) {
  function updateField(index: number, field: keyof MapPoint, val: string | number) {
    const next = value.map((p, i) => (i === index ? { ...p, [field]: val } : p));
    onChange(next);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...value, emptyPoint()]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">地图标记点</span>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          <Plus size={14} />
          添加标记
        </button>
      </div>

      {value.length === 0 && (
        <p className="text-xs text-white/30 py-2">暂无标记点，点击"添加标记"新增</p>
      )}

      <div className="space-y-2">
        {value.map((point, i) => (
          <div
            key={point.id || i}
            className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <GripVertical size={14} className="text-white/20 shrink-0" />

            <input
              type="text"
              value={point.name}
              onChange={(e) => updateField(i, "name", e.target.value)}
              placeholder="地点名称"
              className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />

            <input
              type="number"
              value={point.latitude}
              onChange={(e) => updateField(i, "latitude", parseFloat(e.target.value) || 0)}
              placeholder="纬度"
              step="any"
              className="w-24 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />

            <input
              type="number"
              value={point.longitude}
              onChange={(e) => updateField(i, "longitude", parseFloat(e.target.value) || 0)}
              placeholder="经度"
              step="any"
              className="w-24 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            />

            <select
              value={point.type}
              onChange={(e) => updateField(i, "type", e.target.value)}
              className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer"
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-neutral-900">
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1.5 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors shrink-0"
              aria-label="删除标记"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
