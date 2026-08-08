import { Users } from "lucide-react";
import {
  Input,
  Select,
  type FieldProps,
  cuisineOptions,
  diningStyleOptions,
  indoorOutdoorOptions,
  priceRangeOptions,
} from "./editPropertyShared";

export function RestaurantFields({ formData, updateField }: FieldProps) {
  return (
    <>
      <Input
        label="Address"
        value={formData.address || ""}
        onChange={(v) => updateField("address", v)}
        theme="brand"
        className="md:col-span-2"
      />

      <Select
        label="Cuisine Type"
        value={formData.cuisine_type || ""}
        onChange={(v) => updateField("cuisine_type", v)}
        options={cuisineOptions}
        theme="brand"
      />

      <Select
        label="Dining Style"
        value={formData.dining_style || ""}
        onChange={(v) => updateField("dining_style", v)}
        options={diningStyleOptions}
        theme="brand"
      />

      <Select
        label="Indoor / Outdoor"
        value={formData.indoor_outdoor || ""}
        onChange={(v) => updateField("indoor_outdoor", v)}
        options={indoorOutdoorOptions}
        theme="brand"
      />

      <Select
        label="Price Range"
        value={formData.price_range || ""}
        onChange={(v) => updateField("price_range", v)}
        options={priceRangeOptions}
        theme="brand"
      />

      <Input
        label="Capacity"
        type="number"
        value={formData.capacity || ""}
        onChange={(v) => updateField("capacity", v)}
        theme="brand"
        icon={<Users className="size-4" />}
      />

      <Input
        label="Minimum Guests"
        type="number"
        value={formData.minimum_guests || ""}
        onChange={(v) => updateField("minimum_guests", v)}
        theme="brand"
      />

      <Input
        label="Maximum Guests"
        type="number"
        value={formData.maximum_guests || ""}
        onChange={(v) => updateField("maximum_guests", v)}
        theme="brand"
      />
    </>
  );
}
