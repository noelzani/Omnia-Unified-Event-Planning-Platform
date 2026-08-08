import { useState } from "react";
import {
  ArrowRight,
  Building2,
  ChefHat,
  Palette,
  UtensilsCrossed,
} from "lucide-react";

import AddVenue from "../../components/properties/AddVenue";
import AddRestaurant from "../../components/properties/AddRestaurant";
import AddCatering from "../../components/properties/AddCatering";
import AddDecor from "../../components/properties/AddDecor";
import { Button } from "../../components/ui/button";

type PropertyType = "Venues" | "Restaurants" | "Catering" | "Decor" | null;

export default function AddProperty() {
  const [selectedType, setSelectedType] = useState<PropertyType>(null);

  const propertyTypes = [
    {
      type: "Venues" as PropertyType,
      title: "Venue",
      description: "List your event space, villa, or venue",
      icon: Building2,
      bg: "bg-[#EABAB0]/30",
      text: "text-[#875A6B]",
      border: "border-[#EABAB0]/60",
    },
    {
      type: "Restaurants" as PropertyType,
      title: "Restaurant",
      description: "List your restaurant or dining venue",
      icon: UtensilsCrossed,
      bg: "bg-[#EABAB0]/30",
      text: "text-[#875A6B]",
      border: "border-[#EABAB0]/60",
    },
    {
      type: "Catering" as PropertyType,
      title: "Catering Service",
      description: "List your catering business",
      icon: ChefHat,
      bg: "bg-[#EABAB0]/30",
      text: "text-[#875A6B]",
      border: "border-[#EABAB0]/60",
    },
    {
      type: "Decor" as PropertyType,
      title: "Decor Service",
      description: "List your decoration business",
      icon: Palette,
      bg: "bg-[#EABAB0]/30",
      text: "text-[#875A6B]",
      border: "border-[#EABAB0]/60",
    },
  ];

  const currentTypeInfo = propertyTypes.find((item) => item.type === selectedType);

  if (!selectedType) {
    return (
      <div className="min-h-screen bg-[#fdf7f8]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 h-[3px] w-12 rounded-full bg-gradient-to-r from-[#875A6B] to-[#C9995A]" />
            <h1 className="mb-3 text-4xl font-bold text-slate-900">Add New Property</h1>
            <p className="text-base text-slate-500">
              Choose the type of property or service you want to list.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {propertyTypes.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSelectedType(item.type)}
                  className={`rounded-2xl border-2 bg-white p-8 text-left shadow-lg transition-all hover:scale-105 hover:shadow-xl ${item.border}`}
                >
                  <div
                    className={`mb-6 inline-flex size-16 items-center justify-center rounded-xl ${item.bg}`}
                  >
                    <Icon className={`size-8 ${item.text}`} />
                  </div>

                  <h3 className="mb-2 text-2xl font-bold">{item.title}</h3>

                  <p className="mb-4 text-gray-600">{item.description}</p>

                  <div className={`flex items-center gap-2 font-semibold ${item.text}`}>
                    Select <ArrowRight className="size-5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const Icon = currentTypeInfo?.icon;

  return (
    <div className="min-h-screen bg-[#fdf7f8]">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 text-center">
          <div
            className={`mb-5 inline-flex size-20 items-center justify-center rounded-2xl ${currentTypeInfo?.bg}`}
          >
            {Icon && <Icon className={`size-10 ${currentTypeInfo?.text}`} />}
          </div>

          <h1 className="mb-3 text-3xl font-bold text-slate-900">
            Add {currentTypeInfo?.title}
          </h1>

          <p className="text-sm text-slate-500">
            Fill in the details and upload images from your computer.
          </p>

          <Button
            type="button"
            variant="outline"
            onClick={() => setSelectedType(null)}
            className="mt-4 border-[#EABAB0]/50 text-[#875A6B] hover:bg-[#fdf7f8]"
          >
            ← Change Property Type
          </Button>
        </div>

        {selectedType === "Venues" && <AddVenue />}
        {selectedType === "Restaurants" && <AddRestaurant />}
        {selectedType === "Catering" && <AddCatering />}
        {selectedType === "Decor" && <AddDecor />}
      </div>
    </div>
  );
}