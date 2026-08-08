import { Heart, MapPin, Star, Users, ArrowRight } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import type { CatalogItem } from '../../types/item';
import {
  getFavoriteEntityTypeFromCategory,
  normalizeFavoriteId,
} from '../../services/favorites/favorites.types';

interface ItemCardProps {
  item: CatalogItem;
  color?: string;
}

export function ItemCard({ item }: ItemCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { user } = useAuth();
  const navigate = useNavigate();
  const entityType = getFavoriteEntityTypeFromCategory(item.categoryKey);
  const normalizedItemId = normalizeFavoriteId(item.id);
  const favorite = entityType ? isFavorite(entityType, normalizedItemId) : false;

  const handleCardClick = () => navigate(`/${item.categoryKey}/${item.id}`);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!entityType) return;
    void toggleFavorite(entityType, normalizedItemId, {
      name: item.name,
      image: item.image,
      category: item.category,
    });
  };

  // Pick a small metadata tag relevant to the category
  const metaTag = item.venueType || item.cuisineType || item.serviceType || item.menuType || item.decorStyle || item.indoorOutdoor || null;

  return (
    <div
      onClick={handleCardClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={item.image || 'https://placehold.co/600x400?text=No+Image'}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Dark gradient at top for pill readability */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />
        {/* Subtle gradient at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Category pill — top left */}
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#875A6B] shadow-sm">
          {item.category}
        </span>

        {/* Favorite button — top right */}
        <button
          onClick={handleFavoriteClick}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/20 transition-all hover:bg-white/40"
        >
          <Heart
            className={`size-4 transition-colors ${
              favorite ? 'fill-red-400 text-red-400' : 'text-white'
            }`}
          />
        </button>

        {/* Rating — bottom right of image */}
        {item.rating != null && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 backdrop-blur-sm shadow-sm">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-800">{item.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name + price row */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="font-semibold text-[#111827] leading-snug line-clamp-1 text-lg group-hover:text-[#875A6B] transition-colors">
            {item.name}
          </h3>
          {item.price && (
            <span className="shrink-0 text-base font-bold text-[#875A6B] whitespace-nowrap">
              {item.price}
            </span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {item.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.location && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="size-3 shrink-0 text-[#875A6B]/60" />
                {item.location}
              </span>
            )}
            {item.capacity && (
              <span className="flex items-center gap-1 rounded-full bg-slate-50 border border-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                <Users className="size-3 text-[#875A6B]/60" />
                {item.capacity}
              </span>
            )}
            {metaTag && (
              <span className="rounded-full bg-[#fdf7f8] border border-[#EABAB0]/40 px-2 py-0.5 text-[11px] text-[#875A6B]">
                {metaTag}
              </span>
            )}
          </div>

          <ArrowRight className="size-3.5 shrink-0 text-slate-300 group-hover:text-[#875A6B] transition-colors" />
        </div>
      </div>
    </div>
  );
}
