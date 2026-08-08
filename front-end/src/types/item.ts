import type { CategoryType } from './category';

export interface CatalogItem {
  id: string;
  category: string;
  categoryKey: CategoryType;
  name: string;
  description: string;
  details: string;
  price: string;
  image: string;
  images: string[];
  rating?: number;
  capacity?: string;
  parking?: boolean;
  amenities?: string[];
  supportedEventTypes?: string[];
  location?: string;
  indoorOutdoor?: string;
  venueType?: string;
  locationType?: string;
  priceCategory?: string;
  cuisineType?: string;
  diningStyle?: string;
  serviceType?: string;
  menuType?: string;
  decorStyle?: string;
  decorType?: string;
  status?: string;
  about?: string;
  hourlyPrice?: string;
  availableIn?: string[];
}
