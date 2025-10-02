const express = require("express");
const app = express();
const PORT = 5000;

// Simple API route
app.get("/", (req, res) => {
  res.send("Hello from Node.js backend!");
});

const loginRoutes = require('./routes/login');
const registerRoutes = require('./routes/register');

app.use(express.json());
app.use('/api/login', loginRoutes);
app.use('/api/register', registerRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
