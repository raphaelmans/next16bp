# Listing Verifier Fixtures

Fixture files define small, deterministic batches for the place-listing verifier.

- `scripts/test-place-listing-verifier-fixtures.ts` checks the deterministic baseline suggestion against fixture expectations.
- `scripts/eval-place-listing-verifier.ts` replays the same fixtures against OpenAI for prompt and parameter tuning.

## Deterministic check

```bash
pnpm script:test-place-listing-verifier
```

## Live eval

```bash
pnpm script:eval-place-listing-verifier
pnpm script:eval-place-listing-verifier -- --model gpt-5-mini
pnpm script:eval-place-listing-verifier -- --fixture obvious-remove.json
```
