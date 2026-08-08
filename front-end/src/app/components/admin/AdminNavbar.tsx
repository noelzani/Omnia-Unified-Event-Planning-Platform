import { Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, UserPlus, LogOut, Menu, X, User, ShieldCheck, FolderKanban } from 'lucide-react';
import { useState } from 'react';

import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../ui/ConfirmModal';
import { NotificationsPanel } from '../NotificationsPanel';

export function AdminNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const navItems = [
    { path: '/admin',              label: 'Dashboard',    icon: LayoutDashboard },
    { path: '/admin/manage',       label: 'Manage',       icon: FolderKanban },
    { path: '/admin/add-provider', label: 'Add Provider', icon: UserPlus },
  ];

  const isActive = (path: string) =>
    path === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <>
    <header className="sticky top-0 z-50 bg-gradient-to-r from-[#875A6B] to-[#EABAB0] shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2 text-xl font-bold text-white">
            <ShieldCheck className="size-5" />
            Omnia
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    className={`gap-2 ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white hover:bg-white/30'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className={`hidden gap-2 sm:flex ${
                isActive('/admin/profile')
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
              onClick={() => navigate('/admin/profile')}
            >
              <User className="size-4" />
              Profile
            </Button>

            <NotificationsPanel />

            <Button
              variant="ghost"
              className="gap-2 text-white/90 hover:bg-white/10 hover:text-white"
              onClick={() => setShowSignOutConfirm(true)}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Log Out</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white md:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="space-y-2 py-3 md:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-2 ${
                      isActive(item.path)
                        ? 'bg-white/20 text-white'
                        : 'text-white/90'
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}

            <Button
              variant="ghost"
              className={`w-full justify-start gap-2 ${
                isActive('/admin/profile')
                  ? 'bg-white/20 text-white'
                  : 'text-white/90'
              }`}
              onClick={() => {
                setMobileOpen(false);
                navigate('/admin/profile');
              }}
            >
              <User className="size-4" />
              Profile
            </Button>
          </div>
        )}
      </div>
    </header>

    <ConfirmModal
      open={showSignOutConfirm}
      variant="brand"
      icon={LogOut}
      title="Log out?"
      description="You'll be logged out of the admin panel."
      confirmLabel="Log Out"
      onCancel={() => setShowSignOutConfirm(false)}
      onConfirm={() => { setShowSignOutConfirm(false); void handleLogout(); }}
    />
    </>
  );
}
