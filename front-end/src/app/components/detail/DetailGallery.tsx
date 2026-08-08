import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { CatalogItem } from '../../../types/item';

type DetailGalleryProps = {
  item: CatalogItem;
};

export default function DetailGallery({ item }: DetailGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showCounter, setShowCounter] = useState(true);
  const counterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetCounterTimer = () => {
    setShowCounter(true);
    if (counterTimer.current) clearTimeout(counterTimer.current);
    counterTimer.current = setTimeout(() => setShowCounter(false), 2000);
  };

  const images = useMemo(() => {
    if (item.images && item.images.length > 0) return item.images;
    if (item.image) return [item.image];
    return [];
  }, [item.image, item.images]);

  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  useEffect(() => {
    if (!lightboxOpen) {
      if (counterTimer.current) clearTimeout(counterTimer.current);
      return;
    }
    resetCounterTimer();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextImage();
      else if (e.key === 'ArrowLeft') prevImage();
      else if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxOpen, images.length]);

  useEffect(() => {
    if (lightboxOpen) resetCounterTimer();
  }, [currentImageIndex]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1fr]">
        <div
          className="h-[420px] cursor-pointer overflow-hidden rounded-2xl"
          onClick={() => openLightbox(0)}
        >
          <img
            src={images[0]}
            alt={`${item.name} main`}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        </div>

        <div className="grid h-[420px] grid-cols-2 gap-3">
          {images.slice(1, 5).map((img, index) => {
            const actualIndex = index + 1;
            const isLastVisible = index === 3 && images.length > 5;

            return (
              <div
                key={actualIndex}
                className="relative cursor-pointer overflow-hidden rounded-2xl"
                onClick={() => openLightbox(actualIndex)}
              >
                <img
                  src={img}
                  alt={`${item.name} ${actualIndex + 1}`}
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                />

                {isLastVisible && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                    <span className="text-2xl font-semibold text-white">
                      +{images.length - 5} photos
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {images.length === 2 && (
            <div className="hidden rounded-2xl bg-gray-50 lg:block" />
          )}
          {images.length === 3 && (
            <div className="hidden rounded-2xl bg-gray-50 lg:block" />
          )}
          {images.length === 4 && (
            <div className="hidden rounded-2xl bg-gray-50 lg:block" />
          )}
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={closeLightbox}
          onMouseMove={resetCounterTimer}
        >
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 transition-all hover:bg-white/20"
          >
            <X className="size-8 text-white" />
          </button>

          <div className="relative flex max-w-7xl flex-col items-center gap-3 px-20">
            <div className={`rounded-full bg-white/10 px-4 py-1.5 text-sm text-white transition-opacity duration-500 ${showCounter ? 'opacity-100' : 'opacity-0'}`}>
              {currentImageIndex + 1} / {images.length}
            </div>

            <img
              src={images[currentImageIndex]}
              alt={`${item.name} - Image ${currentImageIndex + 1}`}
              className="max-h-[85vh] max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 transition-all hover:bg-white/20"
                >
                  <ChevronLeft className="size-8 text-white" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-4 transition-all hover:bg-white/20"
                >
                  <ChevronRight className="size-8 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}