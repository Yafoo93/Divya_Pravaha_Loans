# Divya Pravaha Loan Management System

A controlled, auditable business-management system for **Divya Pravaha Trading and Financial Services**. The platform is designed for group-based microfinance lending, individual loan contracts, cash collections, collector custody, capital recycling, joint liability, double-entry accounting, and—only after legal approval—investor portfolio management.

> **Current status:** requirements and development planning are complete enough to begin Phase 1. The application has not yet been scaffolded. This repository currently contains the authoritative requirements, implementation checklists, design assets, and project documentation.

## Product goal

Divya Pravaha needs more than a borrower database. The system must preserve financial truth and provide evidence for every important action:

- who registered and verified a borrower;
- which members guaranteed a loan at approval time;
- who approved or rejected the application and why;
- which verified funds financed a disbursement;
- who physically received or released cash;
- how every receipt was divided between principal and interest;
- where collected cash is currently held;
- when cash became available for reuse;
- how arrears and joint-liability contributions were calculated;
- which accounting entries resulted from each business event; and
- how corrections were reversed and reposted without destroying history.

The intended result is a responsive staff workspace that supports daily operations while remaining traceable, reconcilable, and resistant to duplicate or unauthorized financial activity.

## Source of truth

Requirements and design inputs have the following precedence:

1. [`docs/system-requirements-v1.1.json`](docs/system-requirements-v1.1.json) — authoritative functional, financial, security, and data requirements.
2. [`docs/PHASE_1_BUSINESS_BUILD_CHECKLIST.md`](docs/PHASE_1_BUSINESS_BUILD_CHECKLIST.md) — build order for the complete owner-demo prototype.
3. [`docs/PHASE_2_TECHNICAL_BUILD_CHECKLIST.md`](docs/PHASE_2_TECHNICAL_BUILD_CHECKLIST.md) — production hardening, migration, validation, pilot, and launch.
4. UI screenshots and visual concepts — guidance for appearance and responsive layout only.

If a screenshot or checklist conflicts with the system requirements, the system requirements take precedence.

## Current business model

### Borrowers and groups

- Loans are issued to individual borrowers who belong to jointly liable groups.
- A group requires at least five verified and consenting members before activation.
- The maximum group size remains a management decision and must be configurable once approved.
- Membership is effective-dated. Joining, exiting, suspension, and reactivation append history rather than overwrite it.
- Each approved loan freezes its own guarantee snapshot.
- A member who later exits remains responsible for loans included in their earlier snapshot unless legally released.
- A later member is not added to an older guarantee.
- Restricted or blacklisted borrowers cannot submit new applications until manager-approved reactivation with fresh verification.

### Loan product

The initial product is `GROUP_FLAT_20`:

| Rule | Initial requirement |
| --- | --- |
| Interest | 20% of original principal, charged once for the full contract |
| Maximum term | 6 months |
| Frequencies | Weekly, fortnightly, or monthly |
| Fees | None |
| Penalties | None |
| Grace period | 0 days after the effective due date |
| Early settlement | Allowed, with all remaining contractual interest still payable |
| Active exposure | One active loan per borrower |
| Pending applications | One nonterminal application per borrower |
| Collection channel | Cash only in the initial release |

For a principal of **GHS 10,000**:

```text
Contractual interest = GHS 10,000 × 20% = GHS 2,000
Total repayment      = GHS 10,000 + GHS 2,000 = GHS 12,000
```

For this pure flat-20% product, every repayment is scheduled as:

- **5/6 principal** — approximately 83.333%;
- **1/6 interest** — approximately 16.667%.

This ratio ensures that all repayments total exactly 100% of principal and 20% interest. An 80/20 split must not be used because it would recover only 96% of original principal and charge 24% interest.

### Repayment schedules

- The actual cash-disbursement date anchors the contract.
- Weekly instalments recur every 7 calendar days.
- Fortnightly instalments recur every 14 calendar days.
- Monthly instalments recur on the corresponding calendar day.
- If a monthly day does not exist, the last day of that month is used.
- A weekend or public-holiday collection date moves to the next business day.
- This calendar adjustment is not a grace period.
- Nonfinal instalments are rounded to the nearest pesewa using half-up rounding.
- The final instalment absorbs all rounding differences so component and contract totals remain exact.

### Cash collections and custody

- Cash is the only enabled collection channel initially.
- Mobile Money, bank transfer, card, cheque, and offline capture are disabled.
- Borrower debt reduces when a unique numbered receipt is successfully issued.
- The same cash simultaneously enters the named collector's custody.
- Collector-held cash is not company cash available for another loan.
- A Cashier/Accountant must independently count, verify, and post the handover.
- Handover transfers custody to company cash; it must not reduce borrower debt a second time.
- Partial and full payments are permitted.
- Allocations are automatic, oldest-due-first, and pro rata across scheduled principal and interest.
- Manual allocation overrides are not permitted.

### Exceptions and corrections

- Unidentified cash is posted to a suspense liability.
- Suspense does not reduce borrower debt and cannot fund another loan.
- Verified excess is recorded as a refundable customer liability.
- Refunds require payer verification, manager approval, cashier payment, a journal entry, and signed evidence.
- Posted receipts and journals cannot be edited or deleted.
- Corrections use an independently authorized, linked reversal followed by a corrected repost.

### Arrears and joint liability

- An unpaid obligation becomes overdue immediately after its effective due date.
- A late instalment does not automatically accelerate the entire contract.
- Joint-liability calculations use the frozen approval snapshot, not current membership.
- The eligible unpaid amount is divided equally among the other eligible guarantors.
- Pesewa remainders are assigned deterministically by ascending member ID.
- A Manager must approve the assessment before contributions can be collected.
- Contributions settle the original borrower's receivable.
- Contributions do not create new income or a new loan for contributing members.
- No reimbursement claim is created until a legally approved policy exists.

### Capital source and use

The system maintains two related but distinct views:

- the **general ledger**, which is the accounting source of truth; and
- a **source-attribution subledger**, which explains how verified funds were allocated.

Capital moves through these management states:

```text
AVAILABLE → RESERVED → COMMITTED → DISBURSED → RECOVERED
                         └───────────────→ CANCELLED where applicable
```

Source attribution must never create a second cash balance. Receivables, collector custody, unidentified receipts, refundable overpayments, and locked investor funds are excluded from available lending cash.

### Investor functionality

The requirements describe a proposed simple return of 60% per annum, but the instrument's legal classification and operational rules are still under review.

All production investor functionality must remain disabled until the following gates are complete:

- written legal classification;
- licensing or regulatory confirmation;
- approved signed contract;
- approved tax treatment;
- approved maturity, payout, withdrawal, default, and cancellation rules;
- approved accounting treatment; and
- management sign-off.

Draft or sample investor records must not affect operational balances.

## Roles and segregation of duties

| Role | Main responsibility | Important restriction |
| --- | --- | --- |
| System Administrator | Users, roles, branches, and security | No financial approval or posting authority by default |
| Manager | Loan decisions, cash-out authorization, exceptions | Cannot approve their own work |
| Loan Officer | Borrowers, groups, verification, applications | Cannot approve submitted loans |
| Field Collector | Assignments, cash receipts, handovers | Cannot verify own handover or reverse posted receipts |
| Cashier/Accountant | Cash verification, reconciliation, ledger, close preparation | Controlled corrections and independent checking |
| Investor Portfolio Officer | Future investor records and requests | Entire role remains operationally gated |
| Auditor | Journals, evidence, exceptions, and history | Read-only |
| Investor Portal User | Future access to own contracts and statements | Read-only and unavailable until activation |

Server-side authorization is mandatory for every read and mutation. Hiding a button is not an authorization control.

MFA is required for privileged roles, initially:

- System Administrator;
- Manager;
- Cashier/Accountant; and
- Investor Portfolio Officer.

Maker-checker separation applies to loan approval, disbursement authorization, reversals, manual financial adjustments, period reopening, and future investor payouts.

## Core workflows

### 1. Borrower onboarding

```text
Create draft → Verify identity → Record consent → Assess business
→ Attach evidence → Assign/propose group → Ready for application
```

Required data includes legal name, phone, residential address, business information, Ghana Card verification, and consent evidence.

### 2. Group activation

```text
Create group → Add effective-dated members → Verify identity and consent
→ Attach joint-liability agreement → Manager activation
```

Activation is blocked below five eligible members.

### 3. Loan application and approval

```text
DRAFT → SUBMITTED → UNDER REVIEW → APPROVED or REJECTED
                                      ↓
                              AWAITING DISBURSEMENT
```

Approval freezes the terms, supporting evidence versions, and guarantee snapshot. Any later term change requires a new controlled decision.

### 4. Cash disbursement

```text
Approved loan → Verified funding reservation → Beneficiary confirmation
→ Signed voucher → Manager authorization → Physical cash release
→ Journal posting → ACTIVE loan and anchored schedule
```

The entire release must be idempotent and transactional.

### 5. Cash collection and handover

```text
Assigned stop → Cash captured → Numbered receipt issued
→ Borrower debt reduced → Collector custody increased
→ Handover prepared → Physical count → Independent verification
→ Company cash posted and available
```

### 6. Arrears and joint liability

```text
Effective due date passes → Arrears detected → Notice/evidence recorded
→ Frozen guarantors evaluated → Equal assessment calculated
→ Manager decision → Contributions collected → Original debt reduced
```

### 7. Correction

```text
Error identified → Reversal requested → Independent approval
→ Linked reversal posted → Correct transaction reposted
```

The original record remains available throughout.

## Accounting model

The system uses immutable double-entry accounting. Every journal includes a posting date, source event, actor, branch, and balanced debit/credit lines.

The provisional chart of accounts includes:

| Code | Account | Type |
| --- | --- | --- |
| 1000 | Cash on Hand | Asset |
| 1010 | Collector Cash Custody | Asset |
| 1020 | Operating Bank | Asset |
| 1100 | Loan Principal Receivable | Asset |
| 1110 | Interest Receivable | Asset |
| 1120 | Allowance for Credit Losses | Contra asset |
| 2000 | Unidentified Receipts Suspense | Liability |
| 2010 | Customer Overpayments Refundable | Liability |
| 2100 | Investor Principal Liability | Liability; gated |
| 2110 | Investor Returns Payable | Liability; gated |
| 3000 | Owner Capital | Equity |
| 4000 | Loan Interest Income | Income |
| 5000 | Investor Return Expense | Expense; gated |
| 5100 | Credit Loss Expense | Expense |

The chart, recognition policy, and event-to-journal mappings remain subject to qualified accountant approval before production.

### Important posting examples

**Cash loan disbursement**

```text
Dr Loan Principal Receivable
   Cr Cash on Hand
```

**Cash received by collector**

```text
Dr Collector Cash Custody
   Cr Loan Principal Receivable
   Cr Interest Receivable
```

**Verified collector handover**

```text
Dr Cash on Hand
   Cr Collector Cash Custody
```

**Unidentified cash received**

```text
Dr Cash on Hand
   Cr Unidentified Receipts Suspense
```

## Planned architecture

| Layer | Technology and responsibility |
| --- | --- |
| Web application | Next.js App Router, React, TypeScript, Tailwind CSS |
| Domain services | Server-only groups, loans, schedules, collections, liability, capital, accounting, and reporting logic |
| Persistence | PostgreSQL with Prisma migrations and transactions |
| Authentication | Secure server sessions, RBAC, branch scope, privileged MFA |
| Background processing | Reliable scheduler/worker for accruals, alerts, reports, and retries |
| Documents | Encrypted private object storage with access logging and malware scanning |
| Observability | Structured logs, error monitoring, health checks, capacity and job alerts |
| Deployment | Commercial managed hosting or managed VPS with explicit database, worker, backup, and monitoring plans |

The initial architecture is a **modular monolith**. Microservices are intentionally avoided because they would add distributed transaction and reconciliation complexity without a demonstrated need.

## Technical invariants

These rules must hold regardless of the page or API initiating an action:

- Money is stored in integer pesewas.
- Financial references are unique.
- Financial commands are idempotent.
- Posted journals balance exactly.
- Posted financial records cannot be edited or deleted.
- Corrections retain linked original and reversal records.
- A maker cannot act as checker for the same controlled action.
- One receipt cannot enter multiple active handovers.
- A funding lot cannot be allocated beyond its verified available balance.
- Concurrent requests cannot spend the same pesewa twice.
- Collector custody, receivables, suspense, and customer liabilities are not available lending cash.
- Membership and agreement histories are effective-dated.
- Guarantee snapshots do not change when later membership changes.
- Private document access is authorized and logged.
- UI checks never replace server-side validation or authorization.

## Planned application areas

Proposed route names may be refined without changing business behavior.

| Area | Proposed route |
| --- | --- |
| Staff authentication | `/login`, `/mfa` |
| Manager overview | `/workspace/overview` |
| Borrowers | `/workspace/borrowers` |
| Groups | `/workspace/groups` |
| Applications | `/workspace/loan-applications` |
| Disbursements | `/workspace/disbursements` |
| Loan portfolio | `/workspace/loans` |
| Cash collections | `/workspace/cash-collections` |
| Handovers | `/workspace/handovers` |
| Arrears | `/workspace/arrears` |
| Accounting and reports | `/workspace/accounting` |
| Capital source and use | `/workspace/capital` |
| Administration and audit | `/workspace/administration` |
| Collector assignments | `/field/assignments` |
| Collector receipts | `/field/receipts` |
| Collector handovers | `/field/handovers` |

## Delivery plan

### Phase 1 — working owner-demo prototype

Phase 1 builds the complete functional prototype:

1. Project foundation and fictional seed data.
2. Shared desktop and mobile interface.
3. Authentication, MFA, roles, branches, administration, and audit.
4. Borrowers and groups.
5. Loan applications, schedules, and independent approval.
6. Prototype accounting engine.
7. Capital reservation and cash disbursement.
8. Collector cash receipts and handovers.
9. Portfolio, arrears, joint liability, and controlled corrections.
10. Reports, dashboards, and role-specific queues.
11. Reconciled owner demonstration and prototype acceptance.

See the detailed [Phase 1 checklist](docs/PHASE_1_BUSINESS_BUILD_CHECKLIST.md).

### Phase 2 — production completion

Phase 2 converts the accepted prototype into a production service:

1. Freeze and review the accepted prototype.
2. Harden the database, authentication, authorization, private documents, and privacy.
3. Obtain final accounting validation and prove financial transaction integrity.
4. Complete period controls, reports, exceptions, jobs, and approved integrations.
5. Complete security review, observability, incident response, backups, and recovery.
6. Migrate and reconcile real data and opening balances.
7. Complete QA, accessibility, browser/device, concurrency, and performance testing.
8. Deploy staging and conduct user-acceptance testing.
9. Train staff and support personnel.
10. Run a controlled pilot.
11. Launch, stabilize, and obtain final production acceptance.

See the detailed [Phase 2 checklist](docs/PHASE_2_TECHNICAL_BUILD_CHECKLIST.md).

## Phase 1 demonstration path

The prototype is considered cohesive when the owner can follow this exact path:

1. Sign in as different staff roles.
2. Register and verify a borrower.
3. Form and activate a group of at least five verified members.
4. Create a six-month flat-20% loan application.
5. Review and approve it as an independent Manager.
6. Reserve owner capital and record physical cash disbursement.
7. Inspect the active loan and final anchored schedule.
8. Capture a partial payment in the collector mobile workspace.
9. Issue a unique numbered receipt.
10. Prepare, count, independently verify, and post the cash handover.
11. Inspect the resulting journals and capital trace.
12. Demonstrate arrears and a joint-liability assessment.
13. Demonstrate a reversal, unidentified receipt, or overpayment refund.
14. Review dashboards, reports, audit history, and locked investor gates.

## Reports

The planned report library includes:

- trial balance;
- statement of financial position;
- income statement;
- cash-flow statement;
- general ledger;
- loan portfolio outstanding;
- portfolio aging and arrears;
- repayment and collection register;
- collector custody and handover reconciliation;
- interest accrual;
- credit-loss provision;
- capital source and use;
- reversals and exceptions; and
- investor liabilities and maturities after legal activation.

Each KPI and report must define its formula, date basis, scope, inclusions, exclusions, and treatment of reversals and pending records.

## Security and privacy expectations

- HTTPS is mandatory in production.
- Privileged users require MFA.
- Sessions use secure, HTTP-only cookies.
- All unsafe browser mutations require CSRF protection.
- Inputs are validated and authorized server-side.
- Branch scope is applied at query and mutation boundaries.
- Secrets are stored outside source code and client bundles.
- Private documents use encrypted, nonpublic storage.
- Uploads are restricted and malware-scanned.
- Document access and sensitive exports are audited.
- Logs and errors must exclude passwords, tokens, Ghana Card values, and private URLs.
- Dependencies and builds are scanned for vulnerabilities and secrets.
- Production requires an independent security review and penetration test.
- Privacy, retention, and deletion behavior require Ghana-specific legal/compliance approval.

## Reliability and recovery expectations

- Financial operations run inside database transactions.
- Unique constraints and idempotency keys protect against duplicate execution.
- Scheduled jobs persist attempts and safely retry.
- Health checks, structured logs, error monitoring, and financial exception alerts are required.
- Backups are encrypted and stored off-site.
- The provisional recovery objectives are a 24-hour RPO and 8-hour RTO.
- Restoration must be tested quarterly.
- Production launch requires a tested recovery procedure, not merely configured backups.

## Development setup

The application scaffold does not yet exist, so install and run commands will be added during Phase 1 Stage 0. The intended prerequisites are:

- Node.js active LTS;
- a package manager selected and locked by the project;
- PostgreSQL;
- Git; and
- optional container tooling for local services.

Expected command categories after scaffolding:

```text
install dependencies
start local PostgreSQL
apply Prisma migrations
seed fictional demo data
start the Next.js development server
run lint and type checks
run automated tests
create a production build
```

Do not copy assumed commands into automation until the repository contains the corresponding package scripts and setup files.

## Intended repository structure

```text
Divya_Pravaha_Loans/
├── README.md
├── logo.png
├── docs/
│   ├── system-requirements-v1.1.json
│   ├── PHASE_1_BUSINESS_BUILD_CHECKLIST.md
│   ├── PHASE_2_TECHNICAL_BUILD_CHECKLIST.md
│   └── archive/
├── prisma/                       # schema, migrations, and seed data
├── public/                       # approved public assets only
├── src/
│   ├── app/                      # Next.js routes and layouts
│   ├── components/               # shared visual components
│   ├── domain/                   # server-only business services
│   ├── infrastructure/           # database, storage, jobs, integrations
│   └── lib/                      # shared validation, money, dates, IDs
└── tests/                        # unit, integration, and end-to-end tests
```

This is the intended structure, not a claim that every directory currently exists.

## Development principles

1. **Financial correctness before convenience.** A polished screen must never bypass a financial invariant.
2. **Server authority.** Permissions and business rules are enforced on the server.
3. **Append history.** Membership, agreements, approvals, journals, and corrections preserve their earlier state.
4. **One source event, one financial result.** Idempotency is required for retries and duplicate clicks.
5. **No silent correction.** Posted finance uses reversal and reposting.
6. **Separate obligations from cash.** Receivables and issued receipts are not automatically spendable funds.
7. **Separate accounting from attribution.** The ledger is financial truth; source attribution is a management explanation.
8. **Protect private evidence.** Identity and contracts do not belong in public storage.
9. **Keep gated features gated.** Draft investor functionality cannot affect production balances.
10. **Test the difficult cases.** Concurrency, rounding, month ends, reversals, partial payments, and access boundaries require automated coverage.

## Definition of done

A feature is not complete merely because its page renders. It must have:

- server-side validation and authorization;
- correct role and branch behavior;
- transactional domain logic where money is involved;
- unique references and idempotency where required;
- audit evidence;
- empty, loading, error, and denied states;
- relevant automated tests;
- reconciled financial effects;
- responsive and accessible presentation; and
- updated requirement/checklist traceability.

## Known open decisions

The following remain explicit sign-off items and must not be silently invented during development:

- maximum group size;
- formal joint-liability appeal process;
- investor legal classification and regulatory approval;
- investor maturity, withdrawal, default, cancellation, and tax rules;
- final accounting policy and chart approval;
- regulatory and credit-bureau reporting obligations; and
- data-retention and deletion schedule.

Where a decision affects production safety, the relevant feature must remain blocked or gated.

## Documentation

- [Authoritative system requirements](docs/system-requirements-v1.1.json)
- [Phase 1 prototype checklist](docs/PHASE_1_BUSINESS_BUILD_CHECKLIST.md)
- [Phase 2 production checklist](docs/PHASE_2_TECHNICAL_BUILD_CHECKLIST.md)
- [Superseded planning documents](docs/archive/)

## Project status

| Item | Status |
| --- | --- |
| Requirements baseline | Complete — v1.1 working baseline |
| UI concepts | Available as external visual references |
| Phase 1 implementation checklist | Complete |
| Phase 2 production checklist | Complete |
| Git initialization | Complete |
| Application scaffold | Not started |
| Database schema and migrations | Not started |
| Automated tests | Not started |
| Owner-demo prototype | Not started |
| Production deployment | Not started |

The next action is **Phase 1, Stage 0: scaffold the Next.js/TypeScript application, configure PostgreSQL and Prisma, establish automated checks, and create repeatable fictional seed data.**
