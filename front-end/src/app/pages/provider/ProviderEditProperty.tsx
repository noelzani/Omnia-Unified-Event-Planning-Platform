import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2, Save, ImagePlus, X, Star, GripVertical } from "lucide-react";
import { toast } from "sonner";

import { Button } from "../../components/ui/button";
import { supabase } from "../../../lib/supabase";
import {
  STORAGE_BUCKET,
  CITIES,
  config,
  getThemeStyles,
  Input,
  Select,
  Textarea,
  type EntityType,
  type ServiceImage,
  type FormData,
} from "./editPropertyShared";
import { VenueFields } from "./ProviderEditVenueFields";
import { RestaurantFields } from "./ProviderEditRestaurantFields";
import { CateringFields } from "./ProviderEditCateringFields";
import { DecorFields } from "./ProviderEditDecorFields";

type EventType = { event_type_id: number; name: string };

const EVENT_JUNCTION: Partial<Record<EntityType, { table: string; idColumn: string }>> = {
  venue:      { table: "venue_event_types",      idColumn: "venue_id" },
  restaurant: { table: "restaurant_event_types", idColumn: "restaurant_id" },
};

export default function ProviderEditProperty() {
  const navigate = useNavigate();
  const { entityType, id } = useParams();

  const type = entityType as EntityType;
  const currentConfig = config[type];

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    city: "",
    about: "",
    rating: "",
  });

  const [allEventTypes, setAllEventTypes] = useState<EventType[]>([]);
  const [selectedEventTypeIds, setSelectedEventTypeIds] = useState<number[]>([]);

  const [existingImages, setExistingImages] = useState<ServiceImage[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<ServiceImage[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void loadProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, id]);

  const loadProperty = async () => {
    if (!currentConfig || !id) {
      navigate("/provider/properties");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from(currentConfig.table)
      .select("*")
      .eq(currentConfig.idColumn, Number(id))
      .single();

    if (error || !data) {
      toast.error(error?.message || "Property not found");
      navigate("/provider/properties");
      return;
    }

    const { data: imageData } = await supabase
      .from("service_images")
      .select("image_id, image_url, is_primary")
      .eq("entity_type", type)
      .eq("entity_id", Number(id))
      .order("is_primary", { ascending: false })
      .order("image_id", { ascending: true });

    setExistingImages((imageData || []) as ServiceImage[]);

    // Fetch event types (all + currently selected for venue/restaurant)
    const { data: etAll } = await supabase.from("event_types").select("event_type_id, name").order("name");
    setAllEventTypes((etAll || []) as EventType[]);

    const junctionCfg = EVENT_JUNCTION[type];
    if (junctionCfg) {
      const { data: etSelected } = await supabase
        .from(junctionCfg.table)
        .select("event_type_id")
        .eq(junctionCfg.idColumn, Number(id));
      setSelectedEventTypeIds((etSelected || []).map((r: any) => r.event_type_id));
    }

    setFormData({
      name: data.name || "",
      description: data.description || "",
      city: data.city || "",
      about: data.about || "",
      rating: data.rating ? String(data.rating) : "5.0",

      venue_type: data.venue_type || "",
      address: data.address || "",
      capacity: data.capacity ? String(data.capacity) : "",
      price_per_hour: data.price_per_hour ? String(data.price_per_hour) : "",
      price_per_day: data.price_per_day ? String(data.price_per_day) : "",
      indoor_outdoor: data.indoor_outdoor || "",
      location_type: data.location_type || "",

      cuisine_type: data.cuisine_type || "",
      minimum_guests: data.minimum_guests ? String(data.minimum_guests) : "",
      maximum_guests: data.maximum_guests ? String(data.maximum_guests) : "",
      dining_style: data.dining_style || "",
      price_range: data.price_range || "",

      menu_type: data.menu_type || "",
      price_per_person: data.price_per_person ? String(data.price_per_person) : "",
      service_type: data.service_type || "",

      theme_style: data.theme_style || "",
      starting_price: data.starting_price ? String(data.starting_price) : "",
      operating_cities: Array.isArray(data.operating_cities)
        ? data.operating_cities.join(", ")
        : "",
    });

    setIsLoading(false);
  };

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const numberOrNull = (value?: string) => {
    if (!value) return null;
    return Number(value);
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const onlyImages = files.filter((file) => file.type.startsWith("image/"));
    setNewImageFiles((prev) => [...prev, ...onlyImages]);
    e.target.value = "";
  };

  const removeExistingImage = (image: ServiceImage) => {
    setExistingImages((prev) => prev.filter((item) => item.image_id !== image.image_id));
    setImagesToDelete((prev) => [...prev, image]);
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    setExistingImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDragIndex(null);
  };

  const getStoragePathFromPublicUrl = (url: string) => {
    const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
    const parts = url.split(marker);
    return parts[1] || null;
  };

  const uploadNewImages = async (files: File[], entityId: number) => {
    const urls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop();
      const folder =
        type === "venue"
          ? "venues"
          : type === "restaurant"
            ? "restaurants"
            : type === "catering"
              ? "catering"
              : "decor";

      const filePath = `${folder}/${entityId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, file);
      if (error) throw error;

      const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
      urls.push(data.publicUrl);
    }

    return urls;
  };

  const getOperatingCitiesArray = () => {
    if (!formData.operating_cities?.trim()) return null;
    return formData.operating_cities
      .split(",")
      .map((city) => city.trim())
      .filter(Boolean);
  };

  const handleSave = async () => {
    if (!currentConfig || !id) return;

    if (!formData.name.trim()) { toast.error("Name is required."); return; }
    if (!formData.city.trim()) { toast.error("City is required."); return; }
    if (!formData.description.trim()) { toast.error("Description is required."); return; }

    const remainingImagesCount = existingImages.length + newImageFiles.length;
    if (remainingImagesCount === 0) {
      toast.error("Please keep or upload at least one image.");
      return;
    }

    setIsSaving(true);

    try {
      let updateData: Record<string, unknown> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        city: formData.city.trim(),
        about: formData.about.trim() || formData.description.trim(),
        rating: numberOrNull(formData.rating),
      };

      if (type === "venue") {
        updateData = {
          ...updateData,
          venue_type: formData.venue_type || null,
          address: formData.address?.trim() || null,
          capacity: numberOrNull(formData.capacity),
          price_per_hour: numberOrNull(formData.price_per_hour),
          price_per_day: numberOrNull(formData.price_per_day),
          indoor_outdoor: formData.indoor_outdoor || null,
          location_type: formData.location_type || null,
        };
      }

      if (type === "restaurant") {
        updateData = {
          ...updateData,
          address: formData.address?.trim() || null,
          capacity: numberOrNull(formData.capacity),
          cuisine_type: formData.cuisine_type || null,
          minimum_guests: numberOrNull(formData.minimum_guests),
          maximum_guests: numberOrNull(formData.maximum_guests),
          dining_style: formData.dining_style || null,
          price_range: formData.price_range || null,
          indoor_outdoor: formData.indoor_outdoor || null,
        };
      }

      if (type === "catering") {
        updateData = {
          ...updateData,
          menu_type: formData.menu_type || null,
          price_per_person: numberOrNull(formData.price_per_person),
          minimum_guests: numberOrNull(formData.minimum_guests),
          maximum_guests: numberOrNull(formData.maximum_guests),
          service_type: formData.service_type || null,
        };
      }

      if (type === "decoration") {
        updateData = {
          ...updateData,
          theme_style: formData.theme_style || null,
          starting_price: numberOrNull(formData.starting_price),
          operating_cities: getOperatingCitiesArray(),
        };
      }

      const { error } = await supabase
        .from(currentConfig.table)
        .update(updateData)
        .eq(currentConfig.idColumn, Number(id));

      if (error) throw error;

      // Save event types for venue / restaurant
      const junctionCfg = EVENT_JUNCTION[type];
      if (junctionCfg) {
        await supabase.from(junctionCfg.table).delete().eq(junctionCfg.idColumn, Number(id));
        if (selectedEventTypeIds.length > 0) {
          await supabase.from(junctionCfg.table).insert(
            selectedEventTypeIds.map((etId) => ({
              [junctionCfg.idColumn]: Number(id),
              event_type_id: etId,
            }))
          );
        }
      }

      // Delete explicitly removed images (storage + DB)
      if (imagesToDelete.length > 0) {
        const pathsToDelete = imagesToDelete
          .map((image) => getStoragePathFromPublicUrl(image.image_url))
          .filter(Boolean) as string[];

        await supabase
          .from("service_images")
          .delete()
          .in("image_id", imagesToDelete.map((image) => image.image_id));

        if (pathsToDelete.length > 0) {
          await supabase.storage.from(STORAGE_BUCKET).remove(pathsToDelete);
        }
      }

      // Delete remaining existing image DB rows (storage kept), then re-insert in dragged order
      if (existingImages.length > 0) {
        await supabase
          .from("service_images")
          .delete()
          .in("image_id", existingImages.map((img) => img.image_id));

        const { error: reinsertError } = await supabase
          .from("service_images")
          .insert(existingImages.map((img, i) => ({
            entity_type: type,
            entity_id: Number(id),
            image_url: img.image_url,
            is_primary: i === 0,
          })));

        if (reinsertError) throw reinsertError;
      }

      // Upload and insert new images after existing ones
      if (newImageFiles.length > 0) {
        const urls = await uploadNewImages(newImageFiles, Number(id));

        const imageRows = urls.map((url, index) => ({
          entity_type: type,
          entity_id: Number(id),
          image_url: url,
          is_primary: existingImages.length === 0 && index === 0,
        }));

        const { error: imageInsertError } = await supabase
          .from("service_images")
          .insert(imageRows);

        if (imageInsertError) throw imageInsertError;
      }

      toast.success("Property updated successfully!");
      navigate("/provider/properties");
    } catch (error: any) {
      console.error("EDIT PROPERTY ERROR:", error);
      toast.error(error?.message || "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !currentConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="size-10 animate-spin text-[#875A6B]" />
      </div>
    );
  }

  const Icon = currentConfig.icon;
  const styles = getThemeStyles(currentConfig.color);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <button
          type="button"
          onClick={() => navigate("/provider/properties")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="size-5" />
          Back to properties
        </button>

        <div className="rounded-3xl bg-white p-8 shadow-xl">
          <div className="mb-8 flex items-center gap-4">
            <div className={`flex size-16 items-center justify-center rounded-2xl ${styles.iconBg}`}>
              <Icon className={`size-8 ${styles.iconText}`} />
            </div>

            <div>
              <h1 className="text-4xl font-bold text-gray-900">{currentConfig.title}</h1>
              <p className="mt-1 text-gray-600">Update listing details and images.</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Input
              label="Name"
              value={formData.name}
              onChange={(v) => updateField("name", v)}
              theme={currentConfig.color}
              required
            />

            <Select
              label="City"
              value={formData.city}
              onChange={(v) => updateField("city", v)}
              options={CITIES}
              theme={currentConfig.color}
            />

            <Textarea
              label="Description"
              value={formData.description}
              onChange={(v) => updateField("description", v)}
              theme={currentConfig.color}
            />

            <Textarea
              label="About"
              value={formData.about}
              onChange={(v) => updateField("about", v)}
              theme={currentConfig.color}
            />

            {type === "venue" && <VenueFields formData={formData} updateField={updateField} />}
            {type === "restaurant" && <RestaurantFields formData={formData} updateField={updateField} />}
            {type === "catering" && <CateringFields formData={formData} updateField={updateField} />}
            {type === "decoration" && <DecorFields formData={formData} updateField={updateField} />}

            {(type === "venue" || type === "restaurant") && allEventTypes.length > 0 && (
              <div className="md:col-span-2">
                <p className="mb-3 font-semibold text-gray-700">Suitable Event Types</p>
                <div className="flex flex-wrap gap-2">
                  {allEventTypes.map((et) => {
                    const checked = selectedEventTypeIds.includes(et.event_type_id);
                    return (
                      <button
                        key={et.event_type_id}
                        type="button"
                        onClick={() =>
                          setSelectedEventTypeIds((prev) =>
                            prev.includes(et.event_type_id)
                              ? prev.filter((x) => x !== et.event_type_id)
                              : [...prev, et.event_type_id]
                          )
                        }
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

            <Input
              label="Rating"
              type="number"
              value={formData.rating}
              onChange={(v) => updateField("rating", v)}
              theme={currentConfig.color}
              icon={<Star className="size-4" />}
            />
          </div>

          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Images</h2>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 p-10 text-center hover:bg-gray-50">
              <ImagePlus className="mb-4 size-10 text-gray-500" />

              <span className="text-lg font-semibold">Upload More Images</span>

              <span className="text-sm text-gray-500">
                Existing images are shown below. First image becomes primary.
              </span>

              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                onChange={handleNewImageChange}
              />
            </label>

            {(existingImages.length > 0 || newImageFiles.length > 0) && (
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {existingImages.map((image, index) => (
                  <div
                    key={image.image_id}
                    className={`relative cursor-grab rounded-2xl transition-opacity duration-150 ${dragIndex === index ? 'opacity-40' : 'opacity-100'}`}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleImageDrop(index)}
                    onDragEnd={() => setDragIndex(null)}
                  >
                    <img src={image.image_url} className="h-36 w-full rounded-2xl object-cover" />

                    <div className="absolute left-2 top-2 flex items-center gap-1">
                      {index === 0 && (
                        <span className="rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/50 p-1 text-white">
                      <GripVertical className="size-4" />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeExistingImage(image)}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}

                {newImageFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      className="h-36 w-full rounded-2xl object-cover"
                    />

                    {existingImages.length === 0 && index === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                        Primary
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-2 text-white"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/provider/properties")}
              className="h-12 rounded-xl px-6"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`h-12 rounded-xl px-6 text-white ${styles.button}`}
            >
              {isSaving ? (
                <Loader2 className="mr-2 size-5 animate-spin" />
              ) : (
                <Save className="mr-2 size-5" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}