# Phase 1 Prototype Build Checklist — Plain-Language Version

This is the practical build order for a complete, working Divya Pravaha prototype that can be demonstrated to the owner. All business rules in the [System Requirements v1.1](system-requirements-v1.1.json) are assumed confirmed for prototype development.

The system requirements remain authoritative. If this checklist or a UI screenshot conflicts with them, the system requirements take precedence. Screenshots guide appearance and responsive behavior only.

## What Phase 1 will deliver

At the end of Phase 1:

- Staff can sign in with role-based access and prototype MFA.
- Administrators can manage branches, staff, roles, audit history, and policy-gate visibility.
- Loan Officers can register borrowers, form groups, and submit applications.
- Managers can independently approve or reject applications.
- Cashier/Accountants can reserve funding and record cash disbursement.
- The system generates correct weekly, fortnightly, and monthly schedules.
- Field Collectors can use a mobile interface to capture cash and issue numbered receipts.
- Cash handovers can be counted, independently verified, and reconciled.
- Arrears and joint liability use frozen guarantee snapshots.
- The loan portfolio shows schedules, balances, activity, and settlement quotes.
- A prototype double-entry ledger records the main financial events.
- Capital can be traced from source through loan disbursement and recovery.
- Dashboards and reports use realistic fictional sample data.
- The investor area remains visibly locked pending legal and accounting approval.

Phase 1 is a **solid functional prototype**, not disconnected mockups. Production integrations, real-data migration, penetration testing, disaster recovery, regulatory evidence, and launch hardening belong to Phase 2.

## Prototype boundaries

| Included in Phase 1 | Deferred to Phase 2 |
| --- | --- |
| Complete staff-facing workflows | Production security certification |
| PostgreSQL-backed fictional data | Historical migration and signed opening balances |
| Cash-only operations | Additional payment integrations if later approved |
| Role and branch access | Independent penetration testing |
| Main double-entry postings | Final accountant validation and close hardening |
| Responsive desktop/mobile UI | Full accessibility and device certification |
| Prototype reports and CSV | Regulatory exports and production report packs |
| Local or demo deployment | Production infrastructure and disaster recovery |
| Locked investor screens | Operational investor module after formal approval |

---

## Stage 0 — Prepare the prototype project

### Development tasks

- [X] Initialize Git and add project setup documentation.
- [X] Create a Next.js App Router project with TypeScript.
- [ ] Configure Tailwind CSS with the royal-blue and white theme.
- [X] Configure PostgreSQL and Prisma.
- [ ] Add local environment and secret templates.
- [ ] Add commands for development, migration, seed, lint, test, and build.
- [ ] Add formatting, linting, type-checking, and test automation.
- [ ] Structure the application as a modular monolith.
- [ ] Create server-only modules for identity, groups, loans, collections, guarantees, capital, accounting, documents, and reporting.
- [ ] Create a repeatable fictional sample-data seed.
- [ ] Seed a branch, every role, borrowers, groups, loans, receipts, arrears, and journals.
- [ ] Mark every seeded record and page clearly as sample data.

### Result

A developer can start the database and application, seed the demonstration workspace, and run all project checks.

---

## Stage 1 — Build the shared desktop and mobile interface

### Shared components

- [ ] Desktop sidebar with branch context and permission-aware navigation.
- [ ] Top bar with breadcrumb, notifications, user, and role.
- [ ] Page headings with branch, date, and GHS context.
- [ ] Cards, badges, tabs, tables, pagination, search, and filters.
- [ ] Buttons, menus, dialogs, confirmations, and alerts.
- [ ] Form controls with labels, help, validation, and disabled states.
- [ ] Loading, empty, error, denied, and not-found states.
- [ ] Printable receipt, voucher, statement, and report layouts.
- [ ] Collector mobile header, connection status, and bottom navigation.
- [ ] One-column mobile cash forms with large touch targets.
- [ ] Ghana cedi formatting and Africa/Accra display dates.
- [ ] Keyboard focus, readable contrast, and responsive layouts.

### Result

All later modules use one polished interface based on the supplied screenshots without inheriting conflicting business rules.

---

## Stage 2 — Build authentication, prototype MFA, roles, and branches

### Pages

- [ ] `/login` — staff email and password.
- [ ] `/mfa` — six-digit prototype verification.
- [ ] `/workspace/administration/staff` — staff and activation state.
- [ ] `/workspace/administration/roles` — roles and permissions.
- [ ] `/workspace/administration/branches` — branches and assignments.

### Backend work

- [ ] Create User, Role, UserRole, Branch, and StaffBranchAssignment records.
- [ ] Use secure password hashing and server sessions.
- [ ] Implement every role in the requirements.
- [ ] Require prototype MFA for privileged roles.
- [ ] Enforce permissions server-side.
- [ ] Enforce branch scope on operational records.
- [ ] Prevent automatic financial authority for System Administrators.
- [ ] Require maker and checker to be different users.
- [ ] Record authentication and permission events.

### Tests

- [ ] Sign in as each role.
- [ ] Reject invalid credentials.
- [ ] Deny unauthorized routes and mutations.
- [ ] Deny cross-branch access.
- [ ] Prevent maker self-approval.

### Result

The owner can switch demonstration roles and see genuine permission differences.

---

## Stage 3 — Build administration, audit, and activation gates

### Pages and behavior

- [ ] `/workspace/administration` — roles, security, audit, sign-offs, and investor gates.
- [ ] Append-only audit list with actor, role, event, record, time, and result.
- [ ] Prototype policy-readiness checklist.
- [ ] Locked investor activation checklist.
- [ ] Audit approvals, rejections, reversals, private-document access, and security changes.
- [ ] Prevent audit-event editing and deletion through the application.

### Result

The prototype demonstrates governance and traceability, not merely CRUD screens.

---

## Stage 4 — Build borrower onboarding and restrictions

### Pages

- [ ] `/workspace/borrowers` — searchable directory and filters.
- [ ] `/workspace/borrowers/new` — identity, contact, address, business, Ghana Card, group, and consent.
- [ ] `/workspace/borrowers/[id]` — profile, documents, groups, loans, restrictions, and history.
- [ ] Restriction and manager-approved reactivation workflow.

### Backend work

- [ ] Create Borrower, Verification, ConsentRecord, BusinessAssessment, Document, Restriction, and ReactivationDecision records.
- [ ] Generate unique customer IDs.
- [ ] Detect duplicate Ghana Card records.
- [ ] Mask Ghana Card in ordinary views.
- [ ] Store prototype documents privately.
- [ ] Record document versions and access events.
- [ ] Block restricted borrowers from new applications.

### Result

Loan Officers can demonstrate controlled borrower onboarding, evidence, restriction, and reactivation.

---

## Stage 5 — Build groups and membership history

### Pages

- [ ] `/workspace/groups` — directory, status, officer, and readiness.
- [ ] `/workspace/groups/new` — group details and initial members.
- [ ] `/workspace/groups/[id]` — membership, agreement, snapshots, documents, and history.
- [ ] Effective-dated membership-change flow.
- [ ] Independent group-activation review.

### Backend work

- [ ] Create Group, GroupMembership, GroupAgreement, GroupVisit, and GroupStatusEvent records.
- [ ] Require at least five verified consenting members.
- [ ] Require a signed joint-liability agreement.
- [ ] Append membership events instead of overwriting history.
- [ ] Preserve exited members on earlier guarantee snapshots.
- [ ] Exclude later members from earlier snapshots.

### Tests

- [ ] Reject activation with four eligible members.
- [ ] Activate with five or more eligible members.
- [ ] Preserve history after joins and exits.

### Result

The prototype proves who belonged to each group and which historical loans they guaranteed.

---

## Stage 6 — Build loan applications and schedules

### Pages

- [ ] `/workspace/loan-applications` — lifecycle queues.
- [ ] `/workspace/loan-applications/new` — borrower, group, purpose, product terms, documents, and schedule preview.
- [ ] `/workspace/loan-applications/[id]` — detail and event history.

### Business logic

- [ ] Seed versioned product `GROUP_FLAT_20`.
- [ ] Limit terms to six months.
- [ ] Support weekly, fortnightly, and monthly frequencies.
- [ ] Calculate flat interest as 20% of original principal.
- [ ] Calculate total repayment as principal plus interest.
- [ ] Allocate five-sixths principal and one-sixth interest.
- [ ] Round to pesewas and absorb the remainder in the final instalment.
- [ ] Implement seven-day, fourteen-day, and calendar-month recurrence.
- [ ] Implement month-end and next-business-day collection rules.
- [ ] State that actual cash-out anchors the final contract schedule.
- [ ] Enforce one active loan and one nonterminal application per borrower.

### Tests

- [ ] GHS 10,000 produces GHS 2,000 interest and GHS 12,000 total.
- [ ] Test weekly, fortnightly, monthly, month-end, leap-year, and weekend dates.
- [ ] Confirm exact component and contract totals.

### Result

The owner can create a real application and inspect a mathematically correct schedule.

---

## Stage 7 — Build independent manager approval

### Pages and backend

- [ ] `/workspace/loan-applications/[id]/review` — borrower, evidence, submitted terms, guarantors, and decision.
- [ ] Manager approval queue.
- [ ] Freeze a versioned submitted-terms snapshot.
- [ ] Freeze verified guarantors and agreement versions.
- [ ] Require an independent Manager.
- [ ] Require an approval or rejection reason.
- [ ] Record decision actor and time.
- [ ] Move approved loans to awaiting disbursement.
- [ ] Require a new controlled decision for changed terms.

### Result

Every decision is independent, reasoned, and supported by immutable prototype evidence.

---

## Stage 8 — Build the prototype accounting engine

### Core work

- [ ] Create LedgerAccount, AccountingPeriod, JournalEntry, JournalLine, and Reversal records.
- [ ] Seed the provisional chart of accounts.
- [ ] Store money as integer pesewas.
- [ ] Require balanced journals.
- [ ] Link journals to source events and actors.
- [ ] Prevent editing and deletion of posted journals.
- [ ] Support linked reversal and replacement entries.

### Posting rules

- [ ] Post loan disbursement.
- [ ] Post elapsed-term interest accrual.
- [ ] Post cash receipt principal and interest components.
- [ ] Post custody transfer after verified handover.
- [ ] Post unidentified cash to suspense.
- [ ] Post excess cash to customer-overpayment liability.
- [ ] Post joint-liability contributions against the original borrower.
- [ ] Prevent duplicate posting of one source event.

### Result

Every prototype money workflow has a visible and balanced accounting effect.

---

## Stage 9 — Build capital source and use

### Pages and backend

- [ ] `/workspace/capital` — verified, reserved, available, excluded, and allocated balances.
- [ ] Funding-lot detail and forward/backward trace.
- [ ] Create FundAccount, FundLot, FundMovement, FundingReservation, and FundAllocation records.
- [ ] Seed fictional owner-capital lots.
- [ ] Support available, reserved, committed, disbursed, recovered, and cancelled states.
- [ ] Exclude custody, receivables, suspense, overpayments, and investor funds.
- [ ] Prevent allocation above a lot's available balance.
- [ ] Trace recovered principal separately from interest.

### Result

The owner can trace verified prototype funds into loans and subsequent recovery.

---

## Stage 10 — Build controlled cash disbursement

### Pages and backend

- [ ] `/workspace/disbursements` — approved loans awaiting cash release.
- [ ] Disbursement detail with beneficiary, reservation, voucher, authorization, and preview.
- [ ] Create Disbursement and CashVoucher records.
- [ ] Require approved loan and verified funding reservation.
- [ ] Confirm borrower identity and beneficiary.
- [ ] Require signed contract, voucher, and manager authorization.
- [ ] Generate unique reference and idempotency key.
- [ ] Record actual physical cash-out date.
- [ ] Consume reservation, post journal, activate loan, and anchor schedule together.
- [ ] Prevent duplicate release.

### Result

The owner can demonstrate one traceable release from verified capital to an active loan.

---

## Stage 11 — Build collector assignments and mobile cash receipts

### Mobile pages

- [ ] `/field/assignments` — route, target, stops, receipts, and custody.
- [ ] `/field/loans/[id]/collect` — borrower confirmation and cash entry.
- [ ] `/field/receipts/[id]` — numbered receipt confirmation.
- [ ] `/field/receipts` — collector receipt history.

### Backend work

- [ ] Create Assignment, Payment, PaymentAllocation, Receipt, and CustodyMovement records.
- [ ] Accept cash only.
- [ ] Require online submission.
- [ ] Allow partial and full payment.
- [ ] Allocate oldest due first and pro rata across schedule components.
- [ ] Prohibit manual allocation override.
- [ ] Generate a numbered receipt exactly once.
- [ ] Reduce borrower debt and increase collector custody together.
- [ ] Keep collector cash unavailable for lending.

### Result

The owner can see the field flow from assigned stop through receipt and custody.

---

## Stage 12 — Build receipt register, handover, and reconciliation

### Pages and backend

- [ ] `/workspace/cash-collections` — receipt lifecycle register.
- [ ] Receipt detail with allocation, custody, balance, and correction links.
- [ ] `/field/handovers/new` — prepare a receipt batch.
- [ ] `/workspace/handovers` and detail — count, discrepancy, and verification.
- [ ] Create Handover, HandoverReceipt, DenominationCount, Reconciliation, and Exception records.
- [ ] Support captured, handed-over, verified, posted, and reversed states.
- [ ] Prevent one receipt entering multiple active handovers.
- [ ] Require a checker different from the collector.
- [ ] Transfer verified custody to company cash without reducing borrower debt again.
- [ ] Demonstrate shortage, excess, and unidentified-cash exceptions.

### Result

The prototype clearly separates payment recognition, collector custody, and spendable company cash.

---

## Stage 13 — Build portfolio and early settlement

### Pages and behavior

- [ ] `/workspace/loans` — searchable and filterable portfolio.
- [ ] `/workspace/loans/[id]` — schedule, receipts, balance, activity, guarantee, documents, and journals.
- [ ] Display contractual and effective due dates.
- [ ] Keep contractual balance separate from accrued accounting income.
- [ ] Produce a dated early-settlement quote.
- [ ] Include all remaining principal and contractual interest.
- [ ] Apply no rebate, waiver, penalty, or restructuring.
- [ ] Close repaid loans while retaining history.

### Result

The owner can inspect a loan from disbursement to closure and reproduce its balance.

---

## Stage 14 — Build arrears and joint liability

### Pages and backend

- [ ] `/workspace/arrears` — aging list and filters.
- [ ] Arrears detail with notices, guarantors, calculation, dispute, and decision.
- [ ] Mark arrears immediately after effective due date with zero grace.
- [ ] Calculate days past due.
- [ ] Use the frozen guarantee snapshot.
- [ ] Divide eligible unpaid amounts equally.
- [ ] Allocate remainder pesewas deterministically.
- [ ] Require Manager approval before collection.
- [ ] Apply contributions to the original borrower receivable.
- [ ] Create no duplicate income, new loan, or reimbursement claim.

### Tests

- [ ] Split GHS 100 among four guarantors as GHS 25 each.
- [ ] Test nondivisible remainder allocation.
- [ ] Retain exited members and exclude later members in historical snapshots.
- [ ] Block collection before approval.

### Result

The prototype demonstrates the core group-lending rule with correct evidence and accounting.

---

## Stage 15 — Build reversals, suspense, overpayments, and refunds

### Pages and behavior

- [ ] Reversal request and independent approval queue.
- [ ] Suspense register and resolution flow.
- [ ] Customer-overpayment liability and refund flow.
- [ ] Preserve original receipt and journal.
- [ ] Reverse ledger and subledger effects together.
- [ ] Repost corrections under a new reference.
- [ ] Keep suspense out of borrower balances and funding availability.
- [ ] Verify payer and Manager approval before refund.
- [ ] Prevent refunds above recorded liability.

### Result

Prototype mistakes can be corrected without hiding or deleting history.

---

## Stage 16 — Build accounting views and prototype reports

### Pages

- [ ] `/workspace/accounting` — journal and ledger search.
- [ ] Account activity view.
- [ ] Monthly close-readiness preview.
- [ ] Prototype report library.

### Reports and controls

- [ ] Trial balance, financial position, income statement, and cash flow.
- [ ] General ledger.
- [ ] Portfolio and aging.
- [ ] Collections and custody.
- [ ] Interest accrual and credit-loss provision preview.
- [ ] Capital source and use.
- [ ] Reversals and exceptions.
- [ ] Open and closed prototype period display.
- [ ] Block ordinary posting to a closed period.
- [ ] Demonstrate controlled reopening.
- [ ] Reconcile report summaries to seeded detail.
- [ ] Export core tables to CSV.

### Result

The owner can follow operational events into journals and management reports.

---

## Stage 17 — Build dashboards and role-specific work queues

### Dashboard work

- [ ] Manager overview with receivables, custody, available cash, receipts, aging, decisions, and exceptions.
- [ ] Loan Officer queue for borrowers, groups, drafts, and submissions.
- [ ] Collector view for assignments, receipts, custody, and handovers.
- [ ] Finance view for reconciliation, journals, close, and exceptions.
- [ ] Auditor read-only traceability view.
- [ ] Administrator view for security, roles, sign-offs, and investor gates.
- [ ] Define every KPI formula.
- [ ] Link summary cards to filtered detail pages.
- [ ] Exclude nonspendable balances from available funding.

### Result

Each demonstration role opens to useful data and a complete work queue.

---

## Stage 18 — Complete the owner demonstration

### Demonstration script

- [ ] Sign in as different staff roles.
- [ ] Register and verify a borrower.
- [ ] Form and activate a qualifying group.
- [ ] Submit and independently approve a loan.
- [ ] Reserve owner capital and record cash disbursement.
- [ ] Show the anchored active-loan schedule.
- [ ] Capture a partial cash payment on mobile and issue a receipt.
- [ ] Prepare, count, verify, and post the handover.
- [ ] Show journals and capital trace.
- [ ] Demonstrate arrears and joint-liability assessment.
- [ ] Demonstrate reversal, suspense, or overpayment handling.
- [ ] Show dashboards, reports, audit history, and locked investor gates.

### Prototype acceptance

- [ ] Remove nonfunctional placeholder buttons from the demonstration path.
- [ ] Reconcile seeded portfolio, cash, capital, and ledger totals.
- [ ] Verify role and branch restrictions.
- [ ] Run lint, type-check, automated tests, and production build.
- [ ] Prepare sample logins and a repeatable demo reset.
- [ ] Record owner feedback.
- [ ] Obtain owner acceptance before Phase 2.

### Result

Phase 1 ends with one cohesive, database-backed prototype demonstrating the entire core loan-business workflow.

---

## Phase 1 completion gate

- [ ] Every core prototype route and action is functional.
- [ ] The loan lifecycle works end to end.
- [ ] Receipt, custody, handover, and reconciliation work end to end.
- [ ] Core journals balance and are immutable through the UI.
- [ ] Capital availability excludes nonspendable balances.
- [ ] Joint liability uses the correct snapshot and calculation.
- [ ] Roles and branch restrictions are demonstrable.
- [ ] Investor functions remain locked.
- [ ] Seeded dashboards and reports reconcile.
- [ ] The owner accepts the prototype.

## Simple Phase 1 sequence

1. Set up the stack, tests, and sample data.
2. Build shared desktop and mobile UI.
3. Build authentication, roles, branches, administration, and audit.
4. Build borrowers and groups.
5. Build applications, schedules, and approvals.
6. Build the ledger foundation.
7. Build capital reservation and disbursement.
8. Build receipts and handovers.
9. Build portfolio, arrears, joint liability, and corrections.
10. Build reports, dashboards, and work queues.
11. Reconcile the sample data and demonstrate the prototype to the owner.

## Where development should begin now

- [ ] Complete Stage 0 and establish the repository.
- [ ] Build the shared data model and seed before reproducing individual screenshots.
- [ ] Build authorization before exposing borrower or financial pages.
- [ ] Build the ledger foundation before cash mutations.
- [ ] Use the Stage 18 demonstration as the definition of a finished Phase 1.
