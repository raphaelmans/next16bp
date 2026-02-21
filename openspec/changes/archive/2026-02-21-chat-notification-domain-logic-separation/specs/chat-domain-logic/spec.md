## ADDED Requirements

### Requirement: Shared Chat Canonical Rules

Chat channel and message identity rules that must behave consistently across client and server SHALL be implemented as pure functions in module-owned shared files.

#### Scenario: Canonical support channel parsing

- **GIVEN** channel ids prefixed with `cr-` or `vr-`
- **WHEN** shared chat parsing functions are called
- **THEN** kind and request id are derived consistently
- **AND** invalid prefixes are rejected deterministically

#### Scenario: Canonical reservation channel parsing

- **GIVEN** channel ids prefixed with `res-`
- **WHEN** shared chat parsing functions are called
- **THEN** reservation id derivation is consistent across call sites

### Requirement: Chat Feature View-Model Logic Is Pure

Chat feature view-model shaping SHALL be implemented in `src/features/chat/domain.ts` as pure functions without UI/runtime side effects.

#### Scenario: Reservation read-only derivation

- **GIVEN** reservation chat meta and current time input
- **WHEN** read-only/archive status functions are evaluated
- **THEN** derived read-only states and reasons are deterministic

#### Scenario: Reservation inbox ordering derivation

- **GIVEN** reservation channels and metas
- **WHEN** sorting and partitioning domain functions run
- **THEN** output ordering and grouping are deterministic and testable without rendering

### Requirement: Chat UI Consumes Domain Outputs

Chat components SHALL consume extracted domain/shared functions for deterministic derivations instead of duplicating inline logic.

#### Scenario: Support inbox rendering

- **GIVEN** support channels and archived ids
- **WHEN** inbox list is rendered
- **THEN** row labels/kinds/request ids come from domain/shared functions
- **AND** component code remains focused on orchestration and interaction wiring
