# OMNIA — Unified Event Planning Platform

> Bachelor's Thesis · Epoka University, Department of Computer Engineering · June 2026
>
> **Author:** Noel Zani

---

## Table of Contents

1. [About the Project](#about-the-project)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [System Architecture](#system-architecture)
5. [Database Schema](#database-schema)
6. [Project Structure](#project-structure)
7. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Environment Variables](#environment-variables)
   - [Running the App](#running-the-app)
8. [User Roles & Access Control](#user-roles--access-control)
9. [Application Routes](#application-routes)
10. [Supabase Edge Functions](#supabase-edge-functions)
11. [Booking & Payment Flow](#booking--payment-flow)
12. [Diagrams](#diagrams)
13. [Known Limitations & Future Work](#known-limitations--future-work)
14. [Attributions](#attributions)
15. [License](#license)

---

## About the Project

OMNIA is a full-stack web application that consolidates every component of event planning into a single, unified platform. Users can discover and book venues, restaurants, catering services, and decoration providers — all without leaving the application.

The platform is built around three distinct roles: **customers** who browse and book, **providers** who list and manage their services, and **administrators** who oversee the entire system. A complete booking lifecycle is implemented, from initial inquiry through provider acceptance and PayPal payment, including automatic cancellation of unpaid confirmed bookings past their deadline.

The project was developed as a Bachelor's thesis at Epoka University and represents a complete, production-ready architecture built on modern web technologies.

---

## Features

### Customer-facing
- Browse and search **venues**, **restaurants**, **catering services**, and **decoration providers**
- Category-specific filters (city, capacity, price range, dining style, cuisine type, etc.)
- Detailed listing pages with image galleries, ratings, and availability calendars
- Full booking flow with date/time selection, guest count validation, and price calculation
- **Favorites system** with user-created boards/collections and drag-and-drop support
- Real-time booking status tracking with a dedicated **My Bookings** dashboard
- **PayPal payment integration** for confirmed bookings
- Automatic cancellation of unpaid bookings past the payment deadline
- Countdown warning banners (amber → red) on approaching payment deadlines
- Google OAuth sign-in, email/password authentication, and password reset via OTP

### Provider-facing
- Provider dashboard with booking statistics (total, pending, confirmed, revenue)
- Full CRUD for listings: add/edit/delete venues, restaurants, catering, and decor services
- Manage availability calendars per listing
- Accept or reject incoming booking requests
- View customer contact details and booking notes

### Admin-facing
- Analytics dashboard with Recharts visualisations:
  - Monthly user and provider registrations
  - Listings by category
  - Top cities by booking volume
  - Booking volume over time
- Manage all users and providers (view, deactivate)
- Add new providers directly from the admin panel

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript |
| **Routing** | React Router 7 |
| **Build tool** | Vite 6 |
| **Styling** | Tailwind CSS 4 |
| **UI components** | Radix UI primitives + shadcn/ui |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Animations** | Motion (Framer Motion successor) |
| **Notifications** | Sonner |
| **Forms** | React Hook Form |
| **Date handling** | date-fns, react-day-picker |
| **Drag and drop** | react-dnd + react-dnd-html5-backend |
| **Backend / Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (email/password + Google OAuth) |
| **Serverless functions** | Supabase Edge Functions (Deno runtime) |
| **Payments** | PayPal SDK (`@paypal/react-paypal-js`) |

---

## System Architecture

The application follows a **client-heavy architecture** where the React frontend communicates directly with Supabase using the `@supabase/supabase-js` client. Row-Level Security (RLS) on the database enforces access control at the data layer.

Sensitive server-side operations that cannot be exposed to the browser — specifically PayPal API communication and privileged user creation — are handled by **Supabase Edge Functions** deployed on the Deno runtime.

```
┌──────────────────────────────────────────────────┐
│                   Browser (React)                │
│  AuthContext · FavoritesContext · FiltersContext  │
└──────────────────┬───────────────────────────────┘
                   │ supabase-js (REST + Realtime)
┌──────────────────▼───────────────────────────────┐
│                  Supabase Platform               │
│  ┌──────────────┐  ┌──────────────┐  ┌────────┐  │
│  │  PostgreSQL  │  │  Supabase    │  │  Edge  │  │
│  │  (database + │  │  Auth        │  │  Fns   │  │
│  │   RLS)       │  │  (JWT)       │  │  (Deno)│  │
│  └──────────────┘  └──────────────┘  └───┬────┘  │
└──────────────────────────────────────────┼───────┘
                                           │ HTTPS
                                    ┌──────▼──────┐
                                    │  PayPal API │
                                    │  (sandbox)  │
                                    └─────────────┘
```

---

## Database Schema

The database is hosted on Supabase (PostgreSQL 17). The schema consists of the following tables:

| Table | Description |
|---|---|
| `users` | Application user profiles linked to Supabase Auth (`user_id`, `name`, `surname`, `phone`, `profile_image`, `role_id`, `status`, `created_at`) |
| `providers` | Provider records linked to a user (`provider_id`, `user_id`, `status`) |
| `venues` | Venue listings (`venue_id`, `provider_id`, `name`, `description`, `city`, `capacity`, `price_per_hour`, `price_per_day`, `venue_type`, `location_type`, `indoor_outdoor`, `parking_available`, `rating`, `status`) |
| `restaurants` | Restaurant listings (`restaurant_id`, `provider_id`, `name`, `city`, `cuisine_type`, `dining_style`, `price_range`, `minimum_guests`, `maximum_guests`, `has_fixed_menu`, `parking_availability`, `indoor_outdoor`, `rating`, `status`) |
| `catering_services` | Catering listings (`catering_id`, `provider_id`, `name`, `menu_type`, `service_type`, `price_per_person`, `minimum_guests`, `maximum_guests`, `city`, `rating`, `status`) |
| `decoration_services` | Decor listings (`decoration_id`, `provider_id`, `name`, `theme_style`, `starting_price`, `operating_cities`, `rating`, `status`) |
| `service_images` | Images for any listing (`image_id`, `entity_id`, `entity_type`, `image_url`, `is_primary`) |
| `event_types` | Lookup table for event type names |
| `venue_event_types` | M2M join: venues ↔ event types |
| `restaurant_event_types` | M2M join: restaurants ↔ event types |
| `events` | Event records created by customers during booking (`event_id`, `customer_id`, `event_category`, `city`, `nr_of_people`, `start_time`, `end_time`, `description`, `status`) |
| `bookings` | Booking records linking events to providers (`booking_id`, `customer_id`, `event_id`, `provider_id`, `booking_status`, `total_price`, `notes`, `created_at`, `updated_at`) |
| `booking_items` | Line items within a booking (`booking_item_id`, `booking_id`, `entity_type`, `entity_id`, `price`, `quantity`, `notes`) |
| `payments` | Payment records per booking (`payment_id`, `booking_id`, `payment_method`, `amount`, `payment_status`, `transaction_reference`, `payment_date`) |
| `availability` | Per-listing availability calendar (`entity_id`, `entity_type`, `available_date`, `is_available`) |
| `favorites` | Saved items per user (`favorite_id`, `user_id`, `entity_type`, `entity_id`, `created_at`) |
| `boards` | User-created collection boards (`board_id`, `user_id`, `name`, `created_at`) |
| `board_items` | Items within a board (`board_item_id`, `board_id`, `entity_type`, `entity_id`) |

---

## Project Structure

```
Event Planning Website/
├── front-end/                          # React + Vite application
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── public/
│   │   └── images/hero.png
│   └── src/
│       ├── main.tsx                    # App entry — PayPalScriptProvider, AuthProvider
│       ├── lib/
│       │   └── supabase.ts             # Supabase client singleton
│       ├── types/
│       │   ├── category.ts
│       │   └── item.ts                 # CatalogItem shared type
│       ├── services/                   # Data access layer (per-entity)
│       │   ├── authService.ts
│       │   ├── catalog.service.ts
│       │   ├── venues/
│       │   ├── restaurants/
│       │   ├── catering/
│       │   ├── decor/
│       │   ├── favorites/
│       │   ├── notifications/
│       │   ├── users/
│       │   └── shared/
│       └── app/
│           ├── App.tsx                 # RouterProvider, FavoritesProvider, FiltersProvider, Toaster
│           ├── routes.ts               # All route definitions
│           ├── context/
│           │   ├── AuthContext.tsx
│           │   ├── FavoritesContext.tsx
│           │   ├── FiltersContext.tsx
│           │   └── NotificationsContext.tsx
│           ├── hooks/
│           │   ├── useBookedEntities.ts
│           │   └── useCategoryItems.ts
│           ├── utils/
│           │   └── filterUtils.ts
│           ├── components/
│           │   ├── ui/                 # shadcn/ui components + ConfirmModal
│           │   ├── detail/             # ItemDetailShell, DetailHeader, DetailGallery, DetailSidebar, DetailInfoGrid
│           │   ├── detail-categories/  # VenueDetail, RestaurantDetail, CateringDetail, DecorDetail
│           │   ├── properties/         # AddVenue, AddRestaurant, AddCatering, AddDecor forms
│           │   ├── availability/       # AvailabilityModal
│           │   ├── payment/            # PayPalButton
│           │   ├── admin/              # AdminNavbar
│           │   ├── provider/           # ProviderNavbar
│           │   ├── Layout.tsx
│           │   ├── ProtectedRoute.tsx
│           │   ├── ProviderRoute.tsx
│           │   ├── AdminRoute.tsx
│           │   ├── ItemCard.tsx
│           │   ├── FilterBar.tsx
│           │   ├── CategorySidebar.tsx
│           │   └── NotificationsPanel.tsx
│           └── pages/
│               ├── Home.tsx
│               ├── LoggedInHome.tsx
│               ├── Venues.tsx / Restaurants.tsx / Catering.tsx / Decor.tsx
│               ├── ItemDetail.tsx
│               ├── Favorites.tsx
│               ├── Profile.tsx
│               ├── MyBookings.tsx
│               ├── auth/               # Login, Register, ForgotPassword, VerifyResetCode, ResetPassword
│               ├── booking/            # BookingPage
│               ├── provider/           # ProviderDashboard, ProviderProperties, ProviderBookings, ProviderEditProperty, ProviderLogin, ProviderProfile
│               └── admin/              # AdminDashboard, AdminLogin, AdminManage, AdminAddProvider, AdminProfile
│
├── supabase/
│   ├── config.toml                     # Supabase local dev configuration
│   └── functions/
│       ├── paypal-capture/             # Edge Function: captures a PayPal order server-side
│       ├── create-provider/            # Edge Function: creates auth user + provider record
│       └── create-booking/             # Edge Function: stub (booking logic is currently client-side)
│
├── diagrams/
│   ├── event-planning-omnia-class-diagram.png
│   ├── event-planning-omnia-class-diagram.drawio
│   ├── event-planning-omnia-class-diagram.puml
│   └── event-planning-omnia-use-case.drawio
│
├── guidelines/
│   └── Guidelines.md
│
├── ATTRIBUTIONS.md
└── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A [Supabase](https://supabase.com/) project (or use the existing project credentials below)
- A [PayPal Developer](https://developer.paypal.com/) sandbox app (for payment testing)

### Installation

Clone or download the repository, then install dependencies from the project root:

```bash
npm install
```

This will install the root workspace dependencies. To install the frontend dependencies separately:

```bash
cd front-end
npm install
```

### Environment Variables

Create a `.env` file inside the `front-end/` directory with the following variables:

```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_PAYPAL_CLIENT_ID=<your-paypal-sandbox-client-id>
```

> The Supabase client is initialised once in `front-end/src/lib/supabase.ts` and imported throughout the app as `import { supabase } from "@/lib/supabase"`.

For the `paypal-capture` Edge Function, the following secrets must be set in your Supabase project's Edge Function environment:

```
PAYPAL_CLIENT_ID=<your-paypal-sandbox-client-id>
PAYPAL_SECRET=<your-paypal-sandbox-secret>
```

### Running the App

From the project root:

```bash
npm run dev
```

Or directly from inside `front-end/`:

```bash
cd front-end
npm run dev
```

The development server starts at **http://localhost:5173**.

To build for production:

```bash
cd front-end
npm run build
```

---

## Test Accounts

The following accounts are pre-seeded in the database for testing and demonstration purposes:

| Role | Email | Password |
|---|---|---|
| **Admin** | nzinter05@gmail.com | inter123 |
| **Provider** | zaninoel@gmail.com | noel1234 |
| **Customer** | nzani23@epoka.edu.al | Noel123! |

> Use the role-specific login pages: customers use `/login`, providers use `/provider/login`, and admins use `/admin/login`.

---

## User Roles & Access Control

The application implements role-based access control using a `role_id` column on the `users` table. Three roles are defined:

| Role ID | Role | Description |
|---|---|---|
| `4` | **Customer** | Can browse all listings, make bookings, manage favorites, and pay via PayPal |
| `5` | **Provider** | Can create and manage listings, set availability, and accept/reject bookings |
| `6` | **Admin** | Full system access: analytics, user management, adding new providers |

- New sign-ups are assigned `role_id = 4` by default.
- Providers are created exclusively by admins via the `create-provider` Edge Function.
- Route guards (`ProtectedRoute`, `ProviderRoute`, `AdminRoute`) enforce access at the client level.

---

## Application Routes

### Public routes

| Path | Page |
|---|---|
| `/` | Landing page (Home) |
| `/register` | Customer registration |
| `/login` | Customer login |
| `/forgot-password` | Request password reset |
| `/verify-reset-code` | Enter OTP from email |
| `/reset-password` | Set new password |
| `/provider/login` | Provider login |
| `/admin/login` | Admin login |

### Customer routes (requires `role_id = 4`)

| Path | Page |
|---|---|
| `/dashboard` | Logged-in home / discovery feed |
| `/venues` | Browse venues |
| `/restaurants` | Browse restaurants |
| `/catering` | Browse catering services |
| `/decor` | Browse decoration services |
| `/:category/:id` | Listing detail page |
| `/book/:entityType/:id` | Booking form |
| `/my-bookings` | Booking history and payment |
| `/favorites` | Saved boards and items |
| `/profile` | User profile settings |

### Provider routes (requires `role_id = 5`)

| Path | Page |
|---|---|
| `/provider/dashboard` | Provider overview |
| `/provider/properties` | Manage listings |
| `/provider/add-property` | Add a new listing |
| `/provider/edit-property/:entityType/:id` | Edit a listing |
| `/provider/bookings` | Manage incoming bookings |
| `/provider/profile` | Provider profile settings |

### Admin routes (requires `role_id = 6`)

| Path | Page |
|---|---|
| `/admin` | Analytics dashboard |
| `/admin/manage` | User and provider management |
| `/admin/add-provider` | Create a new provider account |
| `/admin/profile` | Admin profile settings |

---

## Supabase Edge Functions

Edge Functions run on the Deno runtime and are deployed to Supabase. They handle operations that require server-side credentials.

### `paypal-capture`

Captures a PayPal order after the customer approves it in the PayPal popup.

- **Trigger:** Called by `PayPalButton.tsx` after `onApprove` fires
- **Input:** `{ orderId: string }`
- **Process:** Exchanges `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` for a Bearer token, then calls `POST /v2/checkout/orders/{orderId}/capture` on the PayPal sandbox API
- **Output:** Full PayPal capture response object
- **Note:** Does not write to the database; the frontend inserts the resulting record into the `payments` table directly

### `create-provider`

Creates a new provider account from the admin panel.

- **Trigger:** Called by `AdminAddProvider.tsx`
- **Input:** `{ email, password, name, surname, phone }`
- **Process:** Uses the Supabase service-role key to bypass RLS; creates an auth user (pre-confirmed), inserts a `users` row with `role_id = 5`, and inserts a `providers` row with status `"Pending Approval"`
- **Output:** `{ provider_id }`
- **Rollback:** If any step fails after the auth user is created, the auth user is deleted to avoid orphaned records

### `create-booking` *(stub)*

This function exists in the codebase but currently only returns a placeholder response. Actual booking creation is handled client-side in `BookingPage.tsx`.

---

## Booking & Payment Flow

```
1. Customer opens /book/:entityType/:id
       ↓
2. BookingPage loads availability data and marks blocked dates on the calendar
       ↓
3. Customer selects date(s), guests, and notes — price is calculated:
   • Venue       → price_per_day × number of days
   • Catering    → price_per_person × number of guests
   • Decoration  → starting_price (flat)
   • Restaurant  → €5 reservation fee (flat)
       ↓
4. On submit: INSERT events → INSERT bookings (status: Pending) → INSERT booking_items
       ↓
5. Provider sees the booking in /provider/bookings and clicks Accept or Reject
       ↓
6. If Accepted: booking_status → "Confirmed", updated_at is set
       ↓
7. Customer sees the booking in /my-bookings under the Confirmed tab
   • Payment deadline = min(confirmedAt + 2 days at 23:59, eventDate − 1 day at 23:59)
   • Warning banner appears: amber (>12h remaining) → red (≤12h remaining)
   • If deadline passes unpaid: booking is auto-cancelled on the next page load
       ↓
8. Customer pays via the PayPal button:
   • PayPal SDK creates an order client-side
   • Customer approves in the PayPal popup
   • paypal-capture Edge Function captures the order
   • Frontend inserts a record into the payments table
   • Booking status → "Paid"
```

---

## Diagrams

The `diagrams/` directory contains the following UML artefacts produced during the design phase of the thesis:

| File | Description |
|---|---|
| `event-planning-omnia-class-diagram.png` | Class diagram (rendered image) |
| `event-planning-omnia-class-diagram.drawio` | Class diagram (editable draw.io source) |
| `event-planning-omnia-class-diagram.puml` | Class diagram (PlantUML source) |
| `event-planning-omnia-use-case.drawio` | Use case diagram (editable draw.io source) |

---

## Known Limitations & Future Work

The following items are known gaps between the current implementation and a production-ready deployment:

| # | Issue | Notes |
|---|---|---|
| 1 | **`create-booking` edge function is a stub** | Booking logic runs client-side; moving it server-side would improve security and atomicity |
| 2 | **Google OAuth redirect is hardcoded to `localhost:5173`** | Must be updated to the production URL before deploying |
| 3 | **PayPal is using the sandbox environment** | `PAYPAL_API` in `paypal-capture/index.ts` must be changed to `api-m.paypal.com` for production |
| 4 | **Auto-cancel logic runs client-side** | Expired bookings are only cancelled when the customer visits `/my-bookings`; a scheduled server-side job would be more reliable |
| 5 | **Restaurant reservation fee is hardcoded** | The €5 flat fee is set in `BookingPage.tsx` and is not stored in the database |
| 6 | **No email notifications** | Providers and customers do not receive emails on booking status changes |
| 7 | **No image upload** | Listing images are stored as external URLs; a Supabase Storage integration is needed for provider uploads |

---

## Attributions

- UI components from [shadcn/ui](https://ui.shadcn.com/), used under the [MIT License](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md)
- Stock photography from [Unsplash](https://unsplash.com/), used under the [Unsplash License](https://unsplash.com/license)
- Original Figma design reference: [Event Planning Website on Figma](https://www.figma.com/design/KKC1oZEipmlJtXHcyUc2ZV/Event-Planning-Website)

---

## License

© 2026 Noel Zani. All rights reserved.

This project was developed as a Bachelor's thesis submitted to Epoka University, Department of Computer Engineering. It may not be reproduced, distributed, or used in any form without the explicit written permission of the author.
