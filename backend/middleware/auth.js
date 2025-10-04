const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer "))
    return res.status(401).json({ error: "Missing token" });
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "secret");
    // payload expected to contain userId and companyId
    req.user = { userId: payload.userId, companyId: payload.companyId };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};
