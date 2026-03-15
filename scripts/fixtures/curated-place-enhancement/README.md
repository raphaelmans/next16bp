# Curated Place Enhancement Fixtures

Fixture files replay the standalone post-persistence enhancement pipeline against
saved website or Facebook evidence.

Each fixture should include:

- `fixtureName`
- `source`: `website` or `facebook`
- `candidate`: the persisted place snapshot being enhanced
- `input`: saved source evidence
- `expected`: judged decision and improved payload

Run the eval harness with:

```bash
pnpm script:eval-curated-enhancement
pnpm script:eval-curated-enhancement -- --fixture example.json
pnpm script:eval-curated-enhancement -- --source facebook --judge-model gpt-5-mini
```
