import {
  Store,
  UtensilsCrossed,
  Users,
  MapPin,
} from 'lucide-react';
import type { CatalogItem } from '../../../types/item';
import DetailInfoGrid, { type DetailInfoItem } from '../detail//DetailInfoGrid';

type CateringDetailProps = {
  item: CatalogItem;
  textClassName: string;
};

export default function CateringDetail({
  item,
  textClassName,
}: CateringDetailProps) {
  const infoItems: DetailInfoItem[] = [];

  // Add location to the info grid if available
  if (item.location) {
    infoItems.push({
      label: 'Location',
      value: item.location,
      icon: MapPin,
      iconClassName: textClassName,
    });
  }

  // Add service type to the info grid if available
  if (item.serviceType) {
    infoItems.push({
      label: 'Service Type',
      value: item.serviceType,
      icon: Store,
      iconClassName: textClassName,
    });
  }

  // Add menu type to the info grid if available
  if (item.menuType) {
    infoItems.push({
      label: 'Menu Type',
      value: item.menuType,
      icon: UtensilsCrossed,
      iconClassName: textClassName,
    });
  }

  // Add guest capacity to the info grid if available
  if (item.capacity) {
    infoItems.push({
      label: 'Guest Capacity',
      value: item.capacity,
      icon: Users,
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