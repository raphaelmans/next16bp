## 1. Product Contracts And Persistence

- [ ] 1.1 Define the organization plan-assignment artifact contract for `FREE` and `BUSINESS_PLUS`, including billing-cycle anchor metadata and manual assignment source
- [ ] 1.2 Define the organization notification-policy contract for the explicit SMS assignee
- [ ] 1.3 Define the organization costly-service usage ledger contract for quota-governed services, with SMS as the first service key

## 2. Quota And Routing Design

- [ ] 2.1 Specify the plan-source adapter contract used by quota evaluation
- [ ] 2.2 Specify quota-policy resolution for `SMS` across `FREE` and `BUSINESS_PLUS`
- [ ] 2.3 Specify dispatch-time SMS quota enforcement and usage-recording behavior
- [ ] 2.4 Specify the single-recipient organization SMS resolution flow, including owner fallback and invalid-assignee handling

## 3. Owner And Admin Surfaces

- [ ] 3.1 Specify owner-facing SMS assignee read/write APIs and settings-screen behavior
- [ ] 3.2 Specify admin-facing plan assignment read/write APIs
- [ ] 3.3 Specify the minimal admin UI behavior for searching organizations and changing plan assignments

## 4. Validation

- [ ] 4.1 Validate the OpenSpec change artifacts against the local spec-driven schema
- [ ] 4.2 Review the change package for consistency between proposal, design, specs, and task breakdown before any code implementation starts
