import type { CatalogItem } from '../../types/item';
import {
  formatCapacityLabel,
  normalizeImageList,
} from '../shared/itemMappers';
import type { VenueRow } from './venue.types';

const DEFAULT_VENUE_IMAGE =
  'https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400';

type VenueMapperOptions = {
  images?: string[];
  supportedEventTypes?: string[];
};

function normalizeVenueLocationType(value?: string | null) {
  const normalized = (value || '').trim().toLowerCase();

  if (normalized.includes('coast')) return 'Coastline';
  if (normalized.includes('old town')) return 'Old Town';
  if (normalized.includes('city')) return 'City Center';
  if (normalized.includes('suburb')) return 'Suburban';
  if (normalized.includes('mount')) return 'Mountain';
  if (normalized.includes('country') || normalized.includes('nature')) return 'Countryside';

  return value?.trim() || '';
}

function mapVenuePriceCategory(row: VenueRow) {
  const dailyPrice =
    typeof row.price_per_day === 'number'
      ? row.price_per_day
      : typeof row.price_per_hour === 'number'
        ? row.price_per_hour
        : null;

  if (dailyPrice == null) {
    return '';
  }

  if (dailyPrice < 100) return 'low';
  if (dailyPrice < 400) return 'mid';
  if (dailyPrice < 700) return 'high';
  return 'luxury';
}

function formatVenuePrice(row: VenueRow): string {
  if (row.price_per_day != null) {
    return `€${row.price_per_day}/day`;
  }

  if (row.price_per_hour != null) {
    return `€${row.price_per_hour}/hour`;
  }

  return '';
}

export function mapVenueRowToItem(
  row: VenueRow,
  options: VenueMapperOptions = {},
): CatalogItem {
  const images = normalizeImageList(options.images ?? [], DEFAULT_VENUE_IMAGE);

  return {
    id: String(row.venue_id),
    category: 'Venues',
    categoryKey: 'venues',
    name: row.name?.trim() || 'Venue',
    description: row.description?.trim() || '',
    details: row.about?.trim() || '',
    about: row.about?.trim() || '',
    price:
      row.price_per_day != null
        ? `€${row.price_per_day}/day`
        : row.price_per_hour != null
        ? `€${row.price_per_hour}/hour`
        : '',
    image: images[0] ?? DEFAULT_VENUE_IMAGE,
    images,
    rating: row.rating ?? 0,

    capacity: formatCapacityLabel(row.capacity ?? undefined),
    parking: row.parking_available ?? undefined,
    location: row.city?.trim() || row.address?.trim() || '',
    indoorOutdoor: row.indoor_outdoor?.trim() || '',
    venueType: row.venue_type?.trim() || '',
    status: row.status?.trim() || '',
    amenities: [],
    supportedEventTypes: options.supportedEventTypes ?? [],
    locationType: normalizeVenueLocationType(row.location_type),
    priceCategory: mapVenuePriceCategory(row),
  };
}