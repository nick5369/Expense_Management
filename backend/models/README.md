# Database models

This document describes the Mongoose models used by the Expense Management backend. Models live in `backend/models/` and are implemented with Mongoose schema definitions.

## Models

1. Company (`Company`)

- Purpose: Tenant data for each company.
- File: `company.js`
- Key fields:
  - `name` (String, required)
  - `defaultCurrency` (String, required) — the company's base currency (e.g. `INR`, `USD`).
  - `country` (String) — optional country code/name for locale-driven defaults.
  - `createdAt`, `updatedAt` (Date)

Example document:

```js
{
  _id: ObjectId("..."),
  name: 'Innovate Corp',
  defaultCurrency: 'INR',
  country: 'India',
  createdAt: ISODate(...)
}
```

Notes:

- Keep `defaultCurrency` populated on signup (picked from user's locale/country).
- Consider adding company-level settings later (approval chains, finance contacts, currency source id).

2. User (`User`)

- Purpose: Users (Admin, Manager, Employee) within a company.
- File: `user.js`
- Key fields:
  - `name` (String)
  - `email` (String, required, unique)
  - `hashedPassword` (String, required)
  - `role` (String, enum: ['Admin','Manager','Employee'], default: 'Employee')
  - `companyId` (ObjectId -> Company, required)
  - `managerId` (ObjectId -> User) — direct manager relationship
  - `isManagerApprover` (Boolean) — indicates if direct manager is the first approver
  - `createdAt`, `updatedAt`

Example document:

```js
{
  _id: ObjectId("..."),
  name: 'Priya Sharma',
  email: 'priya@example.com',
  hashedPassword: 'bcrypt_hash',
  role: 'Employee',
  companyId: ObjectId('...'),
  managerId: ObjectId('...'),
  isManagerApprover: true
}
```

Notes & best practices:

- Always scope user queries by `companyId` to enforce tenancy.
- Do not return `hashedPassword` from API responses. The controllers use `.select('-hashedPassword')`.
- For deactivation, consider adding `isActive` or `deletedAt` (soft delete) instead of physical delete.

3. Expense (`Expense`)

- Purpose: Stores each expense claim and its approval history.
- File: `expense.js`
- Key fields:
  - `employeeId` (ObjectId -> User, required)
  - `companyId` (ObjectId -> Company, required)
  - `description` (String)
  - `category` (String)
  - `expenseDate` (Date)
  - `submittedAt` (Date)
  - `amount` (embedded object):
    - `original` (Number, required) — amount as submitted
    - `currency` (String, required) — currency of the submitted amount
    - `companyCurrencyValue` (Number) — converted to company base currency at submission
  - `status` (String enum: ['Draft','Pending','Processing','Approved','Rejected'])
  - `approvalWorkflow` (Array of embedded approval steps): each step has `approverId`, `sequence`, `status`, `comments`, `actedAt`
  - `currentApproverIndex` (Number) — index into the `approvalWorkflow` array for the next approver
  - `approvalRuleId` (ObjectId -> ApprovalRule) — optional rule that influenced the workflow
  - `receipt` (embedded object):
    - `url` (String) — storage URL/path for the receipt image
    - `ocrData` (vendor, total, date, rawText)
  - timestamps (`createdAt`, `updatedAt` due to schema timestamps)

Example document:

```js
{
  _id: ObjectId('...'),
  employeeId: ObjectId('...'),
  companyId: ObjectId('...'),
  description: 'Client dinner',
  category: 'Meals & Entertainment',
  expenseDate: ISODate('2025-10-02'),
  amount: { original: 55.75, currency: 'USD', companyCurrencyValue: 4650.50 },
  status: 'Pending',
  approvalWorkflow: [ { approverId: ObjectId('...'), sequence:1, status:'Pending' } ],
  currentApproverIndex: 0,
  receipt: { url: 'https://.../receipt.jpg', ocrData: { vendor:'The Grand', total:55.75, date:'2025-10-02' } }
}
```

Notes & behavior:

- Approval workflow is embedded so each expense carries its own approval state/history; this simplifies reading the entire workflow but can grow if many steps are added.
- When an approver acts, update the corresponding `approvalWorkflow[sequence-1]` entry, set `status` and `actedAt`, and advance `currentApproverIndex` if approved.
- Always scope expense queries by `companyId`.
- Store the conversion rate or `companyCurrencyValue` at submission time to make historic reporting accurate.

4. ApprovalRule (`ApprovalRule`)

- Purpose: Reusable conditional approval rules to generate or evaluate approval workflows.
- File: `approvalRule.js`
- Key fields:
  - `name` (String, required)
  - `companyId` (ObjectId -> Company, required)
  - `triggers` (Mixed) — rule triggers like `minAmount`, `categories`
  - `logic` (embedded object) — defines type/operator/conditions (Percentage, SpecificApprover, Hybrid)
  - `createdAt`

Example document:

```js
{
  _id: ObjectId('...'),
  name: 'High value international travel',
  companyId: ObjectId('...'),
  triggers: { minAmount: 50000, categories:['International Travel'] },
  logic: { type:'Hybrid', operator:'OR', conditions:[ {type:'Percentage', value:60} ] }
}
```

Notes:

- Rules are applied when building the `approvalWorkflow` for a submitted expense. Implement rule evaluation code in a controller/service that produces the list of approvers.

## Indexes and performance

- Recommended indexes:
  - `User`: `{ companyId: 1, email: 1 }` (email unique constraint already exists)
  - `Expense`: `{ companyId: 1, employeeId: 1, status: 1, submittedAt: -1 }` for queries and reporting
  - `ApprovalRule`: `{ companyId: 1 }`

## Tenancy and security

- All reads and writes should be scoped by `companyId` taken from the authenticated token (see `middleware/auth.js` which sets `req.user.companyId`).
- Never return `hashedPassword` in responses. Use `.select('-hashedPassword')` when returning user objects.

## Extensibility

- To add more fields (e.g., cost center, project), extend the `Expense` schema and add appropriate indexes.
- If workflows become large or you need to query approvals independently, consider moving `approvalWorkflow` to a separate `approvals` collection and referencing `expenseId`.
- If you add attachments to many models, standardize upload handling (local vs. S3) and store metadata in a shared `attachments` model.

## Migration & seeding

- Provide small scripts to seed an admin and a demo company (use `mongoose.connect` and model `create` calls).
- When changing schemas in production, write migration scripts that backfill values (for example, populate `companyCurrencyValue` for existing expenses using historical rates if available).

## Troubleshooting

- If you see missing required fields during model creation, validate request bodies in controllers before saving.
- If you plan to scale multi-tenant data across many collections or shards, ensure `companyId` is included in shard keys or partitioning strategy.

If you want, I can also add:

- example seed scripts (`backend/scripts/seed.js`),
- a separate `approvals` collection if you'd prefer normalized approval steps,
- or auto-generation logic that creates `approvalWorkflow` at expense submission time based on rules and manager relationships.
