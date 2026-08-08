import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Building2,
  UtensilsCrossed,
  ChefHat,
  Palette,
  Edit,
  Trash2,
  MapPin,
  DollarSign,
  Star,
  Plus,
  Loader2,
} from 'lucide-react';

import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { supabase } from '../../../lib/supabase';
import ConfirmModal from '../../components/ui/ConfirmModal';

type Category = 'Venues' | 'Restaurants' | 'Catering' | 'Decor';

interface Property {
  id: string;
  entityType: 'venue' | 'restaurant' | 'catering' | 'decoration';
  name: string;
  description: string;
  category: Category;
  image: string | null;
  rating: number | null;
  price: string | null;
  city: string | null;
}

export default function ProviderProperties() {
  const navigate = useNavigate();
  const location = useLocation();

  const [properties, setProperties] = useState<Property[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    void loadProperties();

    const state = location.state as { filterCategory?: string } | null;

    if (state?.filterCategory) {
      setFilterCategory(state.filterCategory);
    }
  }, [location.state]);

  const getPrimaryImage = (
    images: {
      entity_type: string;
      entity_id: number;
      image_url: string;
      is_primary: boolean | null;
    }[],
    entityType: string,
    entityId: number,
  ) => {
    const matchedImages = images.filter(
      (img) => img.entity_type === entityType && Number(img.entity_id) === Number(entityId),
    );

    const primaryImage = matchedImages.find((img) => img.is_primary);

    return primaryImage?.image_url || matchedImages[0]?.image_url || null;
  };

  const loadProperties = async () => {
    setIsLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setProperties([]);
      setIsLoading(false);
      return;
    }

    const { data: provider, error: providerError } = await supabase
      .from('providers')
      .select('provider_id')
      .eq('user_id', user.id)
      .single();

    if (providerError || !provider) {
      setProperties([]);
      setIsLoading(false);
      return;
    }

    const providerId = provider.provider_id;

    const [venuesRes, restaurantsRes, cateringRes, decorationsRes] = await Promise.all([
      supabase.from('venues').select('*').eq('provider_id', providerId),
      supabase.from('restaurants').select('*').eq('provider_id', providerId),
      supabase.from('catering_services').select('*').eq('provider_id', providerId),
      supabase.from('decoration_services').select('*').eq('provider_id', providerId),
    ]);

    if (
      venuesRes.error ||
      restaurantsRes.error ||
      cateringRes.error ||
      decorationsRes.error
    ) {
      console.error(
        venuesRes.error ||
          restaurantsRes.error ||
          cateringRes.error ||
          decorationsRes.error,
      );

      setProperties([]);
      setIsLoading(false);
      return;
    }

    const venueIds = venuesRes.data?.map((item) => item.venue_id) || [];
    const restaurantIds = restaurantsRes.data?.map((item) => item.restaurant_id) || [];
    const cateringIds = cateringRes.data?.map((item) => item.catering_id) || [];
    const decorationIds = decorationsRes.data?.map((item) => item.decoration_id) || [];

    const imageQueries = [];

    if (venueIds.length > 0) {
      imageQueries.push(
        supabase
          .from('service_images')
          .select('entity_type, entity_id, image_url, is_primary')
          .eq('entity_type', 'venue')
          .in('entity_id', venueIds),
      );
    }

    if (restaurantIds.length > 0) {
      imageQueries.push(
        supabase
          .from('service_images')
          .select('entity_type, entity_id, image_url, is_primary')
          .eq('entity_type', 'restaurant')
          .in('entity_id', restaurantIds),
      );
    }

    if (cateringIds.length > 0) {
      imageQueries.push(
        supabase
          .from('service_images')
          .select('entity_type, entity_id, image_url, is_primary')
          .eq('entity_type', 'catering')
          .in('entity_id', cateringIds),
      );
    }

    if (decorationIds.length > 0) {
      imageQueries.push(
        supabase
          .from('service_images')
          .select('entity_type, entity_id, image_url, is_primary')
          .eq('entity_type', 'decoration')
          .in('entity_id', decorationIds),
      );
    }

    const imageResults = await Promise.all(imageQueries);

    const images = imageResults.flatMap((result) => result.data || []);

    const venues: Property[] =
      venuesRes.data?.map((item) => ({
        id: String(item.venue_id),
        entityType: 'venue',
        name: item.name || 'Untitled venue',
        description: item.description || '',
        category: 'Venues',
        city: item.city,
        price: item.price_per_day
          ? `${item.price_per_day} € / day`
          : item.price_per_hour
            ? `${item.price_per_hour} € / hour`
            : null,
        rating: item.rating,
        image: getPrimaryImage(images, 'venue', item.venue_id),
      })) || [];

    const restaurants: Property[] =
      restaurantsRes.data?.map((item) => ({
        id: String(item.restaurant_id),
        entityType: 'restaurant',
        name: item.name || 'Untitled restaurant',
        description: item.description || '',
        category: 'Restaurants',
        city: item.city,
        price: item.price_range || null,
        rating: item.rating,
        image: getPrimaryImage(images, 'restaurant', item.restaurant_id),
      })) || [];

    const catering: Property[] =
      cateringRes.data?.map((item) => ({
        id: String(item.catering_id),
        entityType: 'catering',
        name: item.name || 'Untitled catering',
        description: item.description || '',
        category: 'Catering',
        city: item.city,
        price: item.price_per_person ? `${item.price_per_person} € / person` : null,
        rating: item.rating,
        image: getPrimaryImage(images, 'catering', item.catering_id),
      })) || [];

    const decorations: Property[] =
      decorationsRes.data?.map((item) => ({
        id: String(item.decoration_id),
        entityType: 'decoration',
        name: item.name || 'Untitled decoration',
        description: item.description || '',
        category: 'Decor',
        city: item.city,
        price: item.starting_price ? `From ${item.starting_price} €` : null,
        rating: item.rating,
        image: getPrimaryImage(images, 'decoration', item.decoration_id),
      })) || [];

    setProperties([...venues, ...restaurants, ...catering, ...decorations]);
    setIsLoading(false);
  };

  const handleDelete = async () => {
    const property = deleteTarget;
    if (!property) return;

    setIsDeleting(true);
    const tableInfo = {
      Venues: {
        table: 'venues',
        idColumn: 'venue_id',
      },
      Restaurants: {
        table: 'restaurants',
        idColumn: 'restaurant_id',
      },
      Catering: {
        table: 'catering_services',
        idColumn: 'catering_id',
      },
      Decor: {
        table: 'decoration_services',
        idColumn: 'decoration_id',
      },
    };

    const { table, idColumn } = tableInfo[property.category];

    await supabase
      .from('service_images')
      .delete()
      .eq('entity_type', property.entityType)
      .eq('entity_id', Number(property.id));

    await supabase
      .from('availability')
      .delete()
      .eq('entity_type', property.entityType)
      .eq('entity_id', Number(property.id));

    const { error } = await supabase
      .from(table)
      .delete()
      .eq(idColumn, Number(property.id));

    if (error) {
      toast.error(error.message);
      setIsDeleting(false);
      setDeleteTarget(null);
      return;
    }

    toast.success(`"${property.name}" deleted.`);
    setIsDeleting(false);
    setDeleteTarget(null);
    await loadProperties();
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
      gradient: 'from-[#875A6B] to-[#6f4958]',
      border: 'border-[#EABAB0]/60',
    },
    Restaurants: {
      bg: 'bg-[#fdf7f8]',
      text: 'text-[#875A6B]',
      gradient: 'from-[#875A6B] to-[#6f4958]',
      border: 'border-[#EABAB0]/60',
    },
    Catering: {
      bg: 'bg-[#fdf7f8]',
      text: 'text-[#875A6B]',
      gradient: 'from-[#875A6B] to-[#6f4958]',
      border: 'border-[#EABAB0]/60',
    },
    Decor: {
      bg: 'bg-[#fdf7f8]',
      text: 'text-[#875A6B]',
      gradient: 'from-[#875A6B] to-[#6f4958]',
      border: 'border-[#EABAB0]/60',
    },
  };

  const categories = ['All', 'Venues', 'Restaurants', 'Catering', 'Decor'];

  const filteredProperties =
    filterCategory === 'All'
      ? properties
      : properties.filter((property) => property.category === filterCategory);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf7f8]">
        <Loader2 className="size-10 animate-spin text-[#875A6B]" />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-[#fdf7f8]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              My Properties
            </h1>
            <p className="text-lg text-gray-600">
              Manage and edit your property listings
            </p>
          </div>

          <Button
            type="button"
            onClick={() => navigate('/provider/add-property')}
            className="h-12 rounded-xl bg-[#875A6B] px-6 text-white hover:bg-[#6f4958]"
          >
            <Plus className="mr-2 size-5" />
            Add Property
          </Button>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const isActive = filterCategory === category;

              const Icon =
                category !== 'All'
                  ? categoryIcons[category as keyof typeof categoryIcons]
                  : null;

              const colors =
                category !== 'All'
                  ? categoryColors[category as keyof typeof categoryColors]
                  : null;

              const count =
                category === 'All'
                  ? properties.length
                  : properties.filter((property) => property.category === category)
                      .length;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilterCategory(category)}
                  className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all ${
                    isActive
                      ? category === 'All'
                        ? 'bg-[#875A6B] text-white shadow-lg'
                        : `${colors?.bg} ${colors?.text} border-2 ${colors?.border} shadow-md`
                      : 'bg-[#EABAB0]/20 text-[#111827] hover:bg-[#EABAB0]/40'
                  }`}
                >
                  {Icon && <Icon className="size-5" />}
                  {category}

                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs ${
                      isActive
                        ? category === 'All'
                          ? 'bg-white/30'
                          : 'bg-white'
                        : 'bg-gray-200'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="rounded-2xl bg-white p-16 text-center shadow-lg">
            <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-gray-100">
              <Building2 className="size-10 text-gray-400" />
            </div>

            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              No Properties Found
            </h2>

            <p className="mb-8 text-gray-600">
              {filterCategory === 'All'
                ? "You haven't added any properties yet"
                : `You don't have any ${filterCategory} properties`}
            </p>

            <Button
              type="button"
              onClick={() => navigate('/provider/add-property')}
              className="h-12 rounded-xl bg-[#875A6B] px-6 text-white hover:bg-[#6f4958]"
            >
              <Plus className="mr-2 size-5" />
              Add Your First Property
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => {
              const colors = categoryColors[property.category];
              const Icon = categoryIcons[property.category];

              return (
                <div
                  key={`${property.category}-${property.id}`}
                  className="overflow-hidden rounded-2xl bg-white shadow-lg transition-shadow hover:shadow-xl"
                >
                  <div className="relative h-48">
                    {property.image ? (
                      <img
                        src={property.image}
                        alt={property.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${colors.gradient}`}
                      >
                        <Icon className="size-16 text-white/50" />
                      </div>
                    )}

                    <div
                      className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${colors.bg} ${colors.text}`}
                    >
                      <Icon className="size-4" />
                      {property.category}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="mb-2 line-clamp-1 text-xl font-bold text-gray-900">
                      {property.name}
                    </h3>

                    <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                      {property.description || 'No description added'}
                    </p>

                    <div className="mb-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="size-4" />
                        <span>{property.city || 'No city added'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="size-4" />
                        <span>{property.price || 'No price added'}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        <span>
                          {property.rating ? `${property.rating} / 5` : 'No rating yet'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/provider/edit-property/${property.entityType}/${property.id}`,
                          )
                        }
                        className={`flex-1 rounded-xl ${colors.bg} ${colors.text} hover:opacity-80`}
                      >
                        <Edit className="mr-2 size-4" />
                        Edit
                      </Button>

                      <Button
                        type="button"
                        onClick={() => setDeleteTarget(property)}
                        variant="outline"
                        className="rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>

    <ConfirmModal
      open={deleteTarget !== null}
      variant="danger"
      title={`Delete "${deleteTarget?.name}"?`}
      description="This listing and all its images will be permanently removed."
      confirmLabel="Delete Property"
      loading={isDeleting}
      onCancel={() => setDeleteTarget(null)}
      onConfirm={() => void handleDelete()}
    />
    </>
  );
}