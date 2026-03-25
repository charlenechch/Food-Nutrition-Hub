// routes/map.js
// GET /api/map    → Explore mode (Google Places nearby + MySQL curated picks)
// GET /api/search → Search mode  (Google Places Text Search by dish name)

const express    = require('express');
const router     = express.Router();
const { many }   = require('../config/db');
const axios      = require('axios');

const PLACES_KEY = process.env.GOOGLE_PLACES_KEY;
const KUCHING    = { lat: 1.5535, lng: 110.3493 };

// ── Normalize Google Places result ────────────────────────────
function fromGoogle(place) {
  return {
    id:       `g_${place.id || place.place_id}`,
    source:   'google',
    name:     place.displayName?.text || place.name,
    dish:     '',                              // used by detectCategory on frontend
    address:  place.formattedAddress  || place.vicinity || '',
    city:     'Kuching',
    lat:      place.location?.latitude  ?? place.geometry?.location?.lat,
    lng:      place.location?.longitude ?? place.geometry?.location?.lng,
    rating:   place.rating           || null,
    reviews:  place.userRatingCount  || 0,
    price:    null,
    hours:    null,
    halal:    false,
    photo:    place.photos?.[0]?.name || null,
    open_now: place.regularOpeningHours?.openNow ?? null,
    is_pick:  false,
  };
}

// ── Normalize MySQL curated pick ──────────────────────────────
function fromMySQL(row) {
  return {
    id:      `m_${row.restaurantID}`,
    source:  'mysql',
    name:    row.name,
    dish:    row.food_name || '',              // food name from food table join
    address: row.address,
    city:    row.city,
    lat:     parseFloat(row.latitude),
    lng:     parseFloat(row.longitude),
    rating:  parseFloat(row.rating),
    reviews: null,
    price:   row.price ? `RM ${row.price}` : null,
    hours:   row.opening_hours,
    halal:   Boolean(row.is_halal),
    desc:    row.description,
    photo:   null,
    is_pick: true,
  };
}

// ────────────────────────────────────────────────────────────
//  GET /api/map
//  Default explore view — MySQL picks + Google Places nearby
//  Query params: lat, lng (optional), radius (optional, metres)
// ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // ✅ Use parseFloat for all numbers — Google requires float not int
    const lat    = parseFloat(req.query.lat)    || KUCHING.lat;
    const lng    = parseFloat(req.query.lng)    || KUCHING.lng;
    const radius = parseFloat(req.query.radius) || 5000.0;

    // 1. Google Places Nearby Search
    const googleRes = await axios.post(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        includedTypes:  ['restaurant', 'cafe', 'food_court'],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: {
              latitude:  parseFloat(lat),   // ✅ explicit float
              longitude: parseFloat(lng),
            },
            radius: parseFloat(radius),     // ✅ explicit float
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

    const googlePins = (googleRes.data.places || []).map(fromGoogle);

    // 2. MySQL curated picks
    const rows = await many(`
      SELECT
        r.restaurantID,
        r.name,
        r.city,
        r.latitude,
        r.longitude,
        r.rating,
        r.price,
        r.address,
        r.description,
        r.opening_hours,
        r.is_halal,
        f.name AS food_name
      FROM restaurants r
      LEFT JOIN food f ON f.foodID = r.foodID
    `);

    const mysqlPins = rows.map(fromMySQL);

    // 3. Merge — curated picks first so they render on top
    res.json({
      pins:  [...mysqlPins, ...googlePins],
      total: mysqlPins.length + googlePins.length,
    });

  } catch (err) {
    console.error('[GET /api/map]', err.response?.data || err.message);
    res.status(500).json({
      error:  'Failed to load map data',
      detail: err.response?.data?.error?.message || err.message,
    });
  }
});

// ────────────────────────────────────────────────────────────
//  GET /api/search?q=kolo+mee
//  Search by dish name via Google Places Text Search
//  Query params: q (required), lat, lng (optional)
// ────────────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.status(400).json({ error: 'q param is required' });

    const lat = parseFloat(req.query.lat) || KUCHING.lat;
    const lng = parseFloat(req.query.lng) || KUCHING.lng;

    const googleRes = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery:      `${query} restaurant Kuching Sarawak`,
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: {
              latitude:  parseFloat(lat),   // ✅ explicit float
              longitude: parseFloat(lng),
            },
            radius: 10000.0,                // ✅ float
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
            'places.priceLevel',
          ].join(','),
        },
      }
    );

    const pins = (googleRes.data.places || []).map(fromGoogle);
    res.json({ pins, total: pins.length, query });

  } catch (err) {
    console.error('[GET /api/search]', err.response?.data || err.message);
    res.status(500).json({
      error:  'Search failed',
      detail: err.response?.data?.error?.message || err.message,
    });
  }
});

module.exports = router;