const express = require("express");
const app = express();
const PORT = 5000;

// Simple API route
app.get("/", (req, res) => {
  res.send("Hello from Node.js backend!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
