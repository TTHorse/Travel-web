## MODIFIED Requirements

### Requirement: 高德 (Amap) Web API

高德地图 Web 服务 API SHALL be accessed through `src/lib/amap.ts`. The API key SHALL be read from `NEXT_PUBLIC_AMAP_KEY` environment variable. Map zoom behavior SHALL adapt to destination administrative level via adcode.

#### Scenario: Input tips search
- GIVEN a user types a destination name
- WHEN the input tips API is called
- THEN the request is proxied through `src/app/api/amap-inputtips/` and the response is typed as `AmapInputTipsResponse`

#### Scenario: JSAPI loading
- GIVEN a map component needs the 高德 JSAPI
- WHEN the component mounts
- THEN `@amap/amap-jsapi-loader` dynamically loads the script with the API key

#### Scenario: Adaptive zoom for provincial destination
- GIVEN a search target with adcode ending in "0000" (e.g., 530000 云南省)
- WHEN the map flies to the destination
- THEN zoom is set to 5 to show the entire province

#### Scenario: Adaptive zoom for city-level destination
- GIVEN a search target with adcode ending in "00" but not "0000" (e.g., 532900 大理州)
- WHEN the map flies to the destination
- THEN zoom is set to 9 to show the city area

#### Scenario: Adaptive zoom for district/POI destination
- GIVEN a search target with a district-level adcode or empty adcode
- WHEN the map flies to the destination
- THEN zoom is set to 12

#### Scenario: Explicit zoom override
- GIVEN a search target with an explicit `zoom` value
- WHEN the map flies to the destination
- THEN the explicit zoom is used instead of the adcode-derived zoom

## ADDED Requirements

### Requirement: Adcode-based zoom calculation

The system SHALL provide a `getZoomForAdcode(adcode: string): number` utility in `src/lib/amap.ts` that maps a 高德 adcode to an appropriate zoom level.

#### Scenario: Provincial adcode
- GIVEN an adcode like "530000"
- WHEN `getZoomForAdcode` is called
- THEN it returns 5

#### Scenario: City-level adcode
- GIVEN an adcode like "532900"
- WHEN `getZoomForAdcode` is called
- THEN it returns 9

#### Scenario: District-level adcode
- GIVEN an adcode like "532901"
- WHEN `getZoomForAdcode` is called
- THEN it returns 12

#### Scenario: Empty adcode
- GIVEN an empty string adcode
- WHEN `getZoomForAdcode` is called
- THEN it returns 12 as default
