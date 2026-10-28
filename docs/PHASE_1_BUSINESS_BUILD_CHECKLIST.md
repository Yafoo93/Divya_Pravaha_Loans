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
- [X] Configure Tailwind CSS with the royal-blue and white theme.
- [X] Configure PostgreSQL and Prisma.
- [X] Add local environment and secret templates.
- [X] Add commands for development, migration, seed, lint, test, and build.
- [X] Add formatting, linting, type-checking, and test automation.
- [X] Structure the application as a modular monolith.
- [X] Create server-only modules for identity, groups, loans, collections, guarantees, capital, accounting, documents, and reporting.
- [X] Create a repeatable fictional sample-data seed.
- [X] Seed a branch, every role, borrowers, groups, loans, receipts, arrears, and journals.
- [X] Mark every seeded record and page clearly as sample data.

### Result

A developer can start the database and application, seed the demonstration workspace, and run all project checks.

---

## Stage 1 — Build the shared desktop and mobile interface

### Shared components

- [X] Desktop sidebar with branch context and permission-aware navigation.
- [X] Top bar with breadcrumb, notifications, user, and role.
- [X] Page headings with branch, date, and GHS context.
- [X] Cards, badges, tabs, tables, pagination, search, and filters.
- [X] Buttons, menus, dialogs, confirmations, and alerts.
- [X] Form controls with labels, help, validation, and disabled states.
- [X] Loading, empty, error, denied, and not-found states.
- [X] Printable receipt, voucher, statement, and report layouts.
- [X] Collector mobile header, connection status, and bottom navigation.
- [X] One-column mobile cash forms with large touch targets.
- [X] Ghana cedi formatting and Africa/Accra display dates.
- [X] Keyboard focus, readable contrast, and responsive layouts.

### Result

All later modules use one polished interface based on the supplied screenshots without inheriting conflicting business rules.

---

## Stage 2 — Build authentication, prototype MFA, roles, and branches

### Pages

- [X] `/login` — staff email and password.
- [ ] `/mfa` — six-digit prototype verification.
- [X] `/workspace/administration/staff` — staff and activation state.
- [X] `/workspace/administration/roles` — roles and permissions.
- [X] `/workspace/administration/branches` — branches and assignments.

### Backend work

- [X] Create User, Role, UserRole, Branch, and StaffBranchAssignment records.
- [X] Use secure password hashing and server sessions.
- [X] Implement every role in the requirements.
- [ ] Require prototype MFA for privileged roles.
- [X] Enforce permissions server-side.
- [X] Enforce branch scope on operational records.
- [X] Prevent automatic financial authority for System Administrators.
- [X] Require maker and checker to be different users.
- [X] Record authentication and permission events.

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

- [X] `/workspace/administration` — roles, security, audit, sign-offs, and investor gates.
- [X] Append-only audit list with actor, role, event, record, time, and result.
- [X] Prototype policy-readiness checklist.
- [X] Locked investor activation checklist.
- [X] Audit approvals, rejections, reversals, private-document access, and security changes.
- [X] Prevent audit-event editing and deletion through the application.

### Result

The prototype demonstrates governance and traceability, not merely CRUD screens.

---

## Stage 4 — Build borrower onboarding and restrictions

### Pages

- [X] `/workspace/borrowers` — searchable directory and filters.
- [X] `/workspace/borrowers/new` — identity, contact, address, business, Ghana Card, group, and consent.
- [X] `/workspace/borrowers/[id]` — profile, documents, groups, loans, restrictions, and history.
- [X] Restriction and manager-approved reactivation workflow.

### Backend work

- [X] Create Borrower, Verification, ConsentRecord, BusinessAssessment, Document, Restriction, and ReactivationDecision records.
- [X] Generate unique customer IDs.
- [X] Detect duplicate Ghana Card records.
- [X] Mask Ghana Card in ordinary views.
- [X] Store prototype documents privately.
- [X] Record document versions and access events.
- [X] Block restricted borrowers from new applications.

### Result

Loan Officers can demonstrate controlled borrower onboarding, evidence, restriction, and reactivation.

---

## Stage 5 — Build groups and membership history

### Pages

- [X] `/workspace/groups` — directory, status, officer, and readiness.
- [X] `/workspace/groups/new` — group details and initial members.
- [X] `/workspace/groups/[id]` — membership, agreement, snapshots, documents, and history.
- [X] Effective-dated membership-change flow.
- [X] Independent group-activation review.

### Backend work

- [X] Create Group, GroupMembership, GroupAgreement, GroupVisit, and GroupStatusEvent records.
- [X] Require at least five verified consenting members.
- [X] Require a signed joint-liability agreement.
- [X] Append membership events instead of overwriting history.
- [X] Preserve exited members on earlier guarantee snapshots.
- [X] Exclude later members from earlier snapshots.

### Tests

- [ ] Reject activation with four eligible members.
- [ ] Activate with five or more eligible members.
- [ ] Preserve history after joins and exits.

### Result

The prototype proves who belonged to each group and which historical loans they guaranteed.

---

## Stage 6 — Build loan applications and schedules

### Pages

- [X] `/workspace/loan-applications` — lifecycle queues.
- [X] `/workspace/loan-applications/new` — borrower, group, purpose, product terms, documents, and schedule preview.
- [X] `/workspace/loan-applications/[id]` — detail and event history.

### Business logic

- [X] Seed versioned product `GROUP_FLAT_20`.
- [X] Limit terms to six months.
- [X] Support weekly, fortnightly, and monthly frequencies.
- [X] Calculate flat interest as 20% of original principal.
- [X] Calculate total repayment as principal plus interest.
- [X] Allocate five-sixths principal and one-sixth interest.
- [X] Round to pesewas and absorb the remainder in the final instalment.
- [X] Implement seven-day, fourteen-day, and calendar-month recurrence.
- [X] Implement month-end and next-business-day collection rules.
- [X] State that actual cash-out anchors the final contract schedule.
- [X] Enforce one active loan and one nonterminal application per borrower.

### Tests

- [ ] GHS 10,000 produces GHS 2,000 interest and GHS 12,000 total.
- [ ] Test weekly, fortnightly, monthly, month-end, leap-year, and weekend dates.
- [ ] Confirm exact component and contract totals.

### Result

The owner can create a real application and inspect a mathematically correct schedule.

---

## Stage 7 — Build independent manager approval

### Pages and backend

- [X] `/workspace/loan-applications/[id]/review` — borrower, evidence, submitted terms, guarantors, and decision.
- [X] Manager approval queue.
- [X] Freeze a versioned submitted-terms snapshot.
- [X] Freeze verified guarantors and agreement versions.
- [X] Require an independent Manager.
- [X] Require an approval or rejection reason.
- [X] Record decision actor and time.
- [X] Move approved loans to awaiting disbursement.
- [X] Require a new controlled decision for changed terms.

### Result

Every decision is independent, reasoned, and supported by immutable prototype evidence.

---

## Stage 8 — Build the prototype accounting engine

### Core work

- [X] Create LedgerAccount, AccountingPeriod, JournalEntry, JournalLine, and Reversal records.
- [X] Seed the provisional chart of accounts.
- [X] Store money as integer pesewas.
- [X] Require balanced journals.
- [X] Link journals to source events and actors.
- [X] Prevent editing and deletion of posted journals.
- [X] Support linked reversal and replacement entries.

### Posting rules

- [X] Post loan disbursement.
- [X] Post elapsed-term interest accrual.
- [X] Post cash receipt principal and interest components.
- [X] Post custody transfer after verified handover.
- [X] Post unidentified cash to suspense.
- [X] Post excess cash to customer-overpayment liability.
- [X] Post joint-liability contributions against the original borrower.
- [X] Prevent duplicate posting of one source event.

### Result

Every prototype money workflow has a visible and balanced accounting effect.

---

## Stage 9 — Build capital source and use

### Pages and backend

- [X] `/workspace/capital` — verified, reserved, available, excluded, and allocated balances.
- [X] Funding-lot detail and forward/backward trace.
- [X] Create FundAccount, FundLot, FundMovement, FundingReservation, and FundAllocation records.
- [X] Seed fictional owner-capital lots.
- [X] Support available, reserved, committed, disbursed, recovered, and cancelled states.
- [X] Exclude custody, receivables, suspense, overpayments, and investor funds.
- [X] Prevent allocation above a lot's available balance.
- [X] Trace recovered principal separately from interest.

### Result

The owner can trace verified prototype funds into loans and subsequent recovery.

---

## Stage 10 — Build controlled cash disbursement

### Pages and backend

- [X] `/workspace/disbursements` — approved loans awaiting cash release.
- [X] Disbursement detail with beneficiary, reservation, voucher, authorization, and preview.
- [X] Create Disbursement and CashVoucher records.
- [X] Require approved loan and verified funding reservation.
- [X] Confirm borrower identity and beneficiary.
- [X] Require signed contract, voucher, and manager authorization.
- [X] Generate unique reference and idempotency key.
- [X] Record actual physical cash-out date.
- [X] Consume reservation, post journal, activate loan, and anchor schedule together.
- [X] Prevent duplicate release.

### Result

The owner can demonstrate one traceable release from verified capital to an active loan.

---

## Stage 11 — Build collector assignments and mobile cash receipts

### Mobile pages

- [X] `/field/assignments` — route, target, stops, receipts, and custody.
- [X] `/field/loans/[id]/collect` — borrower confirmation and cash entry.
- [X] `/field/receipts/[id]` — numbered receipt confirmation.
- [X] `/field/receipts` — collector receipt history.

### Backend work

- [X] Create Assignment, Payment, PaymentAllocation, Receipt, and CustodyMovement records.
- [X] Accept cash only.
- [X] Require online submission.
- [X] Allow partial and full payment.
- [X] Allocate oldest due first and pro rata across schedule components.
- [X] Prohibit manual allocation override.
- [X] Generate a numbered receipt exactly once.
- [X] Reduce borrower debt and increase collector custody together.
- [X] Keep collector cash unavailable for lending.

### Result

The owner can see the field flow from assigned stop through receipt and custody.

---

## Stage 12 — Build receipt register, handover, and reconciliation

### Pages and backend

- [X] `/workspace/cash-collections` — receipt lifecycle register.
- [X] Receipt detail with allocation, custody, balance, and correction links.
- [X] `/field/handovers/new` — prepare a receipt batch.
- [X] `/workspace/handovers` and detail — count, discrepancy, and verification.
- [X] Create Handover, HandoverReceipt, DenominationCount, Reconciliation, and Exception records.
- [X] Support captured, handed-over, verified, posted, and reversed states.
- [X] Prevent one receipt entering multiple active handovers.
- [X] Require a checker different from the collector.
- [X] Transfer verified custody to company cash without reducing borrower debt again.
- [X] Demonstrate shortage, excess, and unidentified-cash exceptions.

### Result

The prototype clearly separates payment recognition, collector custody, and spendable company cash.

---

## Stage 13 — Build portfolio and early settlement

### Pages and behavior

- [X] `/workspace/loans` — searchable and filterable portfolio.
- [X] `/workspace/loans/[id]` — schedule, receipts, balance, activity, guarantee, documents, and journals.
- [X] Display contractual and effective due dates.
- [X] Keep contractual balance separate from accrued accounting income.
- [X] Produce a dated early-settlement quote.
- [X] Include all remaining principal and contractual interest.
- [X] Apply no rebate, waiver, penalty, or restructuring.
- [X] Close repaid loans while retaining history.

### Result

The owner can inspect a loan from disbursement to closure and reproduce its balance.

---

## Stage 14 — Build arrears and joint liability

### Pages and backend

- [X] `/workspace/arrears` — aging list and filters.
- [X] Arrears detail with notices, guarantors, calculation, dispute, and decision.
- [X] Mark arrears immediately after effective due date with zero grace.
- [X] Calculate days past due.
- [X] Use the frozen guarantee snapshot.
- [X] Divide eligible unpaid amounts equally.
- [X] Allocate remainder pesewas deterministically.
- [X] Require Manager approval before collection.
- [X] Apply contributions to the original borrower receivable.
- [X] Create no duplicate income, new loan, or reimbursement claim.

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

- [X] Reversal request and independent approval queue.
- [X] Suspense register and resolution flow.
- [X] Customer-overpayment liability and refund flow.
- [X] Preserve original receipt and journal.
- [X] Reverse ledger and subledger effects together.
- [X] Repost corrections under a new reference.
- [X] Keep suspense out of borrower balances and funding availability.
- [X] Verify payer and Manager approval before refund.
- [X] Prevent refunds above recorded liability.

### Result

Prototype mistakes can be corrected without hiding or deleting history.

---

## Stage 16 — Build accounting views and prototype reports

### Pages

- [X] `/workspace/accounting` — journal and ledger search.
- [X] Account activity view.
- [X] Monthly close-readiness preview.
- [X] Prototype report library.

### Reports and controls

- [X] Trial balance, financial position, income statement, and cash flow.
- [X] General ledger.
- [X] Portfolio and aging.
- [X] Collections and custody.
- [X] Interest accrual and credit-loss provision preview.
- [X] Capital source and use.
- [X] Reversals and exceptions.
- [X] Open and closed prototype period display.
- [X] Block ordinary posting to a closed period.
- [X] Demonstrate controlled reopening.
- [X] Reconcile report summaries to seeded detail.
- [X] Export core tables to CSV.

### Result

The owner can follow operational events into journals and management reports.

---

## Stage 17 — Build dashboards and role-specific work queues

### Dashboard work

- [X] Manager overview with receivables, custody, available cash, receipts, aging, decisions, and exceptions.
- [X] Loan Officer queue for borrowers, groups, drafts, and submissions.
- [X] Collector view for assignments, receipts, custody, and handovers.
- [X] Finance view for reconciliation, journals, close, and exceptions.
- [X] Auditor read-only traceability view.
- [X] Administrator view for security, roles, sign-offs, and investor gates.
- [X] Define every KPI formula.
- [X] Link summary cards to filtered detail pages.
- [X] Exclude nonspendable balances from available funding.

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
