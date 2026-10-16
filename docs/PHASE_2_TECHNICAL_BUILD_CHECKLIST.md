# Phase 2 Production Completion Checklist — Plain-Language Version

Phase 2 takes the owner-approved Phase 1 prototype and turns it into a secure, resilient, supportable production system. It does not rebuild the prototype. It completes technical depth, validates financial behavior, removes shortcuts, migrates real data, proves recovery, and prepares controlled launch.

The [System Requirements v1.1](system-requirements-v1.1.json) remain authoritative. The [Phase 1 Prototype Build Checklist](PHASE_1_BUSINESS_BUILD_CHECKLIST.md) defines the working feature baseline.

## What Phase 2 will deliver

- Production-hardened authentication, authorization, documents, jobs, and audit behavior.
- Accountant-validated journals, reports, close controls, and credit-loss treatment.
- Database-enforced financial invariants with concurrency and idempotency tests.
- Migrated and reconciled real branches, staff, borrowers, groups, loans, balances, and documents.
- Monitoring, backups, restoration, incident response, and support ownership.
- Implemented privacy, retention, regulatory, and compliance requirements.
- Completed accessibility, browser, device, security, and performance assurance.
- Scenario-based staff training, UAT, controlled pilot, and production launch.
- Investor functions still locked unless their separate activation gate is fully approved.

---

## Stage 0 — Freeze and review the accepted prototype

- [ ] Record the exact Phase 1 version accepted by the owner.
- [ ] Convert owner feedback into prioritized production issues.
- [ ] Separate defects, launch requirements, enhancements, and future scope.
- [ ] Trace each launch requirement to code and tests.
- [ ] Remove dead screens, placeholder actions, and contradictory sample wording.
- [ ] Review module boundaries and server-only business logic.
- [ ] Review database relationships, transaction boundaries, and error behavior.
- [ ] Confirm the investor module remains gated.

### Result

Phase 2 starts from a named and controlled prototype baseline.

---

## Stage 1 — Harden the production database

- [ ] Add database constraints for amounts, states, branch ownership, and references.
- [ ] Add unique indexes for receipt, disbursement, voucher, journal, and external references.
- [ ] Persist idempotency records for financial commands.
- [ ] Prevent cascade deletion of finance and evidence.
- [ ] Enforce effective-date integrity.
- [ ] Add indexes for portfolio, arrears, collectors, branches, journals, and reports.
- [ ] Confirm all money uses integer pesewas or approved decimal handling.
- [ ] Test migrations on clean and populated databases.
- [ ] Document migration rollback and forward-fix procedures.

### Result

The database protects core financial and historical rules even if application code fails.

---

## Stage 2 — Harden identity, MFA, permissions, and staff lifecycle

- [ ] Replace prototype MFA with a production authenticator implementation.
- [ ] Implement secure recovery codes.
- [ ] Apply password, throttling, reset, lockout, and session controls.
- [ ] Use secure HTTP-only cookies, HTTPS enforcement, and CSRF protection.
- [ ] Rotate sessions after authentication and privilege changes.
- [ ] Test every page, server action, route, job, and export for authorization.
- [ ] Enforce branch scope at query and mutation boundaries.
- [ ] Recheck maker-checker identity at execution time.
- [ ] Implement staff joiner, change, transfer, suspension, and leaver flows.
- [ ] Preserve historical actor identity after deactivation.
- [ ] Add privileged-access review reports.

### Result

Production access follows named identity, least privilege, branch scope, and independent approval.

---

## Stage 3 — Harden private documents and privacy

- [ ] Use encrypted private object storage outside the web filesystem.
- [ ] Use unpredictable identifiers and time-limited downloads.
- [ ] Restrict file types and sizes.
- [ ] Scan uploads for malware.
- [ ] Audit upload, access, replacement, and policy actions.
- [ ] Prevent private URLs and identifiers from entering logs.
- [ ] Record approved privacy-notice and consent versions.
- [ ] Implement the approved retention schedule.
- [ ] Support authorized access and correction requests.
- [ ] Preserve records where finance or law prohibits deletion.
- [ ] Complete data-controller and processor documentation.

### Result

Borrower identity, consent, contracts, and financial evidence are protected throughout their lifecycle.

---

## Stage 4 — Validate and harden the financial engine

### Accountant validation

- [ ] Approve the chart of accounts.
- [ ] Approve every event-to-journal mapping.
- [ ] Approve interest accrual and income recognition.
- [ ] Approve credit-loss provisioning.
- [ ] Approve close, reopen, reversal, and opening-balance treatment.

### Technical assurance

- [ ] Post business event, subledgers, and journal in one database transaction.
- [ ] Lock or serialize balances used for reservations and disbursements.
- [ ] Enforce unique source-event posting.
- [ ] Make retries return the original result.
- [ ] Prove failed transactions leave no partial state.
- [ ] Reconcile loan, custody, cash, suspense, overpayment, and capital controls to the ledger.
- [ ] Property-test money, schedule, allocation, aging, and rounding calculations.
- [ ] Test concurrency for reservations, receipts, handovers, reversals, and refunds.

### Result

Financial correctness has both signed accounting treatment and technical protection against retries and races.

---

## Stage 5 — Complete close controls and production reporting

- [ ] Implement open, closing, closed, and reopened periods.
- [ ] Enforce posting cutoffs.
- [ ] Run close-readiness checks against reconciliation and exceptions.
- [ ] Require Finance preparation and Manager approval.
- [ ] Produce a versioned close pack.
- [ ] Require reason and dual authorization for reopening.
- [ ] Reconcile trial balance, financial statements, cash flow, and general ledger.
- [ ] Reconcile portfolio, aging, custody, accrual, provision, and capital reports.
- [ ] Apply permission and branch scope to reports and exports.
- [ ] Add approved CSV and PDF outputs.
- [ ] Record sensitive exports.
- [ ] Document every KPI formula and date basis.

### Result

Finance can close a period and reproduce each report from controlled source records.

---

## Stage 6 — Complete exceptions, corrections, and support tooling

- [ ] Finalize shortage, excess, unidentified cash, late handover, duplicate, and negative-balance alerts.
- [ ] Assign each exception an owner, severity, deadline, and escalation path.
- [ ] Block close while critical exceptions remain.
- [ ] Complete receipt, handover, disbursement, and journal reversal flows.
- [ ] Prevent reversal where dependent activity needs coordinated correction.
- [ ] Link original, reversal, and replacement records.
- [ ] Add safe correlation IDs and diagnostic views.
- [ ] Prevent support staff from directly editing financial data.
- [ ] Document financial-defect escalation.

### Result

Problems are visible, assigned, and corrected without hidden data manipulation.

---

## Stage 7 — Add reliable jobs and notifications

- [ ] Configure a production scheduler and worker.
- [ ] Persist job state, attempts, results, and idempotency keys.
- [ ] Retry transient failures with bounded backoff.
- [ ] Expose permanent failures to operators.
- [ ] Prevent retries from duplicating journals or notices.
- [ ] Schedule interest accrual, delinquency, provisions, reminders, and close checks.
- [ ] Schedule investor activity only after activation.
- [ ] Finalize in-system notifications.
- [ ] Add SMS/email only after vendor and consent approval.
- [ ] Keep notification failure separate from transaction success.

### Result

Time-based work runs reliably without repeating business events.

---

## Stage 8 — Complete approved integrations

Cash remains the initial channel. Additional integrations require an approved requirements change.

- [ ] Use provider adapters rather than vendor logic inside domain services.
- [ ] Store credentials in managed secrets.
- [ ] Verify signed callbacks and prevent replay.
- [ ] Validate amount, currency, reference, state, and counterparty.
- [ ] Add timeout, retry, and manual-reconciliation behavior.
- [ ] Integrate Ghana Card verification if approved.
- [ ] Integrate SMS/email if approved.
- [ ] Integrate holiday calendar if approved.
- [ ] Add bank import, Mobile Money, credit bureau, or regulatory submission only if formally required.

### Result

External failures or repeated messages cannot corrupt internal financial truth.

---

## Stage 9 — Preserve the investor production gate

- [ ] Require written legal classification.
- [ ] Require licensing or regulatory confirmation.
- [ ] Require approved contract and tax treatment.
- [ ] Require approved payout, early-exit, default, and cancellation rules.
- [ ] Require approved accounting treatment and management sign-off.
- [ ] Keep routes, APIs, jobs, and permissions inaccessible before activation.
- [ ] Exclude sample investor data from operational balances.
- [ ] Require a controlled feature-activation record.
- [ ] Independently test returns, maturity, repayment, and payout behavior before activation.

### Result

The lending system can launch without accidentally enabling an unapproved investor product.

---

## Stage 10 — Complete security hardening

- [ ] Threat-model authentication, finance, files, exports, jobs, and integrations.
- [ ] Validate and authorize every input server-side.
- [ ] Prevent injection, XSS, CSRF, insecure object access, and mass assignment.
- [ ] Add content-security and transport-security headers.
- [ ] Rate-limit authentication, exports, uploads, and financial mutations.
- [ ] Remove secrets and sensitive data from logs and errors.
- [ ] Scan dependencies, source, builds, and configuration.
- [ ] Apply least privilege to database, storage, worker, and deployment identities.
- [ ] Separate staging and production credentials and data.
- [ ] Perform independent security review and penetration testing.
- [ ] Resolve critical and high findings before launch.

### Result

Production security is independently tested rather than inferred from the interface.

---

## Stage 11 — Add observability and incident response

- [ ] Add health and readiness checks.
- [ ] Add structured logs and correlation IDs.
- [ ] Add server and browser error monitoring.
- [ ] Alert on database, capacity, connection, and slow-query problems.
- [ ] Alert on failed jobs, accruals, reconciliations, backups, and security events.
- [ ] Monitor receipt, handover, disbursement, journal, and login anomalies.
- [ ] Define alert severity, owner, and response time.
- [ ] Create runbooks for authentication, database, storage, jobs, cash mismatch, and duplicate posting.
- [ ] Create incident and data-breach procedures.
- [ ] Run incident tabletop exercises.

### Result

Failures are detected and handled before they become unexplained financial or privacy issues.

---

## Stage 12 — Configure backups and prove recovery

- [ ] Configure encrypted off-site PostgreSQL backups.
- [ ] Configure point-in-time recovery where supported.
- [ ] Back up private documents and critical configuration.
- [ ] Monitor backup completion and age.
- [ ] Confirm or revise the provisional 24-hour RPO and 8-hour RTO.
- [ ] Restore database and documents into an isolated environment.
- [ ] Verify users, journals, balances, and sampled files.
- [ ] Test provider-outage procedures.
- [ ] Record recovery results and corrective actions.
- [ ] Schedule quarterly restoration tests.

### Result

Recovery has been demonstrated, not merely promised.

---

## Stage 13 — Migrate real data and opening balances

- [ ] Inventory existing branches, staff, borrowers, groups, loans, receipts, balances, restrictions, and documents.
- [ ] Identify duplicates, missing identity, inconsistent membership, and unexplained balances.
- [ ] Define source mappings and rejection rules.
- [ ] Decide historical cutoff and detail level.
- [ ] Build repeatable imports with dry-run reports.
- [ ] Preserve original references and mapping tables.
- [ ] Import effective-dated membership and guarantee evidence.
- [ ] Import active schedules and balances.
- [ ] Import files through secure storage.
- [ ] Post accountant-approved opening balances through journals.
- [ ] Reconcile borrower counts, portfolio, cash, custody, suspense, liabilities, equity, provisions, and capital availability.
- [ ] Obtain Operations and Finance sign-off.

### Result

Production starts with explainable real data and signed balances.

---

## Stage 14 — Complete comprehensive QA

### Functional and financial tests

- [ ] Unit-test calculations and state transitions.
- [ ] Integration-test transaction boundaries.
- [ ] Test database constraints, idempotency, locking, and concurrency.
- [ ] Run every SRS acceptance test.
- [ ] Reconcile reports using independent control totals.
- [ ] Test full loan lifecycle, collections, handovers, liability, reversals, refunds, close, and reopening.
- [ ] Test every role, branch boundary, MFA flow, and private document.
- [ ] Test investor-gate denial.

### Compatibility and performance

- [ ] Test mobile, tablet, laptop, and desktop layouts.
- [ ] Test supported Chrome, Edge, Firefox, and Safari versions.
- [ ] Test keyboard, screen reader, contrast, zoom, and reduced motion.
- [ ] Test slow networks, failures, refreshes, and duplicate clicks.
- [ ] Field-test representative collector devices.
- [ ] Agree expected users, portfolio, receipts, and report volumes.
- [ ] Load-test common pages and concurrent financial commands.
- [ ] Establish performance baselines.

### Result

The production candidate passes realistic financial, security, accessibility, device, and scale scenarios.

---

## Stage 15 — Deploy staging and run user acceptance

- [ ] Deploy a production-like staging environment.
- [ ] Use sanitized or approved test data.
- [ ] Configure storage, workers, monitoring, alerts, and backups.
- [ ] Run production migrations and smoke tests.
- [ ] Test restoration and rollback.
- [ ] Give each role scenario-based UAT scripts.
- [ ] Require users to perform workflows rather than only inspect pages.
- [ ] Reconcile every UAT cash and accounting scenario.
- [ ] Record issues and retest evidence.
- [ ] Obtain Operations, Finance, Management, Technical, and applicable Legal/Compliance acceptance.

### Result

Business owners prove that the production candidate supports real work correctly.

---

## Stage 16 — Train users and prepare support

- [ ] Train Administrators on access without default financial authority.
- [ ] Train Managers on approvals and exceptions.
- [ ] Train Loan Officers on evidence, groups, applications, and snapshots.
- [ ] Train Collectors on online receipts, custody, and handovers.
- [ ] Train Cashier/Accountants on reconciliation, journals, corrections, and close.
- [ ] Train Auditors on reports and traceability.
- [ ] Test competence on high-risk workflows.
- [ ] Publish operating guides, support contacts, and escalation paths.
- [ ] Define account recovery, staff-leaver, maintenance, and financial-defect procedures.

### Result

Users and support staff know both normal workflows and failure procedures.

---

## Stage 17 — Run a controlled pilot

- [ ] Select one branch or limited portfolio.
- [ ] Define pilot dates, limits, staff, and rollback criteria.
- [ ] Verify opening balances and take a tested backup.
- [ ] Provide on-call business, finance, and technical support.
- [ ] Reconcile every receipt, handover, disbursement, reversal, and exception daily.
- [ ] Reconcile subledgers to the ledger daily.
- [ ] Review errors, access, jobs, performance, and backups.
- [ ] Complete an appropriate end-to-end repayment cycle.
- [ ] Resolve critical and high defects and repeat tests.
- [ ] Obtain signed approval to proceed, extend, or stop.

### Result

The system proves itself under controlled real operations before wider rollout.

---

## Stage 18 — Launch and stabilize production

### Cutover

- [ ] Approve the release and migration plan.
- [ ] Configure production domain, HTTPS, database, storage, workers, monitoring, and secrets.
- [ ] Load approved users, configuration, policy versions, data, and balances.
- [ ] Verify MFA and least privilege.
- [ ] Take a final verified pre-cutover backup.
- [ ] Execute migrations and opening postings.
- [ ] Smoke-test each critical role and money workflow.

### Stabilization and operation

- [ ] Monitor authentication, receipts, handovers, disbursements, journals, jobs, and performance.
- [ ] Reconcile cash and ledger balances daily during stabilization.
- [ ] Hold daily launch reviews until exit criteria are met.
- [ ] Apply fixes through controlled review and release.
- [ ] Obtain final production acceptance.
- [ ] Schedule access reviews, patching, restoration tests, and security scans.
- [ ] Version future requirements and assess their financial impact.

### Result

Divya Pravaha moves from an accepted prototype to a controlled, recoverable production service.

---

## Phase 2 completion gate

- [ ] Prototype shortcuts are removed or formally accepted.
- [ ] Accountant-approved posting and reporting rules are implemented.
- [ ] Financial concurrency and idempotency tests pass.
- [ ] Security and penetration-test findings are resolved.
- [ ] Privacy and document controls are approved.
- [ ] Real data and opening balances are signed.
- [ ] Monitoring, jobs, alerts, support, and incident response operate.
- [ ] Backup restoration meets approved objectives.
- [ ] UAT, training, and pilot are complete.
- [ ] Investor functions remain locked unless separately approved.
- [ ] Management, Finance, Operations, Legal/Compliance, and Technical leadership approve production use.

## Simple Phase 2 sequence

1. Freeze and review the accepted prototype.
2. Harden the database, identity, permissions, documents, and privacy.
3. Validate accounting and financial transaction integrity.
4. Complete reports, exceptions, jobs, and approved integrations.
5. Add security, monitoring, incident response, backups, and recovery.
6. Migrate and reconcile real data.
7. Complete QA and staging UAT.
8. Train staff and support.
9. Run a controlled pilot.
10. Launch, stabilize, and obtain final acceptance.

## Where Phase 2 should begin

- [ ] Record the exact owner-approved Phase 1 build.
- [ ] Convert owner feedback into the production backlog.
- [ ] Obtain final accounting treatment before report hardening.
- [ ] Confirm hosting, storage, jobs, monitoring, backup, and support ownership.
- [ ] Harden schema and security before importing real borrower data.
