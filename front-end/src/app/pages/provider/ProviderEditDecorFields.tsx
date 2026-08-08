import { Euro } from "lucide-react";
import {
  CITIES,
  Input,
  type FieldProps,
  themeStyleOptions,
} from "./editPropertyShared";

export function DecorFields({ formData, updateField }: FieldProps) {
  const selectedCities = formData.operating_cities
    ? formData.operating_cities.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const toggleCity = (city: string) => {
    const updated = selectedCities.includes(city)
      ? selectedCities.filter((c) => c !== city)
      : [...selectedCities, city];
    updateField("operating_cities", updated.join(", "));
  };

  return (
    <>
      <div>
        <label className="mb-2 block font-semibold text-gray-700">Operating Cities</label>
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          {CITIES.map((city) => (
            <label key={city} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedCities.includes(city)}
                onChange={() => toggleCity(city)}
                className="accent-[#875A6B]"
              />
              {city}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block font-semibold text-gray-700">Theme Style</label>
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          {themeStyleOptions.map((style) => {
            const selectedStyles = formData.theme_style
              ? formData.theme_style.split(",").map((s) => s.trim()).filter(Boolean)
              : [];
            return (
              <label key={style} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedStyles.includes(style)}
                  onChange={() => {
                    const updated = selectedStyles.includes(style)
                      ? selectedStyles.filter((s) => s !== style)
                      : [...selectedStyles, style];
                    updateField("theme_style", updated.join(", "));
                  }}
                  className="accent-[#875A6B]"
                />
                {style}
              </label>
            );
          })}
        </div>
      </div>

      <Input
        label="Starting Price (€)"
        type="number"
        value={formData.starting_price || ""}
        onChange={(v) => updateField("starting_price", v)}
        theme="brand"
        icon={<Euro className="size-4" />}
      />
    </>
  );
}
