// Shared types, config, option lists, and form UI components used by all edit-property pages.

export const STORAGE_BUCKET = "images";

export const CITIES = [
  'Berat', 'Durres', 'Elbasan', 'Fier',
  'Korce', 'Kruje', 'Shkoder', 'Tirane', 'Vlore',
];

export type EntityType = "venue" | "restaurant" | "catering" | "decoration";

export type ServiceImage = {
  image_id: number;
  image_url: string;
  is_primary: boolean | null;
};

export interface FormData {
  name: string;
  description: string;
  city: string;
  about: string;
  rating: string;

  venue_type?: string;
  address?: string;
  capacity?: string;
  price_per_hour?: string;
  price_per_day?: string;
  indoor_outdoor?: string;
  location_type?: string;

  cuisine_type?: string;
  minimum_guests?: string;
  maximum_guests?: string;
  dining_style?: string;
  price_range?: string;

  menu_type?: string;
  price_per_person?: string;
  service_type?: string;

  theme_style?: string;
  starting_price?: string;
  operating_cities?: string;
}

export type FieldProps = {
  formData: FormData;
  updateField: (field: keyof FormData, value: string) => void;
};

import { Building2, UtensilsCrossed, ChefHat, Palette, ChevronDown } from "lucide-react";

export const config = {
  venue: {
    table: "venues",
    idColumn: "venue_id",
    title: "Edit Venue",
    icon: Building2,
    color: "brand",
    entityType: "venue",
  },
  restaurant: {
    table: "restaurants",
    idColumn: "restaurant_id",
    title: "Edit Restaurant",
    icon: UtensilsCrossed,
    color: "brand",
    entityType: "restaurant",
  },
  catering: {
    table: "catering_services",
    idColumn: "catering_id",
    title: "Edit Catering Service",
    icon: ChefHat,
    color: "brand",
    entityType: "catering",
  },
  decoration: {
    table: "decoration_services",
    idColumn: "decoration_id",
    title: "Edit Decor Service",
    icon: Palette,
    color: "brand",
    entityType: "decoration",
  },
};

export const venueTypeOptions = ["Villa", "Apartment", "Ballroom"];
export const locationTypeOptions = ["Countryside", "Coastline", "Old Town", "City Center", "Suburban", "Mountain"];
export const indoorOutdoorOptions = ["Indoor", "Outdoor", "Both"];
export const cuisineOptions = ["Italian", "American", "Asian Fusion", "Latin", "Mediterranean", "Seafood", "Contemporary", "Traditional"];
export const diningStyleOptions = ["Fine Dining", "Casual", "Elegant", "Rooftop", "Garden Dining", "Waterfront"];
export const priceRangeOptions = ["€", "€€", "€€€", "€€€€"];
export const serviceTypeOptions = ["Full Service", "Buffet Style", "Plated Dinner", "Cocktail Reception", "Family Style", "Food Stations"];
export const menuTypeOptions = ["Gourmet", "International", "Local Cuisine", "Vegetarian/Vegan", "BBQ/Grilled", "Desserts Only"];
export const themeStyleOptions = ["Elegant", "Modern", "Rustic", "Luxury", "Floral", "Minimalist"];

export function getThemeStyles(theme: string) {
  if (theme === "blue") {
    return {
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      button: "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700",
      focus: "focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
    };
  }
  if (theme === "green") {
    return {
      iconBg: "bg-green-100",
      iconText: "text-green-600",
      button: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
      focus: "focus:border-green-500 focus:ring-4 focus:ring-green-100",
    };
  }
  if (theme === "orange") {
    return {
      iconBg: "bg-orange-100",
      iconText: "text-orange-600",
      button: "bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600",
      focus: "focus:border-orange-500 focus:ring-4 focus:ring-orange-100",
    };
  }
  return {
    iconBg: "bg-[#EABAB0]/30",
    iconText: "text-[#875A6B]",
    button: "bg-[#875A6B] hover:bg-[#6f4958]",
    focus: "focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25",
  };
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  icon,
  theme,
  className = "",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: React.ReactNode;
  theme: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const styles = getThemeStyles(theme);
  return (
    <div className={className}>
      <label className="mb-2 block font-semibold text-gray-700">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        )}
        <input
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 outline-none transition-all ${styles.focus} ${icon ? "pl-11" : ""}`}
        />
      </div>
    </div>
  );
}

export function Textarea({
  label,
  value,
  onChange,
  theme,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  theme: string;
  className?: string;
}) {
  const styles = getThemeStyles(theme);
  return (
    <div className={`md:col-span-2 ${className}`}>
      <label className="mb-2 block font-semibold text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className={`w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 outline-none transition-all ${styles.focus}`}
      />
    </div>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  theme,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  theme: string;
  className?: string;
}) {
  const styles = getThemeStyles(theme);
  return (
    <div className={className}>
      <label className="mb-2 block font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-14 w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-11 outline-none transition-all ${styles.focus}`}
        >
          <option value="">Select option</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
