const mongoose = require("mongoose");

const ReceiptSchema = new mongoose.Schema(
  {
    url: { type: String },
    ocrData: {
      vendor: String,
      total: Number,
      date: String,
      rawText: String,
    },
  },
  { _id: false }
);

const ApprovalStepSchema = new mongoose.Schema(
  {
    approverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sequence: { type: Number },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    comments: { type: String },
    actedAt: { type: Date },
  },
  { _id: false }
);

const ExpenseSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    description: { type: String },
    category: { type: String },
    expenseDate: { type: Date },
    submittedAt: { type: Date, default: Date.now },
    amount: {
      original: { type: Number, required: true },
      currency: { type: String, required: true },
      companyCurrencyValue: { type: Number },
    },
    status: {
      type: String,
      enum: ["Draft", "Pending", "Processing", "Approved", "Rejected"],
      default: "Pending",
    },
    approvalWorkflow: { type: [ApprovalStepSchema], default: [] },
    currentApproverIndex: { type: Number, default: 0 },
    approvalRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApprovalRule",
    },
    receipt: { type: ReceiptSchema },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
