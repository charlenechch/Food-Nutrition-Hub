// src/pages/FoodMap/FoodMap.jsx
// npm install leaflet react-leaflet
// Add route in App.jsx: <Route path="/map" element={<FoodMap />} />

import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./FoodMap.css";

const API = import.meta.env.VITE_API_URL || "https://api.sarawakeats.site";

// ── Fix Leaflet default icon issue with Vite ──────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const PIN_COLORS = {
  mysql:  "#c4532a",
  google: "#1a73e8",
};

// ── Custom pin icon ───────────────────────────────────────────
function makePin(color, isPick = false) {
  const size   = isPick ? 40 : 34;
  const shadow = isPick ? "0 4px 14px rgba(196,83,42,0.45)" : "0 3px 10px rgba(0,0,0,0.22)";
  const star   = isPick
    ? `<div style="position:absolute;top:-8px;right:-6px;background:#f59e0b;color:white;font-size:9px;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-weight:700;border:1.5px solid white;">★</div>`
    : "";
  return L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="width:${size}px;height:${size}px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:${color};border:2px solid rgba(255,255,255,0.5);box-shadow:${shadow};"></div>
        ${star}
      </div>`,
    className:  "",
    iconSize:   [size, size],
    iconAnchor: [size / 2, size],
  });
}

// ── FlyTo helper ─────────────────────────────────────────────
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 17, { duration: 0.8 });
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
  const [userPos,     setUserPos]     = useState(null);
  const mapRef      = useRef(null);
  const searchTimer = useRef(null);

  // ── Load explore map ────────────────────────────────────────
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

  // ── Search ──────────────────────────────────────────────────
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

  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    if (!val.trim()) { loadMap(); return; }
    searchTimer.current = setTimeout(() => doSearch(val), 500);
  };

  // ── Geolocate ───────────────────────────────────────────────
  const geolocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const pos = [coords.latitude, coords.longitude];
      setUserPos(pos);
      setFlyTarget(pos);
      loadMap(coords.latitude, coords.longitude);
    });
  };

  // ── Detail ──────────────────────────────────────────────────
  const openDetail = (pin) => {
    setSelected(pin);
    setFlyTarget([pin.lat, pin.lng]);
  };
  const closeDetail    = () => setSelected(null);
  const openDirections = () => {
    if (!selected) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`, "_blank");
  };

  const curatedPins = pins.filter((p) => p.is_pick);
  const googlePins  = pins.filter((p) => !p.is_pick);

  return (
    <div className="foodmap-page">

      {/* TOPBAR */}
      <div className="foodmap-topbar">
        <div className="foodmap-search-wrap">
          <span className="foodmap-search-icon">🔍</span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search for a dish… e.g. Kolo Mee, Laksa"
            className="foodmap-search-input"
          />
          {searching && <span className="foodmap-searching">Searching…</span>}
        </div>

        <span className={`foodmap-mode-badge ${mode === "search" ? "search-mode" : ""}`}>
          {mode === "search" ? `"${searchInput}"` : "Explore Mode"}
        </span>

        {!loading && <span className="foodmap-count">{pins.length} places</span>}

        <button className="foodmap-nearbtn" onClick={geolocate}>
          📍 Near Me
        </button>
      </div>

      {/* BODY */}
      <div className="foodmap-body">

        {/* SIDEBAR */}
        <div className="foodmap-sidebar">
          <div className="foodmap-legend">
            <div className="foodmap-legend-item">
              <div className="foodmap-legend-dot" style={{ background: "#c4532a" }}/>
              Sarawak Eats Pick
            </div>
            <div className="foodmap-legend-item">
              <div className="foodmap-legend-dot" style={{ background: "#1a73e8" }}/>
              Google Places
            </div>
          </div>

          <div className="foodmap-list-head">
            <span className="foodmap-list-title">
              {mode === "search" ? "Search Results" : "Nearby Restaurants"}
            </span>
            <span className="foodmap-list-count">{pins.length} places</span>
          </div>

          <div className="foodmap-cards">
            {loading && (
              <div className="foodmap-state">
                <div className="foodmap-spinner" />
                <p>Loading restaurants…</p>
              </div>
            )}
            {error && <div className="foodmap-error">⚠️ {error}</div>}
            {!loading && !error && pins.length === 0 && (
              <div className="foodmap-state">
                <div className="foodmap-state-icon">🍃</div>
                <p>No restaurants found.<br />Try a different search term.</p>
              </div>
            )}
            {!loading && !error && (
              <>
                {curatedPins.length > 0 && (
                  <>
                    <div className="foodmap-section-label curated">⭐ Sarawak Eats Picks</div>
                    {curatedPins.map((pin) => (
                      <PinCard key={pin.id} pin={pin} active={selected?.id === pin.id} onClick={() => openDetail(pin)} />
                    ))}
                  </>
                )}
                {googlePins.length > 0 && (
                  <>
                    <div className="foodmap-section-label google">🌐 Nearby Restaurants</div>
                    {googlePins.map((pin) => (
                      <PinCard key={pin.id} pin={pin} active={selected?.id === pin.id} onClick={() => openDetail(pin)} />
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

            {userPos && (
              <Marker
                position={userPos}
                icon={L.divIcon({
                  html: `<div style="width:14px;height:14px;background:#1a73e8;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(26,115,232,0.5);"></div>`,
                  className: "", iconSize: [14, 14], iconAnchor: [7, 7],
                })}
              />
            )}

            {pins.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.lat, pin.lng]}
                icon={makePin(PIN_COLORS[pin.source] || "#888", pin.is_pick)}
                eventHandlers={{ click: () => openDetail(pin) }}
              />
            ))}
          </MapContainer>

          <div className="foodmap-zoom">
            <button className="foodmap-zoom-btn" onClick={() => mapRef.current?.zoomIn()}>+</button>
            <button className="foodmap-zoom-btn" onClick={() => mapRef.current?.zoomOut()}>−</button>
          </div>

          {selected && (
            <DetailCard pin={selected} onClose={closeDetail} onDirections={openDirections} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Pin card ──────────────────────────────────────────────────
function PinCard({ pin, active, onClick }) {
  return (
    <div className={`foodmap-card ${active ? "active" : ""}`} onClick={onClick}>
      <div className="foodmap-card-dot" style={{ background: PIN_COLORS[pin.source] || "#888" }} />
      <div className="foodmap-card-body">
        <div className="foodmap-card-top">
          <span className="foodmap-card-name">{pin.name}</span>
          {pin.rating && <span className="foodmap-card-rating">⭐ {pin.rating}</span>}
        </div>
        {pin.is_pick && <div className="foodmap-pick-badge">Sarawak Eats Pick</div>}
        <div className="foodmap-card-address">{pin.address}</div>
        <div className="foodmap-card-meta">
          {pin.price     && <span className="foodmap-card-price">{pin.price}</span>}
          {pin.open_now === true  && <span className="foodmap-open">Open</span>}
          {pin.open_now === false && <span className="foodmap-closed">Closed</span>}
          {pin.halal     && <span className="foodmap-halal">Halal</span>}
        </div>
      </div>
    </div>
  );
}

// ── Detail card ───────────────────────────────────────────────
function DetailCard({ pin, onClose, onDirections }) {
  return (
    <div className="foodmap-detail">
      <div className="foodmap-detail-head" style={{ background: pin.is_pick ? "#c4532a" : "#1a73e8" }}>
        <button className="foodmap-detail-close" onClick={onClose}>✕</button>
        {pin.is_pick && <div className="foodmap-detail-pick-badge">⭐ Sarawak Eats Pick</div>}
        <div className="foodmap-detail-name">{pin.name}</div>
        {pin.desc && <div className="foodmap-detail-desc">{pin.desc}</div>}
      </div>
      <div className="foodmap-detail-body">
        {pin.rating && (
          <div className="foodmap-detail-row">
            <span className="foodmap-detail-icon">⭐</span>
            <span className="foodmap-detail-text"><b>{pin.rating}</b>{pin.reviews && ` · ${pin.reviews} reviews`}</span>
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
          {pin.halal          && <span className="foodmap-halal">✅ Halal</span>}
          {pin.open_now === true  && <span className="foodmap-open">Open Now</span>}
          {pin.open_now === false && <span className="foodmap-closed">Closed</span>}
        </div>
        <div className="foodmap-detail-actions">
          <button className="foodmap-detail-btn" onClick={onDirections}>🗺️ Directions</button>
          <button className="foodmap-detail-btn primary">🔖 Save</button>
        </div>
      </div>
    </div>
  );
}