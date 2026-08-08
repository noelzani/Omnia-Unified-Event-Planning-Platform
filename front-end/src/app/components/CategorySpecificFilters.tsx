import { X } from 'lucide-react';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useFilters } from '../context/FiltersContext';

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1 text-[11px] font-semibold text-[#875A6B]/60 underline underline-offset-2 hover:text-[#875A6B] transition"
      >
        <X className="size-3" />
        Clear filters
      </button>
    </div>
  );
}

export function CategorySpecificFilters() {
  const { filters, updateFilters } = useFilters();

  const segmentClass = 'flex flex-1 flex-col border-r border-[#EABAB0]/25 last:border-r-0 px-6 py-3.5 transition-colors hover:bg-[#fdf7f8]/60';
  const labelClass = 'mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#875A6B]/60';
  const triggerClass = 'h-auto border-none p-0 text-sm font-semibold text-slate-700 shadow-none ring-0 focus:ring-0';

  if (filters.selectedCategory === 'venues') {
    const isActive = !!(filters.venueType || filters.locationType || filters.priceRange);
    return (
      <>
        <div>
          <div className="h-[3px] rounded-t-xl bg-gradient-to-r from-[#875A6B] via-[#C9995A] to-[#EABAB0]" />
          <div
            className="overflow-hidden rounded-b-xl border border-t-0 border-[#EABAB0]/40 shadow-sm"
            style={{ background: 'linear-gradient(to right, #ffffff, #fdfaf8, #fdf7f8)' }}
          >
            <div className="flex flex-col divide-y divide-[#EABAB0]/25 sm:flex-row sm:divide-x sm:divide-y-0">
              <div className={segmentClass}>
                <Label className={labelClass}>Venue Type</Label>
                <Select value={filters.venueType} onValueChange={(v) => updateFilters({ venueType: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="ballroom">Ballroom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={segmentClass}>
                <Label className={labelClass}>Location Type</Label>
                <Select value={filters.locationType} onValueChange={(v) => updateFilters({ locationType: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Countryside">Countryside</SelectItem>
                    <SelectItem value="Coastline">Coastline</SelectItem>
                    <SelectItem value="Old Town">Old Town</SelectItem>
                    <SelectItem value="City Center">City Center</SelectItem>
                    <SelectItem value="Suburban">Suburban</SelectItem>
                    <SelectItem value="Mountain">Mountain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={segmentClass}>
                <Label className={labelClass}>Price Range</Label>
                <Select value={filters.priceRange} onValueChange={(v) => updateFilters({ priceRange: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any price" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Under €100 / day</SelectItem>
                    <SelectItem value="mid">€100 – €300 / day</SelectItem>
                    <SelectItem value="high">€300 – €600 / day</SelectItem>
                    <SelectItem value="luxury">€600+ / day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        {isActive && <ClearButton onClick={() => updateFilters({ venueType: '', locationType: '', priceRange: '' })} />}
      </>
    );
  }

  if (filters.selectedCategory === 'restaurants') {
    const isActive = !!(filters.cuisineType || filters.diningStyle || filters.priceRange);
    return (
      <>
        <div>
          <div className="h-[3px] rounded-t-xl bg-gradient-to-r from-[#875A6B] via-[#C9995A] to-[#EABAB0]" />
          <div
            className="overflow-hidden rounded-b-xl border border-t-0 border-[#EABAB0]/40 shadow-sm"
            style={{ background: 'linear-gradient(to right, #ffffff, #fdfaf8, #fdf7f8)' }}
          >
            <div className="flex flex-col divide-y divide-[#EABAB0]/25 sm:flex-row sm:divide-x sm:divide-y-0">
              <div className={segmentClass}>
                <Label className={labelClass}>Cuisine Type</Label>
                <Select value={filters.cuisineType} onValueChange={(v) => updateFilters({ cuisineType: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any cuisine" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="italian">Italian</SelectItem>
                    <SelectItem value="american">American</SelectItem>
                    <SelectItem value="Asian Fusion">Asian Fusion</SelectItem>
                    <SelectItem value="latin">Latin</SelectItem>
                    <SelectItem value="mediterranean">Mediterranean</SelectItem>
                    <SelectItem value="seafood">Seafood</SelectItem>
                    <SelectItem value="contemporary">Contemporary</SelectItem>
                    <SelectItem value="Albanian traditional">Traditional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={segmentClass}>
                <Label className={labelClass}>Dining Style</Label>
                <Select value={filters.diningStyle} onValueChange={(v) => updateFilters({ diningStyle: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fine-dining">Fine Dining</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="elegant">Elegant</SelectItem>
                    <SelectItem value="rooftop">Rooftop</SelectItem>
                    <SelectItem value="garden">Garden Dining</SelectItem>
                    <SelectItem value="waterfront">Waterfront</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={segmentClass}>
                <Label className={labelClass}>Price Range</Label>
                <Select value={filters.priceRange} onValueChange={(v) => updateFilters({ priceRange: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any price" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="€">€ — Budget</SelectItem>
                    <SelectItem value="€€">€€ — Moderate</SelectItem>
                    <SelectItem value="€€€">€€€ — Premium</SelectItem>
                    <SelectItem value="€€€€">€€€€ — Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        {isActive && <ClearButton onClick={() => updateFilters({ cuisineType: '', diningStyle: '', priceRange: '' })} />}
      </>
    );
  }

  if (filters.selectedCategory === 'catering') {
    const isActive = !!(filters.serviceType || filters.menuType || filters.priceRange);
    return (
      <>
        <div>
          <div className="h-[3px] rounded-t-xl bg-gradient-to-r from-[#875A6B] via-[#C9995A] to-[#EABAB0]" />
          <div
            className="overflow-hidden rounded-b-xl border border-t-0 border-[#EABAB0]/40 shadow-sm"
            style={{ background: 'linear-gradient(to right, #ffffff, #fdfaf8, #fdf7f8)' }}
          >
            <div className="flex flex-col divide-y divide-[#EABAB0]/25 sm:flex-row sm:divide-x sm:divide-y-0">
              <div className={segmentClass}>
                <Label className={labelClass}>Service Type</Label>
                <Select value={filters.serviceType} onValueChange={(v) => updateFilters({ serviceType: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any service" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-service">Full Service</SelectItem>
                    <SelectItem value="buffet">Buffet Style</SelectItem>
                    <SelectItem value="plated">Plated Dinner</SelectItem>
                    <SelectItem value="cocktail">Cocktail Reception</SelectItem>
                    <SelectItem value="family-style">Family Style</SelectItem>
                    <SelectItem value="food-stations">Food Stations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={segmentClass}>
                <Label className={labelClass}>Menu Type</Label>
                <Select value={filters.menuType} onValueChange={(v) => updateFilters({ menuType: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any menu" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gourmet">Gourmet</SelectItem>
                    <SelectItem value="international">International</SelectItem>
                    <SelectItem value="local">Local Cuisine</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian / Vegan</SelectItem>
                    <SelectItem value="bbq">BBQ / Grilled</SelectItem>
                    <SelectItem value="desserts">Desserts Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={segmentClass}>
                <Label className={labelClass}>Price Range</Label>
                <Select value={filters.priceRange} onValueChange={(v) => updateFilters({ priceRange: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any price" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget (€40–€70/person)</SelectItem>
                    <SelectItem value="moderate">Moderate (€70–€100/person)</SelectItem>
                    <SelectItem value="upscale">Upscale (€100–€150/person)</SelectItem>
                    <SelectItem value="premium">Premium (€150+/person)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        {isActive && <ClearButton onClick={() => updateFilters({ serviceType: '', menuType: '', priceRange: '' })} />}
      </>
    );
  }

  if (filters.selectedCategory === 'decor') {
    const isActive = !!(filters.decorStyle || filters.decorType || filters.priceRange);
    return (
      <>
        <div>
          <div className="h-[3px] rounded-t-xl bg-gradient-to-r from-[#875A6B] via-[#C9995A] to-[#EABAB0]" />
          <div
            className="overflow-hidden rounded-b-xl border border-t-0 border-[#EABAB0]/40 shadow-sm"
            style={{ background: 'linear-gradient(to right, #ffffff, #fdfaf8, #fdf7f8)' }}
          >
            <div className="flex flex-col divide-y divide-[#EABAB0]/25 sm:flex-row sm:divide-x sm:divide-y-0">
              <div className={segmentClass}>
                <Label className={labelClass}>Decor Style</Label>
                <Select value={filters.decorStyle} onValueChange={(v) => updateFilters({ decorStyle: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elegant">Elegant / Classic</SelectItem>
                    <SelectItem value="modern">Modern / Contemporary</SelectItem>
                    <SelectItem value="rustic">Rustic / Vintage</SelectItem>
                    <SelectItem value="romantic">Romantic</SelectItem>
                    <SelectItem value="bohemian">Bohemian</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={segmentClass}>
                <Label className={labelClass}>Decor Type</Label>
                <Select value={filters.decorType} onValueChange={(v) => updateFilters({ decorType: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="floral">Floral Arrangements</SelectItem>
                    <SelectItem value="lighting">Lighting</SelectItem>
                    <SelectItem value="table-settings">Table Settings</SelectItem>
                    <SelectItem value="centerpieces">Centerpieces</SelectItem>
                    <SelectItem value="draping">Draping / Fabrics</SelectItem>
                    <SelectItem value="candles">Candles / Ambiance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className={segmentClass}>
                <Label className={labelClass}>Price Range</Label>
                <Select value={filters.priceRange} onValueChange={(v) => updateFilters({ priceRange: v })}>
                  <SelectTrigger className={triggerClass}><SelectValue placeholder="Any price" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="budget">Budget (€1,500–€3,000)</SelectItem>
                    <SelectItem value="moderate">Moderate (€3,000–€5,000)</SelectItem>
                    <SelectItem value="upscale">Upscale (€5,000–€7,000)</SelectItem>
                    <SelectItem value="premium">Premium (€7,000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        {isActive && <ClearButton onClick={() => updateFilters({ decorStyle: '', decorType: '', priceRange: '' })} />}
      </>
    );
  }

  return null;
}
