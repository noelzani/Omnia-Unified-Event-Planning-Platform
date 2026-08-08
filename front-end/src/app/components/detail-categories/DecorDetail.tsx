import {
  Store,
  UtensilsCrossed,
  Users,
  MapPin,
} from 'lucide-react';
import type { CatalogItem } from '../../../types/item';
import DetailInfoGrid, { type DetailInfoItem } from '../detail//DetailInfoGrid';

type DecorDetailProps = {
  item: CatalogItem;
  textClassName: string;
};

export default function DecorDetail({
  item,
  textClassName,
}: DecorDetailProps) {
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

  // Add theme style to the info grid if available
  if (item.decorStyle) {
    infoItems.push({
      label: 'Theme Style',
      value: item.decorStyle,
      icon: Store,
      iconClassName: textClassName,
    });
  }

  // Add capacity to the info grid if available
  if (item.capacity) {
    infoItems.push({
      label: 'Capacity',
      value: item.capacity,
      icon: Users,
      iconClassName: textClassName,
    });
  }

  // Add operating cities to the info grid if available
  if (item.availableIn && item.availableIn.length > 0) {
    infoItems.push({
      label: 'Operating Cities',
      value: item.availableIn.join(', '),
      icon: MapPin,
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