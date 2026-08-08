export interface RestaurantRow {
  restaurant_id: number;
  provider_id: number;
  name: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  capacity: number | null;
  cuisine_type: string | null;
  minimum_guests: number | null;
  maximum_guests: number | null;
  has_fixed_menu: boolean | null;
  parking_availability: boolean | null;
  indoor_outdoor: string | null;
  status: string | null;
  rating: number | null;
  dining_style: string | null;
  price_range: string | null;
  about: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface RestaurantServiceImageRow {
  image_id: number;
  entity_id: number;
  image_url: string;
  is_primary: boolean | null;
}

export interface RestaurantEventTypeRow {
  restaurant_id: number;
  event_type_id: number;
}

export interface EventTypeRow {
  event_type_id: number;
  name: string;
}