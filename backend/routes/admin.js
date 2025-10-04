const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const users = require("../controllers/adminUsersController");
const rules = require("../controllers/adminRulesController");
const expenses = require("../controllers/adminExpensesController");

router.use(auth);

// Users
router.post("/users", users.createUser);
router.get("/users", users.listUsers);
router.put("/users/:userId", users.updateUser);
router.delete("/users/:userId", users.deleteUser);

// Rules
router.post("/rules", rules.createRule);
router.get("/rules", rules.listRules);
router.put("/rules/:ruleId", rules.updateRule);
router.delete("/rules/:ruleId", rules.deleteRule);

// Expenses
router.get("/expenses", expenses.listExpenses);
router.post("/expenses/:expenseId/override", expenses.overrideExpense);

module.exports = router;
