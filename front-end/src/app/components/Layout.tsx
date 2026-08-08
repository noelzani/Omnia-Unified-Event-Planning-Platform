import { Link, Outlet, useLocation } from 'react-router';
import {
  MapPin,
  UtensilsCrossed,
  ChefHat,
  Sparkles,
  Heart,
  Menu,
  X,
  User,
  CalendarDays,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from './ui/button';
import { useFavorites } from '../context/FavoritesContext';
import { ProviderNavbar } from './provider/ProviderNavbar';
import { AdminNavbar } from './admin/AdminNavbar';
import { NotificationsPanel } from './NotificationsPanel';

export function Layout() {
  const location = useLocation();
  const { favorites } = useFavorites();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const authRoutes = ['/login', '/register', '/forgot-password', '/provider/login', '/admin/login'];
  const isAuthPage = authRoutes.includes(location.pathname);
  const isGuestHomePage = location.pathname === '/';
  const isProviderPage = location.pathname.startsWith('/provider');
  const isAdminPage = location.pathname.startsWith('/admin') && !isAuthPage;

  const showUserHeader = !isAuthPage && !isGuestHomePage && !isProviderPage && !isAdminPage;
  const showProviderHeader = isProviderPage && !isAuthPage;
  const showAdminHeader = isAdminPage;
  const showFooter = !isAuthPage && !isProviderPage && !isAdminPage;

  const navItems = [
    { path: '/', label: 'Home', icon: null },
    { path: '/dashboard', label: 'My Event', icon: null },
    { path: '/venues', label: 'Venues', icon: MapPin },
    { path: '/restaurants', label: 'Restaurants', icon: UtensilsCrossed },
    { path: '/catering', label: 'Catering', icon: ChefHat },
    { path: '/decor', label: 'Decor', icon: Sparkles },
    { path: '/my-bookings', label: 'My Bookings', icon: CalendarDays },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getActiveButtonColor = (itemPath: string) => {
    return isActive(itemPath)
      ? 'bg-white/20 text-white hover:bg-white/30'
      : 'text-white/90 hover:bg-white/10 hover:text-white';
  };

  return (
    <div className="flex min-h-screen flex-col">
      {showAdminHeader && <AdminNavbar />}
      {showProviderHeader && <ProviderNavbar />}

      {showUserHeader && (
        <header className="sticky top-0 z-50 bg-gradient-to-r from-[#875A6B] to-[#EABAB0] shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex h-16 items-center justify-between">
              <Link to="/" className="text-2xl font-semibold text-white">
                Omnia
              </Link>

              <nav className="hidden items-center gap-1 md:flex">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path}>
                      <Button
                        variant="ghost"
                        className={`gap-2 ${getActiveButtonColor(item.path)}`}
                      >
                        {Icon && <Icon className="size-4" />}
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2">
                <Link to="/favorites">
                  <Button variant="ghost" className={`relative gap-2 ${getActiveButtonColor('/favorites')}`}>
                    <Heart className="size-4" />
                    <span className="hidden sm:inline">Favorites</span>
                    {favorites.length > 0 && (
                      <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-white text-[#875A6B] text-xs font-bold">
                        {favorites.length}
                      </span>
                    )}
                  </Button>
                </Link>

                <NotificationsPanel />

                <Link to="/profile">
                  <Button variant="ghost" size="icon" className={getActiveButtonColor('/profile')}>
                    <User className="size-4" />
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/90 hover:bg-white/10 md:hidden"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                >
                  {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </Button>
              </div>
            </div>

            {mobileMenuOpen && (
              <nav className="space-y-1 py-4 md:hidden">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className={`w-full justify-start gap-2 ${getActiveButtonColor(item.path)}`}
                      >
                        {Icon && <Icon className="size-4" />}
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}

                <Link to="/favorites" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className={`w-full justify-start gap-2 ${getActiveButtonColor('/favorites')}`}>
                    <Heart className="size-4" />
                    Favorites
                  </Button>
                </Link>

                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className={`w-full justify-start gap-2 ${getActiveButtonColor('/profile')}`}>
                    <User className="size-4" />
                    Profile
                  </Button>
                </Link>
              </nav>
            )}
          </div>
        </header>
      )}

      <main className="flex-1">
        <Outlet />
      </main>

      {showFooter && (
        <footer className="border-t border-[#EABAB0]/40 bg-gradient-to-r from-[#875A6B]/10 via-[#EABAB0]/18 to-[#875A6B]/10 py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-[#875A6B]">
              © 2026{' '}
              <span className="bg-gradient-to-r from-[#875A6B] to-[#EABAB0] bg-clip-text font-semibold text-transparent">
                Omnia
              </span>
              . Making your events memorable.
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}