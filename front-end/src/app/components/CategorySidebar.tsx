import { MapPin, UtensilsCrossed, ChefHat, Sparkles } from 'lucide-react';
import { useFilters, CategoryType } from '../context/FiltersContext';
import { Card } from './ui/card';

export function CategorySidebar() {
  const { filters, updateFilters } = useFilters();

  const categories = [
    {
      id: 'venues' as CategoryType,
      title: 'Venues',
      icon: MapPin,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      activeColor: 'bg-blue-200',
      activeTextColor: 'text-blue-700',
    },
    {
      id: 'restaurants' as CategoryType,
      title: 'Restaurants',
      icon: UtensilsCrossed,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      activeColor: 'bg-green-200',
      activeTextColor: 'text-green-700',
    },
    {
      id: 'catering' as CategoryType,
      title: 'Catering',
      icon: ChefHat,
      color: 'text-orange-400',
      bgColor: 'bg-orange-100',
      activeColor: 'bg-orange-200',
      activeTextColor: 'text-orange-700',
    },
    {
      id: 'decor' as CategoryType,
      title: 'Decor',
      icon: Sparkles,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
      activeColor: 'bg-purple-200',
      activeTextColor: 'text-purple-700',
    },
  ];

  return (
    <Card className="sticky top-24 border-white/70 bg-white/92 p-5 shadow-lg shadow-purple-100/40">
      <div className="space-y-5">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = filters.selectedCategory === category.id;
          const activeClasses = `${category.activeColor} ${category.activeTextColor} shadow-lg shadow-slate-200 hover:brightness-[0.98]`;
          
          return (
            <button
              key={category.id}
              onClick={() => updateFilters({ selectedCategory: category.id })}
              className={`w-full rounded-2xl px-4 py-2.5 transition-all ${
                isActive 
                  ? activeClasses
                  : `${category.bgColor} ${category.color} hover:-translate-y-0.5 hover:shadow-md`
              }`}
            >
              <div className="flex items-center justify-start gap-3">
                <div
                  className={`rounded-2xl p-2 ${
                    isActive
                      ? `bg-white/70 ${category.activeTextColor}`
                      : 'bg-white/70'
                  }`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="text-base font-medium">{category.title}</div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
