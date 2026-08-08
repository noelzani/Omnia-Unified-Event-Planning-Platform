import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Upload,
  X,
  Loader2,
  ChefHat,
  MapPin,
  Users,
  Euro,
  Star,
  ChevronDown,
} from "lucide-react";

import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { Button } from "../ui/button";

const STORAGE_BUCKET = "images";

const serviceTypeOptions = [
  "Full Service",
  "Buffet Style",
  "Plated Dinner",
  "Cocktail Reception",
  "Family Style",
  "Food Stations",
];

const menuTypeOptions = [
  "Gourmet",
  "International",
  "Local Cuisine",
  "Vegetarian/Vegan",
  "BBQ/Grilled",
  "Desserts Only",
];

const CITIES = [
  'Berat', 'Durres', 'Elbasan', 'Fier',
  'Korce', 'Kruje', 'Shkoder', 'Tirane', 'Vlore',
];

export default function AddCatering() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    about: "",
    city: "",
    serviceType: "",
    menuType: "",
    pricePerPerson: "",
    minimumGuests: "",
    maximumGuests: "",
    rating: "5.0",
  });

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);

    const onlyImages = files.filter((file) =>
      file.type.startsWith("image/")
    );

    setImageFiles((prev) => [...prev, ...onlyImages]);

    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const uploadImages = async (
    files: File[],
    cateringId: number
  ) => {
    const urls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();

      const filePath = `catering/${cateringId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      urls.push(data.publicUrl);
    }

    return urls;
  };

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (imageFiles.length === 0) {
      toast.error("Please upload at least one image.");
      return;
    }

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in.");
        return;
      }

      const { data: provider } = await supabase
        .from("providers")
        .select("provider_id")
        .eq("user_id", user.id)
        .single();

      if (!provider) {
        toast.error("Provider profile not found.");
        return;
      }

      const { data: catering, error } = await supabase
        .from("catering_services")
        .insert({
          provider_id: provider.provider_id,

          name: formData.name.trim(),

          description:
            formData.description.trim(),

          about:
            formData.about.trim() || formData.description.trim(),

          city: formData.city.trim(),

          service_type:
            formData.serviceType || null,

          menu_type:
            formData.menuType || null,

          price_per_person:
            formData.pricePerPerson
              ? Number(formData.pricePerPerson)
              : null,

          minimum_guests:
            formData.minimumGuests
              ? Number(formData.minimumGuests)
              : null,

          maximum_guests:
            formData.maximumGuests
              ? Number(formData.maximumGuests)
              : null,

          rating:
            Number(formData.rating),

          status: "Available",
        })
        .select("catering_id")
        .single();

      if (error || !catering) {
        toast.error(error?.message || "Failed to create catering service.");
        return;
      }

      const urls = await uploadImages(
        imageFiles,
        catering.catering_id
      );

      const imageRows = urls.map((url, index) => ({
        entity_type: "catering",
        entity_id: catering.catering_id,
        image_url: url,
        is_primary: index === 0,
      }));

      await supabase
        .from("service_images")
        .insert(imageRows);

      toast.success("Catering service added successfully!");
      navigate("/provider/properties");

    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl"
    >
      <div className="mb-8 flex items-center gap-4">

        <div className="flex size-16 items-center justify-center rounded-2xl bg-[#EABAB0]/30">
          <ChefHat className="size-8 text-[#875A6B]" />
        </div>

        <div>
          <h2 className="text-3xl font-bold">
            Add Catering Service
          </h2>

          <p className="text-gray-500">
            Create your catering listing.
          </p>
        </div>

      </div>

      <div className="grid gap-6 md:grid-cols-2">

        <Input
          label="Service Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <Select
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          options={CITIES}
          required
        />

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="md:col-span-2"
        />

        <Textarea
          label="About"
          name="about"
          value={formData.about}
          onChange={handleChange}
          className="md:col-span-2"
        />

        <div>
          <label className="mb-2 block font-semibold text-gray-700">Service Type</label>
          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            {serviceTypeOptions.map((type) => {
              const selected = formData.serviceType
                ? formData.serviceType.split(",").map((s) => s.trim()).filter(Boolean)
                : [];
              return (
                <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(type)}
                    onChange={() => {
                      const updated = selected.includes(type)
                        ? selected.filter((s) => s !== type)
                        : [...selected, type];
                      setFormData((prev) => ({ ...prev, serviceType: updated.join(", ") }));
                    }}
                    className="accent-[#875A6B]"
                  />
                  {type}
                </label>
              );
            })}
          </div>
        </div>

        <Select
          label="Menu Type"
          name="menuType"
          value={formData.menuType}
          onChange={handleChange}
          options={menuTypeOptions}
        />

        <Input
          label="Price Per Person (€)"
          type="number"
          name="pricePerPerson"
          value={formData.pricePerPerson}
          onChange={handleChange}
          icon={<Euro className="size-4" />}
        />

        <Input
          label="Minimum Guests"
          type="number"
          name="minimumGuests"
          value={formData.minimumGuests}
          onChange={handleChange}
          icon={<Users className="size-4" />}
        />

        <Input
          label="Maximum Guests"
          type="number"
          name="maximumGuests"
          value={formData.maximumGuests}
          onChange={handleChange}
          icon={<Users className="size-4" />}
        />

        <Input
          label="Rating"
          type="number"
          name="rating"
          value={formData.rating}
          onChange={handleChange}
          icon={<Star className="size-4" />}
        />

      </div>

      <div className="mt-8">

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 p-10 text-center hover:bg-gray-50">

          <Upload className="mb-4 size-10 text-gray-500" />

          <span className="text-lg font-semibold">
            Upload Catering Images
          </span>

          <span className="text-sm text-gray-500">
            Add multiple high-quality photos
          </span>

          <input
            type="file"
            multiple
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />

        </label>

        {imageFiles.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

            {imageFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="relative"
              >
                <img
                  src={URL.createObjectURL(file)}
                  className="h-36 w-full rounded-2xl object-cover"
                />

                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                    Primary
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white"
                >
                  <X className="size-4" />
                </button>

              </div>
            ))}

          </div>
        )}

      </div>

      <Button
        type="submit"
        disabled={loading}
        className="mt-8 h-14 w-full rounded-2xl bg-[#875A6B] text-lg font-semibold text-white hover:bg-[#6f4958]"
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          "Add Catering Service"
        )}
      </Button>

    </form>
  );
}

function Input({
  label,
  icon,
  className = "",
  ...props
}: any) {
  return (
    <div className={className}>

      <label className="mb-2 block font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative">

        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          {...props}
          className={`h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 outline-none transition-all focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25 ${
            icon ? "pl-11" : ""
          }`}
        />

      </div>

    </div>
  );
}

function Textarea({
  label,
  className = "",
  ...props
}: any) {
  return (
    <div className={className}>

      <label className="mb-2 block font-semibold text-gray-700">
        {label}
      </label>

      <textarea
        {...props}
        rows={5}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 outline-none transition-all focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25"
      />

    </div>
  );
}

function Select({
  label,
  options,
  className = "",
  ...props
}: any) {
  return (
    <div className={className}>

      <label className="mb-2 block font-semibold text-gray-700">
        {label}
      </label>

      <div className="relative">

        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />

        <select
          {...props}
          className="h-14 w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-11 outline-none transition-all focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25"
        >
          <option value="">Select option</option>

          {options.map((option: string) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}

        </select>

      </div>

    </div>
  );
}