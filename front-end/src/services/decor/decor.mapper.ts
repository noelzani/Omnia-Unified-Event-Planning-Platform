import type { CatalogItem } from '../../types/item';
import {
  normalizeImageList,
  readNumber,
  readString,
  readStringArray,
} from '../shared/itemMappers';
import type { DecorRow } from './decor.types';

const DEFAULT_DECOR_IMAGE =
  'https://images.unsplash.com/photo-1653821355168-144695e5c0e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

function formatPrice(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') return `${value} €`;
  const parsed = Number(value);
  if (!Number.isNaN(parsed)) return `${parsed} €`;
  return String(value);
}

export function mapDecorRowToItem(row: DecorRow, index: number): CatalogItem {
  const fallbackImage = DEFAULT_DECOR_IMAGE;

  const images = normalizeImageList(
    readStringArray(row, 'images', 'image_urls', 'imageUrls'),
    fallbackImage,
  );

  return {
    id: String(row.decoration_id),
    category: 'Decor',
    categoryKey: 'decor',

    name: readString(row, 'name') ?? `Decor ${index + 1}`,

    description: readString(row, 'description') ?? '',


    about: readString(row, 'about') ?? '',
    details: readString(row, 'about') ?? '',

    price: formatPrice(readNumber(row, 'starting_price')),

    image: images[0] ?? fallbackImage,
    images,

    rating: readNumber(row, 'rating'),

    location: readString(row, 'city') ?? '',
    availableIn: readStringArray(row, 'operating_cities') ?? [],


    decorStyle: readString(row, 'theme_style'),

    decorType: undefined,
    priceCategory: undefined,
    amenities: [],

    status: readString(row, 'status'),
  };
}