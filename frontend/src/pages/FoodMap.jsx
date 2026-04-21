import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "../css/FoodMap.css";
import Header from "../components/Header";
import { useTranslation } from "react-i18next";
import { translateTexts } from "../hooks/useAITranslation"; // ← ADDED

const API = import.meta.env.VITE_API_URL || "https://api.sarawakeats.site";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Sarawak food categories from your database
const FOODS = {
  "Linut":           { emoji: "🥣", color: "#0070cc" },
  "Kolo Mee":        { emoji: "🍝", color: "#e68c00" },
  "Umai":            { emoji: "🐟", color: "#0f8a4e" },
  "Nasi Aruk":       { emoji: "🍚", color: "#c47a00" },
  "Asam Siok":       { emoji: "🍲", color: "#c0392b" },
  "Belacan Bihun":   { emoji: "🍜", color: "#d45500" },
  "Daun Ubi Tumbuk": { emoji: "🌿", color: "#2e7d32" },
  "Manicai":         { emoji: "🥬", color: "#388e3c" },
  "Midin":           { emoji: "🌱", color: "#558b2f" },
  "Ayam Pansuh":     { emoji: "🎋", color: "#5d4037" },
};

const DEFAULT_FOOD = { emoji: "🍽️", color: "#757575" };

function getFoodMeta(foodName = "") {
  if (!foodName) return DEFAULT_FOOD;
  // exact match first
  if (FOODS[foodName]) return FOODS[foodName];
  // partial match
  const key = Object.keys(FOODS).find((k) =>
    foodName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(foodName.toLowerCase())
  );
  return key ? FOODS[key] : DEFAULT_FOOD;
}

// TasteAtlas-style pin: emoji + food name label
function makePin(foodName, isPick = false) {
  const meta  = getFoodMeta(foodName);
  const label = foodName || "Restaurant";
  const maxLen = 14;
  const display = label.length > maxLen ? label.slice(0, maxLen) + "…" : label;

  return L.divIcon({
    html: `
      <div class="se-pin ${isPick ? "se-pin--pick" : ""}"
           style="--pin-color:${meta.color}">
        <div class="se-pin-head">
          <span class="se-pin-emoji">${meta.emoji}</span>
        </div>
        <div class="se-pin-label">${display}</div>
        ${isPick ? '<div class="se-pin-star">⭐</div>' : ""}
      </div>`,
    className:  "",
    iconSize:   [90, 52],
    iconAnchor: [45, 52],
  });
}

// FlyTo helper
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, 16, { duration: 0.8 });
  }, [target, map]);
  return null;
}

// Main component
export default function FoodMap() {
  const { t, i18n } = useTranslation(); // ← ADDED i18n
  const [searchParams] = useSearchParams();
  const [pins,         setPins]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [flyTarget,    setFlyTarget]    = useState(null);
  const [searchInput,  setSearchInput]  = useState("");
  const [searching,    setSearching]    = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [userPos,      setUserPos]      = useState(null);
  const [geoError,     setGeoError]     = useState(null);
  const [translatedPins, setTranslatedPins] = useState({}); // ← ADDED
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const mapRef        = useRef(null);
  const searchTimer   = useRef(null);
  const userCoordsRef = useRef(null); // ← stores user lat/lng after Near Me

  // ← ADDED: translate pin descriptions when language or pins change
  useEffect(() => {
    if (!pins.length || i18n.language === "en") {
      setTranslatedPins({});
      return;
    }
    const cacheKey = `map_translations_${i18n.language}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) { setTranslatedPins(JSON.parse(cached)); return; }

    const texts = {};
    pins.forEach(p => {
      if (p.desc) texts[`desc_${p.id}`] = p.desc;
    });
    if (!Object.keys(texts).length) return;

    translateTexts(texts, i18n.language).then(result => {
      setTranslatedPins(result);
      localStorage.setItem(cacheKey, JSON.stringify(result));
    });
  }, [pins, i18n.language]);

  // Load all pins
  const loadAll = useCallback(async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const params = (lat != null && lng != null) ? `?lat=${lat}&lng=${lng}` : "";
      const res    = await fetch(`${API}/api/map${params}`);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data   = await res.json();
      setPins(data.pins || []);
      setActiveFilter("all");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter by food category
  const filterByFood = useCallback(async (foodName) => {
    if (foodName === "all") {
      const c = userCoordsRef.current;
      loadAll(c?.lat, c?.lng);
      return;
    }
    setSearching(true);
    setSelected(null);
    setSearchInput("");
    try {
      const c = userCoordsRef.current;
      const params = c
        ? `?q=${encodeURIComponent(foodName)}&lat=${c.lat}&lng=${c.lng}`
        : `?q=${encodeURIComponent(foodName)}`;
      const res  = await fetch(`${API}/api/map/search${params}`);
      if (!res.ok) throw new Error(`Filter error ${res.status}`);
      const data = await res.json();
      setPins(data.pins || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }, [loadAll]);

  // Search bar
  const doSearch = useCallback(async (q, preserveFilter = false) => {
    if (!q.trim()) { loadAll(); return; }
    setSearching(true);
    setLoading(false);
    setSelected(null);
    if (!preserveFilter) setActiveFilter("all");
    try {
      const c = userCoordsRef.current;
      const params = c
        ? `?q=${encodeURIComponent(q)}&lat=${c.lat}&lng=${c.lng}`
        : `?q=${encodeURIComponent(q)}`;
      const res  = await fetch(`${API}/api/map/search${params}`);
      if (!res.ok) throw new Error(`Search error ${res.status}`);
      const data = await res.json();
      setPins(data.pins || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  }, [loadAll]);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setSearchInput(q);
      setActiveFilter(q);
      doSearch(q, true);
    } else {
      loadAll();
    }
  }, [loadAll, doSearch]);

  const handleSearchChange = (val) => {
    setSearchInput(val);
    clearTimeout(searchTimer.current);
    if (!val.trim()) { loadAll(); return; }
    searchTimer.current = setTimeout(() => doSearch(val), 400);
  };

  const handleChipClick = (food) => {
    setActiveFilter(food);
    filterByFood(food);
  };

  // Geolocate
  const geolocate = () => {
    setGeoError(null);
    if (!navigator.geolocation) { setGeoError(t("map.geoNotSupported")); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        let lat = parseFloat(coords.latitude.toFixed(7));
        let lng = parseFloat(coords.longitude.toFixed(7));

        // If outside Sarawak bounds, fall back to Kuching center
        if (lat < 0.9 || lat > 5.0 || lng < 109.5 || lng > 119.0)  {
          setGeoError(t("map.geoOutsideSarawak"));
          lat = 1.5535;
          lng = 110.3493;
        }

        setUserPos([lat, lng]);
        setFlyTarget([lat, lng]);
        userCoordsRef.current = { lat, lng };
        loadAll(lat, lng);
      },
      (err) => {
        const msgs = {
          [err.PERMISSION_DENIED]:    t("map.geoDenied"),
          [err.POSITION_UNAVAILABLE]: t("map.geoUnavailable"),
        };
        setGeoError(msgs[err.code] || t("map.geoFailed"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const openDetail    = (pin) => { setSelected(pin); setFlyTarget([pin.lat, pin.lng]); };
  const closeDetail   = () => setSelected(null);
  const openDirections = () => {
    if (!selected) return;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`, "_blank");
  };

  const curatedPins = pins.filter((p) => p.is_pick);
  const googlePins  = pins.filter((p) => !p.is_pick);

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
              placeholder={t("map.searchPlaceholder")}
              className="foodmap-search-input"
            />
            {searching && <span className="foodmap-searching">{t("map.searching")}</span>}
          </div>
          {!loading && (
            <span className="foodmap-count">{pins.length} {t("map.restaurants")}</span>
          )}
          <button className="foodmap-nearbtn lrp-no-outline" onClick={geolocate}>
            📍 {t("map.nearMe")}
          </button>
        </div>

        {/* GEO ERROR */}
        {geoError && (
          <div className="foodmap-geo-error">
            ⚠️ {geoError}
            <button className = "lrp-no-outline" onClick={() => setGeoError(null)}>✕</button>
          </div>
        )}

        {/* FOOD FILTER CHIPS */}
        <div className="foodmap-cats">
          <button
            className={`foodmap-cat-chip lrp-no-outline ${activeFilter === "all" ? "active-all" : ""}`}
            onClick={() => handleChipClick("all")}
          >
            🍽️ {t("map.allFoods")}
          </button>
          {Object.entries(FOODS).map(([name, meta]) => (
            <button
              key={name}
              className={`foodmap-cat-chip lrp-no-outline ${activeFilter === name ? "active-cat" : ""}`}
              style={activeFilter === name
                ? { borderColor: meta.color, background: meta.color + "14", color: meta.color }
                : {}
              }
              onClick={() => handleChipClick(name)}
            >
              {meta.emoji} {name}
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="foodmap-body">

          {/* SIDEBAR */}
          <div className="foodmap-sidebar">
            <div className="foodmap-list-head">
              <span className="foodmap-list-title">
                {activeFilter === "all" ? t("map.allRestaurants") : activeFilter}
              </span>
              <span className="foodmap-list-count">{pins.length} {t("map.places")}</span>
            </div>

            <div className="foodmap-cards">
              {loading && (
                <div className="foodmap-state">
                  <div className="foodmap-spinner" />
                  <p>{t("map.loadingRestaurants")}</p>
                </div>
              )}
              {error && <div className="foodmap-error">⚠️ {error}</div>}
              {!loading && !error && pins.length === 0 && (
                <div className="foodmap-state">
                  <div className="foodmap-state-icon">🍃</div>
                  <p>{t("map.noRestaurants")}</p>
                </div>
              )}

              {!loading && !error && (
                <>
                  {curatedPins.length > 0 && (
                    <>
                      <div className="foodmap-section-label curated">
                        ⭐ {t("map.picks")}
                      </div>
                      {/* Group curated picks by restaurant name */}
                      {Object.values(
                        curatedPins.reduce((acc, pin) => {
                          const key = pin.name;
                          if (!acc[key]) {
                            acc[key] = { ...pin, foods: [pin.food] };
                          } else {
                            if (!acc[key].foods.includes(pin.food)) {
                              acc[key].foods.push(pin.food);
                            }
                          }
                          return acc;
                        }, {})
                      ).map((pin) => (
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
                      <div className="foodmap-section-label google">
                        🌐 {userPos ? t("map.nearbyRestaurants") : t("map.moreRestaurants")}
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

          {/* MAP */}
          <div className="foodmap-map-wrap">
            <MapContainer
              center={[1.555, 110.348]}
              zoom={13}
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
                  icon={makePin(pin.food, pin.is_pick)}
                  eventHandlers={{ click: () => openDetail(pin) }}
                />
              ))}
            </MapContainer>

            {/* Zoom */}
            <div className="foodmap-zoom">
              <button className="foodmap-zoom-btn lrp-no-outline" onClick={() => mapRef.current?.zoomIn()}>+</button>
              <button className="foodmap-zoom-btn lrp-no-outline" onClick={() => mapRef.current?.zoomOut()}>−</button>
            </div>

            {/* Detail card */}
            {selected && (
              isMobile
                ? (
                  <div className="foodmap-detail-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeDetail(); }}>
                    <DetailCard
                      pin={selected}
                      onClose={closeDetail}
                      onDirections={openDirections}
                      translatedPins={translatedPins}
                    />
                  </div>
                ) : (
                  <DetailCard
                    pin={selected}
                    onClose={closeDetail}
                    onDirections={openDirections}
                    translatedPins={translatedPins}
                  />
                )
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Pin card in sidebar
function PinCard({ pin, active, onClick }) {
  const { t } = useTranslation();
  const foods = pin.foods || [pin.food];
  const primaryMeta = getFoodMeta(foods[0]);

  return (
    <div className={`foodmap-card ${active ? "active" : ""}`} onClick={onClick}>
      <div className="foodmap-card-emoji-wrap"
        style={{ background: primaryMeta.color + "18", border: `1.5px solid ${primaryMeta.color}33` }}>
        <span>{primaryMeta.emoji}</span>
      </div>
      <div className="foodmap-card-body">
        <div className="foodmap-card-top">
          <span className="foodmap-card-name">{pin.name}</span>
          {pin.rating && <span className="foodmap-card-rating">⭐ {pin.rating}</span>}
        </div>

        {/* Show all foods this restaurant serves */}
        <div className="foodmap-card-foods">
          {foods.filter(Boolean).map((food) => {
            const meta = getFoodMeta(food);
            return (
              <span
                key={food}
                className="foodmap-card-food-tag"
                style={{ color: meta.color, background: meta.color + "14",
                         border: `1px solid ${meta.color}33` }}
              >
                {meta.emoji} {food}
              </span>
            );
          })}
          {pin.is_pick && <span className="foodmap-pick-badge">⭐ {t("map.pick")}</span>}
        </div>

        <div className="foodmap-card-address">{pin.address}</div>
        <div className="foodmap-card-meta">
          {pin.price          && <span className="foodmap-card-price">{pin.price}</span>}
          {pin.open_now === true  && <span className="foodmap-open">{t("map.open")}</span>}
          {pin.open_now === false && <span className="foodmap-closed">{t("map.closed")}</span>}
          {pin.halal          && <span className="foodmap-halal">{t("map.halal")}</span>}
        </div>
      </div>
    </div>
  );
}

// Detail card
function DetailCard({ pin, onClose, onDirections, translatedPins = {} }) { // ← ADDED translatedPins
  const { t } = useTranslation();
  const meta = getFoodMeta(pin.food);
  return (
    <div className="foodmap-detail">
      <div className="foodmap-detail-head" style={{ background: meta.color }}>
        <button className="foodmap-detail-close lrp-no-outline" onClick={onClose}>✕</button>
        {pin.food && (
          <div className="foodmap-detail-cat-badge">
            {meta.emoji} {pin.food}
            {pin.is_pick && ` · ⭐ ${t("map.pick")}`}
          </div>
        )}
        <div className="foodmap-detail-name">{pin.name}</div>
        {/* ← CHANGED: use translated desc if available, fallback to raw */}
        {pin.desc && <div className="foodmap-detail-desc">{translatedPins[`desc_${pin.id}`] || pin.desc}</div>}
      </div>
      <div className="foodmap-detail-body">
        {pin.rating && (
          <div className="foodmap-detail-row">
            <span className="foodmap-detail-icon">⭐</span>
            <span className="foodmap-detail-text">
              <b>{pin.rating}</b>{pin.reviews ? ` · ${pin.reviews} ${t("map.reviews")}` : ""}
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
          {pin.halal              && <span className="foodmap-halal">✅ {t("map.halal")}</span>}
          {pin.open_now === true  && <span className="foodmap-open">{t("map.openNow")}</span>}
          {pin.open_now === false && <span className="foodmap-closed">{t("map.closed")}</span>}
        </div>
        <div className="foodmap-detail-actions">
          <button className="foodmap-detail-btn lrp-no-outline" onClick={onDirections}>🗺️ {t("map.directions")}</button>
          {pin.reviews > 0 && (
            <button
              className="foodmap-detail-btn lrp-no-outline"
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin.name + ' ' + pin.address)}`, "_blank")}
            >
              ⭐ {pin.reviews} {t("map.reviews")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}