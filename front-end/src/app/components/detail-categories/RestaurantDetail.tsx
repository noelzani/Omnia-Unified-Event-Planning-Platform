import {
  Car,
  MapPin,
  Store,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import type { CatalogItem } from '../../../types/item';
import DetailInfoGrid, { type DetailInfoItem } from '../detail//DetailInfoGrid';

type RestaurantDetailProps = {
  item: CatalogItem;
  textClassName: string;
};

export default function RestaurantDetail({
  item,
  textClassName,
}: RestaurantDetailProps) {
  const infoItems: DetailInfoItem[] = [];

  if (item.location) {
    infoItems.push({
      label: 'Location',
      value: item.location,
      icon: MapPin,
      iconClassName: textClassName,
    });
  }

  if (item.cuisineType) {
    infoItems.push({
      label: 'Cuisine Type',
      value: item.cuisineType,
      icon: UtensilsCrossed,
      iconClassName: textClassName,
    });
  }

  if (item.diningStyle) {
    infoItems.push({
      label: 'Dining Style',
      value: item.diningStyle,
      icon: Store,
      iconClassName: textClassName,
    });
  }

  if (item.parking !== undefined) {
    infoItems.push({
      label: 'Parking',
      value: item.parking ? 'Available' : 'Not Available',
      icon: Car,
      iconClassName: textClassName,
    });
  }

  if (item.capacity) {
    infoItems.push({
      label: 'Capacity',
      value: item.capacity,
      icon: Users,
      iconClassName: textClassName,
    });
  }

  if (item.indoorOutdoor) {
    infoItems.push({
      label: 'Indoor / Outdoor',
      value: item.indoorOutdoor,
      icon: Store,
      iconClassName: textClassName,
    });
  }

  return (
    <div>
      <DetailInfoGrid items={infoItems} />

      {item.details && (
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold">About</h2>
          <p className="leading-relaxed text-gray-700">{item.details}</p>
        </div>
      )}
    </div>
  );
}