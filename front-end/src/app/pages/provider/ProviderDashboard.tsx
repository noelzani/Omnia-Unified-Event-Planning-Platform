import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Building2,
  UtensilsCrossed,
  ChefHat,
  Palette,
  TrendingUp,
  CalendarCheck,
  Heart,
  Plus,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { Button } from '../../components/ui/button';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../../lib/supabase';

type Category = 'Venues' | 'Restaurants' | 'Catering' | 'Decor';

interface Property {
  id: number;
  name: string;
  category: Category;
  rating: number | null;
  status: string | null;
  created_at: string | null;
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [properties, setProperties] = useState<Property[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [bookingsCount, setBookingsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadProviderDashboard = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setErrorMessage('');

        const { data: provider, error: providerError } = await supabase
          .from('providers')
          .select('provider_id')
          .eq('user_id', user.id)
          .single();

        if (providerError) throw providerError;

        const providerId = provider.provider_id;

        const [venuesRes, restaurantsRes, cateringRes, decorRes] =
          await Promise.all([
            supabase
              .from('venues')
              .select('venue_id, name, rating, status, created_at')
              .eq('provider_id', providerId),

            supabase
              .from('restaurants')
              .select('restaurant_id, name, rating, status, created_at')
              .eq('provider_id', providerId),

            supabase
              .from('catering_services')
              .select('catering_id, name, rating, status, created_at')
              .eq('provider_id', providerId),

            supabase
              .from('decoration_services')
              .select('decoration_id, name, rating, status, created_at')
              .eq('provider_id', providerId),
          ]);

        if (venuesRes.error) throw venuesRes.error;
        if (restaurantsRes.error) throw restaurantsRes.error;
        if (cateringRes.error) throw cateringRes.error;
        if (decorRes.error) throw decorRes.error;

        const venues = venuesRes.data ?? [];
        const restaurants = restaurantsRes.data ?? [];
        const catering = cateringRes.data ?? [];
        const decor = decorRes.data ?? [];

        const venueIds = venues.map((item) => item.venue_id);
        const restaurantIds = restaurants.map((item) => item.restaurant_id);
        const cateringIds = catering.map((item) => item.catering_id);
        const decorIds = decor.map((item) => item.decoration_id);

        const favoriteQueries = await Promise.all([
          venueIds.length
            ? supabase
                .from('favorites')
                .select('favorite_id', { count: 'exact', head: true })
                .eq('entity_type', 'venue')
                .in('entity_id', venueIds)
            : Promise.resolve({ count: 0, error: null }),

          restaurantIds.length
            ? supabase
                .from('favorites')
                .select('favorite_id', { count: 'exact', head: true })
                .eq('entity_type', 'restaurant')
                .in('entity_id', restaurantIds)
            : Promise.resolve({ count: 0, error: null }),

          cateringIds.length
            ? supabase
                .from('favorites')
                .select('favorite_id', { count: 'exact', head: true })
                .eq('entity_type', 'catering')
                .in('entity_id', cateringIds)
            : Promise.resolve({ count: 0, error: null }),

          decorIds.length
            ? supabase
                .from('favorites')
                .select('favorite_id', { count: 'exact', head: true })
                .eq('entity_type', 'decoration')
                .in('entity_id', decorIds)
            : Promise.resolve({ count: 0, error: null }),
        ]);

        favoriteQueries.forEach((query) => {
          if (query.error) throw query.error;
        });

        const totalFavorites = favoriteQueries.reduce(
          (sum, query) => sum + (query.count ?? 0),
          0
        );

        setFavoritesCount(totalFavorites);

        const { count: totalBookings } = await supabase
          .from('bookings')
          .select('booking_id', { count: 'exact', head: true })
          .eq('provider_id', providerId);

        setBookingsCount(totalBookings ?? 0);

        const allProperties: Property[] = [
          ...venues.map((item) => ({
            id: item.venue_id,
            name: item.name,
            rating: item.rating,
            status: item.status,
            created_at: item.created_at,
            category: 'Venues' as Category,
          })),

          ...restaurants.map((item) => ({
            id: item.restaurant_id,
            name: item.name,
            rating: item.rating,
            status: item.status,
            created_at: item.created_at,
            category: 'Restaurants' as Category,
          })),

          ...catering.map((item) => ({
            id: item.catering_id,
            name: item.name,
            rating: item.rating,
            status: item.status,
            created_at: item.created_at,
            category: 'Catering' as Category,
          })),

          ...decor.map((item) => ({
            id: item.decoration_id,
            name: item.name,
            rating: item.rating,
            status: item.status,
            created_at: item.created_at,
            category: 'Decor' as Category,
          })),
        ];

        setProperties(allProperties);
      } catch (error) {
        console.error('Provider dashboard error:', error);
        setErrorMessage('Could not load provider dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void loadProviderDashboard();
  }, [user]);

  const averageRating = useMemo(() => {
    const ratings = properties
      .map((item) => item.rating)
      .filter((rating): rating is number => rating !== null);

    if (ratings.length === 0) return '0.0';

    const total = ratings.reduce((sum, rating) => sum + rating, 0);
    return (total / ratings.length).toFixed(1);
  }, [properties]);

  const propertiesByCategory = {
    Venues: properties.filter((p) => p.category === 'Venues').length,
    Restaurants: properties.filter((p) => p.category === 'Restaurants').length,
    Catering: properties.filter((p) => p.category === 'Catering').length,
    Decor: properties.filter((p) => p.category === 'Decor').length,
  };

  const categoryIcons = {
    Venues: Building2,
    Restaurants: UtensilsCrossed,
    Catering: ChefHat,
    Decor: Palette,
  };

  const categoryColors = {
    Venues: {
      bg: 'bg-[#fdf7f8]',
      text: 'text-[#875A6B]',
      border: 'border-[#EABAB0]/60',
    },
    Restaurants: {
      bg: 'bg-[#fdf7f8]',
      text: 'text-[#875A6B]',
      border: 'border-[#EABAB0]/60',
    },
    Catering: {
      bg: 'bg-[#fdf7f8]',
      text: 'text-[#875A6B]',
      border: 'border-[#EABAB0]/60',
    },
    Decor: {
      bg: 'bg-[#fdf7f8]',
      text: 'text-[#875A6B]',
      border: 'border-[#EABAB0]/60',
    },
  };

  const stats = [
    {
      label: 'Total Properties',
      value: properties.length,
      icon: Building2,
      bgColor: 'bg-[#EABAB0]/25',
      textColor: 'text-[#875A6B]',
    },
    {
      label: 'Total Bookings',
      value: bookingsCount,
      icon: CalendarCheck,
      bgColor: 'bg-[#EABAB0]/25',
      textColor: 'text-[#875A6B]',
    },
    {
      label: 'Favorites',
      value: favoritesCount,
      icon: Heart,
      bgColor: 'bg-[#EABAB0]/25',
      textColor: 'text-[#875A6B]',
    },
    {
      label: 'Avg Rating',
      value: averageRating,
      icon: TrendingUp,
      bgColor: 'bg-[#EABAB0]/25',
      textColor: 'text-[#875A6B]',
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf7f8]">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="size-5 animate-spin" />
          Loading provider dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf7f8]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-10">
          <h1 className="mb-2 text-4xl font-bold text-gray-900">
            Provider Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Manage your properties and track your performance.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
            {errorMessage}
          </div>
        )}

        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl bg-white p-6 shadow-md transition hover:shadow-lg"
              >
                <div className={`inline-flex rounded-xl p-3 ${stat.bgColor}`}>
                  <Icon className={`size-6 ${stat.textColor}`} />
                </div>

                <p className="mt-4 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Bar chart */}
          <div className="lg:col-span-3 rounded-2xl bg-white p-6 shadow-md">
            <h2 className="mb-1 text-base font-semibold text-gray-900">Properties by Category</h2>
            <p className="mb-5 text-xs text-gray-400">Distribution across all service types</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={Object.entries(propertiesByCategory).map(([name, count]) => ({ name, count }))}
                margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                barSize={36}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #EABAB0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  cursor={{ fill: '#fdf7f8' }}
                  formatter={(value: number) => [value, 'Properties']}
                />
                <Bar dataKey="count" fill="#875A6B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category buttons */}
          <div className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-md">
            <h2 className="mb-1 text-base font-semibold text-gray-900">Browse by Type</h2>
            <p className="mb-5 text-xs text-gray-400">Click to view properties</p>
            <div className="grid gap-3">
              {Object.entries(propertiesByCategory).map(([category, count]) => {
                const typedCategory = category as Category;
                const Icon = categoryIcons[typedCategory];
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => navigate('/provider/properties', { state: { filterCategory: category } })}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-[#fdf7f8] px-4 py-3 text-left hover:border-[#EABAB0]/60 hover:shadow-sm transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-[#EABAB0]/30">
                        <Icon className="size-4 text-[#875A6B]" />
                      </div>
                      <span className="text-sm font-medium text-gray-800">{category}</span>
                    </div>
                    <span className="text-sm font-bold text-[#875A6B]">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {properties.length === 0 && (
          <div className="mt-10 rounded-2xl bg-white p-10 text-center shadow-md">
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-[#875A6B]/10">
              <Building2 className="size-10 text-[#875A6B]" />
            </div>

            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              No properties yet
            </h2>

            <p className="mx-auto mb-6 max-w-md text-gray-500">
              Start by adding your first property to showcase it to event
              planners.
            </p>

            <Button
              onClick={() => navigate('/provider/add-property')}
              className="rounded-xl bg-gradient-to-r from-[#875A6B] to-[#EABAB0] text-white hover:opacity-90"
            >
              <Plus className="size-5" />
              Add Your First Property
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}