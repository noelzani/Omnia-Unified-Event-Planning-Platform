import { supabase } from '../../lib/supabase';
import type { CatalogItem } from '../../types/item';
import { mapCateringRowToItem } from './catering.mapper';
import type { CateringRow } from './catering.types';

type ServiceImageRow = {
  entity_id: number;
  entity_type: string;
  image_url: string;
  is_primary?: boolean | null;
  uploaded_at?: string | null;
};

const TABLE_NAME = 'catering_services';

async function attachCateringImages(rows: CateringRow[]): Promise<CateringRow[]> {
  if (!rows.length) return rows;

  const cateringIds = rows
    .map((row) => Number(row.catering_id))
    .filter((id) => !Number.isNaN(id));

  if (!cateringIds.length) return rows;

  const { data: imageRows, error } = await supabase
    .from('service_images')
    .select('entity_id, entity_type, image_url, is_primary, uploaded_at')
    .or('entity_type.eq.catering,entity_type.eq.catering_services')
    .in('entity_id', cateringIds)
    .order('is_primary', { ascending: false })
    .order('uploaded_at', { ascending: true });

  if (error) {
    console.error('Failed to load catering images:', error);
    return rows;
  }

  const imagesByEntityId = new Map<number, string[]>();

  ((imageRows ?? []) as ServiceImageRow[]).forEach((image) => {
    const entityId = Number(image.entity_id);
    const url = typeof image.image_url === 'string' ? image.image_url.trim() : '';

    if (!entityId || !url) return;

    if (!imagesByEntityId.has(entityId)) {
      imagesByEntityId.set(entityId, []);
    }

    const existing = imagesByEntityId.get(entityId)!;

    if (!existing.includes(url)) {
      existing.push(url);
    }
  });

  return rows.map((row) => {
    const cateringId = Number(row.catering_id);
    const images = imagesByEntityId.get(cateringId) ?? [];

    return {
      ...row,
      images,
      image_url: images[0] ?? row.image_url ?? null,
    };
  });
}

export async function getCateringItems(): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      catering_id,
      provider_id,
      name,
      description,
      about,
      menu_type,
      service_type,
      price_per_person,
      minimum_guests,
      maximum_guests,
      city,
      status,
      created_at,
      rating
    `)
    .eq('status', 'Available')
    .order('name', { ascending: true });

  if (error) throw error;

  const rows = await attachCateringImages((data ?? []) as CateringRow[]);
  return rows.map((row, index) => mapCateringRowToItem(row, index));
}

export async function getCateringById(id: string): Promise<CatalogItem | null> {
  const numericId = Number(id);
  if (Number.isNaN(numericId)) return null;

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(`
      catering_id,
      provider_id,
      name,
      description,
      about,
      menu_type,
      service_type,
      price_per_person,
      minimum_guests,
      maximum_guests,
      city,
      status,
      created_at,
      rating
    `)
    .eq('catering_id', numericId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [rowWithImages] = await attachCateringImages([data as CateringRow]);
  return mapCateringRowToItem(rowWithImages, 0);
}