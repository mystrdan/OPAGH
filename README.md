# OPAGH

OPAGH is a logistics aggregation platform.

One platform for ordering logistics across multiple delivery networks.

## Platforms

One shared codebase for Web, Android, and iOS. Windows and macOS are not targets.

## Core flow

1. Customer enters pickup and destination.
2. Customer describes what is being moved.
3. Platform requests delivery options.
4. Customer selects an option.
5. Customer pays through the platform.
6. Platform creates the delivery with the selected provider.
7. Customer sees order and delivery status.

## Architecture

The first provider will sit behind a provider adapter. Additional logistics APIs can be added later without changing the customer-facing order flow.

## Stack

- Expo / React Native
- Expo Router
- TypeScript
- React Native Web

## Principle

Keep it simple. OPAGH is a logistics aggregation layer, not a fleet management company.

## Current implementation

- Phone-number login and 6-digit OTP screens are scaffolded for Supabase Auth.
- Delivery requests are passed through the request → options flow.
- Logistics providers use a shared adapter interface so additional provider APIs can be added without changing the customer flow.
- A development provider adapter supplies non-production quote data until a real logistics API is connected.
- No placeholder quote is presented as a real provider quote.
