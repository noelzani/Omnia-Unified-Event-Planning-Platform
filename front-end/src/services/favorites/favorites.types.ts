import type { CategoryType } from '../../types/category';

export type FavoriteEntityType =
  | 'venue'
  | 'restaurant'
  | 'catering'
  | 'decoration';

export interface FavoriteRow {
  favorite_id: number;
  user_id: string;
  entity_type: FavoriteEntityType;
  entity_id: number;
  created_at: string;
}

export function normalizeFavoriteId(id: number | string) {
  return Number(id);
}

export function getFavoriteEntityTypeFromCategory(
  categoryKey: CategoryType,
): FavoriteEntityType | null {
  switch (categoryKey) {
    case 'venues':
      return 'venue';
    case 'restaurants':
      return 'restaurant';
    case 'catering':
      return 'catering';
    case 'decor':
      return 'decoration';
    default:
      return null;
  }
}

export function normalizeFavoriteRow(row: FavoriteRow): FavoriteRow {
  return {
    ...row,
    entity_id: normalizeFavoriteId(row.entity_id),
  };
}
