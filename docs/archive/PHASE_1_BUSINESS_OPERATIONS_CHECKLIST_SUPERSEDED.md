# Archived Business Operations Checklist — Superseded

This phase defines and validates all business knowledge required to operate Divya Pravaha safely and consistently. It describes what staff do, what decisions they make, which evidence they retain, and how money and borrower obligations move through the business.

The [System Requirements v1.1](system-requirements-v1.1.json) remain the authoritative source. If this checklist, a screenshot, or a UI concept conflicts with those requirements, the system requirements take precedence. The screenshots are visual guidance only.

## What Phase 1 will deliver

At the end of Phase 1:

- Management has approved operating policies for borrowers, groups, loans, collections, joint liability, accounting, capital use, and staff authority.
- Every daily business workflow has a named owner, required evidence, approval rule, exception path, and expected accounting result.
- Staff can explain how a loan moves from application to closure without relying on undocumented assumptions.
- Reports and dashboard figures have agreed business definitions.
- Legal, regulatory, accounting, and privacy decisions that block production are identified and assigned.
- The business is ready for the technical team to implement the system without inventing policy.

Phase 1 does **not** mean the production application has been built. It creates the approved operational blueprint that Phase 2 will implement.

## Main business areas

| Area | Primary users | Business outcome |
| --- | --- | --- |
| Governance and branches | Management, administrators | Clear authority, branch ownership, and segregation of duties |
| Borrowers and groups | Loan officers, managers | Verified borrowers and valid jointly liable groups |
| Loan applications | Loan officers, managers | Consistent assessment and independent approval |
| Disbursement | Managers, cashier/accountants | Authorized cash reaches the verified borrower exactly once |
| Collections and handovers | Collectors, cashier/accountants | Borrower debt, collector custody, and company cash remain distinct |
| Arrears and joint liability | Loan officers, managers | Overdue debt is handled consistently with retained evidence |
| Accounting and reconciliation | Cashier/accountants, management | Balanced journals and reconciled physical cash |
| Capital source and use | Management, finance | Only verified available cash funds new loans |
| Investor arrangements | Management, legal, finance | No investor activity until all activation gates are approved |
| Reporting and oversight | Management, auditors | Trustworthy operational and financial information |

---

## Stage 0 — Approve the operating baseline

No software workflow should be treated as production-ready during this stage. Management confirms the rules that govern the business.

### Business decisions

- [ ] Approve Ghana cedi as the operating and reporting currency.
- [ ] Approve cash as the only initial disbursement and collection channel.
- [ ] Confirm that Mobile Money, bank transfer, card, cheque, and offline collection are outside the initial release.
- [ ] Approve the maximum loan term of six months.
- [ ] Approve weekly, fortnightly, and monthly repayment frequencies.
- [ ] Approve the 20% flat interest charge once for the full contractual term.
- [ ] Confirm there are no loan fees, penalties, waivers, restructures, or write-offs at launch.
- [ ] Confirm that early settlement is allowed but does not reduce the contractual 20% interest.
- [ ] Approve zero grace days after the effective due date.
- [ ] Approve the next-business-day collection rule when a contractual due date is a weekend or public holiday.
- [ ] Approve one active loan and one nonterminal loan application per borrower.
- [ ] Decide and approve the maximum permitted group size.
- [ ] Approve the provisional accounting and credit-loss policies with a qualified accountant.
- [ ] Confirm the applicable lending licence, regulatory reporting, and credit-bureau obligations.
- [ ] Approve privacy, consent, document-retention, and deletion policies.

### Required sign-offs

- [ ] Managing Director signs the business operating policy.
- [ ] Finance/Accounts signs the accounting treatment and chart of accounts.
- [ ] Operations/Loan Manager signs the lending and collection procedures.
- [ ] Legal/Compliance signs the licensing, privacy, contracts, and investor position.
- [ ] Technical Lead acknowledges the approved baseline for implementation.

### Result

The company has one signed baseline. Unapproved rules remain visibly pending and cannot quietly become production behavior.

---

## Stage 1 — Define branches, staff roles, and authority

### Branch operations

- [ ] Record every branch's official name, code, address, digital address, phone, operating hours, and manager.
- [ ] Define which staff are assigned to each branch.
- [ ] Decide which roles may view one branch and which may view all branches.
- [ ] Define the process for transferring a staff member between branches.
- [ ] Define branch opening, temporary closure, and permanent closure procedures.
- [ ] Confirm that every borrower, group, loan, cash receipt, handover, journal, and report carries a branch reference.

### Staff roles

- [ ] System Administrator manages users, roles, and security without automatic financial authority.
- [ ] Manager independently approves or rejects loans, cash releases, exceptions, and defined joint-liability decisions.
- [ ] Loan Officer registers borrowers and groups, performs checks, and submits applications without self-approval.
- [ ] Field Collector views assignments, issues cash receipts, and hands over cash without verifying their own handover.
- [ ] Cashier/Accountant verifies cash, reconciles records, posts journals, and prepares period close.
- [ ] Investor Portfolio Officer remains locked from operational investor activity until legal activation.
- [ ] Auditor receives read-only access to evidence, journals, exceptions, and histories.
- [ ] Investor Portal User remains unavailable until the investor module is legally activated.

### Segregation of duties

- [ ] Confirm that a maker cannot approve their own work.
- [ ] Define temporary delegation rules for staff absence.
- [ ] Define emergency authority and the after-the-fact review process.
- [ ] Define who can request and who can approve reversals.
- [ ] Define who can prepare, review, close, and reopen an accounting period.

### Result

Every business action has an authorized role and an independent checker where required.

---

## Stage 2 — Define borrower onboarding and restrictions

### Borrower information

- [ ] Confirm required legal name, phone number, residential address, business details, Ghana Card, and consent information.
- [ ] Define acceptable Ghana Card verification evidence.
- [ ] Define how duplicate borrowers are detected before a new record is created.
- [ ] Define required business-verification evidence and visit notes.
- [ ] Define optional guarantor or emergency-contact information.
- [ ] Approve customer-ID format and branch ownership.
- [ ] Define how corrections to identity information are requested, approved, and audited.

### Consent and documents

- [ ] Approve borrower privacy notice and consent wording.
- [ ] Approve the document checklist for onboarding.
- [ ] Define who may view Ghana Card and other private documents.
- [ ] Define document expiry, replacement, and version-history procedures.
- [ ] Define complaint and data-correction request procedures.

### Restrictions and reactivation

- [ ] Define the events that create a borrower restriction or blacklist status.
- [ ] Confirm that a restriction blocks new loan applications and new group-membership approval.
- [ ] Define the evidence required for the group to vouch for a restricted member.
- [ ] Require fresh identity and business verification before reactivation.
- [ ] Require manager approval and a recorded reason for reactivation.
- [ ] Confirm that restrictions never delete historical loans or obligations.

### Result

Loan officers can register and verify borrowers consistently, and management can explain every restriction or reactivation.

---

## Stage 3 — Define group formation and membership

### Group activation

- [ ] Require at least five verified and consenting members.
- [ ] Record group name, branch, leader, assigned officer, formation date, and status.
- [ ] Require a signed joint-liability agreement before activation.
- [ ] Confirm that the company must approve activation after the members agree to trust one another.
- [ ] Define the checks performed by the activating manager.
- [ ] Define suspension, closure, and reactivation rules for groups.
- [ ] Approve a maximum group size or retain the item as a production blocker.

### Membership history

- [ ] Record joins, exits, suspensions, and reactivations as dated events.
- [ ] Never overwrite historical membership.
- [ ] Define whether group leadership changes require a new agreement.
- [ ] Define how a member exit affects future loan guarantees.
- [ ] Confirm that an exit does not erase obligations in an existing loan's approval snapshot.
- [ ] Define treatment when a member dies or receives a legally approved release.

### Group records

- [ ] Define required meeting, visit, verification, complaint, and incident records.
- [ ] Define who may record a membership change.
- [ ] Define who approves a group-status change.
- [ ] Require reasons and evidence for every non-routine change.

### Result

The business can prove who belonged to each group, when they belonged, and which loans they guaranteed.

---

## Stage 4 — Define the loan product and application process

### Product rules

- [ ] Approve product code `GROUP_FLAT_20`.
- [ ] Confirm interest equals original principal multiplied by 20% once for the entire contract.
- [ ] Confirm total contractual repayment equals principal plus contractual interest.
- [ ] Confirm the maximum term is six months.
- [ ] Confirm the minimum term is one selected repayment interval.
- [ ] Confirm permitted frequencies are weekly, fortnightly, and monthly.
- [ ] Confirm that staff cannot enter discretionary rates, fees, or penalties.

### Application information

- [ ] Select a verified borrower and active guaranteeing group.
- [ ] Record requested principal, term, frequency, and business purpose.
- [ ] Check identity, consent, restriction status, active loans, and existing applications.
- [ ] Complete and retain the business assessment.
- [ ] Attach the required private evidence.
- [ ] Show the applicant the principal, interest, total, frequency, and expected instalments before submission.

### Schedule rules

- [ ] Anchor the final contract schedule to the actual cash-disbursement date.
- [ ] Set the first weekly due date seven calendar days after disbursement.
- [ ] Set the first fortnightly due date fourteen calendar days after disbursement.
- [ ] Set the first monthly due date one calendar month after disbursement.
- [ ] Use the last calendar day when the corresponding monthly day does not exist.
- [ ] Move collection to the next business day for weekends and public holidays.
- [ ] Confirm that the movement is a calendar adjustment, not a grace period.
- [ ] Allocate pure flat-20% repayments as five-sixths principal and one-sixth interest before pesewa rounding.
- [ ] Put all rounding remainder into the final instalment.

### Result

Every applicant receives the same approved product rules, and every proposed schedule can be reproduced from the recorded inputs.

---

## Stage 5 — Define independent loan review and approval

### Submission and review

- [ ] Freeze a versioned snapshot of submitted terms and evidence.
- [ ] Identify the Loan Officer as maker.
- [ ] Assign an independent Manager as checker.
- [ ] Present the borrower, business assessment, group status, current exposure, and guarantee members together.
- [ ] Confirm that the manager cannot change submitted terms without returning or replacing the controlled decision.

### Guarantee snapshot

- [ ] Freeze the borrower and eligible group members at approval.
- [ ] Record each member's verified identity, consent, and effective membership.
- [ ] Retain the signed agreement version.
- [ ] Exclude members who joined after approval from that historical guarantee.
- [ ] Retain exiting members' existing obligations until the guaranteed loan closes, unless legally released.

### Decision

- [ ] Require an approval or rejection reason.
- [ ] Record the decision maker and timestamp.
- [ ] Freeze approved principal, rate, term, frequency, and guarantee snapshot.
- [ ] Require a new controlled decision for any post-approval term change.
- [ ] Notify the responsible Loan Officer of the outcome.

### Result

Every approved or rejected loan has independent reasoning and immutable supporting evidence.

---

## Stage 6 — Define funding reservation and cash disbursement

### Funding availability

- [ ] Use only verified company cash that is not reserved, committed, restricted, or held by collectors.
- [ ] Exclude outstanding loan receivables from available cash.
- [ ] Exclude unidentified receipts and customer overpayments.
- [ ] Keep investor principal locked until investor activation gates are signed.
- [ ] Reserve funds for an approved loan exactly once.
- [ ] Define reservation expiry and cancellation procedures.

### Cash-out controls

- [ ] Confirm the approved loan and verified borrower identity.
- [ ] Confirm a signed contract and signed cash voucher.
- [ ] Confirm the funding reservation and manager cash-out authorization.
- [ ] Require the Cashier/Accountant to record the physical release.
- [ ] Record actual cash-out date, amount, beneficiary, voucher, funding source, and unique reference.
- [ ] Prevent a repeated click or duplicate reference from producing a second disbursement.
- [ ] Activate the loan and freeze its repayment schedule only after physical cash release.

### Result

The company can show who authorized each cash disbursement, who received it, and which verified cash funded it.

---

## Stage 7 — Define field collection and numbered receipts

### Collector assignments

- [ ] Assign borrowers and expected instalments to a named collector and route.
- [ ] Show effective collection due dates and current balances.
- [ ] Keep collection online-only for the initial release.
- [ ] Prevent receipt issuance when connectivity is unavailable.

### Receipt issuance

- [ ] Confirm borrower and loan before accepting cash.
- [ ] Record only the physical cash actually received.
- [ ] Allow full and partial payments.
- [ ] Record actual cash-received date and system-entry timestamp separately.
- [ ] Allocate payment to the oldest due instalment first.
- [ ] Allocate proportionally across principal and interest schedule components.
- [ ] Prohibit manual allocation overrides.
- [ ] Generate one unique numbered receipt exactly once.
- [ ] Reduce borrower debt at receipt issuance.
- [ ] Place the received cash in the named collector's custody.
- [ ] Make collector-held cash unavailable for another loan.

### Exceptions

- [ ] Record unidentified cash in suspense without reducing a borrower balance.
- [ ] Record verified excess as a refundable customer liability.
- [ ] Refund only the verified original payer or legally authorized owner.
- [ ] Require identity confirmation, manager approval, cashier payment, and signed refund evidence.
- [ ] Correct a posted receipt only through an authorized linked reversal and repost.

### Result

Borrowers receive immediate evidence, debt is updated once, and physical cash remains traceable to its collector.

---

## Stage 8 — Define cash handover and daily reconciliation

### Collector handover

- [ ] Group valid numbered receipts into a handover batch.
- [ ] Show the expected cash total and receipt list.
- [ ] Record denomination counts and physical cash total.
- [ ] Attach a signed count record.
- [ ] Prevent the collector from verifying their own handover.

### Independent verification

- [ ] Assign a Cashier/Accountant as independent checker.
- [ ] Match every receipt to the handover batch.
- [ ] Compare expected and counted cash.
- [ ] Require a reconciliation note.
- [ ] Return incomplete or unclear batches for investigation.
- [ ] Post matched handovers from collector custody to company cash on hand.
- [ ] Do not reduce borrower debt again during handover.

### Differences

- [ ] Record shortages and excess cash as separate exceptions.
- [ ] Place unidentified excess in suspense.
- [ ] Define investigation responsibility and completion deadline.
- [ ] Retain evidence, decisions, and corrective journals.
- [ ] Escalate unresolved differences before monthly close.

### Result

Daily receipt totals, collector custody, physical notes, and company cash can be reconciled without double-counting collections.

---

## Stage 9 — Define arrears and joint-liability operations

### Arrears

- [ ] Mark an unpaid obligation overdue immediately after its effective due date.
- [ ] Calculate days past due from the effective due date.
- [ ] Use agreed aging bands for management reporting.
- [ ] Record borrower contact, notice, acknowledgement, and dispute evidence.
- [ ] Confirm that one overdue instalment does not automatically make the entire loan due.

### Joint-liability assessment

- [ ] Calculate only the eligible unpaid amount.
- [ ] Use the frozen approval snapshot, not current group membership.
- [ ] Include all other snapshot guarantors unless deceased or legally released.
- [ ] Divide the amount equally.
- [ ] Assign remainder pesewas deterministically by ascending member ID.
- [ ] Require independent manager approval before collection begins.
- [ ] Prevent collection while approval is pending or the assessment is blocked.

### Contribution treatment

- [ ] Issue a receipt to each paying contributor.
- [ ] Record the payment as made on behalf of the original borrower.
- [ ] Reduce the original borrower receivable.
- [ ] Do not create a new loan or duplicate income for guarantors.
- [ ] Do not create a reimbursement claim until a legally approved policy exists.
- [ ] Record disputes and require manager resolution.
- [ ] Define a formal appeal procedure before production automation.

### Result

Joint liability is enforceable, explainable, equally allocated, and never mistaken for new revenue.

---

## Stage 10 — Define loan servicing and closure

### Active-loan servicing

- [ ] Show original principal, contractual interest, receipts, remaining balance, schedule, and status.
- [ ] Keep contractual balance separate from accrued accounting interest.
- [ ] Retain receipt, reversal, document, and guarantee histories.
- [ ] Prevent staff from editing posted repayment events.

### Early settlement

- [ ] Produce a dated payoff quote.
- [ ] Include all remaining principal and all remaining contractual interest.
- [ ] Apply no early-settlement rebate.
- [ ] Apply no waiver, penalty, or restructuring.
- [ ] Treat verified excess as refundable customer overpayment.

### Closure

- [ ] Close a loan only when contractual obligations reach zero or an approved future closure policy applies.
- [ ] Release the loan-specific guarantee after closure.
- [ ] Keep the contract, guarantee snapshot, receipts, and accounting history available.
- [ ] Allow future borrowing only after restriction and eligibility checks pass.

### Result

Staff can explain the current position of every loan and close it without deleting historical obligations or evidence.

---

## Stage 11 — Define accounting and month-end operations

### Accounting baseline

- [ ] Approve accrual accounting as the provisional basis.
- [ ] Approve the chart of accounts in the system requirements.
- [ ] Approve the event-to-journal matrix.
- [ ] Recognize principal receivable when cash is disbursed.
- [ ] Accrue contractual interest over elapsed calendar time rather than recognizing all income at disbursement.
- [ ] Transfer cash from collector custody to cash on hand only after verified handover.
- [ ] Require every journal to balance.
- [ ] Prohibit editing or deleting posted journals.
- [ ] Use linked reversals and replacement entries for corrections.

### Credit-loss policy

- [ ] Approve or replace the provisional aging provision rates.
- [ ] Confirm that provisioning does not end collection activity.
- [ ] Keep write-off posting disabled until an approved write-off policy exists.
- [ ] Define management review of unusual risk and manual overlays.

### Monthly close

- [ ] Reconcile all collector cash or document exceptions.
- [ ] Complete and sign the physical cash count.
- [ ] Review suspense, overpayments, reversals, and unresolved differences.
- [ ] Post required accruals and credit-loss provisions.
- [ ] Confirm a balanced trial balance.
- [ ] Obtain manager review.
- [ ] Close by the approved deadline of ten business days after month-end.
- [ ] Prevent ordinary posting into a closed period.
- [ ] Require an accountant request, manager approval, reason, and audit event to reopen.

### Result

Finance can produce a repeatable monthly close with balanced, reviewable, and immutable records.

---

## Stage 12 — Define capital source and use

### Funding lots

- [ ] Identify owner capital, verified recovered principal, and any future legally activated investor principal as source categories.
- [ ] Confirm that source attribution is a management subledger, not a claim that physical banknotes are separate.
- [ ] Record verified, available, reserved, committed, disbursed, recovered, and cancelled states.
- [ ] Prevent allocation above an available source balance.
- [ ] Confirm that a reservation and commitment are successive states of the same money, not additional balances.

### Recovery attribution

- [ ] Trace verified recovered principal separately from interest received.
- [ ] Make recovery available only after independent cash verification and posting.
- [ ] Link new disbursements to one or more source lots.
- [ ] Trace allocations backward to sources and forward to funded loans.
- [ ] Reconcile source-attribution balances with accounting cash without treating them as a second ledger.

### Result

Management can see where verified lending cash came from and how it was used without overstating available funds.

---

## Stage 13 — Resolve investor arrangements before activation

### Legal and commercial decisions

- [ ] Obtain written legal classification of the investment instrument.
- [ ] Obtain licensing or regulatory confirmation.
- [ ] Approve a legally reviewed signed contract template.
- [ ] Confirm the proposed 60% per annum simple-return basis or replace it.
- [ ] Approve maturity, withdrawal, default, cancellation, and tax treatment.
- [ ] Determine whether law, regulation, or contract requires fund segregation despite the current company preference.
- [ ] Approve payout timing and early-exit rules.

### Accounting and controls

- [ ] Approve investor principal liability and return-expense treatment.
- [ ] Approve daily simple-return accrual using the correct day basis.
- [ ] Define cleared-funds verification.
- [ ] Require maker-checker approval for receipts, adjustments, and payouts.
- [ ] Define maturity alerts, statements, and overdue obligations.
- [ ] Obtain final management sign-off.

### Activation restriction

- [ ] Keep investor onboarding, funding, allocation, accrual, and payout transactions disabled until every gate is complete.
- [ ] Ensure sample or draft investor data cannot affect operational balances.

### Result

The investor module is either legally approved with complete rules or remains safely unavailable.

---

## Stage 14 — Define reports, formulas, and management oversight

### Operational reports

- [ ] Borrower and group directory.
- [ ] Application and approval queue.
- [ ] Disbursement register.
- [ ] Repayment schedule and receipt history.
- [ ] Collector assignment, custody, and handover reports.
- [ ] Arrears and joint-liability reports.
- [ ] Restriction and reactivation register.
- [ ] Exceptions, reversals, and unresolved discrepancies.

### Financial reports

- [ ] Trial balance.
- [ ] Statement of financial position.
- [ ] Income statement.
- [ ] Cash-flow statement.
- [ ] General ledger.
- [ ] Loan portfolio outstanding and aging.
- [ ] Interest accrual.
- [ ] Credit-loss provision.
- [ ] Capital source-and-use trace.
- [ ] Investor liabilities and maturities after legal activation.

### Metric definitions

- [ ] Document the formula, date basis, inclusions, exclusions, and role scope for every dashboard number.
- [ ] Define portfolio outstanding, arrears, days past due, collection rate, principal recovered, interest received, available cash, and reinvested cash.
- [ ] Keep receipts issued separate from verified company cash.
- [ ] Keep contractual receivables separate from recognized accounting income.
- [ ] Reconcile report summaries to detailed records.

### Result

Management and auditors can reproduce every reported figure from controlled source records.

---

## Stage 15 — Prepare operating manuals, training, and business acceptance

### Operating procedures

- [ ] Write a procedure for every workflow in Stages 1–14.
- [ ] Include responsible role, prerequisites, steps, evidence, approval, exception, and escalation.
- [ ] Prepare opening, daily, end-of-day, month-end, and incident checklists.
- [ ] Prepare cash-safety and physical-document procedures.
- [ ] Prepare borrower complaint and correction procedures.
- [ ] Prepare staff joiner, role-change, and leaver procedures.

### Training

- [ ] Train System Administrators on access without financial self-authorization.
- [ ] Train Managers on approvals, exception reasoning, and segregation of duties.
- [ ] Train Loan Officers on identity, groups, applications, and evidence.
- [ ] Train Collectors on online cash capture, numbered receipts, custody, and handover.
- [ ] Train Cashier/Accountants on verification, reconciliation, journals, and period close.
- [ ] Train Auditors on evidence, histories, and report reconciliation.

### Business acceptance

- [ ] Walk through one successful loan from onboarding to closure.
- [ ] Walk through partial payment, overpayment, unidentified cash, reversal, and handover discrepancy.
- [ ] Walk through arrears and joint-liability approval.
- [ ] Walk through period close and controlled reopening.
- [ ] Verify that all unresolved policy items are either approved or explicitly block the affected feature.
- [ ] Obtain final Phase 1 business sign-off.

### Result

The company has enough approved knowledge, procedures, and trained ownership to operate the business consistently and commission the technical build.

---

## Phase 1 completion gate

Phase 1 is complete only when:

- [ ] All launch-critical business decisions are signed.
- [ ] Every workflow has a named owner and independent checker where required.
- [ ] The accounting policy and journal matrix are approved.
- [ ] Licensing, privacy, and retention requirements are confirmed.
- [ ] Investor operations are either fully approved or explicitly disabled.
- [ ] Report formulas and reconciliation expectations are documented.
- [ ] Operating manuals and acceptance scenarios are approved.
- [ ] Management authorizes Phase 2 implementation against this baseline.

## Simple Phase 1 sequence

1. Approve the operating baseline.
2. Define branches, roles, and authority.
3. Define borrower and group operations.
4. Approve the loan product and schedule rules.
5. Define application, approval, and guarantee snapshots.
6. Define funding and cash disbursement.
7. Define receipts, custody, handover, and reconciliation.
8. Define arrears and joint liability.
9. Define servicing, closure, accounting, and month-end.
10. Define capital attribution and investor gates.
11. Approve reports and operating manuals.
12. Train staff and sign off the business blueprint.

## Where work should begin now

- [ ] Hold a management workshop to approve Stage 0 decisions.
- [ ] Assign an owner and target date to every open decision in the system requirements.
- [ ] Ask the accountant to review the chart of accounts, accrual treatment, and credit-loss matrix.
- [ ] Ask Legal/Compliance to confirm licensing, privacy, retention, joint-liability appeals, and investor classification.
- [ ] Approve the maximum group size.
- [ ] Convert approved decisions into signed, versioned policy records before Phase 2 begins.
