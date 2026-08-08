export interface CateringRow {
  catering_id: number;
  provider_id: number;

  name: string;
  description?: string | null;
  about?: string | null;

  menu_type?: string | null;
  service_type?: string | null;

  price_per_person?: number | string | null;
  minimum_guests?: number | null;
  maximum_guests?: number | null;

  city?: string | null;
  status?: string | null;
  created_at?: string | null;

  images?: string[];
  image_url?: string | null;
  is_primary?: boolean | null;

  business_name?: string | null;
  business_description?: string | null;
  business_address?: string | null;
  average_rating?: number | null;

  [key: string]: unknown;
}