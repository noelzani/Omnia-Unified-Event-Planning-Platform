import { supabase } from '../../lib/supabase';

export type NotificationRow = {
  notification_id: number;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  is_read: boolean;
  created_at: string;
};

export async function insertNotification(
  userId: string,
  title: string,
  message: string,
  type?: string,
): Promise<void> {
  await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type: type ?? null });
}

export async function getUserNotifications(userId: string): Promise<NotificationRow[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  return (data || []) as NotificationRow[];
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('notification_id', notificationId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
}
