# Archived Full Technical Checklist — Superseded

This phase implements the approved Divya Pravaha business blueprint as a secure, auditable production system. It covers application architecture, database rules, pages, APIs, security, testing, deployment, monitoring, backups, migration, and launch.

The [System Requirements v1.1](system-requirements-v1.1.json) are authoritative. The [Phase 1 Business Operations Checklist](PHASE_1_BUSINESS_BUILD_CHECKLIST.md) supplies the approved operational interpretation. UI screenshots guide appearance and layout only; they do not override business rules.

## What Phase 2 will deliver

At the end of Phase 2:

- Authorized staff can operate borrowers, groups, loans, cash disbursements, collections, handovers, arrears, accounting, and capital attribution.
- Financial mutations are transactional, idempotent, balanced, permission-checked, and auditable.
- The application works on desktop and field-collector mobile screens.
- Private identity and contract documents remain protected.
- Reports reconcile with source transactions and the general ledger.
- Backups, monitoring, recovery, training, user acceptance, and production support are ready.
- Investor functionality remains technically gated until all Phase 1 legal and accounting approvals exist.

## Main application areas

| Area | Example routes | Primary users |
| --- | --- | --- |
| Authentication | `/login`, `/mfa`, `/forgot-password` | All staff |
| Overview | `/workspace/overview` | Managers, authorized finance users |
| Borrowers | `/workspace/borrowers` | Loan Officers, Managers |
| Groups | `/workspace/groups` | Loan Officers, Managers |
| Applications | `/workspace/loan-applications` | Loan Officers, Managers |
| Disbursements | `/workspace/disbursements` | Managers, Cashier/Accountants |
| Portfolio | `/workspace/loans` | Authorized operational staff |
| Collections | `/workspace/cash-collections` | Collectors, Cashier/Accountants |
| Handovers | `/workspace/handovers` | Collectors, Cashier/Accountants |
| Arrears | `/workspace/arrears` | Loan Officers, Managers |
| Accounting | `/workspace/accounting` | Cashier/Accountants, Auditors |
| Capital source and use | `/workspace/capital` | Managers, Finance, Auditors |
| Administration | `/workspace/administration` | System Administrators, authorized reviewers |
| Field collector | `/field/assignments`, `/field/receipts`, `/field/handovers` | Field Collectors |

Routes are proposed and may be refined during implementation without changing the underlying business requirements.

---

## Stage 0 — Establish project governance and requirement traceability

### Project setup

- [ ] Initialize Git version control and protect the main branch.
- [ ] Add a project README with local setup and architectural boundaries.
- [ ] Add contribution, review, migration, and release procedures.
- [ ] Record the authoritative requirements version in the repository.
- [ ] Create a requirement-to-feature-and-test traceability register.
- [ ] Record UI screenshots as non-authoritative design references.
- [ ] Add architecture decision records for consequential choices.

### Delivery controls

- [ ] Define development, test, staging, and production environments.
- [ ] Define code-review requirements and protected financial modules.
- [ ] Define the release versioning and rollback procedure.
- [ ] Define who may approve schema migrations and production releases.
- [ ] Create an issue template that links work to a requirement and acceptance test.

### Result

Every implemented feature can be traced to an approved requirement, review, and automated or manual test.

---

## Stage 1 — Create the application foundation

### Stack and structure

- [ ] Create a Next.js App Router project with TypeScript.
- [ ] Configure Tailwind CSS and the royal-blue/white design tokens.
- [ ] Configure PostgreSQL and Prisma.
- [ ] Organize the application as a modular monolith.
- [ ] Keep business rules in server-only domain services rather than React components.
- [ ] Separate identity, groups, loans, collections, guarantees, capital, investors, accounting, documents, notifications, and reporting modules.
- [ ] Create shared money, date, ID, validation, permission, and error utilities.

### Environment

- [ ] Provide a local PostgreSQL setup.
- [ ] Add validated environment-variable configuration.
- [ ] Prevent secrets from entering source control or client bundles.
- [ ] Add development seed data clearly marked as fictional.
- [ ] Add repeatable commands for install, migrate, seed, lint, type-check, test, and build.
- [ ] Configure continuous integration for all required checks.

### Application behavior

- [ ] Add consistent API/action success and error shapes.
- [ ] Add request correlation IDs.
- [ ] Add safe error boundaries and not-found pages.
- [ ] Add Ghana cedi formatting and Africa/Accra display dates while storing timestamps in UTC.
- [ ] Store money as integer pesewas.

### Result

A developer can start the database and application, run migrations and tests, and open a stable empty workspace.

---

## Stage 2 — Build authentication, MFA, sessions, and authorization

### Staff pages

- [ ] `/login` — individual staff email and password sign-in.
- [ ] `/mfa` — authenticator-code or recovery-code verification.
- [ ] `/forgot-password` — safe reset request.
- [ ] `/reset-password/[token]` — controlled password reset.
- [ ] `/account/security` — password, MFA enrollment, recovery codes, and session management.

### Security behavior

- [ ] Use secure HTTP-only sessions with appropriate SameSite and Secure settings.
- [ ] Protect unsafe browser requests against CSRF.
- [ ] Require server-side authorization for every page load and mutation.
- [ ] Require MFA for System Administrator, Manager, Cashier/Accountant, and Investor Portfolio Officer.
- [ ] Support optional policy expansion of MFA to other roles.
- [ ] Rate-limit sign-in, MFA, recovery, and reset attempts.
- [ ] Invalidate sessions after password reset, deactivation, or material role change.
- [ ] Never place session, reset, MFA, or private authorization tokens in browser storage.
- [ ] Record sign-in, failed authentication, MFA, reset, session-revocation, and permission-change events.

### Authorization

- [ ] Implement the eight roles from the system requirements.
- [ ] Restrict data by branch assignment.
- [ ] Implement maker-checker validation that compares actual user identities.
- [ ] Ensure System Administrators receive no financial posting or approval authority by default.
- [ ] Ensure Auditors are read-only.
- [ ] Gate every investor permission behind legal activation.

### Tests

- [ ] Test successful and failed password authentication.
- [ ] Test MFA requirement and recovery codes.
- [ ] Test session expiry and revocation.
- [ ] Test every role against every protected action.
- [ ] Test cross-branch access denial.
- [ ] Test maker cannot be checker.
- [ ] Test deactivated staff cannot sign in.

### Result

Every user acts through a named, role-scoped identity, with strong verification and server-enforced boundaries.

---

## Stage 3 — Build the shared workspace and responsive design system

### Shared components

- [ ] Desktop sidebar with branch selector and role-appropriate navigation.
- [ ] Mobile collector header and bottom navigation.
- [ ] Page header, breadcrumb, branch/date/currency context, and user menu.
- [ ] Buttons, links, cards, badges, tabs, tables, pagination, filters, and empty states.
- [ ] Accessible form controls, validation summaries, dialogs, notifications, and confirmation screens.
- [ ] Currency, amount, status, timestamp, actor, and reference components.
- [ ] Loading, retry, offline-blocked, permission-denied, and system-error states.
- [ ] Printable receipt, voucher, statement, and report layouts.

### Design guidance

- [ ] Use the supplied screenshots for visual hierarchy, density, navigation, and responsive intent.
- [ ] Apply the official logo and royal-blue/white palette.
- [ ] Avoid copying sample values or fictional statuses into production data.
- [ ] Show authoritative terminology from the requirements even when screenshot wording differs.
- [ ] Ensure mobile cash capture clearly blocks offline issuance.

### Accessibility

- [ ] Provide keyboard navigation and visible focus.
- [ ] Label all fields and status icons.
- [ ] Meet readable contrast and scalable-text requirements.
- [ ] Provide screen-reader status announcements for asynchronous mutations.
- [ ] Respect reduced-motion preferences.

### Result

All later modules use one consistent, accessible desktop and mobile workspace.

---

## Stage 4 — Build branches, staff administration, and audit foundations

### Administration pages

- [ ] `/workspace/administration/branches` — list and manage branches.
- [ ] `/workspace/administration/staff` — create, deactivate, and assign staff.
- [ ] `/workspace/administration/roles` — inspect controlled permissions.
- [ ] `/workspace/administration/security` — MFA and session policy status.
- [ ] `/workspace/administration/audit` — append-only audit search and export.
- [ ] `/workspace/administration/policy-signoffs` — record approved policy evidence.
- [ ] `/workspace/administration/investor-gates` — show locked activation requirements.

### Data and backend work

- [ ] Create User, Role, UserRole, Branch, StaffBranchAssignment, Session, and MFA records.
- [ ] Create immutable AuditEvent records with actor, branch, event, target, timestamp, correlation ID, and safe metadata.
- [ ] Create effective-dated permission and branch assignments.
- [ ] Prevent hard deletion of referenced staff and branches.
- [ ] Audit private-document viewing and export.
- [ ] Add date-range, actor, branch, event, and record filters.

### Tests

- [ ] Confirm branch-required records cannot be saved without a branch.
- [ ] Confirm deactivated branches cannot receive new operational records.
- [ ] Confirm historical records retain original branch and actor.
- [ ] Confirm audit records cannot be edited through application endpoints.

### Result

The system has controlled organizational boundaries and a trustworthy record of security and business actions.

---

## Stage 5 — Build borrowers, private documents, and restrictions

### Pages

- [ ] `/workspace/borrowers` — searchable borrower directory and status filters.
- [ ] `/workspace/borrowers/new` — guided borrower onboarding.
- [ ] `/workspace/borrowers/[id]` — identity, business, group, loans, consent, documents, restrictions, and history.
- [ ] `/workspace/borrowers/[id]/restrictions` — controlled restriction and reactivation workflow.

### Data and domain work

- [ ] Create Borrower, ConsentRecord, BorrowerVerification, BusinessAssessment, Restriction, ReactivationDecision, and Document records.
- [ ] Generate immutable internal IDs and unique customer references.
- [ ] Normalize and search phone numbers safely.
- [ ] Detect potential duplicates by Ghana Card and other controlled identity attributes.
- [ ] Mask Ghana Card in ordinary views.
- [ ] Store files in encrypted private object storage using nonpublic identifiers.
- [ ] Validate file type and size and run malware scanning.
- [ ] Use time-limited authorized downloads and log access.
- [ ] Preserve version history instead of overwriting evidence.

### Tests

- [ ] Reject missing required identity and consent data.
- [ ] Reject duplicate Ghana Card records.
- [ ] Prevent unauthorized document access and guessed URLs.
- [ ] Block restricted borrowers from new applications.
- [ ] Require manager approval and new evidence for reactivation.

### Result

Loan Officers can onboard borrowers while sensitive evidence and restriction history remain protected.

---

## Stage 6 — Build groups, memberships, and guarantee history

### Pages

- [ ] `/workspace/groups` — group list, status, branch, officer, and readiness.
- [ ] `/workspace/groups/new` — create a group and select initial members.
- [ ] `/workspace/groups/[id]` — members, readiness, agreements, guarantee snapshots, and history.
- [ ] `/workspace/groups/[id]/membership-change` — effective-dated join, exit, suspension, or reactivation.
- [ ] `/workspace/groups/[id]/activation` — independent activation review.

### Data and domain work

- [ ] Create Group, GroupMembership, GroupAgreement, GroupVisit, GroupStatusEvent, and GroupComplaint records.
- [ ] Enforce a minimum of five verified consenting current members for activation.
- [ ] Enforce the approved maximum group size when management supplies it.
- [ ] Require a signed agreement before activation.
- [ ] Store membership as append-only effective-dated events.
- [ ] Prevent later membership changes from rewriting loan guarantee snapshots.
- [ ] Record all group-status changes with actor, reason, and evidence.

### Tests

- [ ] Reject activation with four eligible members.
- [ ] Allow activation with five eligible members and signed evidence.
- [ ] Reject unverified or nonconsenting members from the activation count.
- [ ] Confirm a later exit does not alter existing snapshots.
- [ ] Confirm a later join does not enter an earlier snapshot.

### Result

The application can prove group eligibility and preserve historical obligations across membership changes.

---

## Stage 7 — Build loan products, applications, schedules, and approval

### Pages

- [ ] `/workspace/loan-applications` — draft, submitted, review, approved, and rejected queues.
- [ ] `/workspace/loan-applications/new` — borrower, group, product terms, purpose, documents, and schedule preview.
- [ ] `/workspace/loan-applications/[id]` — versioned application history.
- [ ] `/workspace/loan-applications/[id]/review` — manager review, snapshot, reason, approval, or rejection.

### Data and domain work

- [ ] Create LoanProductVersion, LoanApplication, ApplicationVersion, LoanApproval, LoanContract, Instalment, and GuaranteeSnapshot records.
- [ ] Seed `GROUP_FLAT_20` as a versioned product rather than hard-code UI behavior.
- [ ] Enforce one active loan and one nonterminal application per borrower.
- [ ] Calculate 20% flat interest in integer pesewas.
- [ ] Support weekly, fortnightly, and monthly schedules up to six months.
- [ ] Implement month-end and next-business-day effective collection rules.
- [ ] Allocate five-sixths principal and one-sixth interest, with final-instalment remainder correction.
- [ ] Treat pre-disbursement schedule dates as previews.
- [ ] Freeze approved terms, evidence versions, and guarantee members.
- [ ] Require an independent Manager and decision reason.
- [ ] Prevent approved records from being edited in place.

### Tests

- [ ] Verify GHS 10,000 produces GHS 2,000 interest and GHS 12,000 total.
- [ ] Test weekly and fortnightly interval dates.
- [ ] Test January 31 monthly recurrence and leap years.
- [ ] Test weekend and public-holiday adjustment.
- [ ] Test pesewa rounding and exact contract totals.
- [ ] Test one-active-loan and application limits under concurrency.
- [ ] Test maker cannot approve their application.

### Result

Applications move through a controlled lifecycle and produce reproducible contracts, schedules, and immutable approval evidence.

---

## Stage 8 — Build the accounting engine before money workflows

### Core ledger

- [ ] Create LedgerAccount, AccountingPeriod, JournalEntry, JournalLine, ReversalRequest, and Reversal records.
- [ ] Seed the approved chart of accounts.
- [ ] Store debit and credit amounts as integer pesewas.
- [ ] Require every journal to balance inside one database transaction.
- [ ] Link every journal to its source business event.
- [ ] Prevent update and delete operations on posted journals.
- [ ] Implement linked reversal and replacement posting.
- [ ] Implement open, closing, closed, and reopened period states.
- [ ] Prevent posting to a closed period.
- [ ] Require maker-checker approval to reopen a period.

### Posting services

- [ ] Implement loan-disbursement principal posting.
- [ ] Implement daily loan-interest accrual posting.
- [ ] Implement collector cash receipt postings by component.
- [ ] Implement custody-transfer posting on verified handover.
- [ ] Implement unidentified-receipt suspense posting.
- [ ] Implement overpayment liability and refund posting.
- [ ] Implement joint-liability contribution posting against the original borrower.
- [ ] Keep investor postings compiled or feature-gated off until activation.

### Tests

- [ ] Reject unbalanced journals.
- [ ] Reject direct mutation of posted entries.
- [ ] Verify a reversal preserves original history.
- [ ] Verify duplicate source events cannot post twice.
- [ ] Verify loan contractual balance differs correctly from accrued accounting interest.
- [ ] Reconcile subledger balances to control accounts.

### Result

All later money workflows post through one tested accounting boundary rather than inventing balances in UI code.

---

## Stage 9 — Build capital availability, reservations, and cash disbursement

### Pages

- [ ] `/workspace/capital` — verified, reserved, committed, disbursed, recovered, and excluded balances.
- [ ] `/workspace/capital/lots/[id]` — source evidence and allocation trace.
- [ ] `/workspace/disbursements` — approved loans awaiting cash release.
- [ ] `/workspace/disbursements/[id]` — beneficiary, evidence, reservation, authorization, voucher, and posting preview.

### Data and domain work

- [ ] Create FundAccount, FundMovement, FundLot, FundingReservation, FundAllocation, Disbursement, and CashVoucher records.
- [ ] Treat the general ledger as accounting truth and capital attribution as a management subledger.
- [ ] Exclude collector custody, receivables, suspense, overpayments, and locked investor funds from availability.
- [ ] Reserve cash atomically and reject over-allocation.
- [ ] Use unique disbursement references and idempotency keys.
- [ ] Require approved loan, verified reservation, beneficiary confirmation, signed voucher, and manager authorization.
- [ ] On physical release, post the ledger, consume reservation, activate loan, and anchor schedule in one transaction.
- [ ] Prevent duplicate cash release under concurrency and retries.

### Tests

- [ ] Two concurrent reservations cannot spend the same pesewa.
- [ ] Collector-held cash cannot fund a loan.
- [ ] Outstanding receivables cannot fund a loan.
- [ ] Duplicate disbursement requests return the original outcome without a second posting.
- [ ] Failed transactions leave no partial activation or journal.

### Result

Only verified available cash can be released, exactly once, to an approved and confirmed borrower.

---

## Stage 10 — Build field assignments and cash receipt capture

### Mobile pages

- [ ] `/field/assignments` — today's route, targets, stops, and custody summary.
- [ ] `/field/loans/[id]/collect` — borrower confirmation, due amount, cash input, date, note, and allocation preview.
- [ ] `/field/receipts/[id]` — numbered receipt confirmation and printable/shareable copy.
- [ ] `/field/receipts` — collector's recent receipts and lifecycle status.

### Data and domain work

- [ ] Create CollectorAssignment, Payment, PaymentAllocation, Receipt, and CollectorCustodyMovement records.
- [ ] Require live server submission; do not queue offline receipts.
- [ ] Issue unique receipt numbers under concurrency.
- [ ] Accept only cash and reject disabled payment channels server-side.
- [ ] Support partial and full payments.
- [ ] Allocate oldest due first and pro rata across schedule components.
- [ ] Prohibit manual allocation override.
- [ ] Reduce borrower debt and debit collector custody in one transaction.
- [ ] Record actual received date separately from system timestamp.
- [ ] Use an idempotency key to prevent duplicate capture.

### Tests

- [ ] GHS 300 allocates GHS 250 principal and GHS 50 interest for this product.
- [ ] Partial payment leaves the correct due and contract balances.
- [ ] Repeated submission does not create a second receipt.
- [ ] Offline state blocks receipt issuance clearly.
- [ ] Collector cannot post directly to company cash or relend custody cash.
- [ ] Unauthorized branch or assignment access is denied.

### Result

Collectors can safely issue immediate evidence while the system keeps borrower debt and physical custody synchronized.

---

## Stage 11 — Build handovers, cash counts, reconciliation, and exceptions

### Pages

- [ ] `/field/handovers/new` — prepare a batch from eligible receipts.
- [ ] `/workspace/handovers` — submitted, returned, verified, and posted batches.
- [ ] `/workspace/handovers/[id]` — receipt list, denomination count, evidence, discrepancy, and approval.
- [ ] `/workspace/exceptions` — shortage, excess, suspense, late handover, and correction queue.

### Data and domain work

- [ ] Create CollectorCashHandover, HandoverReceipt, CashDenominationCount, Reconciliation, and ReconciliationException records.
- [ ] Prevent one receipt from entering two active handovers.
- [ ] Require checker identity to differ from collector identity.
- [ ] Compare expected and counted amounts.
- [ ] Transfer custody to cash on hand only after independent verification.
- [ ] Avoid a second borrower-debt reduction during handover.
- [ ] Post excess unidentified cash to suspense.
- [ ] Retain signed count records and immutable batch history.
- [ ] Support return-for-clarification without losing the submitted evidence.

### Tests

- [ ] Balanced handover posts the correct custody transfer.
- [ ] Shortage or excess creates an exception and follows policy.
- [ ] Collector cannot verify their own handover.
- [ ] Repeated verification does not post twice.
- [ ] Borrower balances remain unchanged at handover.

### Result

Physical cash, numbered receipts, collector custody, and company cash reconcile through an independent workflow.

---

## Stage 12 — Build loan portfolio, arrears, and joint liability

### Pages

- [ ] `/workspace/loans` — portfolio search, status, branch, group, collector, and aging filters.
- [ ] `/workspace/loans/[id]` — schedule, receipts, activity, guarantee, documents, and settlement quote.
- [ ] `/workspace/arrears` — aging work list and assessment status.
- [ ] `/workspace/arrears/[id]` — unpaid amount, frozen guarantors, notices, disputes, calculation, and decision.

### Data and domain work

- [ ] Create DelinquencyEvent, Notice, JointLiabilityEvent, LiabilityAssessment, LiabilityContribution, and Dispute records.
- [ ] Calculate delinquency immediately after the effective due date with zero grace days.
- [ ] Keep arrears aging based on principal exposure and approved metric definitions.
- [ ] Use the loan's frozen guarantee snapshot.
- [ ] Divide assessments equally with deterministic remainder assignment.
- [ ] Require Manager approval before contribution collection.
- [ ] Block collection while disputed or pending approval according to policy.
- [ ] Apply contributions to the original borrower receivable without new income.
- [ ] Produce early-settlement quotes with no interest rebate.

### Tests

- [ ] GHS 100 among four guarantors produces GHS 25 each.
- [ ] Nondivisible pesewa remainder is deterministic and totals exactly.
- [ ] Exited snapshot members remain eligible unless legally released.
- [ ] Later members are excluded from older guarantees.
- [ ] Contribution does not create new loan principal or income.
- [ ] No collection is permitted before approval.
- [ ] Early settlement includes all remaining contractual interest.

### Result

Portfolio servicing and joint liability follow frozen contractual evidence and exact accounting treatment.

---

## Stage 13 — Build reversals, refunds, suspense, and controlled corrections

### Pages

- [ ] `/workspace/cash-collections` — receipt register and lifecycle filters.
- [ ] `/workspace/cash-collections/[id]` — allocation, custody, handover, posting, and correction history.
- [ ] `/workspace/reversals` — requests, evidence, checker decision, and linked entries.
- [ ] `/workspace/refunds` — verified overpayment liabilities and approved payouts.
- [ ] `/workspace/suspense` — unidentified amounts and resolution workflow.

### Domain work

- [ ] Require reason, evidence, maker, checker, and target for reversal requests.
- [ ] Reverse all affected subledger and ledger records atomically.
- [ ] Preserve original receipt and journal as posted history.
- [ ] Repost corrected activity under a new reference.
- [ ] Confirm payer identity before refund approval.
- [ ] Prevent refund above the outstanding overpayment liability.
- [ ] Prevent suspense from reducing borrower debt or funding a loan.
- [ ] Record every resolution and remaining balance.

### Tests

- [ ] Posted records cannot be edited or deleted.
- [ ] Maker cannot approve their reversal.
- [ ] Full and partial correction cases reconcile.
- [ ] Refund cannot exceed liability.
- [ ] Duplicate refund or reversal execution is idempotent.

### Result

Errors can be corrected without erasing evidence or causing duplicate cash, income, or borrower reductions.

---

## Stage 14 — Build accounting operations, close, and financial reports

### Pages

- [ ] `/workspace/accounting` — journal and ledger search.
- [ ] `/workspace/accounting/accounts/[id]` — account activity and balance.
- [ ] `/workspace/accounting/close` — period readiness and close pack.
- [ ] `/workspace/accounting/reports` — controlled financial report library.

### Scheduled and close work

- [ ] Add reliable scheduled daily interest accrual.
- [ ] Make scheduled jobs idempotent and retry-safe.
- [ ] Calculate provisional credit-loss provisions by approved aging bands.
- [ ] Check cash reconciliation, counts, exceptions, trial balance, accruals, and manager review.
- [ ] Close a month only when all required controls pass.
- [ ] Generate a versioned close pack.
- [ ] Support controlled reopening with independent authorization and audit.

### Reports

- [ ] Trial balance.
- [ ] Statement of financial position.
- [ ] Income statement.
- [ ] Cash-flow statement.
- [ ] General ledger.
- [ ] Portfolio and aging.
- [ ] Collections and custody.
- [ ] Interest accrual.
- [ ] Credit-loss provision.
- [ ] Fund source and use.
- [ ] Reversals and exceptions.

### Accuracy tests

- [ ] Reconcile every report total to journals and detailed source records.
- [ ] Test inclusive local-date boundaries.
- [ ] Test reversal and refund treatment.
- [ ] Test closed-period protection.
- [ ] Test daily accrual retries and missed-run recovery.
- [ ] Test report authorization and branch scope.

### Result

Finance can close periods and produce reports that reconcile to immutable source transactions.

---

## Stage 15 — Build dashboards, exports, notifications, and operational queues

### Dashboards

- [ ] Manager overview with receivables, custody, verified available cash, receipts, arrears, approvals, and exceptions.
- [ ] Collector overview with assignments, amounts due, receipts, custody, and handovers.
- [ ] Finance overview with cash, reconciliation, accrual, close, and exception status.
- [ ] Audit overview with reversals, approvals, document access, and traceability.
- [ ] Investor dashboard only after activation gates are satisfied.

### Operational queues

- [ ] Pending loan approvals.
- [ ] Cash disbursements awaiting release.
- [ ] Handovers awaiting verification.
- [ ] Unidentified cash and overpayments.
- [ ] Arrears and joint-liability decisions.
- [ ] Reversal and refund requests.
- [ ] Policy, close, and investor activation gates.

### Exports and notifications

- [ ] Add permission-scoped CSV exports.
- [ ] Add branded printable/PDF reports where required.
- [ ] Record export actor, filter, time, and purpose where sensitive.
- [ ] Build in-system alerts for assignments, decisions, handovers, arrears, exceptions, close, and maturities.
- [ ] Add email or SMS only after vendor and consent decisions are approved.
- [ ] Ensure notification retries cannot repeat the underlying business transaction.

### Result

Each role sees actionable information and trustworthy totals without gaining unauthorized access.

---

## Stage 16 — Build the legally gated investor module

Do not begin operational activation until every Phase 1 investor gate is approved. Technical scaffolding may remain disabled and inaccessible.

### Pages after approval

- [ ] `/workspace/investors` — verified investor directory.
- [ ] `/workspace/investors/[id]` — identity, contracts, receipts, capital attribution, and statements.
- [ ] `/workspace/investments/[id]` — principal, rate, term, accrual, schedule, maturity, and adjustments.
- [ ] `/workspace/investor-payouts` — maker-checker payout queue.
- [ ] `/investor` — own-contract read-only portal.

### Data and domain work after approval

- [ ] Create Investor, InvestmentContract, InvestmentReceipt, ReturnSchedule, ReturnAccrual, InvestorPayout, and CapitalRepayment records.
- [ ] Implement the legally approved return calculation, not an assumed formula.
- [ ] Record actual cleared funds before recognizing investor principal.
- [ ] Attribute capital through the management subledger while keeping contractual liabilities separate.
- [ ] Accrue and post returns according to approved accounting treatment.
- [ ] Require cleared funding and maker-checker approval for payouts.
- [ ] Generate statements and maturity alerts.

### Feature-gate tests

- [ ] Block all investor transactions while any activation gate is incomplete.
- [ ] Exclude draft/sample investor records from all operational balances.
- [ ] Test permissions, calculations, maturity, partial capital repayment, and payout idempotency after approval.

### Result

Investor functions are either unavailable or operate strictly under approved legal, contractual, and accounting rules.

---

## Stage 17 — Add privacy, security hardening, and abuse protection

### Application security

- [ ] Create a threat model for authentication, finance, documents, exports, and integrations.
- [ ] Validate all inputs on the server.
- [ ] Apply least privilege to application, database, storage, and deployment credentials.
- [ ] Add rate limits to authentication, search, exports, uploads, and sensitive mutations.
- [ ] Add content-security, transport-security, framing, MIME, and referrer headers.
- [ ] Protect against injection, cross-site scripting, CSRF, insecure direct-object references, and mass assignment.
- [ ] Prevent sensitive values from entering logs or error responses.
- [ ] Scan dependencies, code, containers, and committed content for vulnerabilities and secrets.

### Privacy

- [ ] Implement consent and privacy-notice version history.
- [ ] Implement access logging for identity and contract documents.
- [ ] Apply the approved retention schedule.
- [ ] Support authorized data-access and correction requests.
- [ ] Prevent deletion where financial or legal retention requires preservation.
- [ ] Record the production data-controller and processor details.

### Security tests

- [ ] Test every API and server action for role and branch access.
- [ ] Test identifier tampering across borrowers, loans, documents, and journals.
- [ ] Test upload restrictions and malware failure handling.
- [ ] Test session theft mitigations, logout, expiry, and revocation.
- [ ] Complete an independent security review before launch.

### Result

Sensitive identity and financial operations are protected beyond ordinary UI-level permissions.

---

## Stage 18 — Add observability, jobs, backups, and disaster recovery

### Observability

- [ ] Add health and readiness checks.
- [ ] Add structured logs with correlation IDs and sensitive-data filtering.
- [ ] Add application and browser error monitoring.
- [ ] Add database capacity, slow-query, and connection alerts.
- [ ] Add failed-job, accrual, reconciliation, backup, and security alerts.
- [ ] Define alert ownership and response times.

### Background work

- [ ] Use a reliable scheduler/worker for accruals, alerts, exports, and notifications.
- [ ] Persist job state and idempotency keys.
- [ ] Retry transient failures with bounded backoff.
- [ ] Send permanently failed jobs to an operator-visible queue.
- [ ] Prevent repeated jobs from duplicating journals or business events.

### Backups and recovery

- [ ] Configure encrypted off-site database backups.
- [ ] Configure private-document backup and recovery.
- [ ] Meet or formally revise the provisional 24-hour RPO and 8-hour RTO.
- [ ] Test database and document restoration quarterly.
- [ ] Record restoration evidence and corrective actions.
- [ ] Document regional or provider outage procedures.

### Result

Failures are visible, recoverable, and owned rather than discovered through missing money or unavailable records.

---

## Stage 19 — Complete data migration and opening balances

### Migration preparation

- [ ] Inventory existing borrowers, groups, loans, receipts, balances, restrictions, and documents.
- [ ] Define source-to-target mappings and cleansing rules.
- [ ] Resolve duplicate identities and inconsistent references.
- [ ] Obtain accountant-approved opening cash, receivable, liability, equity, and provision balances.
- [ ] Decide how much historical transaction detail will be imported.
- [ ] Archive source files and record migration provenance.

### Migration execution

- [ ] Build repeatable import tools with dry-run reports.
- [ ] Validate required fields and reject invalid rows safely.
- [ ] Preserve original references where appropriate and generate controlled system IDs.
- [ ] Import opening balances through balanced journals.
- [ ] Reconcile borrower totals, portfolio totals, cash, and ledger control accounts.
- [ ] Obtain business and accountant sign-off before cutover.

### Result

The new system begins with complete, approved balances rather than unexplained opening numbers.

---

## Stage 20 — Test the complete system

### Automated tests

- [ ] Unit-test all money, schedule, allocation, aging, and permission rules.
- [ ] Integration-test every financial transaction boundary.
- [ ] Test database constraints, unique references, and concurrency controls.
- [ ] Test all 17 acceptance tests from the system requirements.
- [ ] Test report reconciliation against independently calculated control totals.
- [ ] Test migrations forward and restoration to a clean database.

### End-to-end scenarios

- [ ] Borrower and group activation through approved loan and cash release.
- [ ] Full and partial repayment through handover and reconciliation.
- [ ] Weekend/month-end schedule and zero-grace delinquency.
- [ ] Joint-liability calculation, approval, contribution, and accounting.
- [ ] Overpayment, refund, unidentified cash, reversal, and repost.
- [ ] Capital reservation, concurrent requests, disbursement, recovery, and recycling.
- [ ] Monthly accrual, provision, close, reopening, and report generation.
- [ ] Role, branch, maker-checker, and private-document boundaries.
- [ ] Investor feature remains locked without approval.

### Compatibility and usability

- [ ] Test mobile, tablet, laptop, and desktop layouts.
- [ ] Test supported Chrome, Edge, Firefox, and Safari versions.
- [ ] Test keyboard and screen-reader navigation.
- [ ] Test slow connections, failed requests, refreshes, and duplicate clicks.
- [ ] Conduct field testing with collectors under realistic network conditions.
- [ ] Conduct performance and load tests using measured operating volumes.

### Result

The application demonstrates correct financial, operational, security, and usability behavior before real data is exposed.

---

## Stage 21 — Stage, train, pilot, and launch

### Staging

- [ ] Deploy a production-like staging environment.
- [ ] Use sanitized or fictional data only.
- [ ] Configure secure storage, jobs, monitoring, backups, and alerts.
- [ ] Complete security and restoration tests in staging.
- [ ] Run business user-acceptance testing against Phase 1 procedures.

### Training and pilot

- [ ] Train each role using realistic end-to-end scenarios.
- [ ] Require users to demonstrate, not merely attend, critical cash workflows.
- [ ] Pilot with one branch or controlled portfolio.
- [ ] Run parallel cash and accounting reconciliation during the pilot.
- [ ] Record issues, correct them, and repeat affected acceptance tests.
- [ ] Obtain business, finance, legal/compliance, and technical launch sign-off.

### Production launch

- [ ] Configure production domain and HTTPS.
- [ ] Configure production database, private storage, workers, email, and monitoring.
- [ ] Load approved configuration, branches, users, policies, opening data, and balances.
- [ ] Verify MFA and least-privilege access for all staff.
- [ ] Take and verify a pre-launch backup.
- [ ] Complete controlled cutover and smoke tests.
- [ ] Monitor cash, journals, jobs, access, errors, and performance closely during stabilization.
- [ ] Publish support, escalation, incident, and rollback contacts.

### Result

Divya Pravaha enters production through a controlled pilot and cutover with trained users, reconciled balances, recoverable data, and signed acceptance.

---

## Phase 2 completion gate

Phase 2 is complete only when:

- [ ] All launch-scope requirements are implemented and traced to tests.
- [ ] Financial invariants are enforced in both application logic and the database.
- [ ] Reports reconcile to source records and the ledger.
- [ ] Permissions, branch scope, maker-checker, and MFA are independently tested.
- [ ] Security review findings are resolved or formally accepted.
- [ ] Backup restoration meets the approved recovery objectives.
- [ ] Migration and opening balances are signed by Finance.
- [ ] Business user-acceptance testing and role training are complete.
- [ ] Investor functionality is still locked unless every activation gate is approved.
- [ ] Management, Finance, Legal/Compliance, and Technical leadership approve production use.

## Simple Phase 2 production sequence

1. Establish governance, environments, and traceability.
2. Build the application foundation and shared design system.
3. Build authentication, MFA, roles, branches, and audit.
4. Build borrowers, groups, and private documents.
5. Build loan products, applications, schedules, and approval.
6. Build the accounting engine.
7. Build funding reservations and cash disbursement.
8. Build mobile cash collection and handover reconciliation.
9. Build portfolio servicing, arrears, and joint liability.
10. Build corrections, close, reports, dashboards, and exports.
11. Keep investor functions gated until formally approved.
12. Harden security, jobs, monitoring, and recovery.
13. Migrate and reconcile opening data.
14. Test, stage, train, pilot, and launch.

## Where development should begin after Phase 1 sign-off

- [ ] Complete Stage 0 and create requirement traceability.
- [ ] Complete Stage 1 with PostgreSQL, Prisma, Next.js, CI, and repeatable local setup.
- [ ] Build Stage 2 authentication and authorization before exposing business records.
- [ ] Build Stage 3 shared desktop/mobile components from the supplied visual guidance.
- [ ] Build branches, borrowers, and groups before loan applications.
- [ ] Build and test the accounting engine before enabling any production cash workflow.
