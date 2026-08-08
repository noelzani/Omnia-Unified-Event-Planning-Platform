# OMNIA — Unified Event Planning Platform

> Bachelor's Thesis · Epoka University, Department of Computer Engineering · June 2026
>
> **Author:** Noel Zani

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
