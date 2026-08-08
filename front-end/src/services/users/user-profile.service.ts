import { supabase } from '../../lib/supabase';

export type UserProfileRow = {
  user_id: string;
  name: string;
  surname: string | null;
  phone: string | null;
  role_id: number;
  profile_image: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
};

type UpsertUserProfileInput = {
  userId: string;
  name: string;
  surname: string | null;
  phone: string | null;
};

export async function getUserProfile(userId: string): Promise<UserProfileRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select(
      'user_id, name, surname, phone, role_id, profile_image, created_at, updated_at, status',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as UserProfileRow | null) ?? null;
}

export async function upsertUserProfile(
  input: UpsertUserProfileInput,
): Promise<UserProfileRow> {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        user_id: input.userId,
        name: input.name.trim(),
        surname: input.surname?.trim() || null,
        phone: input.phone?.trim() || null,
      },
      { onConflict: 'user_id' },
    )
    .select(
      'user_id, name, surname, phone, role_id, profile_image, created_at, updated_at, status',
    )
    .single();

  if (error) {
    throw error;
  }

  return data as UserProfileRow;
}