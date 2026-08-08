export interface VenueRow {
  venue_id: number;
  provider_id: number;
  name: string | null;
  description: string | null;
  venue_type: string | null;
  address: string | null;
  city: string | null;
  capacity: number | null;
  price_per_hour: number | null;
  price_per_day: number | null;
  indoor_outdoor: string | null;
  parking_available: boolean | null;
  status: string | null;
  about: string | null;
  created_at?: string | null;
  location_type: string | null;
  rating?: number | null; 
  [key: string]: unknown;
}

export interface VenueServiceImageRow {
  image_id: number;
  entity_id: number;
  image_url: string;
  is_primary: boolean | null;
}

export interface VenueEventTypeRow {
  venue_id: number;
  event_type_id: number;
}

export interface EventTypeRow {
  event_type_id: number;
  name: string;
}