// routes/map.js
// GET /api/map        → MySQL picks + 2-3 Google results per Sarawak food
// GET /api/map/search → MySQL + Google filtered by specific food

const express    = require('express');
const router     = express.Router();
const { many }   = require('../config/db');
const axios      = require('axios');

const PLACES_KEY = process.env.GOOGLE_PLACES_KEY;
const KUCHING    = { lat: 1.5535, lng: 110.3493 };

// ── All Sarawak foods to search on default load ───────────────
const SARAWAK_FOODS = [
  'Linut',
  'Kolo Mee',
  'Umai',
  'Nasi Aruk',
  'Asam Siok',
  'Belacan Bihun',
  'Daun Ubi Tumbuk',
  'Manicai',
  'Midin',
  'Ayam Pansuh',
];

// ── Haversine distance in km ──────────────────────────────────
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Normalize Google Places result ────────────────────────────
function fromGoogle(place, foodLabel = '') {
  return {
    id:       `g_${place.id || place.place_id}_${foodLabel.replace(/\s+/g, '')}`,
    source:   'google',
    name:     place.displayName?.text || place.name,
    food:     foodLabel,
    address:  place.formattedAddress || place.vicinity || '',
    city:     'Kuching',
    lat:      place.location?.latitude  ?? place.geometry?.location?.lat,
    lng:      place.location?.longitude ?? place.geometry?.location?.lng,
    rating:   place.rating          || null,
    reviews:  place.userRatingCount || 0,
    price:    null,
    hours:    null,
    halal:    false,
    photo:    place.photos?.[0]?.name || null,
    open_now: place.regularOpeningHours?.openNow ?? null,
    is_pick:  false,
  };
}

// ── Normalize MySQL row ───────────────────────────────────────
function fromMySQL(row) {
  return {
    id:      `m_${row.restaurantID}`,
    source:  'mysql',
    name:    row.name,
    food:    row.food_name || '',
    address: row.address   || '',
    city:    row.city      || 'Kuching',
    lat:     parseFloat(row.latitude),
    lng:     parseFloat(row.longitude),
    rating:  parseFloat(row.rating) || null,
    reviews: null,
    price:   (row.price_min && row.price_max)
               ? `RM ${row.price_min} - ${row.price_max}`
               : row.price_min
               ? `From RM ${row.price_min}`
               : null,
    hours:   row.opening_hours || null,
    halal:   Boolean(row.is_halal),
    desc:    row.description   || '',
    photo:   null,
    is_pick: true,
  };
}

// ── Search Google for one specific food ──────────────────────
async function searchGoogleForFood(foodName, lat, lng, limit = 3, radius = 15000) {
  try {
    const res = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery:      `${foodName} Sarawak`,
        maxResultCount: limit,
        locationBias: {
          circle: {
            center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
            radius: radius,
          },
        },
      },
      {
        headers: {
          'Content-Type':     'application/json',
          'X-Goog-Api-Key':   PLACES_KEY,
          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.location',
            'places.rating',
            'places.userRatingCount',
            'places.regularOpeningHours.openNow',
            'places.photos',
          ].join(','),
        },
      }
    );
    return (res.data.places || []).map((p) => fromGoogle(p, foodName));
  } catch (e) {
    console.error(`[Google] "${foodName}":`, e.response?.data?.error?.message || e.message);
    return [];
  }
}

// ── Deduplicate pins by place id ──────────────────────────────
function dedupe(pins) {
  const seen = new Set();
  return pins.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

// ────────────────────────────────────────────────────────────
//  GET /api/map
//  Default view:
//  - All MySQL curated picks (with food labels)
//  - 2-3 Google results per Sarawak food (all in parallel)
// ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const isUserLocation = !isNaN(userLat) && !isNaN(userLng);
    const lat = isUserLocation ? userLat : KUCHING.lat;
    const lng = isUserLocation ? userLng : KUCHING.lng;
    const searchRadius = isUserLocation ? 10000 : 15000;

    // 1. MySQL curated picks — filter by distance if user location is known
    const rows = await many(`
      SELECT
        r.restaurantID, r.foodID, r.name, r.city,
        r.latitude, r.longitude, r.rating,
        r.price_min, r.price_max,       
        r.address, r.description, r.opening_hours, r.is_halal,
        f.name AS food_name
      FROM restaurants r
      LEFT JOIN food f ON f.foodID = r.foodID
      ORDER BY r.rating DESC
    `);
    const mysqlPins = rows.map(fromMySQL).filter(pin => {
      if (!isUserLocation) return true; // show all if no user location
      return distanceKm(lat, lng, pin.lat, pin.lng) <= 10; // within 10km of user
    });

    // 2. Google — search all 10 Sarawak foods in parallel with dynamic radius
    const googleResults = await Promise.all(
      SARAWAK_FOODS.map((food) => searchGoogleForFood(food, lat, lng, 3, searchRadius))
    );

    // Flatten + deduplicate
    const googlePins = dedupe(googleResults.flat());

    // 3. Merge — MySQL picks first, then Google results
    const allPins = [...mysqlPins, ...googlePins];

    res.json({ pins: allPins, total: allPins.length });

  } catch (err) {
    console.error('[GET /api/map]', err.message);
    res.status(500).json({ error: 'Failed to load map data', detail: err.message });
  }
});

// ────────────────────────────────────────────────────────────
//  GET /api/map/search?q=Umai
//  Filter by specific food:
//  - MySQL restaurants serving this food
//  - Google text search for this food (up to 20 results)
// ────────────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.status(400).json({ error: 'q param is required' });

    const userLat = parseFloat(req.query.lat);
    const userLng = parseFloat(req.query.lng);
    const isUserLocation = !isNaN(userLat) && !isNaN(userLng);
    const lat = isUserLocation ? userLat : KUCHING.lat;
    const lng = isUserLocation ? userLng : KUCHING.lng;
    const searchRadius = isUserLocation ? 10000 : 15000;

    // 1. MySQL — restaurants serving this food, filtered by distance if user location known
    const rows = await many(`
      SELECT
        r.restaurantID, r.foodID, r.name, r.city,
        r.latitude, r.longitude, r.rating, 
        r.price_min, r.price_max,
        r.address, r.description, r.opening_hours, r.is_halal,
        f.name AS food_name
      FROM restaurants r
      LEFT JOIN food f ON f.foodID = r.foodID
      WHERE f.name LIKE ? OR r.name LIKE ?
      ORDER BY r.rating DESC
    `, [`%${query}%`, `%${query}%`]);
    const mysqlPins = rows.map(fromMySQL).filter(pin => {
      if (!isUserLocation) return true;
      return distanceKm(lat, lng, pin.lat, pin.lng) <= 10;
    });

    // 2. Google — full search for this specific food with dynamic radius
    const googlePins = await searchGoogleForFood(query, lat, lng, 20, searchRadius);

    const allPins = [...mysqlPins, ...dedupe(googlePins)];
    res.json({ pins: allPins, total: allPins.length, query });

  } catch (err) {
    console.error('[GET /api/map/search]', err.message);
    res.status(500).json({ error: 'Search failed', detail: err.message });
  }
});

module.exports = router;