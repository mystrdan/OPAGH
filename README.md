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

## Architecture

JSI is the customer-facing aggregation layer. It is not a fleet-management company.

Provider integrations sit behind a shared adapter interface so additional logistics networks can be connected without changing the customer-facing request flow.

The provider abstraction includes:

- `getQuote()`
- `createDelivery()`
- `getStatus()`
- `cancelDelivery()`

## Address model

Pickup and destination locations support:

- Normal address text
- GhanaPostGPS digital address
- Landmark / additional directions
- Latitude / longitude when a verified location source is available

The current UI accepts GhanaPostGPS addresses as user-entered values. A direct GhanaPostGPS API integration will only be added when an authorized API/integration method is available; JSI does not scrape or invent an integration.

## Stack

- Expo / React Native
- Expo Router
- TypeScript
- React Native Web

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
- Checkout now shows a structured review before payment.
- Payment, live OTP verification, real provider creation, and tracking are not yet connected.

## Principle

Keep it simple.

**Just Send It.**
