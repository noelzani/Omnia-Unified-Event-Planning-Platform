import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  MapPin,
  Utensils,
  ChefHat,
  Palette,
  ArrowRight,
  Star,
  Heart,
  Calendar,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import type { CatalogItem } from '../../types/item';
import { getVenues } from '../../services/venues/venue.service';
import { getRestaurants } from '../../services/restaurants/restaurant.service';
import { getCateringItems } from '../../services/catering/catering.service';
import { getDecorItems } from '../../services/decor/decor.service';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const navigate = useNavigate();
  const { user, appUser } = useAuth();
  const [venues, setVenues] = useState<CatalogItem[]>([]);
  const [restaurants, setRestaurants] = useState<CatalogItem[]>([]);
  const [catering, setCatering] = useState<CatalogItem[]>([]);
  const [decor, setDecor] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const loadHomeData = async () => {
      try {
        setIsLoading(true);

        const [venuesData, restaurantsData, cateringData, decorData] = await Promise.all([
          getVenues(),
          getRestaurants(),
          getCateringItems(),
          getDecorItems(),
        ]);

        if (!isActive) return;

        setVenues(venuesData);
        setRestaurants(restaurantsData);
        setCatering(cateringData);
        setDecor(decorData);
      } catch (error) {
        console.error('Failed to load homepage data:', error);

        if (!isActive) return;

        setVenues([]);
        setRestaurants([]);
        setCatering([]);
        setDecor([]);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadHomeData();

    return () => {
      isActive = false;
    };
  }, []);

  const categories = [
    {
      name: 'Venues',
      description: 'Discover stunning locations from elegant villas to beautiful gardens and beachfront settings',
      icon: MapPin,
      path: '/venues',
      count: venues.length,
      image: 'https://images.unsplash.com/photo-1769956590960-24298d62537b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    },
    {
      name: 'Restaurants',
      description: 'Browse elegant dining venues with exceptional cuisine and ambiance for your celebration',
      icon: Utensils,
      path: '/restaurants',
      count: restaurants.length,
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    },
    {
      name: 'Catering',
      description: 'Find premium catering services offering exquisite menus and professional service',
      icon: ChefHat,
      path: '/catering',
      count: catering.length,
      image: 'https://images.unsplash.com/photo-1555244162-803834f70033?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    },
    {
      name: 'Decor',
      description: 'Transform your venue with beautiful decoration options from florals to elegant lighting',
      icon: Palette,
      path: '/decor',
      count: decor.length,
      image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800',
    },
  ];

  const featuredItems = useMemo(
    () =>
      [venues[0], restaurants[0], catering[0], decor[0]].filter(
        (item): item is CatalogItem => Boolean(item),
      ),
    [venues, restaurants, catering, decor],
  );

  const navigateForGuestAccess = (path: string) => {
    if (appUser?.role_id === 4) { navigate(path); return; }
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-[#fdf7f8] to-[#f9f0f3] relative overflow-hidden">
        <style>{`
          @keyframes omnia-fade-up {
            from { opacity: 0; transform: translateY(18px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes omnia-sub-fade {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes omnia-line {
            from { transform: scaleX(0); opacity: 0; }
            to { transform: scaleX(1); opacity: 1; }
          }
          @keyframes omnia-shimmer {
            0% { left: -60%; }
            100% { left: 140%; }
          }
          @keyframes omnia-dot {
            0%, 80%, 100% { transform: scale(0.5); opacity: 0.25; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes omnia-ring-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* soft ambient blobs */}
        <div className="absolute top-1/4 left-1/3 size-[28rem] rounded-full bg-[#EABAB0]/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 size-[20rem] rounded-full bg-[#875A6B]/10 blur-[80px] pointer-events-none" />

        <div className="relative text-center select-none">
          <p
            className="text-[10px] font-semibold tracking-[0.55em] uppercase text-[#875A6B]/50 mb-5"
            style={{ animation: 'omnia-fade-up 0.7s ease 0.1s both' }}
          >
            Event Planning
          </p>

          <h1
            className="text-7xl font-bold tracking-[0.18em] bg-gradient-to-br from-[#875A6B] to-[#EABAB0] bg-clip-text text-transparent"
            style={{ animation: 'omnia-fade-up 0.9s ease both' }}
          >
            OMNIA
          </h1>

          {/* animated separator */}
          <div
            className="relative mt-7 mx-auto h-px bg-gradient-to-r from-transparent via-[#EABAB0] to-transparent"
            style={{
              width: 160,
              transformOrigin: 'center',
              animation: 'omnia-line 0.7s ease 0.6s both',
              overflow: 'hidden',
            }}
          >
            <div
              className="absolute inset-y-0 w-2/5 bg-gradient-to-r from-transparent via-white/60 to-transparent"
              style={{ animation: 'omnia-shimmer 1.6s ease-in-out 1.4s infinite' }}
            />
          </div>

          <p
            className="mt-6 text-sm text-[#875A6B]/60"
            style={{ animation: 'omnia-sub-fade 0.8s ease 0.9s both' }}
          >
            Every Detail. One Platform.
          </p>

          {/* spinner ring */}
          <div className="mt-10 mx-auto size-8 relative" style={{ animation: 'omnia-fade-up 0.6s ease 1.1s both' }}>
            <div
              className="absolute inset-0 rounded-full border-2 border-[#EABAB0]/30"
            />
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#875A6B]"
              style={{ animation: 'omnia-ring-spin 0.9s linear infinite' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative h-screen min-h-[680px] overflow-hidden">
        <style>{`
          @keyframes hero-fade-up {
            from { opacity: 0; transform: translateY(22px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes hero-pulse-dot {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50%       { opacity: 1;   transform: scale(1.55); }
          }
          @keyframes hero-line-grow {
            from { transform: scaleX(0); opacity: 0; }
            to   { transform: scaleX(1); opacity: 1; }
          }
        `}</style>

        {/* Background image — no blur, directional overlays */}
        <div className="absolute inset-0">
          <img
            src="/images/hero.png"
            alt="Outdoor oceanfront evening event with string lights at sunset"
            className="w-full h-full object-cover object-center"
          />
          {/* Left-to-right gradient so text side is darker */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/18 to-black/5" />
          {/* Top & bottom vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-transparent to-black/5" />
        </div>

        {/* ── Main content ── */}
        <div className="relative h-full flex items-start">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 w-full pt-28 sm:pt-32 lg:pt-36">
            <div style={{ maxWidth: '42rem' }}>

              {/* Eyebrow */}
              <div
                className="flex items-center gap-3 mb-7"
                style={{ animation: 'hero-fade-up 0.55s ease 0.05s both' }}
              >
                <span
                  className="size-2 rounded-full bg-[#F2C46A] flex-shrink-0"
                  style={{ animation: 'hero-pulse-dot 2.8s ease-in-out infinite' }}
                />
                <span className="text-[#F2C46A] text-[0.7rem] font-semibold tracking-[0.28em] uppercase">
                  OMNIA — Event Planning 
                </span>
              </div>

              {/* Headline — light + bold two-line treatment */}
              <h1
                className="text-white leading-[1.04] mb-6"
                style={{ animation: 'hero-fade-up 0.65s ease 0.2s both' }}
              >
                <span
                  className="block font-light tracking-tight"
                  style={{ fontSize: 'clamp(2.8rem, 5.4vw, 5.25rem)' }}
                >
                  Plan Your
                </span>
                <span
                  className="block font-bold tracking-tight"
                  style={{ fontSize: 'clamp(2.8rem, 5.4vw, 5.25rem)' }}
                >
                  Perfect Event.
                </span>
              </h1>

              {/* Decorative line */}
              <div
                className="h-px bg-gradient-to-r from-[#F2C46A]/60 to-transparent mb-7"
                style={{
                  width: '5rem',
                  transformOrigin: 'left center',
                  animation: 'hero-line-grow 0.6s ease 0.55s both',
                }}
              />

              {/* Subtitle */}
              <p
                className="text-amber-50/70 leading-relaxed mb-10"
                style={{
                  fontSize: 'clamp(1rem, 1.3vw, 1.1rem)',
                  maxWidth: '34rem',
                  animation: 'hero-fade-up 0.65s ease 0.38s both',
                }}
              >
                From intimate gatherings to grand celebrations — discover curated venues,
                restaurants, catering, and decor, all in one place.
              </p>

              {/* CTA buttons */}
              <div
                className="flex flex-wrap items-center gap-4 mb-14"
                style={{ animation: 'hero-fade-up 0.65s ease 0.5s both' }}
              >
                <button
                  onClick={() => navigateForGuestAccess('/dashboard')}
                  className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#C4622A] to-[#F0A050] hover:from-[#A84E20] hover:to-[#D08840] text-white px-8 py-[14px] rounded-full text-sm font-semibold transition-colors duration-300"
                  style={{ boxShadow: '0 8px 28px rgba(196,98,42,0.45)' }}
                >
                  Start Planning
                  <ArrowRight className="size-4" />
                </button>
                <button
                  onClick={() => document.getElementById('explore-categories')?.scrollIntoView({ behavior: 'smooth' })}
                  className="inline-flex items-center gap-2.5 border border-amber-200/35 hover:border-amber-200/60 text-amber-50/80 hover:text-white px-8 py-[14px] rounded-full text-sm font-medium backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors duration-300"
                >
                  Explore Categories
                </button>
              </div>

              {/* Stats row */}
              <div
                className="flex flex-wrap items-center gap-5"
                style={{ animation: 'hero-fade-up 0.65s ease 0.62s both' }}
              >
                <div>
                  <div className="text-[1.6rem] font-bold text-white leading-none">
                    {venues.length + restaurants.length + catering.length + decor.length}+
                  </div>
                  <div className="text-[#F2C46A]/55 text-[0.62rem] mt-1 tracking-widest uppercase">
                    Total Listings
                  </div>
                </div>
                <div className="h-7 w-px bg-white/20" />
                <div>
                  <div className="text-[1.6rem] font-bold text-white leading-none">
                    {venues.length}+
                  </div>
                  <div className="text-[#F2C46A]/55 text-[0.62rem] mt-1 tracking-widest uppercase">
                    Venues
                  </div>
                </div>
                <div className="h-7 w-px bg-white/20" />
                <div>
                  <div className="text-[1.6rem] font-bold text-white leading-none">
                    {restaurants.length}+
                  </div>
                  <div className="text-[#F2C46A]/55 text-[0.62rem] mt-1 tracking-widest uppercase">
                    Restaurants
                  </div>
                </div>
                <div className="h-7 w-px bg-white/20" />
                <div>
                  <div className="text-[1.6rem] font-bold text-white leading-none">
                    {catering.length}+
                  </div>
                  <div className="text-[#F2C46A]/55 text-[0.62rem] mt-1 tracking-widest uppercase">
                    Catering
                  </div>
                </div>
                <div className="h-7 w-px bg-white/20" />
                <div>
                  <div className="text-[1.6rem] font-bold text-white leading-none">
                    {decor.length}+
                  </div>
                  <div className="text-[#F2C46A]/55 text-[0.62rem] mt-1 tracking-widest uppercase">
                    Decor
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Vertical scroll hint (right edge) ── */}
        <div className="absolute right-9 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-2">
          <span
            className="text-white/28 text-[0.55rem] tracking-[0.32em] uppercase"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Scroll to explore
          </span>
          <div className="w-px h-14 bg-gradient-to-b from-white/28 to-transparent mt-2" />
        </div>

      </section>

      {/* Categories */}
      <section id="explore-categories" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#111827]">Explore Our Categories</h2>
            <p className="text-lg text-[#875A6B]">Everything you need to plan your perfect event</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.name}
                  className="group relative bg-[#fdf7f8] border border-[#EABAB0]/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => navigateForGuestAccess(category.path)}
                >
                  <div className="absolute inset-0">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#fdf7f8] via-[#fdf7f8]/80 to-transparent" />

                  <div className="relative p-8">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-white/55 backdrop-blur-sm p-4 rounded-xl">
                        <Icon className="size-8 text-[#875A6B]" />
                      </div>
                      <span className="px-4 py-2 bg-white/55 backdrop-blur-sm text-[#875A6B] rounded-full text-sm font-semibold">
                        {category.count}+ Options
                      </span>
                    </div>

                    <h3 className="text-3xl font-bold mb-3 text-[#111827]">{category.name}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{category.description}</p>

                    <div className="flex items-center text-[#875A6B] font-medium">
                      Explore {category.name}
                      <ArrowRight className="ml-2 size-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-20 bg-[#fdf7f8]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#111827]">Featured Selections</h2>
            <p className="text-lg text-[#875A6B]">Handpicked options for your special day</p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
            {featuredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EABAB0]/30 hover:shadow-md transition-shadow duration-300 cursor-pointer flex flex-col"
                onClick={() => navigateForGuestAccess(`/${item.categoryKey}/${item.id}`)}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {item.rating !== undefined && item.rating !== null && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-sm">{item.rating}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <span className="text-xs font-semibold text-[#875A6B] uppercase tracking-wide">
                    {item.category}
                  </span>
                  <h3 className="text-xl font-bold mt-2 mb-2 text-[#111827]">{item.name}</h3>
                  <p className="text-gray-500 mb-4 line-clamp-2 text-sm flex-1">{item.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#111827]">{item.price}</span>
                    <Button
                      size="sm"
                      className="bg-[#875A6B] hover:bg-[#6f4958] text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateForGuestAccess(`/${item.categoryKey}/${item.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#875A6B] text-[#875A6B] hover:bg-[#875A6B] hover:text-white px-8 py-6 text-lg"
              onClick={() => navigateForGuestAccess('/venues')}
            >
              View All Options
              <ArrowRight className="ml-2 size-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#111827]">Why Choose Our Platform</h2>
            <p className="text-lg text-[#875A6B]">We make event planning effortless</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Calendar, title: 'Easy Planning', text: 'Browse, compare, and book everything for your event in one convenient location' },
              { icon: Star, title: 'Curated Selection', text: 'Only the finest venues, restaurants, caterers, and decorators handpicked for quality' },
              { icon: Heart, title: 'Save Your Favorites', text: 'Create your wishlist and compare options side by side to make the perfect choice' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="text-center">
                <div className="inline-flex items-center justify-center size-20 bg-[#EABAB0]/30 rounded-2xl mb-6">
                  <Icon className="size-10 text-[#875A6B]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#111827]">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-[#875A6B] to-[#EABAB0]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Plan Your Dream Event?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Start exploring our curated collection of venues, restaurants, catering, and decor.
          </p>
          <Button
            size="lg"
            className="bg-white text-[#875A6B] hover:bg-[#fdf7f8] px-10 py-7 text-lg font-semibold shadow-xl"
            onClick={() => navigateForGuestAccess('/venues')}
          >
            Get Started Now
            <ArrowRight className="ml-2 size-6" />
          </Button>
        </div>
      </section>
    </div>
  );
}
