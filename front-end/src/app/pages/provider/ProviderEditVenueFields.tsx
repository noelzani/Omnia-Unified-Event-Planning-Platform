import { Users, Euro } from "lucide-react";
import {
  Input,
  Select,
  type FieldProps,
  venueTypeOptions,
  locationTypeOptions,
  indoorOutdoorOptions,
} from "./editPropertyShared";

export function VenueFields({ formData, updateField }: FieldProps) {
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
        label="Venue Type"
        value={formData.venue_type || ""}
        onChange={(v) => updateField("venue_type", v)}
        options={venueTypeOptions}
        theme="brand"
      />

      <Select
        label="Location Type"
        value={formData.location_type || ""}
        onChange={(v) => updateField("location_type", v)}
        options={locationTypeOptions}
        theme="brand"
      />

      <Select
        label="Indoor / Outdoor"
        value={formData.indoor_outdoor || ""}
        onChange={(v) => updateField("indoor_outdoor", v)}
        options={indoorOutdoorOptions}
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
        label="Price Per Day (€)"
        type="number"
        value={formData.price_per_day || ""}
        onChange={(v) => updateField("price_per_day", v)}
        theme="brand"
        icon={<Euro className="size-4" />}
      />

      <Input
        label="Price Per Hour (€)"
        type="number"
        value={formData.price_per_hour || ""}
        onChange={(v) => updateField("price_per_hour", v)}
        theme="brand"
        icon={<Euro className="size-4" />}
      />
    </>
  );
}
