import { supabase } from '../../lib/supabase';
import type { CatalogItem } from '../../types/item';
import { mapRestaurantRowToItem } from './restaurant.mapper';
import type {
  EventTypeRow,
  RestaurantEventTypeRow,
  RestaurantRow,
  RestaurantServiceImageRow,
} from './restaurant.types';

async function getRestaurantImages(restaurantIds: number[]) {
  const imagesByRestaurant = new Map<number, string[]>();

  if (restaurantIds.length === 0) {
    return imagesByRestaurant;
  }

  const { data, error } = await supabase
    .from('service_images')
    .select('image_id, entity_id, image_url, is_primary')
    .eq('entity_type', 'restaurant')
    .in('entity_id', restaurantIds)
    .order('is_primary', { ascending: false })
    .order('image_id', { ascending: true });

  if (error) {
    throw new Error(`Failed to load restaurant images: ${error.message}`);
  }

  ((data ?? []) as RestaurantServiceImageRow[]).forEach((row) => {
    const current = imagesByRestaurant.get(Number(row.entity_id)) ?? [];
    if (row.image_url?.trim()) {
      current.push(row.image_url);
      imagesByRestaurant.set(Number(row.entity_id), current);
    }
  });

  return imagesByRestaurant;
}

async function getRestaurantEventTypes(restaurantIds: number[]) {
  const eventTypesByRestaurant = new Map<number, string[]>();

  if (restaurantIds.length === 0) {
    return eventTypesByRestaurant;
  }

  const [
    { data: restaurantEventTypes, error: restaurantEventTypesError },
    { data: eventTypes, error: eventTypesError },
  ] = await Promise.all([
    supabase
      .from('restaurant_event_types')
      .select('restaurant_id, event_type_id')
      .in('restaurant_id', restaurantIds),
    supabase
      .from('event_types')
      .select('event_type_id, name'),
  ]);

  if (restaurantEventTypesError) {
    throw new Error(`Failed to load restaurant event types: ${restaurantEventTypesError.message}`);
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

  ((restaurantEventTypes ?? []) as RestaurantEventTypeRow[]).forEach((row) => {
    const eventTypeName = eventTypeNameById.get(Number(row.event_type_id));
    if (!eventTypeName) return;

    const current = eventTypesByRestaurant.get(Number(row.restaurant_id)) ?? [];
    current.push(eventTypeName);
    eventTypesByRestaurant.set(Number(row.restaurant_id), current);
  });

  return eventTypesByRestaurant;
}

export async function getRestaurants(): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select(`
      restaurant_id,
      provider_id,
      name,
      description,
      address,
      city,
      capacity,
      cuisine_type,
      minimum_guests,
      maximum_guests,
      has_fixed_menu,
      parking_availability,
      indoor_outdoor,
      status,
      rating,
      dining_style,
      price_range,
      about,
      created_at
    `)
    .eq('status', 'Available')
    .order('name');

  if (error) {
    throw new Error(`Failed to load restaurants: ${error.message}`);
  }

  const rows = (data ?? []) as RestaurantRow[];
  const restaurantIds = rows.map((row) => Number(row.restaurant_id));

  const [imagesByRestaurant, eventTypesByRestaurant] = await Promise.all([
    getRestaurantImages(restaurantIds),
    getRestaurantEventTypes(restaurantIds),
  ]);

  return rows.map((row) =>
    mapRestaurantRowToItem(row, {
      images: imagesByRestaurant.get(Number(row.restaurant_id)),
      supportedEventTypes: eventTypesByRestaurant.get(Number(row.restaurant_id)),
    }),
  );
}

export async function getRestaurantById(id: string): Promise<CatalogItem | null> {
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return null;
  }

  const { data, error } = await supabase
    .from('restaurants')
    .select(`
      restaurant_id,
      provider_id,
      name,
      description,
      address,
      city,
      capacity,
      cuisine_type,
      minimum_guests,
      maximum_guests,
      has_fixed_menu,
      parking_availability,
      indoor_outdoor,
      status,
      rating,
      dining_style,
      price_range,
      about,
      created_at
    `)
    .eq('restaurant_id', numericId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load restaurant details: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const [imagesByRestaurant, eventTypesByRestaurant] = await Promise.all([
    getRestaurantImages([numericId]),
    getRestaurantEventTypes([numericId]),
  ]);

  return mapRestaurantRowToItem(data as RestaurantRow, {
    images: imagesByRestaurant.get(numericId),
    supportedEventTypes: eventTypesByRestaurant.get(numericId),
  });
}