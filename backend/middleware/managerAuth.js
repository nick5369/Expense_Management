const jwt = require("jsonwebtoken");
const User = require("../models/user");

/**
 * managerAuth middleware
 * - verifies JWT
 * - loads the user and ensures role === 'Manager'
 * - sets req.user = { userId, companyId } and req.manager = user document
 */
module.exports = async function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing token" });
  const token = auth.split(" ")[1];
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }

  if (!payload || !payload.userId || !payload.companyId)
    return res.status(401).json({ error: "Invalid token payload" });
  try {
    const user = await User.findById(payload.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    if (user.companyId.toString() !== payload.companyId.toString())
      return res.status(403).json({ error: "Company mismatch" });
    if (user.role !== "Manager")
      return res.status(403).json({ error: "Requires Manager role" });

    req.user = { userId: user._id, companyId: user.companyId };
    req.manager = user;
    next();
  } catch (err) {
    console.error("managerAuth error", err);
    return res.status(500).json({ error: "Internal auth error" });
  }
};
