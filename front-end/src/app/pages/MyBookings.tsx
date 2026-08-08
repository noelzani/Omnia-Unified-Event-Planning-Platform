import { useEffect, useState } from 'react';
import { CalendarDays, Clock, Users, StickyNote, Loader2, CheckCircle2, XCircle, Hourglass, CreditCard, Pencil, Trash2, AlertCircle, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { DayPicker, type DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

type StatusFilter = 'All' | 'Pending' | 'Confirmed' | 'Paid' | 'Cancelled';

import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import PayPalButton from '../components/payment/PayPalButton';
import ConfirmModal from '../components/ui/ConfirmModal';
import { insertNotification } from '../../services/notifications/notifications.service';

type EntityType = 'venue' | 'restaurant' | 'catering' | 'decoration';

type Payment = {
  payment_id: number;
  booking_id: number;
  payment_method: string;
  amount: number;
  payment_status: string | null;
  transaction_reference: string | null;
};

type BookingItem = {
  booking_item_id: number;
  entity_type: EntityType;
  entity_id: number;
  price: number;
  quantity: number;
  notes: string | null;
  entity_name?: string;
};

type EventData = {
  event_category: string | null;
  city: string | null;
  start_time: string | null;
  end_time: string | null;
  nr_of_people: number | null;
};

type Booking = {
  booking_id: number;
  customer_id: string;
  event_id: number;
  booking_status: string | null;
  total_price: number | null;
  created_at: string | null;
  updated_at: string | null;
  notes: string | null;
  booking_items: BookingItem[];
  events: EventData | null;
  payments: Payment[];
};

type EditForm = {
  notes: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  nr_of_people: string;
};

type EditConstraints = {
  minGuests: number | null;
  maxGuests: number | null;
  unavailableDates: Set<string>;
};

const tableByType: Record<EntityType, { table: string; id: string }> = {
  venue: { table: 'venues', id: 'venue_id' },
  restaurant: { table: 'restaurants', id: 'restaurant_id' },
  catering: { table: 'catering_services', id: 'catering_id' },
  decoration: { table: 'decoration_services', id: 'decoration_id' },
};

const EDIT_CAL_NAMES = {
  months: 'flex justify-center',
  month: 'w-full space-y-3',
  caption: 'relative flex items-center justify-center pt-1 text-sm font-semibold text-gray-900',
  nav: 'flex items-center',
  nav_button: 'h-8 w-8 rounded-lg border border-[#EABAB0]/40 bg-white text-[#875A6B] transition hover:bg-[#fdf7f8] flex items-center justify-center',
  nav_button_previous: 'absolute left-1',
  nav_button_next: 'absolute right-1',
  table: 'w-full border-collapse',
  head_row: 'grid grid-cols-7',
  head_cell: 'h-9 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400',
  row: 'grid grid-cols-7 mt-1',
  cell: 'relative h-10 text-center text-sm',
  day: 'h-9 w-full rounded-lg text-sm font-medium text-gray-800 transition hover:bg-[#fdf7f8]',
  day_disabled: 'cursor-not-allowed text-gray-300 hover:bg-transparent',
  day_outside: 'text-gray-300 opacity-40',
};

const EDIT_CAL_CSS = `
  .ec-booked { position:relative; color:#9ca3af!important; background:transparent!important; opacity:0.55; }
  .ec-booked::after { content:""; position:absolute; left:32%; right:32%; bottom:6px; height:2px; border-radius:999px; background:#9ca3af; }
  .ec-selected, .rdp-day_selected { background:#875A6B!important; color:#fff!important; border:1px solid #875A6B!important; border-radius:0.5rem; }
  .ec-today:not(.ec-selected):not(.rdp-day_selected) { color:#5C3347!important; font-weight:700; }
`;

function getPaymentDeadline(booking: Booking): Date | null {
  const isPaid = booking.payments?.some(p => p.payment_status === 'Paid');
  if (booking.booking_status !== 'Confirmed' || isPaid) return null;

  const confirmedAt = new Date(booking.updated_at || booking.created_at || Date.now());

  const twoDays = new Date(confirmedAt);
  twoDays.setDate(twoDays.getDate() + 2);
  twoDays.setHours(23, 59, 59, 999);

  const eventStart = booking.events?.start_time;
  if (eventStart) {
    const dayBefore = new Date(eventStart);
    dayBefore.setDate(dayBefore.getDate() - 1);
    dayBefore.setHours(23, 59, 59, 999);
    return new Date(Math.min(twoDays.getTime(), dayBefore.getTime()));
  }

  return twoDays;
}

function formatTimeRemaining(deadline: Date, now: Date): { text: string; urgent: boolean } {
  const diff = deadline.getTime() - now.getTime();
  if (diff <= 0) return { text: 'Overdue', urgent: true };
  const totalMins = Math.floor(diff / 60_000);
  const days = Math.floor(totalMins / (60 * 24));
  const hours = Math.floor((totalMins % (60 * 24)) / 60);
  const mins = totalMins % 60;
  if (days > 0) return { text: `${days}d ${hours}h left`, urgent: false };
  if (hours > 0) return { text: `${hours}h ${mins}m left`, urgent: hours < 12 };
  return { text: `${mins}m left`, urgent: true };
}

function fmtDateLocal(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateRangeStrings(start: string, end?: string | null): string[] {
  const out: string[] = [];
  const cur = new Date(start.slice(0, 10));
  const last = new Date((end ?? start).slice(0, 10));
  while (cur <= last) { out.push(fmtDateLocal(new Date(cur))); cur.setDate(cur.getDate() + 1); }
  return out;
}

export default function MyBookings() {
  const { user } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ notes: '', start_date: '', start_time: '', end_date: '', end_time: '', nr_of_people: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editConstraints, setEditConstraints] = useState<EditConstraints | null>(null);
  const [editConstraintsLoading, setEditConstraintsLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [cancelModalId, setCancelModalId] = useState<number | null>(null);

  const formatDate = (dateValue: string | null) => {
    if (!dateValue) return 'No date';
    return new Date(dateValue).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return 'No date';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    if (!endDate || startDate.toDateString() === endDate.toDateString()) return formatDate(start);
    const sameYear = startDate.getFullYear() === endDate.getFullYear();
    const startStr = startDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
    const endStr = endDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  };

  const formatTime = (dateValue: string | null) => {
    if (!dateValue) return '--';
    const timePart = dateValue.split('T')[1] || dateValue.split(' ')[1];
    if (!timePart) return '--';
    const [hourText, minute] = timePart.slice(0, 5).split(':');
    let hour = Number(hourText);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${suffix}`;
  };

  const parseDate = (v: string | null) => (v ? v.slice(0, 10) : '');
  const parseTime = (v: string | null) => {
    if (!v) return '';
    const t = v.split('T')[1] || v.split(' ')[1];
    return t ? t.slice(0, 5) : '';
  };

  const loadBookings = async () => {
    if (!user) { setLoading(false); return; }
    try {
      setLoading(true);
      setErrorMessage('');
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          booking_id, customer_id, event_id,
          booking_status, total_price, created_at, updated_at, notes,
          booking_items (booking_item_id, entity_type, entity_id, price, quantity, notes),
          events (event_category, city, start_time, end_time, nr_of_people),
          payments (payment_id, booking_id, payment_method, amount, payment_status, transaction_reference)
        `)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []) as unknown as Booking[];
      const rowsWithNames = await Promise.all(
        rows.map(async (booking) => {
          const itemsWithNames = await Promise.all(
            (booking.booking_items || []).map(async (item) => {
              const config = tableByType[item.entity_type];
              if (!config) return { ...item, entity_name: 'Unknown service' };
              const { data: entityData } = await supabase.from(config.table).select('name').eq(config.id, item.entity_id).single();
              return { ...item, entity_name: entityData?.name || 'Unknown service' };
            })
          );
          return { ...booking, booking_items: itemsWithNames };
        })
      );

      // Auto-cancel confirmed+unpaid bookings past their payment deadline
      const nowTs = new Date();
      const expired = rowsWithNames.filter(b => {
        const isPaid = b.payments?.some(p => p.payment_status === 'Paid');
        if (isPaid || b.booking_status !== 'Confirmed') return false;
        const deadline = getPaymentDeadline(b);
        return deadline ? deadline < nowTs : false;
      });
      if (expired.length > 0) {
        const expiredIds = expired.map(b => b.booking_id);
        await supabase
          .from('bookings')
          .update({ booking_status: 'Cancelled', updated_at: nowTs.toISOString() })
          .in('booking_id', expiredIds);
        for (const b of rowsWithNames) {
          if (expiredIds.includes(b.booking_id)) b.booking_status = 'Cancelled';
        }
      }

      setBookings(rowsWithNames);
    } catch (error) {
      console.error(error);
      setErrorMessage('Could not load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, [user]);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const fetchEditConstraints = async (booking: Booking) => {
    const item = booking.booking_items[0];
    if (!item) return;

    let minG: number | null = null;
    let maxG: number | null = null;

    if (item.entity_type === 'venue') {
      const { data } = await supabase.from('venues').select('capacity').eq('venue_id', item.entity_id).single();
      maxG = (data as any)?.capacity ?? null;
    } else if (item.entity_type === 'restaurant') {
      const { data } = await supabase.from('restaurants').select('minimum_guests, maximum_guests').eq('restaurant_id', item.entity_id).single();
      minG = (data as any)?.minimum_guests ?? null;
      maxG = (data as any)?.maximum_guests ?? null;
    } else if (item.entity_type === 'catering') {
      const { data } = await supabase.from('catering_services').select('minimum_guests, maximum_guests').eq('catering_id', item.entity_id).single();
      minG = (data as any)?.minimum_guests ?? null;
      maxG = (data as any)?.maximum_guests ?? null;
    }

    const { data: availData } = await supabase
      .from('availability')
      .select('available_date, is_available')
      .eq('entity_type', item.entity_type)
      .eq('entity_id', item.entity_id);

    const blocked = new Set<string>(
      ((availData || []) as Array<{ available_date: string; is_available: boolean }>)
        .filter(r => !r.is_available)
        .map(r => r.available_date)
    );

    const { data: bookingData } = await supabase
      .from('booking_items')
      .select('bookings(booking_id, booking_status, events(start_time, end_time))')
      .eq('entity_type', item.entity_type)
      .eq('entity_id', item.entity_id);

    ((bookingData || []) as any[]).forEach((bi: any) => {
      const b = bi.bookings;
      if (!b || b.booking_id === booking.booking_id) return;
      if (!['Pending', 'Confirmed', 'Completed'].includes(b.booking_status)) return;
      const ev = b.events;
      if (!ev?.start_time) return;
      dateRangeStrings(ev.start_time, ev.end_time).forEach((d: string) => blocked.add(d));
    });

    setEditConstraints({ minGuests: minG, maxGuests: maxG, unavailableDates: blocked });
  };

  const startEdit = async (booking: Booking) => {
    const s = booking.events?.start_time ?? null;
    const e = booking.events?.end_time ?? null;
    setEditForm({
      notes: booking.notes || '',
      start_date: parseDate(s),
      start_time: parseTime(s),
      end_date: parseDate(e),
      end_time: parseTime(e),
      nr_of_people: booking.events?.nr_of_people?.toString() || '',
    });
    setEditConstraints(null);
    setEditingId(booking.booking_id);
    setEditConstraintsLoading(true);
    try {
      await fetchEditConstraints(booking);
    } finally {
      setEditConstraintsLoading(false);
    }
  };

  const handleEditSave = async (booking: Booking) => {
    try {
      setEditLoading(true);
      const isVenueBooking = booking.booking_items[0]?.entity_type === 'venue';

      // Past-date guard
      const todayStr = fmtDateLocal(new Date());
      if (editForm.start_date && editForm.start_date < todayStr) {
        toast.error('Start date cannot be in the past.');
        return;
      }
      const endDateStr = isVenueBooking ? editForm.end_date : editForm.start_date;
      if (editForm.start_date && endDateStr && endDateStr < editForm.start_date) {
        toast.error('End date must be on or after start date.');
        return;
      }

      // Guest capacity
      if (editConstraints) {
        const guestNum = Number(editForm.nr_of_people) || 0;
        if (editConstraints.maxGuests !== null && guestNum > editConstraints.maxGuests) {
          toast.error(`Maximum capacity is ${editConstraints.maxGuests} guests.`);
          return;
        }
        if (editConstraints.minGuests !== null && guestNum < editConstraints.minGuests) {
          toast.error(`Minimum required is ${editConstraints.minGuests} guests.`);
          return;
        }

        // Unavailable / already-booked dates
        if (editForm.start_date && endDateStr) {
          const datesToCheck = dateRangeStrings(editForm.start_date, endDateStr);
          if (datesToCheck.some(d => editConstraints.unavailableDates.has(d))) {
            toast.error('One or more selected dates are unavailable or already booked.');
            return;
          }
        }
      }

      const startISO = editForm.start_date
        ? `${editForm.start_date}T${editForm.start_time || '00:00'}:00`
        : null;
      const endDate = isVenueBooking ? editForm.end_date : editForm.start_date;
      const endISO = endDate
        ? `${endDate}T${editForm.end_time || '23:59'}:00`
        : null;

      const { error: eventsError } = await supabase
        .from('events')
        .update({
          start_time: startISO,
          end_time: endISO,
          nr_of_people: editForm.nr_of_people ? Number(editForm.nr_of_people) : null,
        })
        .eq('event_id', booking.event_id);
      if (eventsError) throw eventsError;

      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ notes: editForm.notes || null })
        .eq('booking_id', booking.booking_id);
      if (bookingError) throw bookingError;

      setEditingId(null);
      await loadBookings();
    } catch (err) {
      console.error(err);
      toast.error('Could not save changes.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (cancelModalId === null) return;
    try {
      setCancellingId(cancelModalId);
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: 'Cancelled' })
        .eq('booking_id', cancelModalId);
      if (error) throw error;
      setBookings(prev => prev.map(b => b.booking_id === cancelModalId ? { ...b, booking_status: 'Cancelled' } : b));
      toast.success('Booking cancelled.');
    } catch (err) {
      console.error(err);
      toast.error('Could not cancel booking.');
    } finally {
      setCancellingId(null);
      setCancelModalId(null);
    }
  };

  const handlePaymentSuccess = async (booking: Booking, paypalOrderId: string) => {
    try {
      const { error } = await supabase.from('payments').insert({
        booking_id: booking.booking_id,
        payment_method: 'PayPal',
        amount: booking.total_price || 0,
        payment_status: 'Paid',
        transaction_reference: paypalOrderId,
      });
      if (error) throw error;

      // Notify the provider that payment was received
      const { data: bookingRow } = await supabase
        .from('bookings')
        .select('provider_id')
        .eq('booking_id', booking.booking_id)
        .single();
      if (bookingRow?.provider_id) {
        const { data: providerUser } = await supabase
          .from('providers')
          .select('user_id')
          .eq('provider_id', bookingRow.provider_id)
          .single();
        if (providerUser?.user_id) {
          const entityName = booking.booking_items[0]?.entity_name || 'your service';
          await insertNotification(
            providerUser.user_id,
            'Payment Received',
            `€${booking.total_price} payment received for ${entityName} (booking #${booking.booking_id}).`,
            'payment',
          );
        }
      }

      toast.success('Payment saved successfully!');
      await loadBookings();
    } catch (error) {
      console.error(error);
      toast.error('Payment was completed, but saving it failed. Please contact support.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#fdf7f8]">
        <Loader2 className="h-7 w-7 animate-spin text-[#875A6B]" />
      </div>
    );
  }

  const counts: Record<StatusFilter, number> = {
    All:       bookings.length,
    Pending:   bookings.filter(b => b.booking_status === 'Pending').length,
    Confirmed: bookings.filter(b => b.booking_status === 'Confirmed' && !b.payments?.some(p => p.payment_status === 'Paid')).length,
    Paid:      bookings.filter(b => b.payments?.some(p => p.payment_status === 'Paid')).length,
    Cancelled: bookings.filter(b => b.booking_status === 'Cancelled').length,
  };

  const filteredBookings = bookings.filter(b => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Paid') return b.payments?.some(p => p.payment_status === 'Paid');
    if (statusFilter === 'Confirmed') return b.booking_status === 'Confirmed' && !b.payments?.some(p => p.payment_status === 'Paid');
    return b.booking_status === statusFilter;
  });

  const STATUS_TABS: { key: StatusFilter; label: string; icon: React.ElementType }[] = [
    { key: 'All',       label: 'All',       icon: CalendarDays },
    { key: 'Pending',   label: 'Pending',   icon: Hourglass },
    { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'Paid',      label: 'Paid',      icon: CreditCard },
    { key: 'Cancelled', label: 'Cancelled', icon: XCircle },
  ];

  return (
    <>
    <div className="min-h-screen bg-[#fdf7f8]">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-lg text-gray-600">All your reservations and their current status.</p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-[#EABAB0]/50 bg-[#EABAB0]/15 px-4 py-3 text-sm text-[#875A6B]">
            {errorMessage}
          </div>
        )}

        {bookings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map(({ key, label, icon: Icon }) => {
              const active = statusFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                    active
                      ? 'border-[#875A6B] bg-[#875A6B] text-white shadow-md shadow-[#875A6B]/20'
                      : 'border-[#EABAB0]/40 bg-white text-slate-600 hover:border-[#875A6B]/30 hover:text-[#875A6B]'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {counts[key]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Unpaid bookings summary banner */}
        {(() => {
          const unpaid = bookings.filter(b => {
            const isPaid = b.payments?.some(p => p.payment_status === 'Paid');
            return b.booking_status === 'Confirmed' && !isPaid;
          });
          if (unpaid.length === 0) return null;

          const deadlines = unpaid
            .map(b => getPaymentDeadline(b))
            .filter((d): d is Date => d !== null);
          const soonest = deadlines.length > 0 ? new Date(Math.min(...deadlines.map(d => d.getTime()))) : null;
          const { text: timerText, urgent } = soonest ? formatTimeRemaining(soonest, now) : { text: '', urgent: false };

          return (
            <div className={`relative overflow-hidden rounded-2xl border px-5 py-4 shadow-sm ${
              urgent
                ? 'border-red-200 bg-gradient-to-r from-red-50 to-rose-50'
                : 'border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50'
            }`}>
              {/* Decorative strip */}
              <div className={`absolute inset-y-0 left-0 w-1 rounded-l-2xl ${urgent ? 'bg-red-400' : 'bg-amber-400'}`} />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${urgent ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <Timer className={`size-5 ${urgent ? 'text-red-500' : 'text-amber-500'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${urgent ? 'text-red-800' : 'text-amber-800'}`}>
                      {unpaid.length === 1
                        ? '1 booking is awaiting payment'
                        : `${unpaid.length} bookings are awaiting payment`}
                    </p>
                    {soonest && (
                      <p className={`mt-0.5 text-xs ${urgent ? 'text-red-500' : 'text-amber-600'}`}>
                        Most urgent deadline in{' '}
                        <span className="font-semibold">{timerText.replace(' left', '').replace('Overdue', 'overdue')}</span>
                        {' '}— {soonest.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} at {soonest.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setStatusFilter('Confirmed')}
                  className={`self-start sm:self-auto shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
                    urgent
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-amber-400 text-white hover:bg-amber-500'
                  }`}
                >
                  View {unpaid.length > 1 ? 'all' : 'booking'}
                </button>
              </div>
            </div>
          );
        })()}

        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-[#EABAB0]/30 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#EABAB0]/30">
              <CalendarDays className="size-6 text-[#875A6B]" />
            </div>
            <h2 className="text-lg font-semibold text-slate-700">No bookings yet</h2>
            <p className="mt-2 text-sm text-slate-400">Your reservations will appear here after you book a service.</p>
            <Button className="mt-6 bg-[#875A6B] hover:bg-[#6f4958] text-white" onClick={() => window.history.back()}>
              Browse Services
            </Button>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="rounded-2xl border border-[#EABAB0]/30 bg-white py-12 text-center">
            <p className="text-base font-semibold text-slate-600">No {statusFilter.toLowerCase()} bookings</p>
            <p className="mt-1 text-sm text-slate-400">Try a different filter above</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => {
              const isPaid = booking.payments?.some((p) => p.payment_status === 'Paid');
              const canPay = booking.booking_status === 'Confirmed' && !isPaid && Number(booking.total_price || 0) > 0;
              const canEdit = booking.booking_status === 'Pending' && !isPaid;
              const canCancel = !isPaid && booking.booking_status !== 'Cancelled';
              const isEditing = editingId === booking.booking_id;
              const isCancelling = cancellingId === booking.booking_id;

              const statusLabel = isPaid ? 'Paid' : booking.booking_status || 'Pending';
              const statusCls = isPaid
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : booking.booking_status === 'Confirmed'
                ? 'bg-[#EABAB0]/30 text-[#875A6B] border-[#EABAB0]/50'
                : booking.booking_status === 'Cancelled'
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-amber-50 text-amber-700 border-amber-200';

              const topStripCls = isPaid
                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                : booking.booking_status === 'Confirmed'
                ? 'bg-gradient-to-r from-[#875A6B] to-[#EABAB0]'
                : booking.booking_status === 'Cancelled'
                ? 'bg-gradient-to-r from-rose-400 to-red-400'
                : 'bg-gradient-to-r from-amber-400 to-[#C9995A]';

              return (
                <div key={booking.booking_id} className="rounded-2xl bg-white border border-[#EABAB0]/30 shadow-sm overflow-hidden">
                  <div className={`h-1 ${topStripCls}`} />

                  <div className="p-6">
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold uppercase tracking-widest text-[#875A6B]/60">
                            #{booking.booking_id}
                          </span>
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCls}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-xl font-bold text-[#111827]">
                          {booking.booking_items[0]?.entity_name || booking.events?.event_category || 'Booking'}
                        </p>
                        {booking.booking_items.length > 1 && (
                          <p className="text-sm text-slate-400">
                            +{booking.booking_items.length - 1} more service{booking.booking_items.length - 1 > 1 ? 's' : ''}
                          </p>
                        )}
                        {booking.events?.city && (
                          <p className="text-sm text-slate-400">{booking.events.city}</p>
                        )}
                      </div>
                      {booking.total_price != null && (
                        <div className="text-right">
                          <p className="text-sm text-slate-400">
                            {booking.booking_items[0]?.entity_type === 'restaurant' ? 'Reservation fee' : 'Total'}
                          </p>
                          <p className="text-xl font-bold text-[#875A6B]">€{booking.total_price}</p>
                        </div>
                      )}
                    </div>

                    {/* Info chips */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[
                        { icon: CalendarDays, text: booking.booking_items[0]?.entity_type === 'venue'
                          ? formatDateRange(booking.events?.start_time || null, booking.events?.end_time || null)
                          : formatDate(booking.events?.start_time || null) },
                        ...(booking.booking_items[0]?.entity_type === 'restaurant'
                          ? [{ icon: Clock, text: `${formatTime(booking.events?.start_time || null)} – ${formatTime(booking.events?.end_time || null)}` }]
                          : []),
                        { icon: Users, text: `${booking.events?.nr_of_people || 0} guests` },
                      ].map(({ icon: Icon, text }, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-full bg-slate-50 border border-slate-100 px-4 py-2 text-sm text-slate-600">
                          <Icon className="size-3.5 text-[#875A6B]/60 shrink-0" />
                          {text}
                        </div>
                      ))}
                    </div>

                    {/* Services */}
                    <div className="mt-4 rounded-xl bg-[#fdf7f8] border border-[#EABAB0]/25 p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#875A6B]/60">Services</p>
                      <div className="grid gap-2">
                        {booking.booking_items.length === 0 ? (
                          <p className="text-sm text-slate-400">No services found.</p>
                        ) : (
                          booking.booking_items.map((item) => (
                            <div key={item.booking_item_id} className="flex items-center justify-between rounded-lg bg-white border border-[#EABAB0]/20 px-4 py-3">
                              <p className="text-base font-semibold text-[#111827]">{item.entity_name}</p>
                              <span className="text-base font-semibold text-[#875A6B]">
                                {item.quantity > 1 ? `${item.quantity}× ` : ''}€{item.price}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    {booking.notes && !isEditing && (
                      <div className="mt-3 rounded-xl border border-[#EABAB0]/30 bg-[#fdf7f8] px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#875A6B]/60 mb-1.5 flex items-center gap-1.5">
                          <StickyNote className="size-3.5" /> Notes
                        </p>
                        <p className="text-sm text-slate-600">{booking.notes}</p>
                      </div>
                    )}

                    {/* Edit form */}
                    {isEditing && (() => {
                      const isVenueBooking = booking.booking_items[0]?.entity_type === 'venue';
                      const isRestaurantBooking = booking.booking_items[0]?.entity_type === 'restaurant';

                      const unavailDates = editConstraints
                        ? Array.from(editConstraints.unavailableDates).map(d => new Date(d + 'T12:00:00'))
                        : [];

                      const editRange: DateRange | undefined = isVenueBooking
                        ? (editForm.start_date
                            ? { from: new Date(editForm.start_date + 'T12:00:00'), to: editForm.end_date ? new Date(editForm.end_date + 'T12:00:00') : undefined }
                            : undefined)
                        : undefined;

                      const editSingle: Date | undefined = !isVenueBooking && editForm.start_date
                        ? new Date(editForm.start_date + 'T12:00:00')
                        : undefined;

                      const guestNum = Number(editForm.nr_of_people) || 0;
                      const guestOverMax = !!editConstraints && editConstraints.maxGuests !== null && editForm.nr_of_people !== '' && guestNum > editConstraints.maxGuests;
                      const guestUnderMin = !!editConstraints && editConstraints.minGuests !== null && editForm.nr_of_people !== '' && guestNum < editConstraints.minGuests;
                      const guestError = guestOverMax
                        ? `Exceeds maximum of ${editConstraints!.maxGuests} guests`
                        : guestUnderMin
                        ? `Minimum ${editConstraints!.minGuests} guests required`
                        : null;

                      const inputCls = "h-10 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25";

                      return (
                      <div className="mt-4 rounded-xl border border-[#875A6B]/20 bg-[#fdf7f8] p-4 space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#875A6B]/60">Edit Booking Details</p>

                        {/* Calendar */}
                        <div className="overflow-hidden rounded-xl border border-[#EABAB0]/40 bg-white shadow-sm">
                          <div className="h-[3px] bg-gradient-to-r from-[#875A6B] via-[#C9995A] to-[#EABAB0]" />
                          <div className="p-3">
                            {editConstraintsLoading ? (
                              <div className="flex h-52 items-center justify-center">
                                <Loader2 className="size-5 animate-spin text-[#875A6B]" />
                              </div>
                            ) : isVenueBooking ? (
                              <DayPicker
                                mode="range"
                                selected={editRange}
                                onSelect={(r) => setEditForm(f => ({
                                  ...f,
                                  start_date: r?.from ? fmtDateLocal(r.from) : '',
                                  end_date: r?.to ? fmtDateLocal(r.to) : '',
                                }))}
                                disabled={[{ before: new Date() }, ...unavailDates]}
                                modifiers={{ booked: unavailDates }}
                                modifiersClassNames={{ booked: 'ec-booked', selected: 'ec-selected', today: 'ec-today' }}
                                classNames={EDIT_CAL_NAMES}
                              />
                            ) : (
                              <DayPicker
                                mode="single"
                                selected={editSingle}
                                onSelect={(d) => setEditForm(f => ({
                                  ...f,
                                  start_date: d ? fmtDateLocal(d) : '',
                                  end_date: '',
                                }))}
                                disabled={[{ before: new Date() }, ...unavailDates]}
                                modifiers={{ booked: unavailDates }}
                                modifiersClassNames={{ booked: 'ec-booked', selected: 'ec-selected', today: 'ec-today' }}
                                classNames={EDIT_CAL_NAMES}
                              />
                            )}
                          </div>
                          <style>{EDIT_CAL_CSS}</style>
                        </div>

                        {/* Hint */}
                        {unavailDates.length > 0 && (
                          <p className="text-xs text-slate-400">Faded dates are unavailable or already booked.</p>
                        )}

                        {/* Time — restaurants only */}
                        {isRestaurantBooking && (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-sm font-semibold text-gray-700">Start Time</label>
                              <input type="time" value={editForm.start_time}
                                onChange={e => setEditForm(f => ({ ...f, start_time: e.target.value }))}
                                className={inputCls} />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-semibold text-gray-700">End Time</label>
                              <input type="time" value={editForm.end_time}
                                onChange={e => setEditForm(f => ({ ...f, end_time: e.target.value }))}
                                className={inputCls} />
                            </div>
                          </div>
                        )}

                        {/* Guests */}
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Number of Guests</label>
                          <input
                            type="text" inputMode="numeric" pattern="[0-9]*"
                            value={editForm.nr_of_people}
                            onChange={e => setEditForm(f => ({ ...f, nr_of_people: e.target.value.replace(/[^0-9]/g, '') }))}
                            onKeyDown={e => { if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight|Tab/.test(e.key)) e.preventDefault(); }}
                            className={`${inputCls} ${guestError ? '!border-red-300 bg-red-50' : ''}`}
                            placeholder="e.g. 50"
                          />
                          {guestError && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
                              <AlertCircle className="size-3.5 shrink-0" /> {guestError}
                            </p>
                          )}
                          {!guestError && editConstraints && (editConstraints.maxGuests !== null || editConstraints.minGuests !== null) && (
                            <p className="mt-1 text-xs text-slate-400">
                              {editConstraints.minGuests !== null && editConstraints.maxGuests !== null
                                ? `Capacity: ${editConstraints.minGuests}–${editConstraints.maxGuests} guests`
                                : editConstraints.maxGuests !== null
                                ? `Max capacity: ${editConstraints.maxGuests} guests`
                                : `Min: ${editConstraints.minGuests} guests`}
                            </p>
                          )}
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="mb-1.5 block text-sm font-semibold text-gray-700">Notes</label>
                          <textarea rows={3} value={editForm.notes}
                            onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25"
                            placeholder="Any notes for the provider..." />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" onClick={() => setEditingId(null)}
                            className="h-10 rounded-xl px-5 text-sm">Discard</Button>
                          <Button type="button" disabled={editLoading || editConstraintsLoading}
                            onClick={() => void handleEditSave(booking)}
                            className="h-10 rounded-xl bg-[#875A6B] px-5 text-sm text-white hover:bg-[#6f4958]">
                            {editLoading || editConstraintsLoading
                              ? <Loader2 className="size-4 animate-spin" />
                              : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                      );
                    })()}

                    {/* Payment deadline warning */}
                    {(() => {
                      const deadline = getPaymentDeadline(booking);
                      if (!deadline) return null;
                      const { text, urgent } = formatTimeRemaining(deadline, now);
                      const deadlineStr = deadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                      const deadlineTime = deadline.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div className={`mt-3 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                          urgent ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'
                        }`}>
                          <Timer className={`mt-0.5 size-4 shrink-0 ${urgent ? 'text-red-500' : 'text-amber-500'}`} />
                          <div>
                            <p className={`text-sm font-semibold ${urgent ? 'text-red-700' : 'text-amber-700'}`}>
                              Payment required — {text}
                            </p>
                            <p className={`mt-0.5 text-xs leading-relaxed ${urgent ? 'text-red-500' : 'text-amber-600'}`}>
                              Pay by <span className="font-semibold">{deadlineStr} at {deadlineTime}</span> to keep your booking. Unpaid bookings are automatically cancelled.
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Payment */}
                    <div className="mt-3 rounded-xl border border-[#EABAB0]/30 bg-white px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#875A6B]/60 mb-2">Payment</p>
                      {isPaid ? (
                        <>
                          <p className="text-sm font-semibold text-emerald-600">✓ Reservation fee paid</p>
                          {booking.booking_items[0]?.entity_type === 'restaurant' && (
                            <p className="mt-1 text-xs text-slate-400">Food, drinks, and other costs are paid at the restaurant.</p>
                          )}
                        </>
                      ) : booking.booking_status !== 'Confirmed' ? (
                        <p className="text-sm text-slate-400">Available after provider confirms the booking.</p>
                      ) : canPay ? (
                        <div className="mt-2 max-w-sm space-y-2">
                          {booking.booking_items[0]?.entity_type === 'restaurant' && (
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Pay the <span className="font-semibold text-[#875A6B]">€{booking.total_price} reservation fee</span> to confirm your table. Food and drinks are settled at the restaurant.
                            </p>
                          )}
                          <PayPalButton
                            amount={Number(booking.total_price || 0).toFixed(2)}
                            onSuccess={(paypalOrderId) => handlePaymentSuccess(booking, paypalOrderId)}
                          />
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">Payment not available.</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    {(canEdit || canCancel) && !isEditing && (
                      <div className="mt-4 flex gap-2 justify-end">
                        {canEdit && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void startEdit(booking)}
                            className="gap-1.5 h-9 rounded-xl border-[#875A6B]/30 px-4 text-sm text-[#875A6B] hover:border-[#875A6B]/60 hover:bg-[#fdf7f8]"
                          >
                            <Pencil className="size-3.5" /> Edit
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isCancelling}
                            onClick={() => setCancelModalId(booking.booking_id)}
                            className="gap-1.5 h-9 rounded-xl border-rose-300 px-4 text-sm text-rose-600 hover:bg-rose-50"
                          >
                            {isCancelling ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                            Cancel Booking
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    <ConfirmModal
      open={cancelModalId !== null}
      variant="warning"
      title="Cancel this booking?"
      description="This will cancel your reservation. This action cannot be undone."
      confirmLabel="Yes, cancel it"
      loading={cancellingId !== null}
      onCancel={() => setCancelModalId(null)}
      onConfirm={handleCancelBooking}
    />
    </>
  );
}
