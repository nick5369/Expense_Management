const User = require("../models/user");
const bcrypt = require("bcrypt");

exports.createUser = async (req, res) => {
  const companyId = req.user.companyId;
  const { name, email, password, role, managerId, isManagerApprover } =
    req.body;
  if (!email || !password || !role)
    return res.status(400).json({ error: "missing fields" });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      hashedPassword: hashed,
      role,
      companyId,
      managerId,
      isManagerApprover,
    });
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to create user" });
  }
};

exports.listUsers = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const users = await User.find({ companyId }).select("-hashedPassword");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to list users" });
  }
};

exports.updateUser = async (req, res) => {
  const companyId = req.user.companyId;
  const { userId } = req.params;
  const updates = req.body;
  delete updates.hashedPassword;
  try {
    const user = await User.findOneAndUpdate(
      { _id: userId, companyId },
      updates,
      { new: true }
    ).select("-hashedPassword");
    if (!user) return res.status(404).json({ error: "not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to update user" });
  }
};

exports.deleteUser = async (req, res) => {
  const companyId = req.user.companyId;
  const { userId } = req.params;
  try {
    const user = await User.findOneAndDelete({ _id: userId, companyId });
    if (!user) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to delete user" });
  }
};
