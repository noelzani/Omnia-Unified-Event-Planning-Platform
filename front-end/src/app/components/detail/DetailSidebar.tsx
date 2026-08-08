import { Button } from '../ui/button';
import type { CatalogItem } from '../../../types/item';

type DetailSidebarProps = {
  item: CatalogItem;
  textClassName: string;
  buttonClassName: string;
  badgeClassName: string;
  onSeeAvailability: () => void;
  onBook: () => void;
};

export default function DetailSidebar({
  item,
  textClassName,
  buttonClassName,
  badgeClassName,
  onSeeAvailability,
  onBook,
}: DetailSidebarProps) {
  return (
    <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {item.price && (
        <div className="mb-5">
          <p className="mb-1 text-sm text-gray-500">Price</p>
          <p className={`text-3xl font-bold ${textClassName}`}>
            {item.price}
          </p>
        </div>
      )}

      {item.hourlyPrice && (
        <div className="mb-5">
          <p className="mb-1 text-sm text-gray-500">Hourly Price</p>
          <p className="text-lg font-medium text-gray-700">
            {item.hourlyPrice}
          </p>
        </div>
      )}

      {item.supportedEventTypes && item.supportedEventTypes.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-sm text-gray-500">Suitable for</p>
          <div className="flex flex-wrap gap-2">
            {item.supportedEventTypes.map((type, index) => (
              <span
                key={index}
                className={`rounded-full px-3 py-1 text-sm font-medium ${badgeClassName}`}
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          className={`w-full py-6 text-lg text-white ${buttonClassName}`}
          onClick={onSeeAvailability}
        >
          See Availability
        </Button>

        <Button
          variant="outline"
          className="w-full py-6 text-lg"
          onClick={onBook}
        >
          Book
        </Button>
      </div>
    </div>
  );
}