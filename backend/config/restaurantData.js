const db = require("./db");

const restaurantData = [
    {
        "restaurantID": 1,
        "foodID": 1,
        "name": "Jak Maan Restaurant",
        "city": "Kuching",
        "latitude": 1.5502,
        "longitude": 110.3378,
        "rating": 4.5,
        "address": "Kuching, Sarawak",
        "description": "Traditional Iban restaurant serving authentic Linut and other Dayak dishes.",
        "opening_hours": "11:00 AM - 10:00 PM",
        "is_halal": 0,
        "price_min": 25.00,
        "price_max": 25.00,
    },

    {
        "restaurantID": 2,
        "foodID": 2,
        "name": "Oriental Park",
        "city": "Kuching",
        "latitude": 1.5560,
        "longitude": 110.3520,
        "rating": 4.6,
        "address": "Kuching, Sarawak",
        "description": "Popular spot for Kolo Mee, one of Kuching most beloved noodle dishes.",
        "opening_hours": "7:00 AM - 2:00 PM",
        "is_halal": 0,
        "price_min": 8.00,
        "price_max": 8.00,
    },

    {
        "restaurantID": 3,
        "foodID": 3,
        "name": "Lepau Restaurant",
        "city": "Kuching",
        "latitude": 1.5502,
        "longitude": 110.3378,
        "rating": 4.6,
        "price": 35.00,
        "address": "Jalan Tuanku Abdul Halim, Kuching, Sarawak",
        "description": "One of the few restaurants dedicated to Dayak cuisine. Famous for Umai, Pansoh and tuak.",
        "opening_hours": "11:00 AM - 10:00 PM",
        "is_halal": 0,
        "price_min": 35.00,
        "price_max": 35.00,
    },

    {
        "restaurantID": 4,
        "foodID": 3,
        "name": "Jak Maan Restaurant",
        "city": "Kuching",
        "latitude": 1.5502,
        "longitude": 110.3378,
        "rating": 4.5,      
        "address": "Kuching, Sarawak",
        "description": "Traditional Iban restaurant also known for their fresh Umai preparation.",
        "opening_hours": "11:00 AM - 10:00 PM",
        "is_halal": 0,
        "price_min": 25.00,
        "price_max": 25.00,
    },

    {
        "restaurantID": 5,
        "foodID": 3,
        "name": "The Lamin",
        "city": "Kuching",
        "latitude": 1.5490,
        "longitude": 110.3460,
        "rating": 4.5,
        "address": "Kuching, Sarawak",
        "description": "Cosy heritage restaurant serving traditional Sarawakian dishes including Umai.",
        "opening_hours": "11:00 AM - 9:00 PM",
        "is_halal": 0,
        "price_min": 30.00,
        "price_max": 30.00,
    }

];

(async () => {
  try {
    for (const r of restaurantData) {
    const sql = `
      INSERT INTO restaurants (restaurantID, foodID, name, city, latitude, longitude, rating, address, description, opening_hours, is_halal, price_min, price_max)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      r.restaurantID,
      r.foodID,
      r.name,
      r.city,
      r.latitude,
      r.longitude,
      r.rating,
      r.address,
      r.description,
      r.opening_hours,
      r.is_halal,
      r.price_min,
      r.price_max
    ];
    await db.pool.query(sql, values);
    }

    console.log("✅ All data inserted successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error inserting data:", err.message);
    process.exit(1);
  }
})(); 
