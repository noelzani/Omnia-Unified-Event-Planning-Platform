import { useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';
import { FilterBar } from '../components/FilterBar';
import { CategorySpecificFilters } from '../components/CategorySpecificFilters';
import { useFilters } from '../context/FiltersContext';
import { filterItems } from '../utils/filterUtils';
import { useCategoryItems } from '../hooks/useCategoryItems';
import { useBookedEntities } from '../hooks/useBookedEntities';

export default function Venues() {
  const { filters, updateFilters } = useFilters();
  const { items: venues, isLoading, errorMessage } = useCategoryItems('venues');
  const bookedIds = useBookedEntities(filters.date);
  const filteredVenues = filterItems(venues, filters, bookedIds);

  useEffect(() => {
    if (filters.selectedCategory !== 'venues') {
      updateFilters({ selectedCategory: 'venues' });
    }
  }, [filters.selectedCategory, updateFilters]);

  return (
    <div className="min-h-screen bg-[#F7F7F9]">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-[#EABAB0]/30 bg-white">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white to-[#fff8f0]" />
          <div className="absolute right-0 top-0 h-full w-56 bg-gradient-to-l from-[#C9995A]/10 to-transparent" />
          <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#875A6B] via-[#C9995A] to-[#EABAB0]" />
          <div className="relative flex items-center justify-between px-6 py-5">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <div className="h-px w-8 bg-gradient-to-r from-[#875A6B] to-[#C9995A]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9995A]">Browse</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Venues</h1>
              <p className="mt-0.5 text-sm text-slate-400">Find the perfect space for your event</p>
            </div>
            <div className="hidden sm:flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#875A6B]/10 to-[#C9995A]/10 border border-[#EABAB0]/30">
              <MapPin className="size-6 text-[#875A6B]" />
            </div>
          </div>
        </div>

        <FilterBar compact />

        <div className="mb-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Refine venues</p>
          <CategorySpecificFilters />
        </div>

        {isLoading && (
          <div className="mb-6 flex items-center justify-center gap-3 py-10">
            <div className="relative size-6">
              <div className="absolute inset-0 rounded-full border-2 border-[#EABAB0]/30" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#875A6B] animate-spin" />
            </div>
            <span className="text-sm text-[#875A6B]/70 font-medium">Loading venues…</span>
          </div>
        )}
        {!isLoading && errorMessage && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {errorMessage}
          </div>
        )}

        {filteredVenues.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
            <p className="text-base font-semibold text-slate-600 mb-1">No venues match your filters</p>
            <p className="text-sm text-slate-400">Try adjusting your search criteria</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-slate-500">
              <span className="font-bold text-slate-700">{filteredVenues.length}</span> {filteredVenues.length === 1 ? 'result' : 'results'} found
            </p>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredVenues.map((venue) => (
                <ItemCard key={venue.id} item={venue} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
