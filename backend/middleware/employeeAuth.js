const jwt = require("jsonwebtoken");
const User = require("../models/user");

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
    if (user.role !== "Employee")
      return res.status(403).json({ error: "Requires Employee role" });

    req.user = { userId: user._id, companyId: user.companyId };
    req.employee = user;
    next();
  } catch (err) {
    console.error("employeeAuth error", err);
    return res.status(500).json({ error: "Internal auth error" });
  }
};
