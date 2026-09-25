# JSI

**JSI — Just Send It.**

JSI is a logistics aggregation platform for sending packages and arranging package pickups through connected delivery providers.

## Platforms

One shared codebase for Web, Android, and iOS. Windows and macOS are not targets.

## Core flow

1. User chooses **Send** or **Pick**.
2. User enters pickup and destination addresses.
3. Each address can include a normal address, GhanaPostGPS digital address, and optional landmark/directions.
4. User describes the package.
5. JSI requests delivery options from connected logistics providers.
6. User selects an available option.
7. User reviews the request.
8. User pays through JSI.
9. JSI creates the delivery with the selected provider.
10. User sees order and delivery status.
11. When the provider supplies GPS coordinates, JSI displays the current package/rider location on the tracking map.

## Architecture

JSI is the customer-facing aggregation layer. It is not a fleet-management company.

Provider integrations sit behind a shared adapter interface so additional logistics networks can be connected without changing the customer-facing request flow.

The provider abstraction includes:

- `getQuote()`
- `createDelivery()`
- `getStatus()`
- `trackDelivery()`
- `cancelDelivery()`

Tracking coordinates come from the connected logistics provider. JSI does not invent or simulate a rider location.

## Address model

Pickup and destination locations support:

- Normal address text
- GhanaPostGPS digital address
- Landmark / additional directions
- Latitude / longitude when a verified location source is available

The current UI accepts GhanaPostGPS addresses as user-entered values. A direct GhanaPostGPS API integration will only be added when an authorized API/integration method is available; JSI does not scrape or invent an integration.

## Tracking

JSI now has a tracking foundation:

- Tracking screen
- Native map component for Android/iOS
- Current package/rider marker when coordinates are available
- Last location timestamp
- Provider tracking adapter contract
- Supabase `tracking_locations` table
- Supabase Realtime subscription for new tracking points
- User-level RLS so customers can only read tracking belonging to their own orders

The Web target shows a location/status fallback rather than pretending to have a native map.

A real rider marker will appear only after the connected provider supplies live GPS data.

## Stack

- Expo / React Native
- Expo Router
- TypeScript
- React Native Web
- React Native Maps
- Supabase

## Current implementation

- JSI branding is applied across the app.
- Phone-number login and 6-digit OTP screens are scaffolded for Supabase Auth.
- Send / Pick mode is implemented in the request flow.
- Pickup and destination addresses are structured separately.
- GhanaPostGPS digital address fields are supported as optional address data.
- Landmark / additional directions are supported for both locations.
- Request data flows into provider quote selection.
- Logistics providers use a shared adapter interface.
- A development provider adapter supplies non-production quote data until a real logistics API is connected.
- Checkout shows a structured review before payment.
- Tracking screen and realtime tracking data model are implemented.
- Payment, live OTP verification, real provider creation, and real provider GPS feeds are not yet connected.

## Map deployment note

The native map uses `react-native-maps`. Expo's documentation notes that store builds using Google Maps require the relevant Google Maps SDK/API-key configuration and a native rebuild. citeturn0search1

## Principle

Keep it simple.

**Just Send It.**
