const Expense = require("../models/expense");

exports.listExpenses = async (req, res) => {
  const companyId = req.user.companyId;
  const {
    status,
    employeeId,
    fromDate,
    toDate,
    page = 1,
    limit = 50,
  } = req.query;
  const q = { companyId };
  if (status) q.status = status;
  if (employeeId) q.employeeId = employeeId;
  if (fromDate || toDate) q.expenseDate = {};
  if (fromDate) q.expenseDate.$gte = new Date(fromDate);
  if (toDate) q.expenseDate.$lte = new Date(toDate);

  try {
    const expenses = await Expense.find(q)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ submittedAt: -1 });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to list expenses" });
  }
};

exports.overrideExpense = async (req, res) => {
  const companyId = req.user.companyId;
  const { expenseId } = req.params;
  const { status, comments } = req.body;
  if (!["Approved", "Rejected", "Pending"].includes(status))
    return res.status(400).json({ error: "invalid status" });
  try {
    const expense = await Expense.findOne({ _id: expenseId, companyId });
    if (!expense) return res.status(404).json({ error: "not found" });
    expense.status = status;
    // push admin override into approvalWorkflow
    expense.approvalWorkflow = expense.approvalWorkflow || [];
    expense.approvalWorkflow.push({
      approverId: req.user.userId,
      sequence: expense.approvalWorkflow.length + 1,
      status,
      comments,
      actedAt: new Date(),
    });
    await expense.save();
    res.json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to override expense" });
  }
};
