const express = require("express");
const router = express.Router();
const employeeAuth = require("../middleware/employeeAuth");
const ctrl = require("../controllers/employeeExpensesController");

router.use(employeeAuth);

router.post("/expenses", ctrl.createExpense);
router.get("/expenses", ctrl.listExpenses);
router.get("/expenses/:expenseId", ctrl.getExpense);
router.put("/expenses/:expenseId", ctrl.updateExpense);
router.delete("/expenses/:expenseId", ctrl.deleteExpense);

module.exports = router;
