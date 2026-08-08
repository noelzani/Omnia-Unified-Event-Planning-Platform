import type { LucideIcon } from 'lucide-react';

export type DetailInfoItem = {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName?: string;
};

type DetailInfoGridProps = {
  items: DetailInfoItem[];
};

export default function DetailInfoGrid({ items }: DetailInfoGridProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 rounded-2xl bg-gray-50 p-6 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div key={item.label} className="flex items-center gap-3">
            <Icon className={`size-5 ${item.iconClassName ?? 'text-gray-600'}`} />
            <div>
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="font-semibold">{item.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}