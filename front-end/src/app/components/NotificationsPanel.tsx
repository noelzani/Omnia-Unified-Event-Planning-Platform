import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, CalendarDays, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Button } from './ui/button';
import { useNotifications } from '../context/NotificationsContext';
import type { LucideIcon } from 'lucide-react';

type TypeConfig = {
  icon: LucideIcon;
  iconColor: string;
  bgUnread: string;
  bgRead: string;
};

const TYPE_CONFIG: Record<string, TypeConfig> = {
  booking: {
    icon: CalendarDays,
    iconColor: 'text-amber-500',
    bgUnread: 'bg-amber-50 ring-1 ring-amber-200',
    bgRead:   'bg-slate-100 ring-1 ring-slate-200',
  },
  booking_confirmed: {
    icon: CheckCircle2,
    iconColor: 'text-[#875A6B]',
    bgUnread: 'bg-[#EABAB0]/25 ring-1 ring-[#EABAB0]/60',
    bgRead:   'bg-slate-100 ring-1 ring-slate-200',
  },
  booking_cancelled: {
    icon: XCircle,
    iconColor: 'text-rose-500',
    bgUnread: 'bg-rose-50 ring-1 ring-rose-200',
    bgRead:   'bg-slate-100 ring-1 ring-slate-200',
  },
  payment: {
    icon: CreditCard,
    iconColor: 'text-emerald-500',
    bgUnread: 'bg-emerald-50 ring-1 ring-emerald-200',
    bgRead:   'bg-slate-100 ring-1 ring-slate-200',
  },
};

const FALLBACK_CONFIG: TypeConfig = {
  icon: Bell,
  iconColor: 'text-slate-400',
  bgUnread: 'bg-slate-100 ring-1 ring-slate-200',
  bgRead:   'bg-slate-100 ring-1 ring-slate-200',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const ROUTE_BY_TYPE: Record<string, string> = {
  booking:           '/provider/bookings',
  booking_confirmed: '/my-bookings',
  booking_cancelled: '/my-bookings',
  payment:           '/provider/bookings',
};

export function NotificationsPanel() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = async (id: number, type: string | null, isRead: boolean) => {
    if (!isRead) await markRead(id);
    const route = ROUTE_BY_TYPE[type ?? ''];
    if (route) {
      setOpen(false);
      void navigate(route);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white/90 hover:bg-white/10 hover:text-white"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-white text-[#875A6B] text-xs font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-[#EABAB0]/40 px-5 py-4">
          <div className="flex items-center justify-between pr-6">
            <SheetTitle className="text-lg font-bold text-[#111827]">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 rounded-full bg-[#875A6B] px-2 py-0.5 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="text-xs font-semibold text-[#875A6B] transition hover:text-[#5C3347]"
              >
                Mark all read
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-[#EABAB0]/30">
                <Bell className="size-6 text-[#875A6B]/50" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No notifications yet</p>
              <p className="text-xs text-slate-400">Activity on your bookings will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#EABAB0]/30">
              {notifications.map((n) => {
                const cfg = TYPE_CONFIG[n.type ?? ''] ?? FALLBACK_CONFIG;
                const Icon = cfg.icon;
                const iconBg = n.is_read ? cfg.bgRead : cfg.bgUnread;
                const iconColor = n.is_read ? 'text-slate-400' : cfg.iconColor;

                return (
                  <li
                    key={n.notification_id}
                    onClick={() => void handleNotificationClick(n.notification_id, n.type, n.is_read)}
                    className={`cursor-pointer px-5 py-4 transition hover:bg-[#fdf7f8] ${
                      n.is_read ? '' : 'bg-[#fdf7f8]/60'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Icon badge */}
                      <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                        <Icon className={`size-4 ${iconColor}`} />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm text-[#111827] ${n.is_read ? 'font-medium' : 'font-semibold'}`}>
                            {n.title}
                          </p>
                          <span className="mt-0.5 shrink-0 text-[10px] font-medium text-slate-400">
                            {timeAgo(n.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{n.message}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
