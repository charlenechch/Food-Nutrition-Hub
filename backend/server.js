const express = require("express");
const cors = require("cors");
const loginRoutes = require("./routes/login");
const registerRoutes = require("./routes/register");

const app = express();
const PORT = 5000;

// middleware 
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Simple API route
app.get("/", (req, res) => {
  res.send("Hello from Node.js backend!");
});

// ✅ routes must come after middleware
app.use("/api/login", loginRoutes);
app.use("/api/register", registerRoutes);

// start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
