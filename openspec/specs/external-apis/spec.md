# External APIs Specification

## Requirement: 高德 (Amap) Web API

高德地图 Web 服务 API SHALL be accessed through `src/lib/amap.ts`. The API key SHALL be read from `NEXT_PUBLIC_AMAP_KEY` environment variable.

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

---

## Requirement: Cloudinary Images

All images SHALL be rendered via `next-cloudinary` `<CldImage>`. Raw `<img>` tags SHALL NOT be used. Cloudinary URLs SHALL NOT be hardcoded in components.

#### Scenario: Rendering a trip cover image
- GIVEN a trip has a `cover_image` (public_id)
- WHEN the image is rendered
- THEN `<CldImage src={trip.cover_image} ...>` is used with appropriate width/height

#### Scenario: Gallery grid
- GIVEN a gallery page with multiple photos
- WHEN the photos render
- THEN each photo uses `<CldImage>` with lazy loading

---

## Requirement: Adcode-based Zoom Calculation

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

---

## Requirement: AI SDK

The Vercel AI SDK (`ai` package v7) MAY be used for AI-assisted features. AI calls SHALL be routed through API endpoints, not called directly from client components.

#### Scenario: AI-assisted content generation
- GIVEN the admin wants AI help with a guide
- WHEN the AI is invoked
- THEN the request goes through an API Route that calls the AI SDK server-side

---

## Requirement: Three.js Earth

The 3D globe SHALL use `@react-three/fiber` and `@react-three/drei`. Mapbox SHALL NOT be used under any circumstances (it was deprecated in favor of this approach).

#### Scenario: Rendering the globe
- GIVEN the map or home page loads
- WHEN the globe component mounts
- THEN Three.js renders a rotating Earth with markers at trip coordinates

#### Scenario: Marker interaction
- GIVEN the globe has trip markers
- WHEN a user clicks a marker
- THEN the marker emits its data via an `onMarkerClick` callback
