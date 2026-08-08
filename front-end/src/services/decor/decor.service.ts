import { supabase } from '../../lib/supabase';
import type { CatalogItem } from '../../types/item';
import { mapDecorRowToItem } from './decor.mapper';
import type { DecorRow } from './decor.types';

type ServiceImageRow = {
  entity_id: number;
  entity_type: string;
  image_url: string;
};

const TABLE_NAME = 'decoration_services';
const IMAGE_ENTITY_TYPE = 'decoration';

async function attachDecorImages(rows: DecorRow[]): Promise<DecorRow[]> {
  if (!rows.length) return rows;

  const decorationIds = rows
    .map((row) => Number(row.decoration_id))
    .filter((id) => !Number.isNaN(id));

  if (!decorationIds.length) return rows;

  const { data: imageRows, error } = await supabase
    .from('service_images')
    .select('entity_id, entity_type, image_url')
    .eq('entity_type', IMAGE_ENTITY_TYPE)
    .in('entity_id', decorationIds);

  if (error) {
    throw error;
  }

  const imageMap = new Map<number, string[]>();

  ((imageRows ?? []) as ServiceImageRow[]).forEach((row) => {
    if (!imageMap.has(row.entity_id)) {
      imageMap.set(row.entity_id, []);
    }
    imageMap.get(row.entity_id)?.push(row.image_url);
  });

  return rows.map((row) => ({
    ...row,
    images: imageMap.get(Number(row.decoration_id)) ?? [],
  }));
}

export async function getDecorItems(): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      decoration_id,
      provider_id,
      name,
      city,
      rating,
      description,
      theme_style,
      starting_price,
      operating_cities,
      status,
      created_at,
      about
    `)
    .eq('status', 'Available')
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  const rowsWithImages = await attachDecorImages((data ?? []) as DecorRow[]);

  return rowsWithImages.map((row, index) => mapDecorRowToItem(row, index));
}

export async function getDecorById(id: string): Promise<CatalogItem | null> {
  const numericId = Number(id);

  if (Number.isNaN(numericId)) {
    return null;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      decoration_id,
      provider_id,
      name,
      city,
      rating,
      description,
      theme_style,
      starting_price,
      operating_cities,
      status,
      created_at,
      about
    `)
    .eq('decoration_id', numericId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const [rowWithImages] = await attachDecorImages([data as DecorRow]);

  return mapDecorRowToItem(rowWithImages, 0);
}