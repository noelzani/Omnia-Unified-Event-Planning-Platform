import {
  Store,
  Car,
  MapPin,
  Users,
} from 'lucide-react';
import type { CatalogItem } from '../../../types/item';
import DetailInfoGrid, { type DetailInfoItem } from '../detail//DetailInfoGrid';

type VenueDetailProps = {
  item: CatalogItem;
  textClassName: string;
};

export default function VenueDetail({
  item,
  textClassName,
}: VenueDetailProps) {
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

  // Add venue type to the info grid if available
  if (item.venueType) {
    infoItems.push({
      label: 'Venue Type',
      value: item.venueType,
      icon: Store,
      iconClassName: textClassName,
    });
  }

  // Removed price from the info grid

  // Add capacity to the info grid if available
  if (item.capacity) {
    infoItems.push({
      label: 'Capacity',
      value: item.capacity,
      icon: Users,
      iconClassName: textClassName,
    });
  }

  // Add parking availability to the info grid if available
  if (item.parking !== undefined) {
    infoItems.push({
      label: 'Parking Availability',
      value: item.parking ? 'Available' : 'Not Available',
      icon: Car,
      iconClassName: textClassName,
    });
  }

  // Add indoor/outdoor to the info grid if available
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