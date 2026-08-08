import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Upload, X, Loader2, Building2, MapPin, Users, Star, ChevronDown } from "lucide-react";

import { toast } from "sonner";
import { supabase } from "../../../lib/supabase";
import { Button } from "../ui/button";

const STORAGE_BUCKET = "images";

const venueTypeOptions = ["Villa", "Apartment", "Ballroom"];
const locationTypeOptions = ["Countryside", "Coastline", "Old Town", "City Center", "Suburban", "Mountain"];
const indoorOutdoorOptions = ["Indoor", "Outdoor", "Both"];

const CITIES = [
  'Berat', 'Durres', 'Elbasan', 'Fier',
  'Korce', 'Kruje', 'Shkoder', 'Tirane', 'Vlore',
];

type EventType = { event_type_id: number; name: string };

export default function AddVenue() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [allEventTypes, setAllEventTypes] = useState<EventType[]>([]);
  const [selectedEventTypeIds, setSelectedEventTypeIds] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    about: "",
    city: "",
    address: "",
    venueType: "",
    capacity: "",
    pricePerDay: "",
    pricePerHour: "",
    indoorOutdoor: "",
    locationType: "",
    parkingAvailable: false,
    rating: "5.0",
  });

  useEffect(() => {
    supabase.from("event_types").select("event_type_id, name").order("name").then(({ data }) => {
      if (data) setAllEventTypes(data);
    });
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleEventType = (id: number) => {
    setSelectedEventTypeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    setImageFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[], venueId: number) => {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const filePath = `venues/${venueId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);
      if (error) throw error;
      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0) { toast.error("Please upload at least one image."); return; }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("You must be logged in."); return; }

      const { data: provider } = await supabase
        .from("providers").select("provider_id").eq("user_id", user.id).single();
      if (!provider) { toast.error("Provider profile not found."); return; }

      const { data: venue, error } = await supabase
        .from("venues")
        .insert({
          provider_id: provider.provider_id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          about: formData.about.trim() || formData.description.trim(),
          city: formData.city.trim(),
          address: formData.address.trim(),
          venue_type: formData.venueType || null,
          capacity: formData.capacity ? Number(formData.capacity) : null,
          price_per_day: formData.pricePerDay ? Number(formData.pricePerDay) : null,
          price_per_hour: formData.pricePerHour ? Number(formData.pricePerHour) : null,
          indoor_outdoor: formData.indoorOutdoor || null,
          location_type: formData.locationType || null,
          parking_available: formData.parkingAvailable,
          rating: Number(formData.rating),
          status: "Available",
        })
        .select("venue_id")
        .single();

      if (error || !venue) { toast.error(error?.message || "Failed to create venue."); return; }

      const urls = await uploadImages(imageFiles, venue.venue_id);
      await supabase.from("service_images").insert(
        urls.map((url, index) => ({
          entity_type: "venue",
          entity_id: venue.venue_id,
          image_url: url,
          is_primary: index === 0,
        }))
      );

      if (selectedEventTypeIds.length > 0) {
        await supabase.from("venue_event_types").insert(
          selectedEventTypeIds.map((id) => ({ venue_id: venue.venue_id, event_type_id: id }))
        );
      }

      toast.success("Venue added successfully!");
      navigate("/provider/properties");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-xl">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-[#EABAB0]/30">
          <Building2 className="size-8 text-[#875A6B]" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Add Venue</h2>
          <p className="text-gray-500">Create your venue listing.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Input label="Venue Name" name="name" value={formData.name} onChange={handleChange} required />
        <Select label="City" name="city" value={formData.city} onChange={handleChange} options={CITIES} required />
        <Input label="Address" name="address" value={formData.address} onChange={handleChange} className="md:col-span-2" />
        <Textarea label="Description" name="description" value={formData.description} onChange={handleChange} className="md:col-span-2" />
        <Textarea label="About" name="about" value={formData.about} onChange={handleChange} className="md:col-span-2" />
        <Select label="Venue Type" name="venueType" value={formData.venueType} onChange={handleChange} options={venueTypeOptions} />
        <Select label="Location Type" name="locationType" value={formData.locationType} onChange={handleChange} options={locationTypeOptions} />
        <Select label="Indoor / Outdoor" name="indoorOutdoor" value={formData.indoorOutdoor} onChange={handleChange} options={indoorOutdoorOptions} />
        <Input label="Capacity" type="number" name="capacity" value={formData.capacity} onChange={handleChange} icon={<Users className="size-4" />} />
        <Input label="Price Per Day (€)" type="number" name="pricePerDay" value={formData.pricePerDay} onChange={handleChange} />
        <Input label="Price Per Hour (€)" type="number" name="pricePerHour" value={formData.pricePerHour} onChange={handleChange} />
        <Input label="Rating" type="number" name="rating" value={formData.rating} onChange={handleChange} icon={<Star className="size-4" />} />
      </div>

      <div className="mt-6">
        <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-5 py-4">
          <input type="checkbox" name="parkingAvailable" checked={formData.parkingAvailable} onChange={handleChange} />
          Parking Available
        </label>
      </div>

      {allEventTypes.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 font-semibold text-gray-700">Suitable Event Types</p>
          <div className="flex flex-wrap gap-2">
            {allEventTypes.map((et) => {
              const checked = selectedEventTypeIds.includes(et.event_type_id);
              return (
                <button
                  key={et.event_type_id}
                  type="button"
                  onClick={() => toggleEventType(et.event_type_id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                    checked
                      ? "border-[#875A6B] bg-[#875A6B] text-white"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#875A6B]/40"
                  }`}
                >
                  {et.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-8">
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 p-10 text-center hover:bg-gray-50">
          <Upload className="mb-4 size-10 text-gray-500" />
          <span className="text-lg font-semibold">Upload Venue Images</span>
          <span className="text-sm text-gray-500">Add multiple high-quality photos</span>
          <input type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
        </label>
        {imageFiles.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {imageFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative">
                <img src={URL.createObjectURL(file)} className="h-36 w-full rounded-2xl object-cover" />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">Primary</span>
                )}
                <button type="button" onClick={() => removeImage(index)} className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white">
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" disabled={loading} className="mt-8 h-14 w-full rounded-2xl bg-[#875A6B] text-lg font-semibold text-white hover:bg-[#6f4958]">
        {loading ? <Loader2 className="animate-spin" /> : "Add Venue"}
      </Button>
    </form>
  );
}

function Input({ label, icon, className = "", ...props }: any) {
  return (
    <div className={className}>
      <label className="mb-2 block font-semibold text-gray-700">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
          {...props}
          className={`h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 outline-none transition-all focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25 ${icon ? "pl-11" : ""}`}
        />
      </div>
    </div>
  );
}

function Textarea({ label, className = "", ...props }: any) {
  return (
    <div className={className}>
      <label className="mb-2 block font-semibold text-gray-700">{label}</label>
      <textarea
        {...props}
        rows={5}
        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 outline-none transition-all focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25"
      />
    </div>
  );
}

function Select({ label, options, className = "", ...props }: any) {
  return (
    <div className={className}>
      <label className="mb-2 block font-semibold text-gray-700">{label}</label>
      <div className="relative">
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <select
          {...props}
          className="h-14 w-full appearance-none rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-11 outline-none transition-all focus:border-[#875A6B]/45 focus:ring-4 focus:ring-[#EABAB0]/25"
        >
          <option value="">Select option</option>
          {options.map((option: string) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
