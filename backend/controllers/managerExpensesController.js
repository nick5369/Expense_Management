const Expense = require("../models/expense");
const mongoose = require("mongoose");

// Helper: ensure ID is a valid ObjectId
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/** GET /api/manager/expenses?view=pending|team
 * - pending: expenses where the approvalWorkflow[currentApproverIndex].approverId === managerId and that step's status === 'Pending'
 * - team: expenses where employee.managerId === managerId
 */
exports.listExpenses = async (req, res) => {
  const managerId = req.user.userId;
  const companyId = req.user.companyId;
  const view = (req.query.view || "pending").toLowerCase();

  try {
    if (view === "pending") {
      // Find expenses in company where current approval step points to this manager and is Pending
      const expenses = await Expense.find({
        companyId,
        // approvalWorkflow exists and currentApproverIndex within bounds
      }).lean();

      // Filter in JS to match the exact condition (safer for embedded arrays)
      const result = expenses
        .filter((exp) => {
          const idx = exp.currentApproverIndex || 0;
          if (!Array.isArray(exp.approvalWorkflow)) return false;
          if (idx < 0 || idx >= exp.approvalWorkflow.length) return false;
          const step = exp.approvalWorkflow[idx];
          if (!step) return false;
          if (!step.approverId) return false;
          return (
            step.approverId.toString() === managerId.toString() &&
            step.status === "Pending"
          );
        })
        .map((e) => ({ ...e, amount: e.amount }));

      return res.json(result);
    }

    if (view === "team") {
      // Find all users whose managerId === managerId, then expenses for those users
      const teamExpenses = await Expense.find({ companyId })
        .populate("employeeId", "managerId")
        .lean();
      const result = teamExpenses
        .filter(
          (e) =>
            e.employeeId &&
            e.employeeId.managerId &&
            e.employeeId.managerId.toString() === managerId.toString()
        )
        .map((e) => ({ ...e, amount: e.amount }));
      return res.json(result);
    }

    return res.status(400).json({ error: "invalid view parameter" });
  } catch (err) {
    console.error("listExpenses error", err);
    return res.status(500).json({ error: "failed to list expenses" });
  }
};

/** POST /api/manager/expenses/:expenseId/action
 * body: { action: 'Approve'|'Reject', comments }
 */
exports.actOnExpense = async (req, res) => {
  const managerId = req.user.userId;
  const companyId = req.user.companyId;
  const { expenseId } = req.params;
  const { action, comments } = req.body;

  if (!isValidId(expenseId))
    return res.status(400).json({ error: "invalid expenseId" });
  if (!["Approve", "Reject"].includes(action))
    return res.status(400).json({ error: "invalid action" });

  try {
    const expense = await Expense.findOne({ _id: expenseId, companyId });
    if (!expense) return res.status(404).json({ error: "expense not found" });

    const idx = expense.currentApproverIndex || 0;
    if (
      !Array.isArray(expense.approvalWorkflow) ||
      idx < 0 ||
      idx >= expense.approvalWorkflow.length
    )
      return res.status(400).json({ error: "no pending approval step" });
    const step = expense.approvalWorkflow[idx];
    if (!step.approverId || step.approverId.toString() !== managerId.toString())
      return res
        .status(403)
        .json({ error: "not authorized to act on this expense" });
    if (step.status !== "Pending")
      return res.status(400).json({ error: "step not pending" });

    if (action === "Approve") {
      step.status = "Approved";
      step.comments = comments || "";
      step.actedAt = new Date();
      // advance index
      expense.currentApproverIndex = expense.currentApproverIndex + 1;
      if (expense.currentApproverIndex >= expense.approvalWorkflow.length) {
        expense.status = "Approved";
      } else {
        expense.status = "Processing";
      }
    } else {
      // Reject
      step.status = "Rejected";
      step.comments = comments || "";
      step.actedAt = new Date();
      expense.status = "Rejected";
    }

    await expense.save();
    return res.json(expense);
  } catch (err) {
    console.error("actOnExpense error", err);
    return res.status(500).json({ error: "failed to act on expense" });
  }
};
