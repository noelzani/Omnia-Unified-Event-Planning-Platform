import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Returns the set of "entityType:entityId" strings that are unavailable
 * on the given date due to Confirmed or Pending bookings.
 * e.g. "venue:7", "decoration:2"
 */
export function useBookedEntities(date: string): Set<string> {
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!date) {
      setUnavailableIds(new Set());
      return;
    }

    const fetchBooked = async () => {
      // Find events whose date range overlaps the selected date
      const { data: events } = await supabase
        .from('events')
        .select('event_id')
        .lte('start_time', `${date}T23:59:59`)
        .gte('end_time', `${date}T00:00:00`);

      if (!events || events.length === 0) {
        setUnavailableIds(new Set());
        return;
      }

      const eventIds = events.map((e: { event_id: number }) => e.event_id);

      // Only Confirmed or Pending bookings block availability
      const { data: bookings } = await supabase
        .from('bookings')
        .select('booking_id')
        .in('event_id', eventIds)
        .in('booking_status', ['Confirmed', 'Pending']);

      if (!bookings || bookings.length === 0) {
        setUnavailableIds(new Set());
        return;
      }

      const bookingIds = bookings.map((b: { booking_id: number }) => b.booking_id);

      const { data: items } = await supabase
        .from('booking_items')
        .select('entity_type, entity_id')
        .in('booking_id', bookingIds);

      const ids = new Set<string>(
        (items || []).map(
          (i: { entity_type: string; entity_id: number }) =>
            `${i.entity_type}:${i.entity_id}`,
        ),
      );
      setUnavailableIds(ids);
    };

    fetchBooked();
  }, [date]);

  return unavailableIds;
}
