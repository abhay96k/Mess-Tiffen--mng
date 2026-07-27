import { useState } from 'react';
import { MapPin, Navigation, Star, Phone, Search, ExternalLink, Compass } from 'lucide-react';
import { motion } from 'motion/react';

export interface MessLocation {
  id: string;
  name: string;
  distance: string;
  rating: number;
  reviewsCount: number;
  type: string;
  specialty: string;
  address: string;
  phone: string;
  timings: string;
  pricePerMonth: number;
  lat: number;
  lng: number;
  isPartner: boolean;
}

const NEARBY_MESSES: MessLocation[] = [
  {
    id: 'm1',
    name: 'Royal Annapurna Pure Veg Mess',
    distance: '0.4 km',
    rating: 4.9,
    reviewsCount: 142,
    type: 'Pure Veg',
    specialty: 'Unlimited Thali, Paneer Butter Masala & Gulab Jamun',
    address: 'Plot 42, Campus Road, Near Student Library',
    phone: '+91 98765 43210',
    timings: '7:30 AM - 10:30 PM',
    pricePerMonth: 2800,
    lat: 18.5204,
    lng: 73.8567,
    isPartner: true,
  },
  {
    id: 'm2',
    name: 'Green Leaf Tiffin & Catering',
    distance: '0.8 km',
    rating: 4.8,
    reviewsCount: 98,
    type: 'Veg & Jain',
    specialty: 'Desi Ghee Chapati, Dal Tadka & Jeera Rice',
    address: 'Lane 3, Hostel Circle, Opp. Engineering Block',
    phone: '+91 98234 56789',
    timings: '8:00 AM - 10:00 PM',
    pricePerMonth: 2600,
    lat: 18.5250,
    lng: 73.8500,
    isPartner: true,
  },
  {
    id: 'm3',
    name: 'Maharashtrian Swad Mess',
    distance: '1.2 km',
    rating: 4.7,
    reviewsCount: 115,
    type: 'Regional Special',
    specialty: 'Puran Poli, Misal Pav & Solkadhi',
    address: 'Near Main Bus Stop, FC Road Corner',
    phone: '+91 97112 23344',
    timings: '7:00 AM - 11:00 PM',
    pricePerMonth: 2500,
    lat: 18.5150,
    lng: 73.8600,
    isPartner: false,
  },
  {
    id: 'm4',
    name: 'Campus Express Tiffin Hub',
    distance: '1.5 km',
    rating: 4.9,
    reviewsCount: 210,
    type: 'Veg & Non-Veg',
    specialty: 'Butter Chicken Sunday Special & Biryani',
    address: 'Block B, Tech Park Square',
    phone: '+91 99887 76655',
    timings: '8:30 AM - 10:30 PM',
    pricePerMonth: 3200,
    lat: 18.5300,
    lng: 73.8450,
    isPartner: true,
  },
];

export function NearbyMessMap() {
  const [selectedMess, setSelectedMess] = useState<MessLocation>(NEARBY_MESSES[0]);
  const [filterType, setFilterType] = useState<'all' | 'veg' | 'partner'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMesses = NEARBY_MESSES.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'veg') return m.type.toLowerCase().includes('veg');
    if (filterType === 'partner') return m.isPartner;
    return true;
  });

  const getMapUrl = (lat: number, lng: number) => {
    // OpenStreetMap interactive view embed
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015}%2C${lat - 0.015}%2C${lng + 0.015}%2C${lat + 0.015}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  return (
    <div className="space-y-4 text-slate-900">
      
      {/* Top Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-tight">Nearby Mess Explorer</h3>
              <p className="text-xs text-slate-500 font-medium">Find & compare top tiffin centers near you</p>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            {filteredMesses.length} Messes
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mess by name, paneer, thali..."
            className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 pl-10 pr-4 py-2.5 text-xs font-semibold rounded-2xl transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 text-xs font-bold pt-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Messes
          </button>
          <button
            onClick={() => setFilterType('veg')}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              filterType === 'veg'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🥗 Pure Veg
          </button>
          <button
            onClick={() => setFilterType('partner')}
            className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
              filterType === 'partner'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            ⭐ Verified Mess
          </button>
        </div>
      </div>

      {/* Interactive Map View Card */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm relative">
        
        {/* Map Header Overlay */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between z-10 relative text-xs">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold">{selectedMess.name}</span>
          </div>
          <span className="bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full font-black text-[10px]">
            {selectedMess.distance}
          </span>
        </div>

        {/* OpenStreetMap iframe */}
        <div className="w-full h-56 relative bg-slate-100">
          <iframe
            title="Nearby Mess Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={getMapUrl(selectedMess.lat, selectedMess.lng)}
            className="w-full h-full filter saturate-110"
          ></iframe>

          {/* Interactive Floating Badge on Map */}
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 shadow-lg flex items-center justify-between text-xs">
            <div>
              <p className="font-black text-slate-900 text-xs">{selectedMess.name}</p>
              <p className="text-[10px] text-slate-500 font-semibold">{selectedMess.address}</p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedMess.lat},${selectedMess.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-xs shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Directions</span>
            </a>
          </div>
        </div>
      </div>

      {/* Nearby Mess Cards Carousel / Grid */}
      <div className="space-y-3">
        <h4 className="font-black text-slate-900 text-sm tracking-tight px-1 flex items-center justify-between">
          <span>Select Mess to View Details</span>
          <span className="text-xs text-slate-400 font-semibold">Tap to focus map</span>
        </h4>

        {filteredMesses.map((mess) => {
          const isSelected = selectedMess.id === mess.id;
          return (
            <motion.div
              key={mess.id}
              onClick={() => setSelectedMess(mess)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50/70 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-black text-slate-900 text-sm leading-snug">{mess.name}</h5>
                    {mess.isPartner && (
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Partner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{mess.address}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 rounded-lg text-xs font-black">
                    <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                    <span>{mess.rating}</span>
                    <span className="text-[9px] text-amber-600">({mess.reviewsCount})</span>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 block mt-1">
                    {mess.distance} away
                  </span>
                </div>
              </div>

              {/* Specialty & Price */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Specialty Dish</span>
                  <span className="font-extrabold text-slate-800">{mess.specialty}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Monthly Pass</span>
                  <span className="font-black text-emerald-800 text-sm">₹{mess.pricePerMonth}</span>
                </div>
              </div>

              {/* Action Contact Bar */}
              <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`tel:${mess.phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-600" />
                  <span>Call Mess</span>
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mess.lat},${mess.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Maps</span>
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
