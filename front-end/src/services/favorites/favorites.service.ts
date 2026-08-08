import { supabase } from '../../lib/supabase';
import type { FavoriteEntityType, FavoriteRow } from './favorites.types';
import { normalizeFavoriteId, normalizeFavoriteRow } from './favorites.types';

export async function getUserFavorites(user_id: string) {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  console.log('GET FAVORITES DATA:', data);
  console.log('GET FAVORITES ERROR:', error);

  if (error) throw error;

  return (data ?? []).map((row) => normalizeFavoriteRow(row as FavoriteRow));
}

export async function addFavorite(
  user_id: string,
  type: FavoriteEntityType,
  id: number,
) {
  const normalizedId = normalizeFavoriteId(id);

  console.log('BEFORE ADD FAVORITE:', {
    user_id,
    entity_type: type,
    entity_id: normalizedId,
  });

  const { data, error } = await supabase
    .from('favorites')
    .insert([
      {
        user_id,
        entity_type: type,
        entity_id: normalizedId,
      },
    ])
    .select()
    .single();

  console.log('AFTER SUPABASE INSERT:', data);
  console.log('ADD FAVORITE ERROR:', error);

  if (error) throw error;

  return normalizeFavoriteRow(data as FavoriteRow);
}

export async function removeFavorite(
  user_id: string,
  type: FavoriteEntityType,
  id: number,
) {
  const normalizedId = normalizeFavoriteId(id);

  console.log('BEFORE REMOVE FAVORITE:', {
    user_id,
    entity_type: type,
    entity_id: normalizedId,
  });

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', user_id)
    .eq('entity_type', type)
    .eq('entity_id', normalizedId);

  console.log('REMOVE FAVORITE ERROR:', error);

  if (error) throw error;
}
