const ApprovalRule = require("../models/approvalRule");

exports.createRule = async (req, res) => {
  const companyId = req.user.companyId;
  const { name, triggers, logic } = req.body;
  if (!name) return res.status(400).json({ error: "missing name" });
  try {
    const rule = new ApprovalRule({ name, companyId, triggers, logic });
    await rule.save();
    res.status(201).json(rule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to create rule" });
  }
};

exports.listRules = async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const rules = await ApprovalRule.find({ companyId });
    res.json(rules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to list rules" });
  }
};

exports.updateRule = async (req, res) => {
  const companyId = req.user.companyId;
  const { ruleId } = req.params;
  try {
    const rule = await ApprovalRule.findOneAndUpdate(
      { _id: ruleId, companyId },
      req.body,
      { new: true }
    );
    if (!rule) return res.status(404).json({ error: "not found" });
    res.json(rule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to update rule" });
  }
};

exports.deleteRule = async (req, res) => {
  const companyId = req.user.companyId;
  const { ruleId } = req.params;
  try {
    const rule = await ApprovalRule.findOneAndDelete({
      _id: ruleId,
      companyId,
    });
    if (!rule) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to delete rule" });
  }
};
