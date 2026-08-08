import { useEffect, useState } from 'react';
import type { CategoryType } from '../../types/category';
import type { CatalogItem } from '../../types/item';
import { getCategoryItems } from '../../services/catalog.service';

export function useCategoryItems(category: CategoryType, enabled = true) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setIsLoading(false);
      setErrorMessage('');
      return;
    }

    let isActive = true;

    const loadItems = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');
        const mappedItems = await getCategoryItems(category);

        if (!isActive) return;
        setItems(mappedItems);
      } catch (error) {
        if (!isActive) return;

        const message =
          error instanceof Error
            ? error.message
            : `Unable to load ${category} from Supabase.`;

        setItems([]);
        setErrorMessage(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadItems();

    return () => {
      isActive = false;
    };
  }, [category, enabled]);

  return { items, isLoading, errorMessage };
}
