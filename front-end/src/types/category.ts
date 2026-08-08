export type CategoryType = 'venues' | 'restaurants' | 'catering' | 'decor';
export type SelectedCategoryType = CategoryType | '';

export const CATEGORY_DISPLAY_NAMES: Record<CategoryType, string> = {
  venues: 'Venues',
  restaurants: 'Restaurants',
  catering: 'Catering',
  decor: 'Decor',
};
