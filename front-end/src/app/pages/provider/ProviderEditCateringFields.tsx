import { Users, Euro } from "lucide-react";
import {
  Input,
  Select,
  type FieldProps,
  serviceTypeOptions,
  menuTypeOptions,
} from "./editPropertyShared";

export function CateringFields({ formData, updateField }: FieldProps) {
  const selectedServiceTypes = formData.service_type
    ? formData.service_type.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <>
      <div>
        <label className="mb-2 block font-semibold text-gray-700">Service Type</label>
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          {serviceTypeOptions.map((type) => (
            <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedServiceTypes.includes(type)}
                onChange={() => {
                  const updated = selectedServiceTypes.includes(type)
                    ? selectedServiceTypes.filter((s) => s !== type)
                    : [...selectedServiceTypes, type];
                  updateField("service_type", updated.join(", "));
                }}
                className="accent-[#875A6B]"
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <Select
        label="Menu Type"
        value={formData.menu_type || ""}
        onChange={(v) => updateField("menu_type", v)}
        options={menuTypeOptions}
        theme="brand"
      />

      <Input
        label="Price Per Person (€)"
        type="number"
        value={formData.price_per_person || ""}
        onChange={(v) => updateField("price_per_person", v)}
        theme="brand"
        icon={<Euro className="size-4" />}
      />

      <Input
        label="Minimum Guests"
        type="number"
        value={formData.minimum_guests || ""}
        onChange={(v) => updateField("minimum_guests", v)}
        theme="brand"
        icon={<Users className="size-4" />}
      />

      <Input
        label="Maximum Guests"
        type="number"
        value={formData.maximum_guests || ""}
        onChange={(v) => updateField("maximum_guests", v)}
        theme="brand"
        icon={<Users className="size-4" />}
      />
    </>
  );
}
