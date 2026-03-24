import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../css/FoodMap.css";

const API = import.meta.env.VITE_API_URL || "https://api.sarawakeats.site";

// ── Fix Leaflet default icon issue with Vite ─────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Pin colors by source ──────────────────────────────────────
const PIN_COLORS = {
  mysql:  "#c4532a", // terracotta — curated picks
  google: "#1a73e8", // google blue — live results
};

// ── Create custom pin icon ────────────────────────────────────
function makePin(color, isPick = false) {
  const size   = isPick ? 40 : 34;
  const border = isPick ? "3px solid white" : "2px solid rgba(255,255,255,0.5)";
  const shadow = isPick
    ? "0 4px 14px rgba(196,83,42,0.5)"
    : "0 3px 10px rgba(0,0,0,0.25)";
  const star = isPick
    ? `<div style="position:absolute;top:-8px;right:-6px;background:#f59e0b;color:white;font-size:9px;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-weight:700;border:1.5px solid white;">★</div>`
    : "";

  return L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="
          width:${size}px;height:${size}px;
          border-radius:50% 50% 50% 4px;
          transform:rotate(-45deg);
          background:${color};
          border:${border};
          box-shadow:${shadow};
        "></div>
        ${star}
      </div>`,
    className: "",
    iconSize:   [size, size],
    iconAnchor: [size / 2, size],
  });
}

// ── FlyTo helper component ────────────────────────────────────
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 17, { duration: 0.8 });
  }, [target, map]);
  return null;
}

// ── Main FoodMap page ─────────────────────────────────────────
export default function FoodMap() {
  const [pins,       setPins]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [flyTarget,  setFlyTarget]  = useState(null);
  const [searchInput,setSearchInput]= useState("");
  const [searching,  setSearching]  = useState(false);
  const [mode,       setMode]       = useState("explore"); // "explore" | "search"
  const [userPos,    setUserPos]    = useState(null);
  const searchTimer = useRef(null);

  // ── Load explore map on mount ───────────────────────────────
  const loadMap = useCallback(async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const params = lat ? `?lat=${lat}&lng=${lng}` : "";
      const res    = await fetch(`${API}/api/map${params}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data   = await res.json();
      setPins(data.pins || []);
      setMode("explore");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMap(); }, [loadMap]);

  // ── Search by dish name ─────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { loadMap(); return; }
    setSearching(true);
    setSelected(null);
    try {
      const res  = await fetch(`${API}/api/map/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`Search error ${res.status}`);
      const data = await res.json();
      setPins(data.pins || []);
      setMode("search");
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }, [loadMap]);

  // Debounce search input
  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    if (!val.trim()) { loadMap(); return; }
    searchTimer.current = setTimeout(() => doSearch(val), 500);
  };

  // ── Geolocate user ──────────────────────────────────────────
  const geolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const pos = [coords.latitude, coords.longitude];
      setUserPos(pos);
      setFlyTarget(pos);
      loadMap(coords.latitude, coords.longitude);
    });
  };

  // ── Open detail card ────────────────────────────────────────
  const openDetail = (pin) => {
    setSelected(pin);
    setFlyTarget([pin.lat, pin.lng]);
  };

  const closeDetail = () => setSelected(null);

  const openDirections = () => {
    if (!selected) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`,
      "_blank"
    );
  };

  // ── Curated vs Google pins ───────────────────────────────────
  const curatedPins = pins.filter((p) => p.is_pick);
  const googlePins  = pins.filter((p) => !p.is_pick);

  return (
    <div className="flex flex-col h-screen bg-stone-50 font-sans overflow-hidden">

      {/* ── TOPBAR ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-200 shadow-sm z-10 flex-shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search for a dish… e.g. Kolo Mee, Laksa"
            className="w-full pl-9 pr-4 py-2 text-sm bg-stone-100 border border-stone-200 rounded-full outline-none focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 animate-pulse">
              Searching…
            </span>
          )}
        </div>

        {/* Mode badge */}
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
          mode === "search"
            ? "bg-orange-100 text-orange-700"
            : "bg-stone-100 text-stone-500"
        }`}>
          {mode === "search" ? `Results for "${searchInput}"` : "Explore Mode"}
        </span>

        {/* Stats */}
        {!loading && (
          <span className="text-xs text-stone-400 hidden sm:block">
            {pins.length} places
          </span>
        )}

        {/* Near me */}
        <button
          onClick={geolocate}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full transition-colors flex-shrink-0"
        >
          📍 Near Me
        </button>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <div className="w-80 bg-white border-r border-stone-200 flex flex-col overflow-hidden flex-shrink-0">

          {/* Legend */}
          <div className="flex gap-3 px-4 py-2.5 border-b border-stone-100 bg-stone-50">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <div className="w-3 h-3 rounded-full bg-orange-600"/>
              Sarawak Eats Pick
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <div className="w-3 h-3 rounded-full bg-blue-500"/>
              Google Places
            </div>
          </div>

          {/* List heading */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-100">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              {mode === "search" ? "Search Results" : "Nearby Restaurants"}
            </span>
            <span className="text-xs text-stone-400">{pins.length} places</span>
          </div>

          {/* Cards */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-stone-400">
                <div className="w-7 h-7 border-2 border-stone-200 border-t-orange-500 rounded-full animate-spin"/>
                <p className="text-sm">Loading restaurants…</p>
              </div>
            )}
            {error && (
              <div className="p-4 m-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                ⚠️ {error}
              </div>
            )}
            {!loading && !error && pins.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-stone-400">
                <span className="text-3xl mb-3">🍃</span>
                <p className="text-sm">No restaurants found.</p>
                <p className="text-xs mt-1">Try a different search term.</p>
              </div>
            )}
            {!loading && !error && (
              <>
                {/* Curated picks first */}
                {curatedPins.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                        ⭐ Sarawak Eats Picks
                      </span>
                    </div>
                    {curatedPins.map((pin) => (
                      <PinCard
                        key={pin.id}
                        pin={pin}
                        active={selected?.id === pin.id}
                        onClick={() => openDetail(pin)}
                      />
                    ))}
                  </>
                )}

                {/* Google results */}
                {googlePins.length > 0 && (
                  <>
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                        🌐 Nearby Restaurants
                      </span>
                    </div>
                    {googlePins.map((pin) => (
                      <PinCard
                        key={pin.id}
                        pin={pin}
                        active={selected?.id === pin.id}
                        onClick={() => openDetail(pin)}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── MAP ── */}
        <div className="flex-1 relative">
          <MapContainer
            center={[1.555, 110.348]}
            zoom={14}
            style={{ width: "100%", height: "100%" }}
            zoomControl={false}
          >
            {/* Google Maps tiles inside Leaflet */}
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}"
              attribution="© Google Maps"
              maxZoom={20}
            />

            <FlyTo target={flyTarget} />

            {/* User location marker */}
            {userPos && (
              <Marker
                position={userPos}
                icon={L.divIcon({
                  html: `<div style="width:14px;height:14px;background:#1a73e8;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(26,115,232,0.5);"></div>`,
                  className: "",
                  iconSize:   [14, 14],
                  iconAnchor: [7, 7],
                })}
              />
            )}

            {/* All pins */}
            {pins.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                icon={makePin(PIN_COLORS[pin.source] || "#888", pin.is_pick)}
                eventHandlers={{ click: () => openDetail(pin) }}
              />
            ))}
          </MapContainer>

          {/* Zoom controls */}
          <div className="absolute top-3 right-3 z-[900] flex flex-col gap-1">
            <button
              onClick={() => document.querySelector(".leaflet-control-zoom-in")?.click()}
              className="w-9 h-9 bg-white rounded-lg shadow-md text-stone-700 text-lg font-light hover:bg-stone-50 transition-colors flex items-center justify-center border border-stone-200"
            >+</button>
            <button
              onClick={() => document.querySelector(".leaflet-control-zoom-out")?.click()}
              className="w-9 h-9 bg-white rounded-lg shadow-md text-stone-700 text-lg font-light hover:bg-stone-50 transition-colors flex items-center justify-center border border-stone-200"
            >−</button>
          </div>

          {/* Detail card */}
          {selected && (
            <DetailCard
              pin={selected}
              onClose={closeDetail}
              onDirections={openDirections}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pin card in sidebar ───────────────────────────────────────
function PinCard({ pin, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex gap-3 px-4 py-3 cursor-pointer border-b border-stone-50 transition-all ${
        active
          ? "bg-orange-50 border-l-2 border-l-orange-500"
          : "hover:bg-stone-50"
      }`}
    >
      {/* Color dot */}
      <div className="flex-shrink-0 mt-0.5">
        <div
          className="w-3 h-3 rounded-full mt-1"
          style={{ background: PIN_COLORS[pin.source] || "#888" }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-stone-800 leading-tight truncate">{pin.name}</p>
          {pin.rating && (
            <span className="text-xs font-bold text-amber-500 flex-shrink-0">
              ⭐ {pin.rating}
            </span>
          )}
        </div>

        {pin.is_pick && (
          <span className="inline-block text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mt-1">
            Sarawak Eats Pick
          </span>
        )}

        <p className="text-xs text-stone-400 mt-1 truncate">{pin.address}</p>

        <div className="flex items-center gap-3 mt-1.5">
          {pin.price && <span className="text-xs text-stone-500">{pin.price}</span>}
          {pin.open_now !== null && (
            <span className={`text-xs font-semibold ${pin.open_now ? "text-green-600" : "text-red-500"}`}>
              {pin.open_now ? "Open" : "Closed"}
            </span>
          )}
          {pin.halal && (
            <span className="text-xs font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full">
              Halal
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Detail card overlay on map ────────────────────────────────
function DetailCard({ pin, onClose, onDirections }) {
  return (
    <div className="absolute bottom-5 left-5 w-72 bg-white rounded-2xl shadow-2xl overflow-hidden z-[1000] animate-[fadeUp_0.2s_ease]">

      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 relative"
        style={{ background: pin.is_pick ? "#c4532a" : "#1a73e8" }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 hover:bg-white/35 text-white text-xs flex items-center justify-center transition-colors"
        >✕</button>

        {pin.is_pick && (
          <div className="inline-flex items-center gap-1 text-xs font-bold text-white/80 bg-white/15 px-2 py-0.5 rounded-full mb-2">
            ⭐ Sarawak Eats Pick
          </div>
        )}
        <h3 className="text-white font-bold text-base leading-tight pr-6">{pin.name}</h3>
        {pin.desc && <p className="text-white/75 text-xs mt-1 italic">{pin.desc}</p>}
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {pin.rating && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-400 text-xs w-4">⭐</span>
            <span className="font-bold text-amber-500">{pin.rating}</span>
            {pin.reviews && <span className="text-stone-400 text-xs">({pin.reviews} reviews)</span>}
          </div>
        )}
        {pin.price && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-400 text-xs w-4">💰</span>
            <span className="text-stone-700">{pin.price}</span>
          </div>
        )}
        {pin.hours && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-stone-400 text-xs w-4">🕐</span>
            <span className="text-stone-700">{pin.hours}</span>
          </div>
        )}
        {pin.address && (
          <div className="flex items-start gap-2 text-sm">
            <span className="text-stone-400 text-xs w-4 mt-0.5">📍</span>
            <span className="text-stone-600 text-xs leading-relaxed">{pin.address}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {pin.halal && (
            <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
              ✅ Halal
            </span>
          )}
          {pin.open_now !== null && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              pin.open_now ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
            }`}>
              {pin.open_now ? "Open Now" : "Closed"}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={onDirections}
            className="py-2 text-xs font-bold rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
          >
            🗺️ Directions
          </button>
          <button
            className="py-2 text-xs font-bold rounded-lg text-white transition-colors"
            style={{ background: pin.is_pick ? "#c4532a" : "#1a73e8" }}
          >
            🔖 Save Place
          </button>
        </div>
      </div>
    </div>
  );
}