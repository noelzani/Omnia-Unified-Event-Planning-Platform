import type { CatalogItem } from '../../types/item';
import {
  normalizeImageList,
  readNumber,
  readString,
  readStringArray,
} from '../shared/itemMappers';
import type { CateringRow } from './catering.types';

const DEFAULT_CATERING_IMAGE =
  'https://images.unsplash.com/photo-1555244162-803834f70033?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

function formatPrice(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') return `${value} € / person`;

  const parsed = Number(value);
  if (!Number.isNaN(parsed)) return `${parsed} € / person`;

  return String(value);
}

function formatGuestRange(minGuests?: number | null, maxGuests?: number | null): string {
  if (minGuests && maxGuests) return `${minGuests} - ${maxGuests} guests`;
  if (minGuests) return `Minimum ${minGuests} guests`;
  if (maxGuests) return `Up to ${maxGuests} guests`;
  return '';
}

export function mapCateringRowToItem(row: CateringRow, index: number): CatalogItem {
  const fallbackImage =
    readString(row, 'image_url', 'image', 'cover_image', 'coverImage') ?? DEFAULT_CATERING_IMAGE;

  const imageList = Array.isArray(row.images)
    ? row.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
    : readStringArray(row, 'images', 'image_urls', 'imageUrls') ?? [];

  const images = normalizeImageList(imageList, fallbackImage);

  const about = readString(row, 'about') ?? '';
  const description = readString(row, 'description') ?? '';

  const minimumGuests = readNumber(row, 'minimum_guests');
  const maximumGuests = readNumber(row, 'maximum_guests');

  return {
    id: String(row.catering_id ?? `catering-${index + 1}`),
    category: 'Catering',
    categoryKey: 'catering',
    name: readString(row, 'name') ?? `Catering ${index + 1}`,
    description,
    details: about || description,
    about: about || description,
    price: formatPrice(row.price_per_person),
    image: images[0] ?? fallbackImage,
    images,
    rating: readNumber(row, 'rating'),

    
    capacity: formatGuestRange(minimumGuests, maximumGuests),
    location: readString(row, 'city') ?? '',
    serviceType: readString(row, 'service_type'),
    menuType: readString(row, 'menu_type'),
    priceCategory: undefined, 

    amenities: [
      readString(row, 'service_type'),
      readString(row, 'menu_type'),
      formatGuestRange(minimumGuests, maximumGuests),
      readString(row, 'city'),
    ].filter((value): value is string => Boolean(value && value.trim())),

    status: readString(row, 'status'),
  } as CatalogItem;
}