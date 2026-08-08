import type { CatalogItem } from '@/types/item';
import { EventFilters } from '../context/FiltersContext';

function normalize(value?: string | null) {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s*\/\s*/g, '-')
    .replace(/\s+/g, '-');
}

const CATEGORY_TO_ENTITY_TYPE: Record<string, string> = {
  venues: 'venue',
  restaurants: 'restaurant',
  catering: 'catering',
  decor: 'decoration',
};

export function filterItems(
  items: CatalogItem[],
  filters: EventFilters,
  bookedIds?: Set<string>,
): CatalogItem[] {
  return items.filter((item) => {
    // Date availability — hide services already booked on the selected date
    if (filters.date && bookedIds && bookedIds.size > 0) {
      const entityType = CATEGORY_TO_ENTITY_TYPE[item.categoryKey];
      if (entityType && bookedIds.has(`${entityType}:${item.id}`)) {
        return false;
      }
    }
    if (filters.eventType && item.supportedEventTypes && item.supportedEventTypes.length > 0) {
      const supportsSelectedEvent = item.supportedEventTypes.some(
        (eventType) => normalize(eventType) === normalize(filters.eventType),
      );

      if (!supportsSelectedEvent) {
        return false;
      }
    }

    // City / location
    if (filters.city) {
      const selectedCity = filters.city.toLowerCase();
      const itemLocation = (item.location || '').toLowerCase();
      const servedByOperatingCities = item.availableIn?.some(
        (c) => c.toLowerCase() === selectedCity,
      );

      if (!itemLocation.includes(selectedCity) && !servedByOperatingCities) {
        return false;
      }
    }

    // Guests / capacity — exclude when guests exceed max capacity
    if (filters.numberOfGuests > 0 && item.capacity) {
      // "Minimum X guests" means no upper limit — always include
      if (!item.capacity.toLowerCase().startsWith('minimum')) {
        const allNumbers = item.capacity.match(/\d+/g);
        if (allNumbers && allNumbers.length > 0) {
          // Take the last number: handles "200 guests", "50 - 200 guests", "Up to 200 guests"
          const maxCapacity = parseInt(allNumbers[allNumbers.length - 1], 10);
          if (filters.numberOfGuests > maxCapacity) {
            return false;
          }
        }
      }
    }

    // Venues
    if (filters.selectedCategory === 'venues') {
      if (filters.venueType && normalize(item.venueType) !== normalize(filters.venueType)) {
        return false;
      }

      if (filters.locationType && normalize(item.locationType) !== normalize(filters.locationType)) {
        return false;
      }
    }

    // Restaurants
    if (filters.selectedCategory === 'restaurants') {
      if (filters.cuisineType && normalize(item.cuisineType) !== normalize(filters.cuisineType)) {
        return false;
      }

      if (filters.diningStyle && normalize(item.diningStyle) !== normalize(filters.diningStyle)) {
        return false;
      }
    }

    // Catering
    if (filters.selectedCategory === 'catering') {
      if (filters.serviceType && normalize(item.serviceType) !== normalize(filters.serviceType)) {
        return false;
      }

      if (filters.menuType && normalize(item.menuType) !== normalize(filters.menuType)) {
        return false;
      }
    }

    // Decor
    if (filters.selectedCategory === 'decor') {
      if (filters.decorStyle && normalize(item.decorStyle) !== normalize(filters.decorStyle)) {
        return false;
      }

      if (filters.decorType && normalize(item.decorType) !== normalize(filters.decorType)) {
        return false;
      }
    }

    // Shared price range
    if (filters.priceRange && normalize(item.priceCategory) !== normalize(filters.priceRange)) {
      return false;
    }

    return true;
  });
}
