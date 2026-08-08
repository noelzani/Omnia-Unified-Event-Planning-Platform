import { Heart, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { useFavorites } from '../../context/FavoritesContext';
import type { CatalogItem } from '../../../types/item';
import {
  getFavoriteEntityTypeFromCategory,
  normalizeFavoriteId,
} from '../../../services/favorites/favorites.types';

type DetailHeaderProps = {
  item: CatalogItem;
  badgeClassName: string;
};

export default function DetailHeader({
  item,
  badgeClassName,
}: DetailHeaderProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  const entityType = getFavoriteEntityTypeFromCategory(item.categoryKey);
  const normalizedItemId = normalizeFavoriteId(item.id);
  const favorite = entityType ? isFavorite(entityType, normalizedItemId) : false;

  const rating = item.rating ?? null;

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${badgeClassName}`}>
            {item.category}
          </span>

          {rating !== null && (
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[#875A6B] px-2.5 py-1 text-sm font-semibold text-white">
                {Number(rating).toFixed(1)}
              </span>

              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = Math.floor(rating);
                  const fraction = rating - filled;
                  if (i < filled) {
                    return <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />;
                  }
                  if (i === filled && fraction > 0) {
                    return (
                      <div key={i} className="relative size-4">
                        <Star className="absolute size-4 text-gray-300" />
                        <div className="absolute inset-0 overflow-hidden" style={{ width: `${fraction * 100}%` }}>
                          <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        </div>
                      </div>
                    );
                  }
                  return <Star key={i} className="size-4 text-gray-300" />;
                })}
              </div>
            </div>
          )}
        </div>

        <h1 className="mb-3 text-4xl font-bold">{item.name}</h1>

        {item.description && (
          <p className="text-lg leading-relaxed text-gray-600">
            {item.description}
          </p>
        )}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          if (!entityType) return;

          void toggleFavorite(entityType, normalizedItemId, {
            name: item.name,
            image: item.image,
            category: item.category,
          });
        }}
      >
        <Heart
          className={`size-6 ${
            favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
          }`}
        />
      </Button>
    </div>
  );
}