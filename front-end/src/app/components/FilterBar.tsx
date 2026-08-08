import { useState } from 'react';
import { Calendar, MapPin, Users, PartyPopper, Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useFilters } from '../context/FiltersContext';

function fmtFilterDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const FILTER_CAL_NAMES = {
  months: 'flex justify-center',
  month: 'space-y-3 p-3',
  caption: 'relative flex items-center justify-center pt-1 text-sm font-semibold text-gray-900',
  nav: 'flex items-center',
  nav_button: 'h-7 w-7 rounded-lg border border-[#EABAB0]/40 bg-white text-[#875A6B] transition hover:bg-[#fdf7f8] flex items-center justify-center',
  nav_button_previous: 'absolute left-1',
  nav_button_next: 'absolute right-1',
  table: 'w-full border-collapse',
  head_row: 'grid grid-cols-7',
  head_cell: 'h-8 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400',
  row: 'grid grid-cols-7 mt-1',
  cell: 'relative h-9 text-center text-sm',
  day: 'h-8 w-full rounded-lg text-xs font-medium text-gray-800 transition hover:bg-[#EABAB0]/20',
  day_disabled: 'cursor-not-allowed text-gray-300 hover:bg-transparent opacity-50',
  day_outside: 'text-gray-300 opacity-40',
};

const FILTER_CAL_CSS = `
  .fc-sel, .rdp-day_selected { background:#875A6B!important; color:#fff!important; border-radius:0.5rem; }
  .fc-today:not(.fc-sel):not(.rdp-day_selected) { color:#5C3347!important; font-weight:700; }
`;

interface FilterBarProps {
  compact?: boolean;
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#EABAB0]/50 bg-[#fdf7f8] px-3 py-1 text-xs font-medium text-[#875A6B] shadow-sm">
      {label}
      <button type="button" onClick={onRemove} className="ml-0.5 rounded-full p-0.5 hover:bg-[#EABAB0]/30 transition">
        <X className="size-2.5" />
      </button>
    </span>
  );
}

export function FilterBar({ compact = false }: FilterBarProps) {
  const { filters, updateFilters, resetFilters, isFiltersActive } = useFilters();
  const [calOpen, setCalOpen] = useState(false);

  const eventTypes = [
    'Wedding', 'Birthday Party', 'Corporate Event', 'Anniversary',
    'Engagement Party', 'Baby Shower', 'Graduation', 'Retirement Party',
    'Holiday Party', 'Other',
  ];

  const cities = [
    'Berat', 'Durres', 'Elbasan', 'Fier',
    'Korce', 'Kruje', 'Shkoder', 'Tirane', 'Vlore',
  ];

  return (
    <div className="mb-6">
      {/* Accent top bar */}
      <div className="h-[3px] rounded-t-2xl bg-gradient-to-r from-[#875A6B] via-[#C9995A] to-[#EABAB0]" />

      {/* Main bar */}
      <div className="flex overflow-hidden rounded-b-2xl border border-t-0 border-[#EABAB0]/40 shadow-lg shadow-[#875A6B]/8"
        style={{ background: 'linear-gradient(to right, #ffffff, #fdfaf8, #fdf7f8)' }}>
        <div className="flex flex-1 flex-col divide-y divide-[#EABAB0]/25 lg:flex-row lg:divide-x lg:divide-y-0">

          <div className="group flex flex-1 flex-col px-5 py-3.5 transition-colors hover:bg-[#fdf7f8]/60">
            <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#875A6B]/60">
              <PartyPopper className="size-3 text-[#875A6B]/50" />
              Event Type
            </span>
            <Select value={filters.eventType} onValueChange={(v) => updateFilters({ eventType: v })}>
              <SelectTrigger className="h-auto border-none p-0 text-sm font-semibold text-slate-700 shadow-none ring-0 focus:ring-0">
                <SelectValue placeholder="What's the occasion?" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <div className="group flex flex-1 flex-col px-5 py-3.5 transition-colors hover:bg-[#fdf7f8]/60">
              <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#875A6B]/60">
                <Calendar className="size-3 text-[#C9995A]/70" />
                Date
              </span>
              <PopoverTrigger asChild>
                <button type="button" className="h-auto border-none bg-transparent p-0 text-left text-sm font-semibold text-slate-700 shadow-none outline-none ring-0">
                  {filters.date
                    ? new Date(filters.date + 'T12:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : <span className="font-normal text-slate-400">Any date</span>
                  }
                </button>
              </PopoverTrigger>
            </div>
            <PopoverContent
              className="w-auto overflow-hidden rounded-2xl border-[#EABAB0]/40 p-0 shadow-xl"
              align="start"
              sideOffset={8}
            >
              <div className="h-[3px] bg-gradient-to-r from-[#875A6B] via-[#C9995A] to-[#EABAB0]" />
              <DayPicker
                mode="single"
                selected={filters.date ? new Date(filters.date + 'T12:00') : undefined}
                onSelect={(d) => {
                  updateFilters({ date: d ? fmtFilterDate(d) : '' });
                  setCalOpen(false);
                }}
                disabled={{ before: new Date() }}
                modifiersClassNames={{ selected: 'fc-sel', today: 'fc-today' }}
                classNames={FILTER_CAL_NAMES}
              />
              {filters.date && (
                <div className="border-t border-[#EABAB0]/25 px-4 pb-3 pt-2">
                  <button type="button"
                    onClick={() => { updateFilters({ date: '' }); setCalOpen(false); }}
                    className="text-xs font-semibold text-[#875A6B]/60 underline underline-offset-2 hover:text-[#875A6B] transition">
                    Clear date
                  </button>
                </div>
              )}
              <style>{FILTER_CAL_CSS}</style>
            </PopoverContent>
          </Popover>

          <div className="group flex flex-1 flex-col px-5 py-3.5 transition-colors hover:bg-[#fdf7f8]/60">
            <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#875A6B]/60">
              <MapPin className="size-3 text-[#875A6B]/50" />
              City
            </span>
            <Select value={filters.city} onValueChange={(v) => updateFilters({ city: v })}>
              <SelectTrigger className="h-auto border-none p-0 text-sm font-semibold text-slate-700 shadow-none ring-0 focus:ring-0">
                <SelectValue placeholder="Where?" />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="group flex flex-1 flex-col px-5 py-3.5 transition-colors hover:bg-[#fdf7f8]/60">
            <span className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#875A6B]/60">
              <Users className="size-3 text-[#C9995A]/70" />
              Guests
            </span>
            <input
              type="number"
              placeholder="How many?"
              value={filters.numberOfGuests || ''}
              onChange={(e) => updateFilters({ numberOfGuests: parseInt(e.target.value) || 0 })}
              min="0"
              className="border-none bg-transparent p-0 text-sm font-semibold text-slate-700 outline-none placeholder:font-normal placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Search button */}
        <div className="flex items-center p-2.5">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-br from-[#875A6B] to-[#5C3347] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#875A6B]/30 transition hover:scale-[1.02] hover:shadow-lg hover:shadow-[#875A6B]/40 active:scale-[0.98]"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {isFiltersActive && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#875A6B]/50">Active filters:</span>
          {filters.eventType && (
            <FilterChip label={filters.eventType} onRemove={() => updateFilters({ eventType: '' })} />
          )}
          {filters.date && (
            <FilterChip
              label={new Date(filters.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              onRemove={() => updateFilters({ date: '' })}
            />
          )}
          {filters.city && (
            <FilterChip label={filters.city} onRemove={() => updateFilters({ city: '' })} />
          )}
          {filters.numberOfGuests > 0 && (
            <FilterChip label={`${filters.numberOfGuests} guests`} onRemove={() => updateFilters({ numberOfGuests: 0 })} />
          )}
          <button
            type="button"
            onClick={resetFilters}
            className="text-[11px] font-semibold text-[#875A6B]/60 underline underline-offset-2 hover:text-[#875A6B] transition"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
