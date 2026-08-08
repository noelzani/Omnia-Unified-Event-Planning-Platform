import { supabase } from '../../lib/supabase';
import type { CatalogItem } from '../../types/item';
import { mapVenueRowToItem } from './venue.mapper';
import type {
  EventTypeRow,
  VenueEventTypeRow,
  VenueRow,
  VenueServiceImageRow,
} from './venue.types';

async function getVenueImages(venueIds: number[]) {
  const imagesByVenue = new Map<number, string[]>();

  if (venueIds.length === 0) {
    return imagesByVenue;
  }

  const { data, error } = await supabase
    .from('service_images')
    .select('image_id, entity_id, image_url, is_primary')
    .eq('entity_type', 'venue')
    .in('entity_id', venueIds)
    .order('is_primary', { ascending: false })
    .order('image_id', { ascending: true });

  if (error) {
    throw new Error(`Failed to load venue images: ${error.message}`);
  }

  ((data ?? []) as VenueServiceImageRow[]).forEach((row) => {
    const current = imagesByVenue.get(Number(row.entity_id)) ?? [];

    if (row.image_url?.trim()) {
      current.push(row.image_url);
      imagesByVenue.set(Number(row.entity_id), current);
    }
  });

  return imagesByVenue;
}

async function getVenueEventTypes(venueIds: number[]) {
  const eventTypesByVenue = new Map<number, string[]>();

  if (venueIds.length === 0) {
    return eventTypesByVenue;
  }

  const [
    { data: venueEventTypes, error: venueEventTypesError },
    { data: eventTypes, error: eventTypesError },
  ] = await Promise.all([
    supabase
      .from('venue_event_types')
      .select('venue_id, event_type_id')
      .in('venue_id', venueIds),
    supabase
      .from('event_types')
      .select('event_type_id, name'),
  ]);

  if (venueEventTypesError) {
    throw new Error(`Failed to load venue event types: ${venueEventTypesError.message}`);
  }

  if (eventTypesError) {
    throw new Error(`Failed to load event type names: ${eventTypesError.message}`);
  }

  const eventTypeNameById = new Map<number, string>();

  ((eventTypes ?? []) as EventTypeRow[]).forEach((row) => {
    if (row.name?.trim()) {
      eventTypeNameById.set(Number(row.event_type_id), row.name);
    }
  });

  ((venueEventTypes ?? []) as VenueEventTypeRow[]).forEach((row) => {
    const eventTypeName = eventTypeNameById.get(Number(row.event_type_id));
    if (!eventTypeName) return;

    const current = eventTypesByVenue.get(Number(row.venue_id)) ?? [];
    current.push(eventTypeName);
    eventTypesByVenue.set(Number(row.venue_id), current);
  });

  return eventTypesByVenue;
}

export async function getVenues(): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from('venues')
    .select(`
      venue_id,
      provider_id,
      name,
      description,
      venue_type,
      location_type,
      address,
      city,
      capacity,
      price_per_hour,
      price_per_day,
      indoor_outdoor,
      parking_available,
      status,
      created_at,
      about,
      rating
    `)
    .eq('status', 'Available')
    .order('name');

  if (error) {
    throw new Error(`Failed to load venues: ${error.message}`);
  }

  const rows = (data ?? []) as VenueRow[];
  const venueIds = rows.map((row) => Number(row.venue_id));

  const [imagesByVenue, eventTypesByVenue] = await Promise.all([
    getVenueImages(venueIds),
    getVenueEventTypes(venueIds),
  ]);

  return rows.map((row) =>
    mapVenueRowToItem(row, {
      images: imagesByVenue.get(Number(row.venue_id)),
      supportedEventTypes: eventTypesByVenue.get(Number(row.venue_id)),
    }),
  );
}

export async function getVenueById(id: string): Promise<CatalogItem | null> {
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return null;
  }

  const { data, error } = await supabase
    .from('venues')
    .select(`
      venue_id,
      provider_id,
      name,
      description,
      venue_type,
      location_type,
      address,
      city,
      capacity,
      price_per_hour,
      price_per_day,
      indoor_outdoor,
      parking_available,
      status,
      created_at,
      about,
      rating
    `)
    .eq('venue_id', numericId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load venue details: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const [imagesByVenue, eventTypesByVenue] = await Promise.all([
    getVenueImages([numericId]),
    getVenueEventTypes([numericId]),
  ]);

  return mapVenueRowToItem(data as VenueRow, {
    images: imagesByVenue.get(numericId),
    supportedEventTypes: eventTypesByVenue.get(numericId),
  });
}