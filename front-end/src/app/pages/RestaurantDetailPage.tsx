import { useNavigate } from 'react-router';
import { useState } from 'react';

import ItemDetailShell from '../components/detail/ItemDetailShell';
import DetailHeader from '../components/detail/DetailHeader';
import DetailGallery from '../components/detail/DetailGallery';
import DetailSidebar from '../components/detail/DetailSidebar';
import RestaurantDetail from '../components/detail-categories/RestaurantDetail';
import AvailabilityModal from '../components/availability/AvailabilityModal';
import type { CatalogItem } from '../../types/item';

type Props = {
  item: CatalogItem;
};

export default function RestaurantDetailPage({ item }: Props) {
  const navigate = useNavigate();
  const [availabilityOpen, setAvailabilityOpen] = useState(false);

  return (
    <>
      <ItemDetailShell
        backgroundClassName="bg-[#fdf7f8]"
        header={
          <DetailHeader item={item} badgeClassName="bg-[#EABAB0]/30 text-[#875A6B]" />
        }
        gallery={<DetailGallery item={item} />}
        content={<RestaurantDetail item={item} textClassName="text-[#875A6B]" />}
        sidebar={
          <DetailSidebar
            item={item}
            textClassName="text-[#875A6B]"
            buttonClassName="bg-[#875A6B] hover:bg-[#6f4958]"
            badgeClassName="bg-[#EABAB0]/30 text-[#875A6B]"
            onSeeAvailability={() => setAvailabilityOpen(true)}
            onBook={() => navigate(`/book/restaurant/${item.id}`)}
          />
        }
      />

      <AvailabilityModal
        isOpen={availabilityOpen}
        onClose={() => setAvailabilityOpen(false)}
        entityType="restaurant"
        entityId={item.id}
      />
    </>
  );
}
