const express = require("express");
const router = express.Router();
const managerAuth = require("../middleware/managerAuth");
const ctrl = require("../controllers/managerExpensesController");

router.use(managerAuth);

// GET /api/manager/expenses?view=pending|team
router.get("/expenses", ctrl.listExpenses);

// POST /api/manager/expenses/:expenseId/action
router.post("/expenses/:expenseId/action", ctrl.actOnExpense);

module.exports = router;
