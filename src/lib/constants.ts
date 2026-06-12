export const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/trips", label: "旅行" },
  { href: "/gallery", label: "画廊" },
  { href: "/map", label: "地图" },
] as const;

export const SITE_CONFIG = {
  name: "我的旅行记录",
  description: "记录每一次旅行的美好瞬间",
  url: process.env.SITE_URL || "http://localhost:3000",
} as const;

export const PLACEHOLDER_IMAGE = "/placeholder-trip.jpg";

export const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";

export const MAP_INITIAL_VIEW = {
  longitude: 100,
  latitude: 20,
  zoom: 1.5,
};
