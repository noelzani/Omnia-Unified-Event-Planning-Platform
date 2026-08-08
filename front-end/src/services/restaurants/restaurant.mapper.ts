import type { CatalogItem } from '../../types/item';
import {
  formatCapacityLabel,
  normalizeImageList,
} from '../shared/itemMappers';
import type { RestaurantRow } from './restaurant.types';

const DEFAULT_RESTAURANT_IMAGE =
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

type RestaurantMapperOptions = {
  images?: string[];
  supportedEventTypes?: string[];
};

export function mapRestaurantRowToItem(
  row: RestaurantRow,
  options: RestaurantMapperOptions = {},
): CatalogItem {
  const images = normalizeImageList(options.images ?? [], DEFAULT_RESTAURANT_IMAGE);

  return {
    id: String(row.restaurant_id),
    category: 'Restaurants',
    categoryKey: 'restaurants',
    name: row.name?.trim() || 'Restaurant',
    description: row.description?.trim() || '',
    details: row.about?.trim() || '',
    about: row.about?.trim() || '',
    price: row.price_range?.trim() || '',
    image: images[0] ?? DEFAULT_RESTAURANT_IMAGE,
    images,
    rating: row.rating ?? undefined,
    capacity: formatCapacityLabel(row.capacity ?? undefined),
    parking: row.parking_availability ?? undefined,
    location: row.city?.trim() || '',
    indoorOutdoor: row.indoor_outdoor?.trim() || '',
    cuisineType: row.cuisine_type?.trim() || '',
    diningStyle: row.dining_style?.trim() || '',
    priceCategory: row.price_range?.trim() || '',
    status: row.status?.trim() || '',
    amenities: [],
    supportedEventTypes: options.supportedEventTypes ?? [],
  };
}