import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../css/FoodMap.css";
import Header from "../components/Header";

const API = import.meta.env.VITE_API_URL || "https://api.sarawakeats.site";

// ── Fix Leaflet default icon issue with Vite ──────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// ── Food categories — TasteAtlas style ───────────────────────
const CATEGORIES = {
  laksa:   { label: "Laksa",    emoji: "🍜", color: "#c4532a" },
  kolomee: { label: "Kolo Mee", emoji: "🍝", color: "#d4921e" },
  umai:    { label: "Umai",     emoji: "🐟", color: "#3a6b3e" },
  linut:   { label: "Linut",    emoji: "🥣", color: "#4a7fa5" },
  seafood: { label: "Seafood",  emoji: "🦐", color: "#7a4a90" },
  others:  { label: "Others",   emoji: "🍽️", color: "#888888" },
};

// ── Detect food category from name/dish ───────────────────────
function detectCategory(name = "", dish = "") {
  const text = `${name} ${dish}`.toLowerCase();
  if (text.includes("laksa"))                           return "laksa";
  if (text.includes("kolo") || text.includes("kampua")) return "kolomee";
  if (text.includes("umai"))                            return "umai";
  if (text.includes("linut"))                           return "linut";
  if (
    text.includes("seafood") || text.includes("prawn") ||
    text.includes("fish")    || text.includes("crab")  ||
    text.includes("ikan")    || text.includes("udang")
  )                                                     return "seafood";
  return "others";
}

// ── Custom pin icon ───────────────────────────────────────────
function makePin(category, isPick = false) {
  const cat    = CATEGORIES[category] || CATEGORIES.others;
  const size   = isPick ? 42 : 34;
  const shadow = isPick
    ? `0 4px 14px ${cat.color}66`
    : "0 3px 10px rgba(0,0,0,0.22)";
  const star = isPick
    ? `<div style="position:absolute;top:-8px;right:-6px;background:#f59e0b;color:white;font-size:9px;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-weight:700;border:1.5px solid white;">★</div>`
    : "";

  return L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size + 8}px;">
        <div style="
          width:${size}px;height:${size}px;
          border-radius:50% 50% 50% 4px;
          transform:rotate(-45deg);
          background:${cat.color};
          border:2px solid rgba(255,255,255,0.5);
          box-shadow:${shadow};
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="transform:rotate(45deg);font-size:${isPick ? 17 : 14}px;line-height:1;">
            ${cat.emoji}
          </span>
        </div>
        ${star}
      </div>`,
    className:  "",
    iconSize:   [size, size + 8],
    iconAnchor: [size / 2, size + 8],
  });
}

// ── FlyTo helper ─────────────────────────────────────────────
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16, { duration: 0.8 });
  }, [target, map]);
  return null;
}

// ── Main component ────────────────────────────────────────────
export default function FoodMap() {
  const [pins,        setPins]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [selected,    setSelected]    = useState(null);
  const [flyTarget,   setFlyTarget]   = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searching,   setSearching]   = useState(false);
  const [mode,        setMode]        = useState("explore");
  const [activeFilter,setActiveFilter]= useState("all");  // food category filter
  const [userPos,     setUserPos]     = useState(null);
  const [geoError,    setGeoError]    = useState(null);
  const mapRef      = useRef(null);
  const searchTimer = useRef(null);

  // ── Normalise pin with category ────────────────────────────
  const normalisePin = useCallback((pin) => ({
    ...pin,
    category: detectCategory(pin.name, pin.dish || ""),
  }), []);

  // ── Load explore map ───────────────────────────────────────
  const loadMap = useCallback(async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const params = (lat && lng) ? `?lat=${lat}&lng=${lng}` : "";
      const res    = await fetch(`${API}/api/map${params}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data   = await res.json();
      setPins((data.pins || []).map(normalisePin));
      setMode("explore");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [normalisePin]);

  useEffect(() => { loadMap(); }, [loadMap]);

  // ── Search ─────────────────────────────────────────────────
  const doSearch = useCallback(async (q) => {
    if (!q.trim()) { loadMap(); return; }
    setSearching(true);
    setSelected(null);
    try {
      const res  = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(`Search error ${res.status}`);
      const data = await res.json();
      setPins((data.pins || []).map(normalisePin));
      setMode("search");
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }, [loadMap, normalisePin]);

  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    if (!val.trim()) { loadMap(); return; }
    searchTimer.current = setTimeout(() => doSearch(val), 500);
  };

  // ── Geolocate — fixed with proper error handling ────────────
  const geolocate = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        const pos = [lat, lng];
        setUserPos(pos);
        setFlyTarget(pos);
        loadMap(lat, lng);
      },
      (err) => {
        console.error("Geolocation error:", err);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError("Location access denied. Please allow location in your browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError("Location unavailable. Showing Kuching centre instead.");
            break;
          default:
            setGeoError("Could not get your location. Try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ── Detail ─────────────────────────────────────────────────
  const openDetail    = (pin) => { setSelected(pin); setFlyTarget([pin.lat, pin.lng]); };
  const closeDetail   = () => setSelected(null);
  const openDirections = () => {
    if (!selected) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`,
      "_blank"
    );
  };

  // ── Filter pins by category ────────────────────────────────
  const visiblePins = activeFilter === "all"
    ? pins
    : pins.filter((p) => p.category === activeFilter);

  const curatedPins = visiblePins.filter((p) => p.is_pick);
  const googlePins  = visiblePins.filter((p) => !p.is_pick);

  // ── Count per category for badges ─────────────────────────
  const catCount = (cat) => pins.filter((p) => p.category === cat).length;

  return (
    <>
      <Header />

      <div className="foodmap-page">

        {/* TOPBAR */}
        <div className="foodmap-topbar">
          <div className="foodmap-search-wrap">
            <span className="foodmap-search-icon">🔍</span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for a dish… e.g. Kolo Mee, Laksa, Umai"
              className="foodmap-search-input"
            />
            {searching && <span className="foodmap-searching">Searching…</span>}
          </div>

          <span className={`foodmap-mode-badge ${mode === "search" ? "search-mode" : ""}`}>
            {mode === "search" ? `"${searchInput}"` : "Explore Mode"}
          </span>

          {!loading && <span className="foodmap-count">{visiblePins.length} places</span>}

          <button className="foodmap-nearbtn" onClick={geolocate}>
            📍 Near Me
          </button>
        </div>

        {/* GEO ERROR BANNER */}
        {geoError && (
          <div className="foodmap-geo-error">
            ⚠️ {geoError}
            <button onClick={() => setGeoError(null)}>✕</button>
          </div>
        )}

        {/* CATEGORY FILTER CHIPS — TasteAtlas style */}
        <div className="foodmap-cats">
          <button
            className={`foodmap-cat-chip ${activeFilter === "all" ? "active all" : ""}`}
            onClick={() => setActiveFilter("all")}
          >
            🍽️ All <span className="foodmap-cat-count">{pins.length}</span>
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              className={`foodmap-cat-chip ${activeFilter === key ? "active" : ""}`}
              style={activeFilter === key ? { borderColor: cat.color, background: cat.color + "18", color: cat.color } : {}}
              onClick={() => setActiveFilter(key)}
            >
              {cat.emoji} {cat.label}
              <span className="foodmap-cat-count">{catCount(key)}</span>
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="foodmap-body">

          {/* SIDEBAR */}
          <div className="foodmap-sidebar">
            <div className="foodmap-list-head">
              <span className="foodmap-list-title">
                {mode === "search" ? "Search Results" : "Nearby Restaurants"}
              </span>
              <span className="foodmap-list-count">{visiblePins.length} places</span>
            </div>

            <div className="foodmap-cards">
              {loading && (
                <div className="foodmap-state">
                  <div className="foodmap-spinner" />
                  <p>Loading restaurants…</p>
                </div>
              )}
              {error && <div className="foodmap-error">⚠️ {error}</div>}
              {!loading && !error && visiblePins.length === 0 && (
                <div className="foodmap-state">
                  <div className="foodmap-state-icon">🍃</div>
                  <p>No restaurants found.<br />Try a different filter or search.</p>
                </div>
              )}

              {!loading && !error && (
                <>
                  {curatedPins.length > 0 && (
                    <>
                      <div className="foodmap-section-label curated">⭐ Sarawak Eats Picks</div>
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
                  {googlePins.length > 0 && (
                    <>
                      <div className="foodmap-section-label google">🌐 Nearby Restaurants</div>
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

          {/* MAP */}
          <div className="foodmap-map-wrap">
            <MapContainer
              center={[1.555, 110.348]}
              zoom={14}
              style={{ width: "100%", height: "100%" }}
              zoomControl={false}
              ref={mapRef}
            >
              <TileLayer
                url="https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}"
                attribution="© Google Maps"
                maxZoom={20}
              />
              <FlyTo target={flyTarget} />

              {/* User location dot */}
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

              {/* All visible pins */}
              {visiblePins.map((pin) => (
                <Marker
                  key={pin.id}
                  position={[pin.lat, pin.lng]}
                  icon={makePin(pin.category, pin.is_pick)}
                  eventHandlers={{ click: () => openDetail(pin) }}
                />
              ))}
            </MapContainer>

            {/* Custom zoom */}
            <div className="foodmap-zoom">
              <button className="foodmap-zoom-btn" onClick={() => mapRef.current?.zoomIn()}>+</button>
              <button className="foodmap-zoom-btn" onClick={() => mapRef.current?.zoomOut()}>−</button>
            </div>

            {/* Map legend */}
            <div className="foodmap-map-legend">
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <div key={key} className="foodmap-map-legend-item">
                  <div className="foodmap-map-legend-dot" style={{ background: cat.color }} />
                  {cat.emoji} {cat.label}
                </div>
              ))}
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
    </>
  );
}

// ── Pin card in sidebar ───────────────────────────────────────
function PinCard({ pin, active, onClick }) {
  const cat = CATEGORIES[pin.category] || CATEGORIES.others;
  return (
    <div className={`foodmap-card ${active ? "active" : ""}`} onClick={onClick}>
      <div
        className="foodmap-card-dot"
        style={{ background: cat.color }}
      />
      <div className="foodmap-card-body">
        <div className="foodmap-card-top">
          <span className="foodmap-card-name">{cat.emoji} {pin.name}</span>
          {pin.rating && <span className="foodmap-card-rating">⭐ {pin.rating}</span>}
        </div>

        <div className="foodmap-card-cat" style={{ color: cat.color }}>
          {cat.label}
          {pin.is_pick && <span className="foodmap-pick-badge">⭐ Sarawak Eats Pick</span>}
        </div>

        <div className="foodmap-card-address">{pin.address}</div>
        <div className="foodmap-card-meta">
          {pin.price          && <span className="foodmap-card-price">{pin.price}</span>}
          {pin.open_now === true  && <span className="foodmap-open">Open</span>}
          {pin.open_now === false && <span className="foodmap-closed">Closed</span>}
          {pin.halal          && <span className="foodmap-halal">Halal</span>}
        </div>
      </div>
    </div>
  );
}

// ── Detail card overlay ───────────────────────────────────────
function DetailCard({ pin, onClose, onDirections }) {
  const cat = CATEGORIES[pin.category] || CATEGORIES.others;
  return (
    <div className="foodmap-detail">
      <div className="foodmap-detail-head" style={{ background: cat.color }}>
        <button className="foodmap-detail-close" onClick={onClose}>✕</button>
        <div className="foodmap-detail-cat-badge">
          {cat.emoji} {cat.label}
          {pin.is_pick && " · ⭐ Sarawak Eats Pick"}
        </div>
        <div className="foodmap-detail-name">{pin.name}</div>
        {pin.desc && <div className="foodmap-detail-desc">{pin.desc}</div>}
      </div>
      <div className="foodmap-detail-body">
        {pin.rating && (
          <div className="foodmap-detail-row">
            <span className="foodmap-detail-icon">⭐</span>
            <span className="foodmap-detail-text">
              <b>{pin.rating}</b>{pin.reviews && ` · ${pin.reviews} reviews`}
            </span>
          </div>
        )}
        {pin.price && (
          <div className="foodmap-detail-row">
            <span className="foodmap-detail-icon">💰</span>
            <span className="foodmap-detail-text">{pin.price}</span>
          </div>
        )}
        {pin.hours && (
          <div className="foodmap-detail-row">
            <span className="foodmap-detail-icon">🕐</span>
            <span className="foodmap-detail-text">{pin.hours}</span>
          </div>
        )}
        {pin.address && (
          <div className="foodmap-detail-row">
            <span className="foodmap-detail-icon">📍</span>
            <span className="foodmap-detail-text">{pin.address}</span>
          </div>
        )}
        <div className="foodmap-detail-tags">
          {pin.halal              && <span className="foodmap-halal">✅ Halal</span>}
          {pin.open_now === true  && <span className="foodmap-open">Open Now</span>}
          {pin.open_now === false && <span className="foodmap-closed">Closed</span>}
        </div>
        <div className="foodmap-detail-actions">
          <button className="foodmap-detail-btn" onClick={onDirections}>🗺️ Directions</button>
          <button className="foodmap-detail-btn primary" style={{ background: cat.color, borderColor: cat.color }}>
            🔖 Save
          </button>
        </div>
      </div>
    </div>
  );
}