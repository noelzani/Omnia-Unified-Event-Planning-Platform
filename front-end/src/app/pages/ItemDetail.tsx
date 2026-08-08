import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { PageLoader } from '../components/PageLoader';
import type { CategoryType } from '../../types/category';
import type { CatalogItem } from '../../types/item';
import { getCategoryItemById } from '../../services/catalog.service';


import RestaurantDetailPage from './RestaurantDetailPage';
import VenueDetailPage from './VenueDetailPage';
import CateringDetailPage from './CateringDetailPage';
import DecorDetailPage from './DecorDetailPage';

function normalizeCategory(category?: string): CategoryType | null {
  switch (category?.toLowerCase()) {
    case 'venues':
      return 'venues';
    case 'restaurants':
      return 'restaurants';
    case 'catering':
      return 'catering';
    case 'decor':
      return 'decor';
    default:
      return null;
  }
}

export default function ItemDetail() {
  const { category, id } = useParams<{ category: string; id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<CatalogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const normalizedCategory = normalizeCategory(category);

  useEffect(() => {
    let isActive = true;

    const loadItem = async () => {
      if (!normalizedCategory || !id) {
        if (!isActive) return;

        setItem(null);
        setErrorMessage('');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage('');

        const matchedItem = await getCategoryItemById(normalizedCategory, id);

        if (!isActive) return;

        setItem(matchedItem);
      } catch (error) {
        if (!isActive) return;

        setItem(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load item details from Supabase.',
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadItem();

    return () => {
      isActive = false;
    };
  }, [id, normalizedCategory]);

  if (isLoading) {
    return <PageLoader />;
  }

  
  if (errorMessage) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="mb-4 text-3xl font-bold">Unable to load item</h1>
        <p className="mb-6 text-gray-600">{errorMessage}</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  
  if (!item) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="mb-4 text-3xl font-bold">Item not found</h1>
        <Button onClick={() => navigate('/')}>Go to Home</Button>
      </div>
    );
  }

  

  if (item.categoryKey === 'restaurants') {
    return <RestaurantDetailPage item={item} />;
  }
  
  if (item.categoryKey === 'catering') {
    return <CateringDetailPage item={item} />;
  }


  if (item.categoryKey === 'decor') {
    return <DecorDetailPage item={item} />;
  }
 
  if (item.categoryKey === 'venues') {
    return <VenueDetailPage item={item} />;
  }

  
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 text-center">
      <h1 className="mb-4 text-3xl font-bold">Unsupported category</h1>
      <Button onClick={() => navigate('/')}>Go Home</Button>
    </div>
  );
}