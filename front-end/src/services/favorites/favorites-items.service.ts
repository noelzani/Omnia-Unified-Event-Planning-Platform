import type { CategoryType } from '../../types/category';
import type { CatalogItem } from '../../types/item';
import { getCategoryItemById } from '../catalog.service';
import type { FavoriteRow } from './favorites.types';

const categoryByEntityType: Record<FavoriteRow['entity_type'], CategoryType> = {
  venue: 'venues',
  restaurant: 'restaurants',
  catering: 'catering',
  decoration: 'decor',
};

export async function fetchFavoriteItems(
  favorites: FavoriteRow[],
): Promise<CatalogItem[]> {
  const favoriteItems = await Promise.all(
    favorites.map((favorite) => {
      const category = categoryByEntityType[favorite.entity_type];

      return getCategoryItemById(category, String(favorite.entity_id));
    }),
  );

  return favoriteItems.filter((item): item is CatalogItem => item !== null);
}
