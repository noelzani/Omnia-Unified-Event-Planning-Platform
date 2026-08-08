import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronDown, MapPin, X } from 'lucide-react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { supabase } from '../../../lib/supabase';
import { insertNotification } from '../../../services/notifications/notifications.service';

type Category = 'venue' | 'restaurant' | 'catering' | 'decoration';

type AvailabilityRow = {
  available_date: string;
  is_available: boolean;
};

type BookingItemRow = {
  bookings: {
    booking_status: string | null;
    events: {
      start_time: string | null;
      end_time: string | null;
    } | null;
  } | null;
};

const BRAND_PURPLE = '#875A6B';
const BRAND_PURPLE_DARK = '#5C3347';
const RESTAURANT_RESERVATION_FEE = 5;

const ENTITY_TABLE: Record<Category, string> = {
  venue: 'venues',
  restaurant: 'restaurants',
  catering: 'catering_services',
  decoration: 'decoration_services',
};

const ENTITY_ID_COL: Record<Category, string> = {
  venue: 'venue_id',
  restaurant: 'restaurant_id',
  catering: 'catering_id',
  decoration: 'decoration_id',
};

function formatDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dateFromString(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getDatesBetween(start: string, end?: string | null) {
  const dates: Date[] = [];
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : new Date(start);

  const current = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );

  const last = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate(),
  );

  while (current <= last) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function hasUnavailableDateInRange(
  from: Date,
  to: Date,
  unavailableDates: Date[],
) {
  const unavailableSet = new Set(unavailableDates.map(formatDateLocal));

  const current = new Date(from);
  current.setHours(0, 0, 0, 0);

  const last = new Date(to);
  last.setHours(0, 0, 0, 0);

  while (current <= last) {
    if (unavailableSet.has(formatDateLocal(current))) return true;
    current.setDate(current.getDate() + 1);
  }

  return false;
}

function getVenueDayCount(from: Date, to: Date) {
  const start = new Date(from);
  const end = new Date(to);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
}

function toMoney(value: unknown) {
  return Number(value || 0);
}

export default function BookingPage() {
  const navigate = useNavigate();
  const { entityType, id } = useParams();
  const [searchParams] = useSearchParams();

  const type = entityType as Category;

  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [range, setRange] = useState<DateRange | undefined>();

  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);

  const [guests, setGuests] = useState('');
  const [guestsTouched, setGuestsTouched] = useState(false);
  const [notes, setNotes] = useState('');

  const [selectedCity, setSelectedCity] = useState('');
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [minGuests, setMinGuests] = useState<number | null>(null);
  const [maxGuests, setMaxGuests] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);

  const isVenue = type === 'venue';
  const isRestaurant = type === 'restaurant';
  const showTimeSlot = isRestaurant;

  useEffect(() => {
    const dateFromUrl = searchParams.get('date');

    if (dateFromUrl) {
      const parsedDate = dateFromString(dateFromUrl);

      if (isVenue) {
        const toFromUrl = searchParams.get('to');
        const parsedTo = toFromUrl ? dateFromString(toFromUrl) : parsedDate;
        setRange({ from: parsedDate, to: parsedTo });
      } else {
        setSelectedDate(parsedDate);
      }
    }
  }, [searchParams, isVenue]);

  useEffect(() => {
    if (!type || !id) return;

    const fetchCalendarData = async () => {
      setCalendarLoading(true);
      setCalendarError('');

      const { data: availabilityData, error: availabilityError } =
        await supabase
          .from('availability')
          .select('available_date, is_available')
          .eq('entity_type', type)
          .eq('entity_id', id)
          .order('available_date', { ascending: true });

      const { data: bookingData, error: bookingError } = await supabase
        .from('booking_items')
        .select(`
          bookings (
            booking_status,
            events (
              start_time,
              end_time
            )
          )
        `)
        .eq('entity_type', type)
        .eq('entity_id', id);

      if (availabilityError || bookingError) {
        setCalendarError('Could not load availability.');
        setCalendarLoading(false);
        return;
      }

      setAvailability((availabilityData || []) as AvailabilityRow[]);

      const booked: Date[] = [];

      ((bookingData || []) as unknown as BookingItemRow[]).forEach((item) => {
        const booking = item.bookings;
        if (!booking) return;

        const status = booking.booking_status;
        const event = booking.events;

        const isBooked =
          status === 'Pending' ||
          status === 'Confirmed' ||
          status === 'Completed';

        if (!isBooked || !event?.start_time) return;

        booked.push(...getDatesBetween(event.start_time, event.end_time));
      });

      setBookedDates(booked);

      // Fetch city + capacity information for the entity
      const infoSelectMap: Record<Category, string> = {
        venue:       'city, capacity',
        restaurant:  'city, minimum_guests, maximum_guests',
        catering:    'city, minimum_guests, maximum_guests',
        decoration:  'city, operating_cities',
      };
      const { data: entityInfo } = await supabase
        .from(ENTITY_TABLE[type])
        .select(infoSelectMap[type])
        .eq(ENTITY_ID_COL[type], id)
        .single();

      if (entityInfo) {
        const main = ((entityInfo as any).city as string) || '';
        if (type === 'venue' || type === 'restaurant') {
          setCityOptions([main]);
          setSelectedCity(main);
        } else if (type === 'decoration') {
          const opCities: string[] = (entityInfo as any).operating_cities || [];
          const all = [main, ...opCities].filter(Boolean);
          setCityOptions(all);
          setSelectedCity(all[0] || '');
        } else {
          // catering — single city
          const opts = [main].filter(Boolean);
          setCityOptions(opts);
          setSelectedCity(opts[0] || '');
        }

        // Capacity limits
        if (type === 'venue') {
          setMaxGuests((entityInfo as any).capacity ?? null);
          setMinGuests(null);
        } else if (type === 'restaurant' || type === 'catering') {
          setMaxGuests((entityInfo as any).maximum_guests ?? null);
          setMinGuests((entityInfo as any).minimum_guests ?? null);
        } else {
          setMaxGuests(null);
          setMinGuests(null);
        }
      }

      setCalendarLoading(false);
    };

    fetchCalendarData();
  }, [type, id]);

  const unavailableDates = useMemo(() => {
    const manuallyUnavailable = availability
      .filter((item) => !item.is_available)
      .map((item) => dateFromString(item.available_date));

    return [...manuallyUnavailable, ...bookedDates];
  }, [availability, bookedDates]);

  const handleBooking = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error('You must be logged in to make a booking.');
        return;
      }

      const start = isVenue ? range?.from : selectedDate;
      const end = isVenue ? range?.to || range?.from : selectedDate;

      if (!start || !end) {
        toast.error('Please select date(s) before booking.');
        return;
      }

      if (!selectedCity) {
        toast.error('Service location could not be determined. Please try again.');
        return;
      }

      if (hasUnavailableDateInRange(start, end, unavailableDates)) {
        toast.error('One or more selected dates are unavailable.');
        return;
      }

      const cleanStartTime = startTimeRef.current?.value.trim() || '';
      const cleanEndTime = endTimeRef.current?.value.trim() || '';

      if (showTimeSlot && (!cleanStartTime || !cleanEndTime)) {
        toast.error('Please select a start and end time.');
        return;
      }

      if (!guests || Number(guests) <= 0) {
        setGuestsTouched(true);
        toast.error('Please enter the number of guests.');
        return;
      }

      const guestCount = Number(guests);

      if (maxGuests !== null && guestCount > maxGuests) {
        toast.error(`This service has a maximum capacity of ${maxGuests} guests.`);
        return;
      }
      if (minGuests !== null && guestCount < minGuests) {
        toast.error(`This service requires a minimum of ${minGuests} guests.`);
        return;
      }

      const eventInsertData = {
        event_category: type,
        city: selectedCity,
        description: 'Booking from app',
        start_time: showTimeSlot
          ? `${formatDateLocal(start)}T${cleanStartTime}:00`
          : `${formatDateLocal(start)}T00:00:00`,
        end_time: showTimeSlot
          ? `${formatDateLocal(end)}T${cleanEndTime}:00`
          : `${formatDateLocal(end)}T23:59:00`,
        nr_of_people: guestCount,
      };

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([eventInsertData])
        .select()
        .single();

      if (eventError) throw eventError;

      const tableMap: Record<Category, string> = {
        venue: 'venues',
        restaurant: 'restaurants',
        catering: 'catering_services',
        decoration: 'decoration_services',
      };

      const idColumnMap: Record<Category, string> = {
        venue: 'venue_id',
        restaurant: 'restaurant_id',
        catering: 'catering_id',
        decoration: 'decoration_id',
      };

      const priceColumnMap: Record<Category, string> = {
        venue: 'provider_id, price_per_day, name',
        restaurant: 'provider_id, name',
        catering: 'provider_id, price_per_person, name',
        decoration: 'provider_id, starting_price, name',
      };

      const { data: entityData, error: entityError } = await supabase
        .from(tableMap[type])
        .select(priceColumnMap[type])
        .eq(idColumnMap[type], id)
        .single();

      if (entityError) throw entityError;

      let calculatedPrice = 0;
      let quantity = 1;

      if (type === 'restaurant') {
        calculatedPrice = RESTAURANT_RESERVATION_FEE;
        quantity = 1;
      }

      if (type === 'decoration') {
        calculatedPrice = toMoney((entityData as any).starting_price);
        quantity = 1;
      }

      if (type === 'catering') {
        const pricePerPerson = toMoney((entityData as any).price_per_person);
        calculatedPrice = pricePerPerson * guestCount;
        quantity = guestCount;
      }

      if (type === 'venue') {
        const days = getVenueDayCount(start, end);
        const pricePerDay = toMoney((entityData as any).price_per_day);
        calculatedPrice = pricePerDay * days;
        quantity = days;
      }

      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            customer_id: user.id,
            event_id: eventData.event_id,
            provider_id: entityData?.provider_id,
            notes,
            booking_status: 'Pending',
            total_price: calculatedPrice,
          },
        ])
        .select()
        .single();

      if (bookingError) throw bookingError;

      const { error: itemError } = await supabase.from('booking_items').insert([
        {
          booking_id: bookingData.booking_id,
          entity_type: type,
          entity_id: Number(id),
          price: calculatedPrice,
          quantity,
        },
      ]);

      if (itemError) throw itemError;

      // Notify the provider about the new booking request
      if (entityData) {
        const providerId = (entityData as any).provider_id;
        const entityName = (entityData as any).name || type;
        if (providerId) {
          const { data: providerUser } = await supabase
            .from('providers')
            .select('user_id')
            .eq('provider_id', providerId)
            .single();
          if (providerUser?.user_id) {
            await insertNotification(
              providerUser.user_id,
              'New Booking Request',
              `A customer has requested a booking for ${entityName} on ${formatDateLocal(start)}.`,
              'booking',
            );
          }
        }
      }

      setSuccessOpen(true);
    } catch (err: any) {
      console.error('FULL ERROR:', err);
      toast.error(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calendarClassNames = {
    months: 'flex justify-center',
    month: 'w-full space-y-4',
    caption:
      'relative flex items-center justify-center pt-1 text-base font-semibold text-gray-900',
    nav: 'flex items-center',
    nav_button:
      'h-9 w-9 rounded-lg border border-[#EABAB0]/40 bg-white text-[#875A6B] transition hover:bg-[#fdf7f8]',
    nav_button_previous: 'absolute left-1',
    nav_button_next: 'absolute right-1',
    table: 'w-full border-collapse',
    head_row: 'grid grid-cols-7',
    head_cell:
      'h-10 text-center text-xs font-semibold uppercase tracking-wide text-gray-400',
    row: 'grid grid-cols-7 mt-1',
    cell: 'relative h-12 text-center text-sm',
    day: 'h-11 w-full rounded-lg text-sm font-medium text-gray-800 transition hover:bg-[#fdf7f8]',
    day_disabled: 'cursor-not-allowed text-gray-300 hover:bg-transparent',
    day_outside: 'text-gray-300 opacity-40',
  };

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-[#875A6B]/70 transition hover:text-[#875A6B]"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">Booking</h1>

        <p className="mb-2 text-gray-500">
          Select your date and booking details.
        </p>

        <p className="mb-8 text-sm text-gray-400">
          Booking for {type} #{id}
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-[#EABAB0]/40 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {isVenue ? 'Select date range' : 'Select event date'}
            </h2>

            {calendarLoading ? (
              <div className="flex min-h-[320px] items-center justify-center">
                <p className="text-sm text-gray-500">Loading availability...</p>
              </div>
            ) : calendarError ? (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {calendarError}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EABAB0]/40 bg-white p-4 shadow-sm">
                {isVenue ? (
                  <DayPicker
                    mode="range"
                    selected={range}
                    onSelect={setRange}
                    disabled={[{ before: new Date() }, ...unavailableDates]}
                    modifiers={{ booked: unavailableDates }}
                    modifiersClassNames={{
                      booked: 'booked-day',
                      selected: 'selected-day',
                      today: 'today-day',
                    }}
                    classNames={calendarClassNames}
                  />
                ) : (
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={[{ before: new Date() }, ...unavailableDates]}
                    modifiers={{ booked: unavailableDates }}
                    modifiersClassNames={{
                      booked: 'booked-day',
                      selected: 'selected-day',
                      today: 'today-day',
                    }}
                    classNames={calendarClassNames}
                  />
                )}
              </div>
            )}

            <style>
              {`
                .booked-day {
                  position: relative;
                  color: #9ca3af !important;
                  background: transparent !important;
                  opacity: 0.55;
                  text-decoration: none !important;
                }

                .booked-day::after {
                  content: "";
                  position: absolute;
                  left: 32%;
                  right: 32%;
                  bottom: 7px;
                  height: 2px;
                  border-radius: 999px;
                  background: #9ca3af;
                }

                .selected-day,
                .rdp-day_selected {
                  background: ${BRAND_PURPLE} !important;
                  color: #ffffff !important;
                  border: 1px solid ${BRAND_PURPLE} !important;
                }

                .today-day:not(.selected-day):not(.rdp-day_selected) {
                  color: ${BRAND_PURPLE_DARK} !important;
                  background: transparent !important;
                }
              `}
            </style>

            <div className="mt-4 text-sm text-gray-500">
              Unavailable dates are faded and underlined.
            </div>
          </div>

          <div className="h-fit space-y-5 rounded-2xl border border-[#EABAB0]/40 bg-white p-5 shadow-sm">

            {/* City — fixed for venue/restaurant/catering, selectable for decoration */}
            {(type === 'venue' || type === 'restaurant' || type === 'catering') && selectedCity && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                <MapPin className="size-4 shrink-0 text-[#875A6B]/60" />
                <span>{selectedCity}</span>
              </div>
            )}

            {type === 'decoration' && cityOptions.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[#875A6B]/60">
                  Service location
                </p>
                {cityOptions.length === 1 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                    <MapPin className="size-4 shrink-0 text-[#875A6B]/60" />
                    <span>{cityOptions[0]}</span>
                  </div>
                ) : (
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#875A6B]/60" />
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-[#EABAB0]/40 bg-[#fdf7f8] py-2.5 pl-9 pr-9 text-sm text-slate-700 outline-none transition focus:border-[#875A6B]/50 focus:ring-2 focus:ring-[#875A6B]/10"
                    >
                      {cityOptions.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {showTimeSlot && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Time slot
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    ref={startTimeRef}
                    type="time"
                    defaultValue="12:30"
                    className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-[#875A6B]/50"
                  />

                  <input
                    ref={endTimeRef}
                    type="time"
                    defaultValue="16:30"
                    className="rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-[#875A6B]/50"
                  />
                </div>
              </div>
            )}

            {(() => {
              const n = Number(guests);
              const isEmpty = guestsTouched && (!guests || n <= 0);
              const overMax = guests !== '' && n > 0 && maxGuests !== null && n > maxGuests;
              const underMin = guests !== '' && n > 0 && minGuests !== null && n < minGuests;
              const hasError = isEmpty || overMax || underMin;
              const errorMsg = isEmpty
                ? 'Number of guests is required'
                : overMax
                ? `Exceeds maximum capacity of ${maxGuests} guests`
                : underMin
                ? `Minimum ${minGuests} guests required`
                : null;
              return (
                <div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value.replace(/[^0-9]/g, ''))}
                    onBlur={() => setGuestsTouched(true)}
                    onKeyDown={(e) => {
                      if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Guests *"
                    className={`w-full rounded-lg border px-3 py-2 outline-none transition ${
                      hasError
                        ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-1 focus:ring-red-200'
                        : 'border-gray-200 focus:border-[#875A6B]/50'
                    }`}
                  />
                  {errorMsg && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
                      <AlertCircle className="size-3.5 shrink-0" />
                      {errorMsg}
                    </p>
                  )}
                  {!hasError && (maxGuests !== null || minGuests !== null) && (
                    <p className="mt-1 text-xs text-slate-400">
                      {minGuests !== null && maxGuests !== null
                        ? `Capacity: ${minGuests}–${maxGuests} guests`
                        : maxGuests !== null
                        ? `Max capacity: ${maxGuests} guests`
                        : `Min: ${minGuests} guests`}
                    </p>
                  )}
                </div>
              );
            })()}

            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special requests..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 outline-none focus:border-[#875A6B]/50"
            />

            {isRestaurant && (
              <div className="rounded-xl border border-[#EABAB0]/40 bg-[#fdf7f8] p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#875A6B]/60">What you pay now</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Reservation fee</span>
                  <span className="text-base font-bold text-[#875A6B]">€{RESTAURANT_RESERVATION_FEE}</span>
                </div>
                <div className="mt-3 flex gap-2 rounded-lg border border-[#EABAB0]/30 bg-white px-3 py-2.5">
                  <span className="mt-0.5 shrink-0 text-[#C9995A]">ℹ</span>
                  <p className="text-xs leading-relaxed text-slate-500">
                    This fee secures your table. Food, drinks, and any other costs are paid directly at the restaurant on the day.
                  </p>
                </div>
              </div>
            )}

            <Button
              onClick={handleBooking}
              className="w-full bg-[#875A6B] hover:bg-[#6f4958]"
              disabled={loading}
            >
              {loading ? 'Booking...' : isRestaurant ? 'Reserve Table — €5' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      </div>

      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button
              onClick={() => setSuccessOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition hover:bg-[#fdf7f8] hover:text-[#875A6B]"
            >
              <X size={20} />
            </button>

            <div className="p-7 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#EABAB0]/30 text-[#875A6B]">
                <CheckCircle2 size={34} />
              </div>

              <h2 className="text-2xl font-bold text-gray-900">
                Booking request sent
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                Your booking was sent to the provider. You will know soon if
                the provider accepts or rejects your request.
              </p>

              <div className="mt-7 grid gap-3">
                <Button
                  onClick={() => navigate('/my-bookings')}
                  className="w-full bg-[#875A6B] hover:bg-[#6f4958]"
                >
                  View My Bookings
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="w-full border-[#EABAB0]/40 hover:bg-[#fdf7f8]"
                >
                  Continue browsing
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}