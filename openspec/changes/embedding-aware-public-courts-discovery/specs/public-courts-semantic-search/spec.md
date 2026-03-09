## ADDED Requirements

### Requirement: Public courts discovery supplements underfilled lexical search with semantic venue candidates
The public `/courts` discovery search SHALL preserve lexical query matching as the primary retrieval path and SHALL only supplement it with semantic venue candidates when the first requested page is underfilled.

#### Scenario: Lexical search fills the requested page
- **WHEN** a user submits a public courts search query and lexical discovery results already fill the requested page
- **THEN** discovery returns the lexical results without adding semantic-only venues

#### Scenario: Lexical search underfills the requested page
- **WHEN** a user submits a qualifying public courts search query and lexical discovery returns fewer venues than the requested page size
- **THEN** discovery appends semantic-only venue candidates until the page is filled or semantic candidates are exhausted

### Requirement: Semantic search is gated to conservative query conditions
The system SHALL only invoke semantic venue search for public `/courts` queries that meet conservative gating rules to control cost and reduce noisy matches.

#### Scenario: Single-token query
- **WHEN** a user searches public discovery with a single-token query
- **THEN** discovery uses lexical search only

#### Scenario: Paginated follow-up page
- **WHEN** a user requests a public discovery page with `offset > 0`
- **THEN** discovery uses lexical search only

#### Scenario: Multi-token first-page query
- **WHEN** a user searches public discovery with a multi-token query on the first page and lexical results underfill the page
- **THEN** discovery may invoke semantic venue search to supplement the result set

### Requirement: Semantic discovery results deduplicate against lexical results
Semantic venue candidates SHALL be deduplicated against lexical results by place identity before being returned to the public discovery page.

#### Scenario: Venue appears in both lexical and semantic result sets
- **WHEN** the same venue is present in both lexical and semantic candidate sets
- **THEN** the venue appears only once in the final public discovery results

### Requirement: Public search transport remains stable
The semantic search enhancement SHALL not require a new public search endpoint or a changed public summary response shape.

#### Scenario: Existing public discovery clients
- **WHEN** the semantic search enhancement is enabled
- **THEN** homepage and discovery search forms continue submitting `q` to `/courts` and consume the existing public discovery response contract
