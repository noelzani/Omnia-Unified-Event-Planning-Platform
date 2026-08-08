import { useEffect, useState } from 'react';
import {
  CalendarDays, Clock, Users, StickyNote, Loader2,
  CheckCircle2, XCircle, MapPin, Phone, Building2,
  Hourglass, TrendingUp, Euro, BadgeCheck, CreditCard,
} from 'lucide-react';

import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { insertNotification } from '../../../services/notifications/notifications.service';

type EntityType = 'venue' | 'restaurant' | 'catering' | 'decoration';
type StatusFilter   = 'All' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Paid';
type PropertyFilter = 'All' | string;

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

type Customer = {
  name: string | null;
  surname: string | null;
  phone: string | null;
};

type Payment = {
  payment_id: number;
  booking_id?: number;
  payment_method: string | null;
  amount: number;
  payment_status: string | null;
  transaction_reference: string | null;
  payment_date: string | null;
};

type Booking = {
  booking_id: number;
  customer_id: string;
  event_id: number;
  booking_status: string | null;
  total_price: number | null;
  created_at: string | null;
  notes: string | null;
  booking_items: BookingItem[];
  events: EventData | null;
  customer: Customer | null;
  payments: Payment[];
};

const tableByType: Record<EntityType, { table: string; id: string }> = {
  venue:      { table: 'venues',               id: 'venue_id' },
  restaurant: { table: 'restaurants',           id: 'restaurant_id' },
  catering:   { table: 'catering_services',     id: 'catering_id' },
  decoration: { table: 'decoration_services',   id: 'decoration_id' },
};

function getStripCls(status: string | null) {
  switch (status) {
    case 'Confirmed':  return 'bg-gradient-to-r from-[#875A6B] to-[#EABAB0]';
    case 'Completed':  return 'bg-gradient-to-r from-slate-400 to-slate-300';
    case 'Cancelled':  return 'bg-gradient-to-r from-rose-400 to-red-300';
    default:           return 'bg-gradient-to-r from-amber-400 to-[#C9995A]';
  }
}

function getStatusCls(status: string | null) {
  switch (status) {
    case 'Confirmed':  return 'bg-[#EABAB0]/30 text-[#875A6B] border-[#EABAB0]/50';
    case 'Completed':  return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'Cancelled':  return 'bg-red-50 text-red-600 border-red-200';
    default:           return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

function initials(name: string | null, surname: string | null) {
  return [name, surname].filter(Boolean).map(s => s![0].toUpperCase()).join('') || 'U';
}

const fmtDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtTime = (v: string | null) => {
  if (!v) return '--';
  const t = v.split('T')[1] || v.split(' ')[1];
  return t ? t.slice(0, 5) : '--';
};

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'All',       label: 'All' },
  { key: 'Pending',   label: 'Pending' },
  { key: 'Confirmed', label: 'Confirmed' },
  { key: 'Paid',      label: 'Paid' },
  { key: 'Completed', label: 'Completed' },
  { key: 'Cancelled', label: 'Cancelled' },
];

export default function ProviderBookings() {
  const { user } = useAuth();

  const [bookings, setBookings]     = useState<Booking[]>([]);
  const [loading, setLoading]       = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFilter, setStatusFilter]     = useState<StatusFilter>('All');
  const [propertyFilter, setPropertyFilter] = useState<PropertyFilter>('All');
  const [confirmAction, setConfirmAction] = useState<{ id: number; status: 'Confirmed' | 'Cancelled' } | null>(null);

  const loadBookings = async () => {
    if (!user) { setLoading(false); return; }
    try {
      setLoading(true);
      setErrorMessage('');

      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select('provider_id')
        .eq('user_id', user.id)
        .single();
      if (providerError) throw providerError;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          booking_id, customer_id, event_id,
          booking_status, total_price, created_at, notes,
          booking_items (booking_item_id, entity_type, entity_id, price, quantity, notes),
          events (event_category, city, start_time, end_time, nr_of_people)
        `)
        .eq('provider_id', providerData.provider_id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const rows = (data || []) as unknown as Booking[];

      const rowsEnriched = await Promise.all(
        rows.map(async (booking) => {
          const itemsWithNames = await Promise.all(
            (booking.booking_items || []).map(async (item) => {
              const cfg = tableByType[item.entity_type];
              if (!cfg) return { ...item, entity_name: 'Unknown' };
              const { data: e } = await supabase.from(cfg.table).select('name').eq(cfg.id, item.entity_id).single();
              return { ...item, entity_name: e?.name || 'Unknown service' };
            }),
          );
          const { data: customerData } = await supabase
            .from('users').select('name, surname, phone').eq('user_id', booking.customer_id).maybeSingle();
          return { ...booking, booking_items: itemsWithNames, customer: customerData ?? null, payments: [] as Payment[] };
        }),
      );

      // Fetch payments separately to avoid RLS blocking nested join
      const bookingIds = rowsEnriched.map(b => b.booking_id);
      let paymentsMap: Record<number, Payment[]> = {};
      if (bookingIds.length > 0) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('payment_id, booking_id, payment_method, amount, payment_status, transaction_reference, payment_date')
          .in('booking_id', bookingIds);
        if (paymentsData) {
          for (const p of paymentsData) {
            if (!paymentsMap[p.booking_id]) paymentsMap[p.booking_id] = [];
            paymentsMap[p.booking_id].push({
              payment_id: p.payment_id,
              payment_method: p.payment_method,
              amount: p.amount,
              payment_status: p.payment_status,
              transaction_reference: p.transaction_reference,
              payment_date: p.payment_date,
            });
          }
        }
      }

      const rowsWithPayments = rowsEnriched.map(b => ({
        ...b,
        payments: paymentsMap[b.booking_id] ?? [],
      }));

      setBookings(rowsWithPayments);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: 'Confirmed' | 'Cancelled') => {
    try {
      setUpdatingId(id);
      const { error } = await supabase
        .from('bookings')
        .update({ booking_status: status, updated_at: new Date().toISOString() })
        .eq('booking_id', id);
      if (error) throw error;
      setBookings(prev => prev.map(b => b.booking_id === id ? { ...b, booking_status: status } : b));

      // Notify the customer about the status change
      const booking = bookings.find(b => b.booking_id === id);
      if (booking) {
        const prevStatus = booking.booking_status;
        const entityName = booking.booking_items[0]?.entity_name || 'your service';
        const title =
          status === 'Confirmed' ? 'Booking Confirmed'
          : prevStatus === 'Confirmed' ? 'Booking Cancelled'
          : 'Booking Rejected';
        const message =
          status === 'Confirmed'
            ? `Your booking for ${entityName} has been confirmed. Please complete payment within the deadline.`
            : prevStatus === 'Confirmed'
              ? `Your confirmed booking for ${entityName} has been cancelled by the provider.`
              : `Your booking request for ${entityName} was not accepted.`;
        await insertNotification(
          booking.customer_id,
          title,
          message,
          status === 'Confirmed' ? 'booking_confirmed' : 'booking_cancelled',
        );
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not update booking status.');
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => { void loadBookings(); }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#fdf7f8]">
        <Loader2 className="size-7 animate-spin text-[#875A6B]" />
      </div>
    );
  }

  // Stats
  const totalRevenue = bookings
    .flatMap(b => b.payments ?? [])
    .filter(p => p.payment_status === 'Paid')
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const pendingCount   = bookings.filter(b => b.booking_status === 'Pending').length;
  const confirmedCount = bookings.filter(b => b.booking_status === 'Confirmed').length;
  const paidCount      = bookings.filter(b => b.payments?.some(p => p.payment_status === 'Paid')).length;

  // All unique property names across all bookings
  const allPropertyNames = Array.from(
    new Set(bookings.map(b => b.booking_items[0]?.entity_name ?? 'Unknown Property'))
  ).sort();

  const counts: Record<StatusFilter, number> = {
    All:       bookings.length,
    Pending:   pendingCount,
    Confirmed: confirmedCount,
    Paid:      paidCount,
    Completed: bookings.filter(b => b.booking_status === 'Completed').length,
    Cancelled: bookings.filter(b => b.booking_status === 'Cancelled').length,
  };

  const filtered = bookings
    .filter(b => {
      if (statusFilter === 'All') return true;
      if (statusFilter === 'Paid') return b.payments?.some(p => p.payment_status === 'Paid');
      return b.booking_status === statusFilter;
    })
    .filter(b => propertyFilter === 'All' || (b.booking_items[0]?.entity_name ?? 'Unknown Property') === propertyFilter);

  // Group by first entity_name
  const grouped = filtered.reduce<Record<string, Booking[]>>((acc, b) => {
    const key = b.booking_items[0]?.entity_name ?? 'Unknown Property';
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  return (
    <>
    <div className="min-h-screen bg-[#fdf7f8]">
      <div className="mx-auto max-w-5xl px-4 py-7 space-y-6">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-gray-900">Bookings</h1>
          <p className="text-lg text-gray-600">Manage reservation requests across all your properties.</p>
        </div>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{errorMessage}</div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total', value: bookings.length, icon: CalendarDays, color: 'text-[#875A6B]', bg: 'bg-[#EABAB0]/20' },
            { label: 'Pending', value: pendingCount, icon: Hourglass, color: 'text-[#875A6B]', bg: 'bg-[#EABAB0]/20' },
            { label: 'Confirmed', value: confirmedCount, icon: TrendingUp, color: 'text-[#875A6B]', bg: 'bg-[#875A6B]/10' },
            { label: 'Revenue', value: `€${totalRevenue}`, icon: Euro, color: 'text-[#C9995A]', bg: 'bg-[#C9995A]/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="rounded-2xl border border-[#EABAB0]/30 bg-white p-5 shadow-sm">
              <div className={`mb-3 inline-flex size-11 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`size-5 ${color}`} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
              <p className={`mt-0.5 text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Pending alert */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-[#fff8f0] px-5 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
              <Hourglass className="size-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">
                {pendingCount} booking{pendingCount > 1 ? 's' : ''} need{pendingCount === 1 ? 's' : ''} your attention
              </p>
              <p className="text-xs text-amber-600">Review and accept or decline below</p>
            </div>
            <button
              onClick={() => setStatusFilter('Pending')}
              className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition"
            >
              View
            </button>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="rounded-2xl border border-[#EABAB0]/30 bg-white py-16 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[#EABAB0]/30">
              <CalendarDays className="size-6 text-[#875A6B]" />
            </div>
            <h2 className="text-lg font-semibold text-slate-700">No bookings yet</h2>
            <p className="mt-2 text-sm text-slate-400">Bookings for your properties will appear here.</p>
          </div>
        ) : (
          <>
            {/* Property filter */}
            {allPropertyNames.length > 1 && (
              <div className="relative">
                <div className="overflow-x-auto scrollbar-none">
                  <div className="flex w-max gap-1 rounded-2xl bg-slate-100/80 p-1.5">
                    {(['All', ...allPropertyNames] as const).map((name) => {
                      const isAll = name === 'All';
                      const active = propertyFilter === name;
                      const count = isAll
                        ? bookings.length
                        : bookings.filter(b => (b.booking_items[0]?.entity_name ?? 'Unknown Property') === name).length;
                      const pending = isAll
                        ? 0
                        : bookings.filter(b => (b.booking_items[0]?.entity_name ?? 'Unknown Property') === name && b.booking_status === 'Pending').length;
                      return (
                        <button
                          key={name}
                          onClick={() => setPropertyFilter(name)}
                          className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                            active
                              ? 'bg-white text-[#875A6B] shadow-sm font-semibold'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {isAll ? 'All Properties' : name}
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                            active ? 'bg-[#EABAB0]/40 text-[#875A6B]' : 'bg-slate-200 text-slate-400'
                          }`}>
                            {count}
                          </span>
                          {pending > 0 && (
                            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold text-white">
                              {pending}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map(({ key, label }) => {
                const active = statusFilter === key;
                const isPaidTab = key === 'Paid';
                return (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                      active
                        ? isPaidTab
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                          : 'border-[#875A6B] bg-[#875A6B] text-white shadow-md shadow-[#875A6B]/20'
                        : isPaidTab
                          ? 'border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400 hover:bg-emerald-50'
                          : 'border-[#EABAB0]/40 bg-white text-slate-600 hover:border-[#875A6B]/30 hover:text-[#875A6B]'
                    }`}
                  >
                    {isPaidTab && <BadgeCheck className="size-3.5" />}
                    {label}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : isPaidTab ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {counts[key]}
                    </span>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-[#EABAB0]/30 bg-white py-12 text-center">
                <p className="font-semibold text-slate-600">No {statusFilter.toLowerCase()} bookings</p>
                <p className="mt-1 text-sm text-slate-400">Try a different filter above</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(grouped).map(([propertyName, propertyBookings]) => (
                  <div key={propertyName}>
                    {/* Property group header */}
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#875A6B]/10">
                        <Building2 className="size-5 text-[#875A6B]" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-slate-800">{propertyName}</p>
                        <p className="text-base text-slate-400">
                          {propertyBookings.length} booking{propertyBookings.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="ml-auto h-px flex-1 bg-gradient-to-r from-[#EABAB0]/40 to-transparent" />
                    </div>

                    <div className="space-y-3">
                      {propertyBookings.map((booking) => {
                        const isPending  = booking.booking_status === 'Pending';
                        const isUpdating = updatingId === booking.booking_id;
                        const customerInitials = initials(booking.customer?.name ?? null, booking.customer?.surname ?? null);
                        const isPaid = booking.payments?.some(p => p.payment_status === 'Paid');

                        return (
                          <div
                            key={booking.booking_id}
                            className="overflow-hidden rounded-2xl border border-[#EABAB0]/30 bg-white shadow-sm"
                          >
                            <div className={`h-1 ${getStripCls(booking.booking_status)}`} />

                            <div className="p-6">
                              {/* Header row: customer + status + actions */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  {/* Customer avatar */}
                                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#875A6B] to-[#5C3347] text-base font-bold text-white shadow-sm">
                                    {customerInitials}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-base font-semibold text-[#111827]">
                                        {[booking.customer?.name, booking.customer?.surname].filter(Boolean).join(' ') || 'Unknown Customer'}
                                      </p>
                                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusCls(booking.booking_status)}`}>
                                        {booking.booking_status || 'Pending'}
                                      </span>
                                      {isPaid && (
                                        <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                          <BadgeCheck className="size-3.5" /> Paid
                                        </span>
                                      )}
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-3 text-sm text-slate-400">
                                      <span>#{booking.booking_id}</span>
                                      {booking.customer?.phone && (
                                        <span className="flex items-center gap-1">
                                          <Phone className="size-3" />
                                          {booking.customer.phone}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                  {booking.total_price != null && (
                                    <p className="text-xl font-bold text-[#875A6B]">€{booking.total_price}</p>
                                  )}
                                  {isPending && (
                                    <div className="flex gap-1.5">
                                      <Button size="sm" disabled={isUpdating}
                                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 text-sm"
                                        onClick={() => setConfirmAction({ id: booking.booking_id, status: 'Confirmed' })}>
                                        <CheckCircle2 className="size-3.5" /> Accept
                                      </Button>
                                      <Button size="sm" variant="outline" disabled={isUpdating}
                                        className="gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50 h-9 px-4 text-sm"
                                        onClick={() => setConfirmAction({ id: booking.booking_id, status: 'Cancelled' })}>
                                        <XCircle className="size-3.5" /> Reject
                                      </Button>
                                    </div>
                                  )}
                                  {booking.booking_status === 'Confirmed' && !isPaid && (
                                    <Button size="sm" variant="outline" disabled={isUpdating}
                                      className="gap-1.5 border-rose-300 text-rose-600 hover:bg-rose-50 h-9 px-4 text-sm"
                                      onClick={() => setConfirmAction({ id: booking.booking_id, status: 'Cancelled' })}>
                                      <XCircle className="size-3.5" /> Cancel
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Info chips */}
                              <div className="mt-4 flex flex-wrap gap-2">
                                {[
                                  { icon: CalendarDays, text: fmtDate(booking.events?.start_time ?? null) },
                                  { icon: Clock, text: `${fmtTime(booking.events?.start_time ?? null)} – ${fmtTime(booking.events?.end_time ?? null)}` },
                                  { icon: Users, text: `${booking.events?.nr_of_people ?? 0} guests` },
                                  { icon: MapPin, text: booking.events?.city ?? '—' },
                                ].map(({ icon: Icon, text }, i) => (
                                  <div key={i} className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                                    <Icon className="size-3.5 shrink-0 text-[#875A6B]/50" />
                                    {text}
                                  </div>
                                ))}
                              </div>

                              {/* Services */}
                              {booking.booking_items.length > 0 && (
                                <div className="mt-4 rounded-xl border border-[#EABAB0]/20 bg-[#fdf7f8] p-4">
                                  <p className="mb-2.5 text-xs font-bold uppercase tracking-widest text-[#875A6B]/50">Services booked</p>
                                  <div className="space-y-2">
                                    {booking.booking_items.map(item => (
                                      <div key={item.booking_item_id}
                                        className="flex items-center justify-between rounded-lg border border-[#EABAB0]/20 bg-white px-4 py-3">
                                        <div>
                                          <p className="text-base font-semibold text-[#111827]">{item.entity_name}</p>
                                          <p className="text-sm capitalize text-slate-400">{item.entity_type}</p>
                                        </div>
                                        <span className="text-base font-semibold text-[#875A6B]">
                                          {item.quantity > 1 ? `${item.quantity}× ` : ''}€{item.price}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Notes */}
                              {booking.notes && (
                                <div className="mt-3 rounded-xl border border-[#EABAB0]/25 bg-[#fdf7f8] px-4 py-3">
                                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#875A6B]/50">
                                    <StickyNote className="size-3.5" /> Notes
                                  </p>
                                  <p className="text-sm text-slate-600">{booking.notes}</p>
                                </div>
                              )}

                              {/* Payment details */}
                              {isPaid && booking.payments.filter(p => p.payment_status === 'Paid').map(p => (
                                <div key={p.payment_id} className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                  <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700">
                                    <CreditCard className="size-3.5" /> Payment received
                                  </p>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                                    <div className="flex items-center justify-between col-span-2 sm:col-span-1">
                                      <span className="text-emerald-600/70">Amount</span>
                                      <span className="font-bold text-emerald-800">€{p.amount}</span>
                                    </div>
                                    <div className="flex items-center justify-between col-span-2 sm:col-span-1">
                                      <span className="text-emerald-600/70">Method</span>
                                      <span className="font-semibold text-emerald-800">{p.payment_method ?? '—'}</span>
                                    </div>
                                    {p.payment_date && (
                                      <div className="flex items-center justify-between col-span-2 sm:col-span-1">
                                        <span className="text-emerald-600/70">Paid on</span>
                                        <span className="font-semibold text-emerald-800">{fmtDate(p.payment_date)}</span>
                                      </div>
                                    )}
                                    {p.transaction_reference && (
                                      <div className="flex items-center justify-between col-span-2">
                                        <span className="text-emerald-600/70">Transaction ref</span>
                                        <span className="font-mono text-xs text-emerald-700 truncate max-w-[180px]">{p.transaction_reference}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>

    <ConfirmModal
      open={confirmAction !== null}
      variant={confirmAction?.status === 'Cancelled' ? 'danger' : 'warning'}
      title={
        confirmAction?.status === 'Confirmed' ? 'Accept this booking?'
        : bookings.find(b => b.booking_id === confirmAction?.id)?.booking_status === 'Confirmed'
          ? 'Cancel confirmed booking?'
          : 'Reject this booking?'
      }
      description={
        confirmAction?.status === 'Confirmed'
          ? 'The customer will be notified and can proceed with payment.'
          : bookings.find(b => b.booking_id === confirmAction?.id)?.booking_status === 'Confirmed'
            ? 'The booking has already been confirmed. The customer will be notified of the cancellation.'
            : 'This will reject the booking request. The customer will be notified.'
      }
      confirmLabel={
        confirmAction?.status === 'Confirmed' ? 'Yes, accept'
        : bookings.find(b => b.booking_id === confirmAction?.id)?.booking_status === 'Confirmed'
          ? 'Yes, cancel'
          : 'Yes, reject'
      }
      loading={updatingId !== null}
      onCancel={() => setConfirmAction(null)}
      onConfirm={async () => {
        if (!confirmAction) return;
        await updateStatus(confirmAction.id, confirmAction.status);
        setConfirmAction(null);
      }}
    />
    </>
  );
}
