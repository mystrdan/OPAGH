# JSI

**JSI — Just Send It.**

JSI is a logistics aggregation platform for sending packages and arranging package pickups through connected delivery providers.

## Platforms

One shared codebase for Web, Android, and iOS. Windows and macOS are not targets.

## Core flow

1. User chooses **Send** or **Pick**.
2. User enters pickup and destination addresses.
3. Each address can include a normal address, GhanaPostGPS digital address, and optional landmark/directions.
4. User provides verified coordinates when the connected provider requires them for pricing and dispatch.
5. JSI requests delivery options from connected logistics providers.
6. User selects an available option.
7. User reviews the request.
8. User pays through JSI.
9. JSI creates the delivery with the selected provider.
10. User sees order and delivery status.
11. When the provider supplies GPS coordinates, JSI displays the current package/rider location on the tracking map.
12. JSI sends transactional delivery/tracking updates to the user's WhatsApp number.

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

JSI has a tracking foundation:

- Tracking screen
- Native map component for Android/iOS
- Current package/rider marker when coordinates are available
- Last location timestamp
- Provider tracking adapter contract
- Supabase `tracking_locations` table
- Supabase Realtime subscription for new tracking points
- User-level RLS so customers can only read tracking belonging to their own orders
- Dawurobo webhook receiver for provider status/location events

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
- Phone-number login and 6-digit OTP screens use Supabase Auth.
- Send / Pick mode is implemented in the request flow.
- Pickup and destination addresses are structured separately.
- GhanaPostGPS digital address fields are supported as optional address data.
- Landmark / additional directions are supported for both locations.
- Provider quote selection is wired to the Dawurobo estimate endpoint.
- Checkout stores the selected provider and the real provider quote.
- Hubtel payment initialization and status verification are implemented server-side.
- Paid orders can be dispatched through the Dawurobo provider adapter.
- Dawurobo dispatch uses partner-funded delivery so the customer is not asked to pay the provider a second time.
- Provider acceptance/in-transit state is taken from the provider webhook rather than assumed immediately after order creation.
- Tracking locations are stored in Supabase and streamed to the tracking screen.
- Order events are recorded for provider status transitions and dispatch failures.
- WhatsApp tracking notifications are handled server-side through Sent.
- High-frequency GPS-only WhatsApp updates are throttled to one message per five minutes, while status changes are sent immediately.
- Live provider creation, GPS feeds, Hubtel checkout, and WhatsApp sending still require their respective production credentials/activation and approved WhatsApp template.

## Map deployment note

The native map uses `react-native-maps`. Store builds using Google Maps require the relevant Google Maps SDK/API-key configuration and a native rebuild.

## Principle

Keep it simple.

**Just Send It.**

## WhatsApp tracking notifications

JSI is designed to send delivery tracking updates to the user's WhatsApp number as part of the delivery experience.

The notification path is:

```
Provider tracking update
  ↓
JSI tracking record
  ↓
WhatsApp notification job
  ↓
Sent
  ↓
WhatsApp
```

The implementation uses the user's authenticated phone number and sends a WhatsApp utility template through Sent. Tracking notifications are transactional, not marketing. Each tracking event has a deterministic idempotency/dedupe key so the same update is not intentionally sent twice.

Status changes are sent immediately. GPS-only updates are throttled to one WhatsApp notification every five minutes so a provider's high-frequency location feed does not spam the customer. The in-app tracking map remains realtime.

The backend function is `supabase/functions/whatsapp-tracking/index.ts`. It requires the server-side `SENT_DM_API_KEY` and an approved WhatsApp template configured through `SENT_DM_TRACKING_TEMPLATE` (default: `jsi_delivery_tracking_update`). These values remain server-side.

JSI does not treat a successful API acceptance as delivery. The Sent message ID is stored in `whatsapp_notifications` so delivery/read lifecycle webhooks can be connected later.
