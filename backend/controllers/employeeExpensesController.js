const Expense = require("../models/expense");
const User = require("../models/user");
const axios = require("axios");
const mongoose = require("mongoose");

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function convertToCompanyCurrency(
  originalAmount,
  fromCurrency,
  companyCurrency
) {
  // Using exchangerate.host free API as a simple example
  try {
    if (!fromCurrency || fromCurrency === companyCurrency)
      return originalAmount;
    const resp = await axios.get(`https://api.exchangerate.host/convert`, {
      params: {
        from: fromCurrency,
        to: companyCurrency,
        amount: originalAmount,
      },
    });
    if (resp.data && resp.data.result) return resp.data.result;
  } catch (err) {
    console.warn("currency conversion failed", err.message);
  }
  return null;
}

/** POST /api/employee/expenses */
exports.createExpense = async (req, res) => {
  const employeeId = req.user.userId;
  const companyId = req.user.companyId;
  const { description, category, expenseDate, amount, receiptUrl } = req.body;
  if (!amount || typeof amount.original !== "number" || !amount.currency)
    return res.status(400).json({ error: "invalid amount" });

  try {
    // load employee to read manager and company currency
    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ error: "employee not found" });

    // get company currency from Company model to convert; lazy-load company currency
    const Company = require("../models/company");
    const company = await Company.findById(companyId);
    const companyCurrency =
      company && company.defaultCurrency
        ? company.defaultCurrency
        : amount.currency;

    const converted = await convertToCompanyCurrency(
      amount.original,
      amount.currency,
      companyCurrency
    );

    // Build initial approvalWorkflow: if employee.managerId present, add manager as approver
    const approvalWorkflow = [];
    if (employee.managerId)
      approvalWorkflow.push({
        approverId: employee.managerId,
        sequence: 1,
        status: "Pending",
      });

    const expense = new Expense({
      employeeId,
      companyId,
      description,
      category,
      expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      amount: {
        original: amount.original,
        currency: amount.currency,
        companyCurrencyValue: converted,
      },
      status: "Pending",
      approvalWorkflow,
      receipt: { url: receiptUrl },
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    console.error("createExpense error", err);
    res.status(500).json({ error: "failed to create expense" });
  }
};

/** GET /api/employee/expenses */
exports.listExpenses = async (req, res) => {
  const employeeId = req.user.userId;
  const companyId = req.user.companyId;
  try {
    const expenses = await Expense.find({ employeeId, companyId }).sort({
      submittedAt: -1,
    });
    res.json(expenses);
  } catch (err) {
    console.error("listExpenses error", err);
    res.status(500).json({ error: "failed to list expenses" });
  }
};

/** GET /api/employee/expenses/:expenseId */
exports.getExpense = async (req, res) => {
  const employeeId = req.user.userId;
  const companyId = req.user.companyId;
  const { expenseId } = req.params;
  if (!isValidId(expenseId))
    return res.status(400).json({ error: "invalid id" });
  try {
    const expense = await Expense.findOne({
      _id: expenseId,
      employeeId,
      companyId,
    });
    if (!expense) return res.status(404).json({ error: "not found" });
    res.json(expense);
  } catch (err) {
    console.error("getExpense error", err);
    res.status(500).json({ error: "failed to get expense" });
  }
};

/** PUT /api/employee/expenses/:expenseId */
exports.updateExpense = async (req, res) => {
  const employeeId = req.user.userId;
  const companyId = req.user.companyId;
  const { expenseId } = req.params;
  const updates = req.body;
  if (!isValidId(expenseId))
    return res.status(400).json({ error: "invalid id" });
  try {
    const expense = await Expense.findOne({
      _id: expenseId,
      employeeId,
      companyId,
    });
    if (!expense) return res.status(404).json({ error: "not found" });
    if (expense.status !== "Draft")
      return res
        .status(400)
        .json({ error: "only draft expenses can be updated" });
    // allow update of fields
    const allowed = [
      "description",
      "category",
      "expenseDate",
      "amount",
      "receipt",
    ];
    allowed.forEach((k) => {
      if (updates[k] !== undefined) expense[k] = updates[k];
    });
    await expense.save();
    res.json(expense);
  } catch (err) {
    console.error("updateExpense error", err);
    res.status(500).json({ error: "failed to update expense" });
  }
};

/** DELETE /api/employee/expenses/:expenseId */
exports.deleteExpense = async (req, res) => {
  const employeeId = req.user.userId;
  const companyId = req.user.companyId;
  const { expenseId } = req.params;
  if (!isValidId(expenseId))
    return res.status(400).json({ error: "invalid id" });
  try {
    const expense = await Expense.findOne({
      _id: expenseId,
      employeeId,
      companyId,
    });
    if (!expense) return res.status(404).json({ error: "not found" });
    if (expense.status !== "Draft")
      return res
        .status(400)
        .json({ error: "only draft expenses can be deleted" });
    await expense.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteExpense error", err);
    res.status(500).json({ error: "failed to delete expense" });
  }
};
