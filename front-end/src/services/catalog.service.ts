import type { CategoryType } from '.././types/category';
import type { CatalogItem } from '.././types/item';
import { getCateringById, getCateringItems } from './catering/catering.service';
import { getDecorById, getDecorItems } from './decor/decor.service';
import { getRestaurantById, getRestaurants } from './restaurants/restaurant.service';
import { getVenueById, getVenues } from './venues/venue.service';

export async function getCategoryItems(category: CategoryType): Promise<CatalogItem[]> {
  switch (category) {
    case 'venues':
      return getVenues();
    case 'restaurants':
      return getRestaurants();
    case 'catering':
      return getCateringItems();
    case 'decor':
      return getDecorItems();
    default:
      return [];
  }
}

export async function getCategoryItemById(
  category: CategoryType,
  id: string,
): Promise<CatalogItem | null> {
  switch (category) {
    case 'venues':
      return getVenueById(id);
    case 'restaurants':
      return getRestaurantById(id);
    case 'catering':
      return getCateringById(id);
    case 'decor':
      return getDecorById(id);
    default:
      return null;
  }
}
