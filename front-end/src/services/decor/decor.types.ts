export type DecorRow = {
  decoration_id: number;
  provider_id: number;
  name: string;
  description: string | null;
  city: string | null;
  theme_style: string | null;
  starting_price: number | string | null;
  operating_cities: string[] | null;
  status: string | null;
  created_at: string | null;
  about: string | null;
  rating?: number | null;
  images?: string[] | null;
};