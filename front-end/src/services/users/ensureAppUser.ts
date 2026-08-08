import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

export type AppUser = {
  user_id: string;
  name: string;
  surname: string | null;
  phone: string | null;
  role_id: number;
  profile_image: string | null;
  status: string | null;
};

function getSafeName(user: User): string {
  const metadata = (user.user_metadata as Record<string, unknown> | undefined) ?? {};

  const givenName =
    typeof metadata.given_name === 'string' ? metadata.given_name.trim() : '';

  const fullName =
    typeof metadata.full_name === 'string'
      ? metadata.full_name.trim()
      : typeof metadata.name === 'string'
      ? metadata.name.trim()
      : '';

  if (givenName) return givenName;
  if (fullName) return fullName.split(' ')[0] || 'User';

  if (user.email) {
    return user.email.split('@')[0] || 'User';
  }

  return 'User';
}

function getSafeSurname(user: User): string | null {
  const metadata = (user.user_metadata as Record<string, unknown> | undefined) ?? {};

  const familyName =
    typeof metadata.family_name === 'string' ? metadata.family_name.trim() : '';

  const fullName =
    typeof metadata.full_name === 'string'
      ? metadata.full_name.trim()
      : typeof metadata.name === 'string'
      ? metadata.name.trim()
      : '';

  if (familyName) return familyName;

  if (fullName) {
    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length > 1) {
      return parts.slice(1).join(' ');
    }
  }

  return null;
}

function getProfileImage(user: User): string | null {
  const metadata = (user.user_metadata as Record<string, unknown> | undefined) ?? {};

  const avatarUrl =
    typeof metadata.avatar_url === 'string' ? metadata.avatar_url.trim() : '';

  const picture =
    typeof metadata.picture === 'string' ? metadata.picture.trim() : '';

  return avatarUrl || picture || null;
}

export async function ensureAppUser(user: User): Promise<AppUser> {
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('user_id, name, surname, phone, role_id, profile_image, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existingUser) {
    return existingUser as AppUser;
  }

  const payload = {
    user_id: user.id,
    name: getSafeName(user),
    surname: getSafeSurname(user),
    role_id: 4,
    profile_image: getProfileImage(user),
    status: 'Active',
  };

  const { data: createdUser, error: insertError } = await supabase
    .from('users')
    .insert(payload)
    .select('user_id, name, surname, phone, role_id, profile_image, status')
    .single();

  if (insertError) {
    throw insertError;
  }

  return createdUser as AppUser;
}