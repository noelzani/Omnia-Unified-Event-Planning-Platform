import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ProviderRoute } from './components/ProviderRoute';
import { AdminRoute } from './components/AdminRoute';

import Home from './pages/Home';
import LoggedInHome from './pages/LoggedInHome';
import Venues from './pages/Venues';
import Restaurants from './pages/Restaurants';
import ItemDetail from './pages/ItemDetail';
import Catering from './pages/Catering';
import Decor from './pages/Decor';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyResetCode from './pages/auth/VerifyResetCode';
import ResetPassword from './pages/auth/ResetPassword';
import BookingPage from './pages/booking/BookingPage';
import MyBookings from './pages/MyBookings';

import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderProperties from './pages/provider/ProviderProperties';
import AddProperty from './pages/provider/AddProperty';
import ProviderLogin from './pages/provider/ProviderLogin';
import ProviderEditProperty from './pages/provider/ProviderEditProperty';
import ProviderProfile from './pages/provider/ProviderProfile';
import ProviderBookings from './pages/provider/ProviderBookings';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminAddProvider from './pages/admin/AdminAddProvider';
import AdminProfile from './pages/admin/AdminProfile';
import AdminManage from './pages/admin/AdminManage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'register', Component: Register },
      { path: 'login', Component: Login },
      { path: 'forgot-password', Component: ForgotPassword },
      { path: 'verify-reset-code', Component: VerifyResetCode },
      { path: 'reset-password', Component: ResetPassword },

      { path: 'provider/login', Component: ProviderLogin },
      { path: 'admin/login', Component: AdminLogin },

      {
        Component: ProtectedRoute,
        children: [
          { path: 'dashboard', Component: LoggedInHome },
          { path: 'venues', Component: Venues },
          { path: 'restaurants', Component: Restaurants },
          { path: 'catering', Component: Catering },
          { path: 'decor', Component: Decor },
          { path: 'favorites', Component: Favorites },
          { path: 'profile', Component: Profile },
          { path: 'book/:entityType/:id', Component: BookingPage },
          { path: 'my-bookings', Component: MyBookings },

          { path: ':category/:id', Component: ItemDetail },
        ],
      },

      {
        Component: AdminRoute,
        children: [
          { path: 'admin',              Component: AdminDashboard },
          { path: 'admin/manage',       Component: AdminManage },
          { path: 'admin/add-provider', Component: AdminAddProvider },
          { path: 'admin/profile',      Component: AdminProfile },
        ],
      },

      {
        Component: ProviderRoute,
        children: [
          { path: 'provider/dashboard', Component: ProviderDashboard },
          { path: 'provider/properties', Component: ProviderProperties },
          { path: 'provider/add-property', Component: AddProperty },
          {
            path: 'provider/edit-property/:entityType/:id',
            Component: ProviderEditProperty,
          },
          { path: 'provider/profile', Component: ProviderProfile },
          { path: 'provider/bookings', Component: ProviderBookings },
        ],
      },
    ],
  },
]);
