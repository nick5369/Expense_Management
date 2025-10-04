const mongoose = require("mongoose");

const ApprovalLogicConditionSchema = new mongoose.Schema(
  {
    type: { type: String },
    value: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const ApprovalLogicSchema = new mongoose.Schema(
  {
    type: { type: String },
    operator: { type: String, enum: ["AND", "OR"], default: "OR" },
    conditions: { type: [ApprovalLogicConditionSchema], default: [] },
  },
  { _id: false }
);

const ApprovalRuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  triggers: { type: mongoose.Schema.Types.Mixed },
  logic: { type: ApprovalLogicSchema },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ApprovalRule", ApprovalRuleSchema);
