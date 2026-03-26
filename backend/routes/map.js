// routes/map.js
// GET /api/map           → all pins (MySQL + Google nearby)
// GET /api/map/search    → filter by food category (MySQL + Google text search)

const express    = require('express');
const router     = express.Router();
const { many }   = require('../config/db');
const axios      = require('axios');

const PLACES_KEY = process.env.GOOGLE_PLACES_KEY;
const KUCHING    = { lat: 1.5535, lng: 110.3493 };

// ── Normalize Google Places result ────────────────────────────
function fromGoogle(place, foodLabel = '') {
  return {
    id:       `g_${place.id || place.place_id}`,
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
    price:   row.price ? `RM ${row.price}` : null,
    hours:   row.opening_hours || null,
    halal:   Boolean(row.is_halal),
    desc:    row.description   || '',
    photo:   null,
    is_pick: true,
  };
}

// ── Google Places helper ──────────────────────────────────────
async function googleNearby(lat, lng, radius = 5000.0) {
  try {
    const res = await axios.post(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        includedTypes:  ['restaurant', 'cafe', 'food_court'],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
            radius: parseFloat(radius),
          },
        },
      },
      {
        headers: {
          'Content-Type':     'application/json',
          'X-Goog-Api-Key':   PLACES_KEY,
          'X-Goog-FieldMask': [
            'places.id', 'places.displayName', 'places.formattedAddress',
            'places.location', 'places.rating', 'places.userRatingCount',
            'places.regularOpeningHours.openNow', 'places.photos',
          ].join(','),
        },
      }
    );
    return res.data.places || [];
  } catch (e) {
    console.error('[Google Nearby]', e.response?.data?.error?.message || e.message);
    return [];
  }
}

async function googleTextSearch(query, lat, lng) {
  try {
    const res = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery:      `${query} restaurant Kuching Sarawak`,
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
            radius: 10000.0,
          },
        },
      },
      {
        headers: {
          'Content-Type':     'application/json',
          'X-Goog-Api-Key':   PLACES_KEY,
          'X-Goog-FieldMask': [
            'places.id', 'places.displayName', 'places.formattedAddress',
            'places.location', 'places.rating', 'places.userRatingCount',
            'places.regularOpeningHours.openNow', 'places.photos',
          ].join(','),
        },
      }
    );
    return res.data.places || [];
  } catch (e) {
    console.error('[Google Text Search]', e.response?.data?.error?.message || e.message);
    return [];
  }
}

// ────────────────────────────────────────────────────────────
//  GET /api/map
//  Default view — all MySQL picks + Google nearby
//  Query params: lat, lng (optional)
// ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || KUCHING.lat;
    const lng = parseFloat(req.query.lng) || KUCHING.lng;

    // 1. All curated picks from MySQL
    const rows = await many(`
      SELECT r.restaurantID, r.foodID, r.name, r.city,
             r.latitude, r.longitude, r.rating, r.price,
             r.address, r.description, r.opening_hours, r.is_halal,
             f.name AS food_name
      FROM restaurants r
      LEFT JOIN food f ON f.foodID = r.foodID
      ORDER BY r.rating DESC
    `);
    const mysqlPins = rows.map(fromMySQL);

    // 2. Google Places nearby (no food label — general nearby)
    const googlePlaces = await googleNearby(lat, lng);
    const googlePins   = googlePlaces.map((p) => fromGoogle(p, ''));

    // 3. Merge — MySQL first so curated picks show on top
    res.json({ pins: [...mysqlPins, ...googlePins], total: mysqlPins.length + googlePins.length });

  } catch (err) {
    console.error('[GET /api/map]', err.message);
    res.status(500).json({ error: 'Failed to load map data', detail: err.message });
  }
});

// ────────────────────────────────────────────────────────────
//  GET /api/map/search?q=Kolo+Mee&lat=1.55&lng=110.34
//  Category filter — MySQL by food name + Google text search
// ────────────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.status(400).json({ error: 'q param is required' });

    const lat = parseFloat(req.query.lat) || KUCHING.lat;
    const lng = parseFloat(req.query.lng) || KUCHING.lng;

    // 1. MySQL — restaurants that serve this food
    const rows = await many(`
      SELECT r.restaurantID, r.foodID, r.name, r.city,
             r.latitude, r.longitude, r.rating, r.price,
             r.address, r.description, r.opening_hours, r.is_halal,
             f.name AS food_name
      FROM restaurants r
      LEFT JOIN food f ON f.foodID = r.foodID
      WHERE f.name LIKE ? OR r.name LIKE ?
      ORDER BY r.rating DESC
    `, [`%${query}%`, `%${query}%`]);
    const mysqlPins = rows.map(fromMySQL);

    // 2. Google Places text search for this food
    const googlePlaces = await googleTextSearch(query, lat, lng);
    // Label google results with the searched food name
    const googlePins   = googlePlaces.map((p) => fromGoogle(p, query));

    res.json({ pins: [...mysqlPins, ...googlePins], total: mysqlPins.length + googlePins.length, query });

  } catch (err) {
    console.error('[GET /api/map/search]', err.message);
    res.status(500).json({ error: 'Search failed', detail: err.message });
  }
});

module.exports = router;