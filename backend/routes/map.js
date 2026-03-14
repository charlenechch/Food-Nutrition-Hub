// routes/map.js
// Two routes:
//   GET /api/map    → Explore mode  (Google Places nearby + MySQL curated picks)
//   GET /api/search → Search mode   (Google Places Text Search by dish name)

const express = require('express');
const router  = express.Router();
const { many } = require('../config/db');  // your existing MySQL pool
const axios    = require('axios');

const PLACES_KEY = process.env.GOOGLE_PLACES_KEY;
const KUCHING    = { lat: 1.5535, lng: 110.3493 }; // default centre

// ── HELPER: normalize a Google Places result into our pin format ──
function fromGoogle(place) {
  return {
    id:        `g_${place.id || place.place_id}`,
    source:    'google',
    name:      place.displayName?.text || place.name,
    address:   place.formattedAddress  || place.vicinity || '',
    lat:       place.location?.latitude  ?? place.geometry?.location?.lat,
    lng:       place.location?.longitude ?? place.geometry?.location?.lng,
    rating:    place.rating            || null,
    reviews:   place.userRatingCount   || 0,
    photo:     place.photos?.[0]?.name || null,
    open_now:  place.regularOpeningHours?.openNow ?? null,
    price:     null,
    tags:      [],
    is_pick:   false,   // not a curated pick
  };
}

// ── HELPER: normalize a MySQL curated pick into our pin format ──
function fromMySQL(row) {
  return {
    id:        `m_${row.id}`,
    source:    'mysql',
    name:      row.name,
    address:   row.address,
    lat:       parseFloat(row.latitude),
    lng:       parseFloat(row.longitude),
    rating:    parseFloat(row.rating),
    reviews:   row.review_count,
    photo:     null,
    open_now:  null,
    price:     `RM ${row.price_min}–${row.price_max}`,
    tags:      row.tags ? row.tags.split('||') : [],
    is_pick:   true,    // show "Sarawak Eats Pick" badge
    emoji:     row.emoji,
    color:     row.pin_color,
    hours:     row.opening_hours,
    desc:      row.description,
    halal:     Boolean(row.is_halal),
    category:  row.category_slug,
  };
}

// ────────────────────────────────────────────────────────────────
//  GET /api/map
//  Explore mode — loads ALL pins for the default map view
//  Query params:
//    lat, lng   (optional) user location, defaults to Kuching centre
//    radius     (optional) metres, default 5000
// ────────────────────────────────────────────────────────────────
router.get('/map', async (req, res) => {
  try {
    const lat    = parseFloat(req.query.lat)    || KUCHING.lat;
    const lng    = parseFloat(req.query.lng)    || KUCHING.lng;
    const radius = parseInt(req.query.radius)   || 5000;

    // ── 1. Google Places Nearby Search (New API) ──────────────
    const googleRes = await axios.post(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        includedTypes: ['restaurant', 'cafe', 'food_court'],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius,
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

    // ── 2. MySQL curated picks ────────────────────────────────
    const rows = await many(`
      SELECT
        r.id, r.name, r.emoji, r.address,
        r.latitude, r.longitude, r.rating, r.review_count,
        r.price_min, r.price_max, r.opening_hours,
        r.description, r.is_halal,
        dc.slug  AS category_slug,
        dc.pin_color,
        GROUP_CONCAT(t.label ORDER BY t.label SEPARATOR '||') AS tags
      FROM restaurants r
      JOIN dish_categories dc ON dc.id = r.category_id
      LEFT JOIN restaurant_tags rt ON rt.restaurant_id = r.id
      LEFT JOIN tags t ON t.id = rt.tag_id
      WHERE r.is_active = TRUE
      GROUP BY r.id
    `);

    const mysqlPins = rows.map(fromMySQL);

    // ── 3. Merge — curated picks first so they render on top ──
    res.json({
      pins:  [...mysqlPins, ...googlePins],
      total: mysqlPins.length + googlePins.length,
    });

  } catch (err) {
    console.error('[GET /api/map]', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to load map data', detail: err.response?.data?.error?.message || err.message });
  }
});

// ────────────────────────────────────────────────────────────────
//  GET /api/search?q=kolo+mee
//  Search mode — finds restaurants by dish name via Google Places
//  Query params:
//    q          dish/food name to search (required)
//    lat, lng   (optional) bias results toward user location
// ────────────────────────────────────────────────────────────────
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.status(400).json({ error: 'q param is required' });

    const lat = parseFloat(req.query.lat) || KUCHING.lat;
    const lng = parseFloat(req.query.lng) || KUCHING.lng;

    // Google Places Text Search (New API)
    const googleRes = await axios.post(
      'https://places.googleapis.com/v1/places:searchText',
      {
        textQuery:        `${query} restaurant Kuching Sarawak`,
        maxResultCount:   20,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 10000,
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
    res.status(500).json({ error: 'Search failed', detail: err.response?.data?.error?.message || err.message });
  }
});

module.exports = router;