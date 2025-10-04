const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Company = require("../models/company");
const User = require("../models/user");

const localeToCurrency = require("../utils/localeToCurrency");

router.post("/signup", async (req, res) => {
  const { email, password, companyName, country, locale } = req.body;
  if (!email || !password || !companyName)
    return res.status(400).json({ error: "missing fields" });

  try {
    // simple: set currency from locale or country
    const defaultCurrency = localeToCurrency(locale || country) || "USD";
    const company = new Company({
      name: companyName,
      defaultCurrency,
      country,
    });
    await company.save();

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name: null,
      email,
      hashedPassword: hashed,
      role: "Admin",
      companyId: company._id,
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, companyId: company._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "8h" }
    );
    res.json({
      token,
      user: { id: user._id, email },
      company: { id: company._id, name: company.name, defaultCurrency },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to signup" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "missing fields" });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "invalid" });
    const ok = await bcrypt.compare(password, user.hashedPassword);
    if (!ok) return res.status(401).json({ error: "invalid" });
    const token = jwt.sign(
      { userId: user._id, companyId: user.companyId },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "8h" }
    );
    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "login error" });
  }
});

module.exports = router;
