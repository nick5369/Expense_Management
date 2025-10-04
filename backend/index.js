const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Company = require("./models/company");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;

async function main() {
  const uri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/odoo_expenses";
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("MongoDB connected");

  app.get("/", (req, res) =>
    res.json({ ok: true, service: "odoo-expenses-backend" })
  );

  const authRoutes = require("./routes/auth");
  app.use("/api/auth", authRoutes);

  app.listen(PORT, () => console.log("Server listening on", PORT));
}

main().catch((err) => {
  console.error("Failed to start", err);
  process.exit(1);
});
