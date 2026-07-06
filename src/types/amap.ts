// 高德 POI 输入提示响应
export interface AmapInputTip {
  id: string;
  name: string;
  district: string; // 行政区，如 "朝阳区"
  adcode: string; // 行政区编码
  location: string; // "经度,纬度"
  address: string; // 详细地址
  typecode: string; // POI 类型编码
}

export interface AmapInputTipsResponse {
  status: "0" | "1";
  info: string;
  infocode: string;
  count: string;
  tips: AmapInputTip[];
}

// 高德 POI 搜索响应
export interface AmapPOI {
  id: string;
  name: string;
  location: string; // "经度,纬度"
  address: string;
  pname: string; // 省
  cityname: string; // 市
  adname: string; // 区
}

export interface AmapPOISearchResponse {
  status: "0" | "1";
  info: string;
  count: string;
  pois: AmapPOI[];
}

// 搜索结果（统一格式，供组件使用）
export interface SearchResult {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  address: string;
  district: string;
  /** 行政区编码（行政区域 tip 用它做地理编码回退） */
  adcode: string;
  /** POI 类型编码（高德 typecode，用于判断省/市/区县/POI 层级） */
  typecode: string;
}
