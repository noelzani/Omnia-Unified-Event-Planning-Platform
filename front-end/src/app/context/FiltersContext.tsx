import { createContext, useContext, useState, ReactNode } from 'react';
import type { CategoryType, SelectedCategoryType } from '../../types/category';

export interface EventFilters {
  eventType: string;
  date: string;
  city: string;
  numberOfGuests: number;
  // Category-specific filters
  selectedCategory: SelectedCategoryType;
  // Venue-specific
  venueType: string;
  locationType: string;
  priceRange: string;
  // Restaurant-specific
  cuisineType: string;
  diningStyle: string;
  // Catering-specific
  serviceType: string;
  menuType: string;
  // Decor-specific
  decorStyle: string;
  decorType: string;
}

interface FiltersContextType {
  filters: EventFilters;
  updateFilters: (filters: Partial<EventFilters>) => void;
  resetFilters: () => void;
  isFiltersActive: boolean;
}

const defaultFilters: EventFilters = {
  eventType: '',
  date: '',
  city: '',
  numberOfGuests: 0,
  selectedCategory: '',
  venueType: '',
  locationType: '',
  priceRange: '',
  cuisineType: '',
  diningStyle: '',
  serviceType: '',
  menuType: '',
  decorStyle: '',
  decorType: '',
};

const FiltersContext = createContext<FiltersContextType | undefined>(undefined);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<EventFilters>(defaultFilters);

  const updateFilters = (newFilters: Partial<EventFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const isFiltersActive = 
    filters.eventType !== '' || 
    filters.date !== '' || 
    filters.city !== '' || 
    filters.numberOfGuests > 0 ||
    filters.venueType !== '' ||
    filters.locationType !== '' ||
    filters.priceRange !== '' ||
    filters.cuisineType !== '' ||
    filters.diningStyle !== '' ||
    filters.serviceType !== '' ||
    filters.menuType !== '' ||
    filters.decorStyle !== '' ||
    filters.decorType !== '';

  return (
    <FiltersContext.Provider
      value={{ filters, updateFilters, resetFilters, isFiltersActive }}
    >
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FiltersContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FiltersProvider');
  }
  return context;
}
