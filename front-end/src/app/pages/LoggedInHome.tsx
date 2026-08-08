import { useState } from 'react';
import { MapPin, UtensilsCrossed, ChefHat, Sparkles, Star } from 'lucide-react';
import { FilterBar } from '../components/FilterBar';
import { ItemCard } from '../components/ItemCard';
import { useFilters } from '../context/FiltersContext';
import { useCategoryItems } from '../hooks/useCategoryItems';
import { useBookedEntities } from '../hooks/useBookedEntities';
import { filterItems } from '../utils/filterUtils';
import { useAuth } from '../context/AuthContext';
import type { CatalogItem } from '../../types/item';
import type { EventFilters } from '../context/FiltersContext';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const SECTIONS = [
  { key: 'venues'      as const, label: 'Venues',           tabLabel: 'Venues',      icon: MapPin },
  { key: 'restaurants' as const, label: 'Restaurants',      tabLabel: 'Restaurants', icon: UtensilsCrossed },
  { key: 'catering'   as const, label: 'Catering Services', tabLabel: 'Catering',    icon: ChefHat },
  { key: 'decor'      as const, label: 'Event Decor',       tabLabel: 'Decor',       icon: Sparkles },
];

type SectionKey = typeof SECTIONS[number]['key'] | 'all';

function generalFilters(filters: EventFilters): EventFilters {
  return { ...filters, selectedCategory: '' };
}

interface SectionProps {
  label: string;
  icon: React.ElementType;
  items: CatalogItem[];
  isLoading: boolean;
  filters: EventFilters;
  bookedIds: Set<string>;
}

function CategorySection({ label, icon: Icon, items, isLoading, filters, bookedIds }: SectionProps) {
  const filtered = filterItems(items, generalFilters(filters), bookedIds);

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#875A6B]/10 border border-[#EABAB0]/30">
          <Icon className="size-5 text-[#875A6B]" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{label}</h2>
        <div className="flex-1 h-[3px] rounded-full bg-gradient-to-r from-[#875A6B]/70 via-[#EABAB0]/60 to-transparent" />
        {!isLoading && (
          <span className="text-sm text-slate-400 shrink-0">
            {filtered.length} available
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-6">
          <div className="relative size-5">
            <div className="absolute inset-0 rounded-full border-2 border-[#EABAB0]/30" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#875A6B] animate-spin" />
          </div>
          <span className="text-sm text-[#875A6B]/60 font-medium">Loading {label.toLowerCase()}…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[#EABAB0]/30 bg-white py-8 text-center">
          <p className="text-sm font-medium text-slate-500">No {label.toLowerCase()} match your filters</p>
          <p className="mt-0.5 text-xs text-slate-400">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function LoggedInHome() {
  const { user, appUser, loading } = useAuth();
  const { filters } = useFilters();
  const bookedIds = useBookedEntities(filters.date);
  const [activeTab, setActiveTab] = useState<SectionKey>('all');

  const { items: venues,      isLoading: loadingVenues }      = useCategoryItems('venues');
  const { items: restaurants, isLoading: loadingRestaurants } = useCategoryItems('restaurants');
  const { items: catering,    isLoading: loadingCatering }    = useCategoryItems('catering');
  const { items: decor,       isLoading: loadingDecor }       = useCategoryItems('decor');

  const allItems = [
    { ...SECTIONS[0], items: venues,      isLoading: loadingVenues },
    { ...SECTIONS[1], items: restaurants, isLoading: loadingRestaurants },
    { ...SECTIONS[2], items: catering,    isLoading: loadingCatering },
    { ...SECTIONS[3], items: decor,       isLoading: loadingDecor },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F9]">

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[#EABAB0]/20 bg-white">
        <style>{`
          @keyframes hero-float-a {
            0%,100% { transform: translateY(0px) rotate(0deg);   opacity: 0.3;  }
            50%      { transform: translateY(-11px) rotate(18deg); opacity: 0.75; }
          }
          @keyframes hero-float-b {
            0%,100% { transform: translateY(0px) rotate(0deg);    opacity: 0.18; }
            50%      { transform: translateY(-15px) rotate(-14deg); opacity: 0.6;  }
          }
          @keyframes hero-float-c {
            0%,100% { transform: translateY(0px) scale(1);   opacity: 0.22; }
            50%      { transform: translateY(-8px) scale(1.25); opacity: 0.65; }
          }
          @keyframes hero-float-d {
            0%,100% { transform: translateY(0px) rotate(5deg);  opacity: 0.15; }
            50%      { transform: translateY(-12px) rotate(-8deg); opacity: 0.5;  }
          }
          @keyframes hero-shimmer {
            0%   { background-position: -200% center; }
            100% { background-position:  200% center; }
          }
          @keyframes hero-dot-pulse {
            0%,100% { transform: scale(1);   opacity: 1; }
            50%      { transform: scale(1.5); opacity: 0.6; }
          }
        `}</style>

        {/* Background glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-[520px] rounded-full bg-[#EABAB0]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-10 size-80 rounded-full bg-[#C9995A]/8 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 top-0 size-[400px] rounded-full bg-[#875A6B]/5 blur-3xl" />

        {/* Floating sparkles — left zone */}
        <Sparkles className="pointer-events-none absolute left-[6%]  top-[15%] size-4   text-[#EABAB0]" style={{ animation: 'hero-float-b 5.2s ease-in-out infinite 0.3s' }} />
        <Star     className="pointer-events-none absolute left-[14%] top-[55%] size-2   fill-[#C9995A] text-[#C9995A]" style={{ animation: 'hero-float-c 4.4s ease-in-out infinite 1.1s' }} />
        <Sparkles className="pointer-events-none absolute left-[22%] bottom-[12%] size-3 text-[#875A6B]" style={{ animation: 'hero-float-a 6.1s ease-in-out infinite 2.2s' }} />
        <Star     className="pointer-events-none absolute left-[8%]  bottom-[30%] size-2.5 fill-[#EABAB0] text-[#EABAB0]" style={{ animation: 'hero-float-d 5.8s ease-in-out infinite 0.7s' }} />

        {/* Floating sparkles — centre/right zone */}
        <Sparkles className="pointer-events-none absolute left-[44%] top-[8%]  size-5   text-[#C9995A]"  style={{ animation: 'hero-float-a 4.0s ease-in-out infinite' }} />
        <Star     className="pointer-events-none absolute left-[52%] top-[20%] size-2   fill-[#875A6B] text-[#875A6B]" style={{ animation: 'hero-float-c 5.5s ease-in-out infinite 1.8s' }} />
        <Sparkles className="pointer-events-none absolute right-[32%] top-[12%] size-3.5 text-[#EABAB0]" style={{ animation: 'hero-float-b 4.7s ease-in-out infinite 0.9s' }} />
        <Star     className="pointer-events-none absolute right-[24%] bottom-[18%] size-2 fill-[#C9995A] text-[#C9995A]" style={{ animation: 'hero-float-a 6.3s ease-in-out infinite 1.4s' }} />
        <Sparkles className="pointer-events-none absolute right-[14%] top-[35%] size-3  text-[#875A6B]"  style={{ animation: 'hero-float-d 5.0s ease-in-out infinite 2.5s' }} />
        <Star     className="pointer-events-none absolute right-[8%]  top-[10%] size-4   fill-[#EABAB0] text-[#EABAB0]" style={{ animation: 'hero-float-c 4.2s ease-in-out infinite 0.5s' }} />

        <div className="relative container mx-auto max-w-6xl px-4 py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:items-stretch">

            {/* Left — text */}
            <div className="flex flex-col justify-center">
              {!loading && user && (
                <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#875A6B]/20 bg-gradient-to-r from-[#875A6B]/10 to-[#C9995A]/8 px-4 py-1.5 shadow-sm">
                  <span className="size-1.5 rounded-full bg-[#C9995A]" style={{ animation: 'hero-dot-pulse 2s ease-in-out infinite' }} />
                  <span className="text-xs font-semibold text-[#875A6B]">
                    {getGreeting()}, {appUser?.name ?? user.email?.split('@')[0]}
                  </span>
                </div>
              )}

              <h1 className="text-4xl font-bold leading-tight text-[#1C1C2E] md:text-5xl lg:text-[3.25rem]">
                Plan Your<br />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(90deg, #875A6B, #a06878, #C9995A, #875A6B)',
                    backgroundSize: '200% auto',
                    animation: 'hero-shimmer 4s linear infinite',
                  }}
                >
                  Perfect Event
                </span>
              </h1>

              <p className="mt-4 max-w-md text-base leading-7 text-slate-500">
                Find venues, restaurants, catering and decor — all in one place.
              </p>

              {/* Divider */}
              <div className="my-5 h-px w-16 rounded-full bg-gradient-to-r from-[#875A6B] to-[#C9995A]" />

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: MapPin,          label: 'Venues'      },
                  { icon: UtensilsCrossed, label: 'Restaurants' },
                  { icon: ChefHat,         label: 'Catering'    },
                  { icon: Sparkles,        label: 'Decor'       },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-[#EABAB0]/40 bg-[#fdf7f8] px-3 py-1 text-xs font-medium text-[#875A6B]">
                    <Icon className="size-3" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — image */}
            <div className="relative hidden overflow-hidden rounded-3xl shadow-xl lg:block" style={{ minHeight: '420px' }}>
              <img
                src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400"
                alt="Elegant event table setting"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#5C3347]/30 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/5" />
              <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-[#875A6B] via-[#C9995A] to-[#EABAB0]" />
            </div>

          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <FilterBar />

        {/* Category toggle */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 ${
              activeTab === 'all'
                ? 'border-[#875A6B] bg-[#875A6B] text-white shadow-md'
                : 'border-[#EABAB0]/50 bg-white text-slate-500 hover:border-[#875A6B]/40 hover:text-[#875A6B]'
            }`}
          >
            All
          </button>
          {SECTIONS.map(({ key, tabLabel, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                activeTab === key
                  ? 'border-[#875A6B] bg-[#875A6B] text-white shadow-md'
                  : 'border-[#EABAB0]/50 bg-white text-slate-500 hover:border-[#875A6B]/40 hover:text-[#875A6B]'
              }`}
            >
              <Icon className="size-3.5" />
              {tabLabel}
            </button>
          ))}
        </div>

        {(activeTab === 'all' ? allItems : allItems.filter(s => s.key === activeTab)).map(({ key, label, icon, items, isLoading }) => (
          <CategorySection
            key={key}
            label={label}
            icon={icon}
            items={items}
            isLoading={isLoading}
            filters={filters}
            bookedIds={bookedIds}
          />
        ))}
      </div>
    </div>
  );
}
