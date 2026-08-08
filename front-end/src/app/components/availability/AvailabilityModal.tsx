import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { X, CalendarDays } from 'lucide-react';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import { supabase } from '../../../lib/supabase';

type EntityType = 'venue' | 'restaurant' | 'catering' | 'decoration';

type AvailabilityRow = {
  available_date: string;
  start_time: string;
  end_time: string;
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

type AvailabilityModalProps = {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityType;
  entityId: number | string;
};

const BRAND_PURPLE = '#875A6B';
const BRAND_PURPLE_DARK = '#5C3347';
const BRAND_PURPLE_LIGHT = '#EABAB0';

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
    startDate.getDate()
  );

  const last = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );

  while (current <= last) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export default function AvailabilityModal({
  isOpen,
  onClose,
  entityType,
  entityId,
}: AvailabilityModalProps) {
  const navigate = useNavigate();

  const isVenue = entityType === 'venue';

  const [availability, setAvailability] = useState<AvailabilityRow[]>([]);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchCalendarData = async () => {
      setLoading(true);
      setErrorMessage('');

      const { data: availabilityData, error: availabilityError } =
        await supabase
          .from('availability')
          .select('available_date, start_time, end_time, is_available')
          .eq('entity_type', entityType)
          .eq('entity_id', entityId)
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
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (availabilityError || bookingError) {
        setErrorMessage('Could not load availability. Please try again.');
        setLoading(false);
        return;
      }

      setAvailability((availabilityData || []) as AvailabilityRow[]);
      setSelectedDate(undefined);
      setSelectedRange(undefined);

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
      setLoading(false);
    };

    fetchCalendarData();
  }, [isOpen, entityType, entityId]);

  const unavailableDates = useMemo(() => {
    const manuallyUnavailable = availability
      .filter((item) => !item.is_available)
      .map((item) => dateFromString(item.available_date));

    return [...manuallyUnavailable, ...bookedDates];
  }, [availability, bookedDates]);

  const selectedDateStr = selectedDate ? formatDateLocal(selectedDate) : '';

  const handleBookNow = () => {
    if (isVenue) {
      const from = selectedRange?.from;
      const to = selectedRange?.to ?? from;
      if (!from) return;
      const params = to && to !== from
        ? `?date=${formatDateLocal(from)}&to=${formatDateLocal(to)}`
        : `?date=${formatDateLocal(from)}`;
      navigate(`/book/${entityType}/${entityId}${params}`);
    } else {
      if (!selectedDate) return;
      navigate(`/book/${entityType}/${entityId}?date=${selectedDateStr}`);
    }
  };

  const venueHasSelection = isVenue ? !!selectedRange?.from : false;
  const nonVenueHasSelection = !isVenue ? !!selectedDate : false;
  const hasSelection = venueHasSelection || nonVenueHasSelection;

  const bookButtonLabel = () => {
    if (isVenue && selectedRange?.from) {
      const from = formatDateLocal(selectedRange.from);
      const to = selectedRange.to ? formatDateLocal(selectedRange.to) : null;
      return to && to !== from ? `Book ${from} → ${to}` : `Book ${from}`;
    }
    return selectedDateStr ? `Book now for ${selectedDateStr}` : '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div
          className="border-b px-6 py-5"
          style={{ borderColor: BRAND_PURPLE_LIGHT }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-2 text-gray-500 transition hover:text-gray-900"
            style={{ backgroundColor: 'transparent' }}
          >
            <X size={22} />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="rounded-xl p-3"
              style={{
                backgroundColor: '#fdf7f8',
                color: BRAND_PURPLE,
              }}
            >
              <CalendarDays size={24} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Availability
              </h2>
              <p className="text-sm text-gray-500">
                {isVenue
                  ? 'Select a date range to continue booking.'
                  : 'Choose an available date to continue booking.'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <p className="text-sm text-gray-500">Loading availability...</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : (
            <>
              <div
                className="rounded-2xl border bg-white p-4 shadow-sm"
                style={{ borderColor: BRAND_PURPLE_LIGHT }}
              >
                {isVenue ? (
                  <DayPicker
                    mode="range"
                    selected={selectedRange}
                    onSelect={setSelectedRange}
                    disabled={[{ before: new Date() }, ...unavailableDates]}
                    modifiers={{ booked: unavailableDates }}
                    modifiersClassNames={{
                      booked: 'av-booked',
                      selected: 'av-selected',
                      today: 'av-today',
                    }}
                    classNames={{
                      months: 'flex justify-center',
                      month: 'w-full space-y-4',
                      caption: 'relative flex items-center justify-center pt-1 text-base font-semibold text-gray-900',
                      nav: 'flex items-center',
                      nav_button: 'h-9 w-9 rounded-lg border border-[#EABAB0]/40 bg-white text-[#875A6B] transition hover:bg-[#fdf7f8]',
                      nav_button_previous: 'absolute left-1',
                      nav_button_next: 'absolute right-1',
                      table: 'w-full border-collapse',
                      head_row: 'grid grid-cols-7',
                      head_cell: 'h-10 text-center text-xs font-semibold uppercase tracking-wide text-gray-400',
                      row: 'grid grid-cols-7 mt-1',
                      cell: 'relative h-12 text-center text-sm',
                      day: 'h-11 w-full rounded-lg text-sm font-medium text-gray-800 transition hover:bg-[#fdf7f8]',
                      day_disabled: 'cursor-not-allowed text-gray-300 hover:bg-transparent',
                      day_outside: 'text-gray-300 opacity-40',
                    }}
                  />
                ) : (
                  <DayPicker
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={[{ before: new Date() }, ...unavailableDates]}
                    modifiers={{ booked: unavailableDates }}
                    modifiersClassNames={{
                      booked: 'av-booked',
                      selected: 'av-selected',
                      today: 'av-today',
                    }}
                    classNames={{
                      months: 'flex justify-center',
                      month: 'w-full space-y-4',
                      caption: 'relative flex items-center justify-center pt-1 text-base font-semibold text-gray-900',
                      nav: 'flex items-center',
                      nav_button: 'h-9 w-9 rounded-lg border border-[#EABAB0]/40 bg-white text-[#875A6B] transition hover:bg-[#fdf7f8]',
                      nav_button_previous: 'absolute left-1',
                      nav_button_next: 'absolute right-1',
                      table: 'w-full border-collapse',
                      head_row: 'grid grid-cols-7',
                      head_cell: 'h-10 text-center text-xs font-semibold uppercase tracking-wide text-gray-400',
                      row: 'grid grid-cols-7 mt-1',
                      cell: 'relative h-12 text-center text-sm',
                      day: 'h-11 w-full rounded-lg text-sm font-medium text-gray-800 transition hover:bg-gray-50',
                      day_disabled: 'cursor-not-allowed text-gray-300 hover:bg-transparent',
                      day_outside: 'text-gray-300 opacity-40',
                    }}
                  />
                )}
              </div>

              <style>
                {`
                  .av-booked {
                    position: relative;
                    color: #9ca3af !important;
                    background: transparent !important;
                    opacity: 0.55;
                  }
                  .av-booked::after {
                    content: "";
                    position: absolute;
                    left: 32%; right: 32%; bottom: 7px;
                    height: 2px;
                    border-radius: 999px;
                    background: #9ca3af;
                  }
                  .av-selected, .rdp-day_selected {
                    background: ${BRAND_PURPLE} !important;
                    color: #ffffff !important;
                    border: 1px solid ${BRAND_PURPLE} !important;
                  }
                  .av-today:not(.av-selected):not(.rdp-day_selected) {
                    color: ${BRAND_PURPLE_DARK} !important;
                    font-weight: 700;
                  }
                `}
              </style>

              <div className="mt-4 text-sm text-gray-500">
                {isVenue
                  ? 'Click a start date then an end date. Faded dates are unavailable.'
                  : 'Unavailable dates are faded and underlined.'}
              </div>

              {hasSelection && (
                <button
                  onClick={handleBookNow}
                  className="mt-6 w-full rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                  style={{ backgroundColor: BRAND_PURPLE }}
                >
                  {bookButtonLabel()}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}