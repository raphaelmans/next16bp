# Phase 1-4: `normalize-data` PoC Script

**Dependencies:** None  
**Parallelizable:** Partial  
**User Stories:** US-66-04

---

## Objective

Implement a PoC CLI that converts external bookings exports (`.ics`, `.csv`, `.xlsx`) into a normalized list of reservation blocks using:

- Deterministic parsing (no AI)
- A single AI call to generate a mapping spec (AI SDK + OpenAI `gpt-5.2`)
- Deterministic normalization to blocks + resource metadata
- Zod validation + best-effort error reporting

No DB reads/writes.

---

## CLI

### Command

Add a pnpm script:

```bash
pnpm script:normalize-data -- --path="/abs/path/to/file.ics"
```

### Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--path` | File path to normalize | required |
| `--format` | `ics` / `csv` / `xlsx` | inferred from extension |
| `--time-zone` | Time zone fallback for local-looking times | `Asia/Manila` |
| `--range-start` | Start for RRULE expansion | `now()` |
| `--range-end` | End for RRULE expansion | `now()+60d` |
| `--model` | OpenAI model id | `gpt-5.2` |
| `--mapping-file` | Load mapping spec JSON (skip AI) | none |
| `--save-mapping-file` | Save mapping spec JSON for reruns | none |
| `--no-ai` | Require `--mapping-file` and skip AI | false |

---

## Output Contract (PoC)

### `resources[]`

Represents detected courts/resources in the input.

```ts
{
  resourceId: "r1" | "r2" | ...,
  label: string,
  sport?: "pickleball" | "basketball" | "badminton" | "tennis" | "unknown"
}
```

### `blocks[]`

Normalized reservation blocks that reference a resource.

```ts
{
  resourceId: string,
  startTime: string, // ISO datetime (UTC)
  endTime: string, // ISO datetime (UTC)
  reason?: string | null,
  source?: { format: "ics" | "csv" | "xlsx"; row?: number; uid?: string }
}
```

### `errors[]`

Best-effort errors collected during parsing/normalization.

```ts
{
  message: string,
  format: "ics" | "csv" | "xlsx",
  row?: number,
  uid?: string
}
```

---

## Deterministic Parsing

### CSV

- Parse header row + rows (reuse the style from `scripts/import-curated-courts.ts`)
- Produce `headers: string[]` + `rows: Record<string, string>`

### XLSX

- Use `xlsx` to read the workbook
- Default to first sheet unless `mappingSpec.sheetName` is provided
- Convert to `headers + rows` in the same shape as CSV

### ICS

- Use an ICS library that can expand RRULE within `[rangeStart, rangeEnd]`
- Produce a list of occurrences:

```ts
{
  start: Date;
  end: Date;
  summary?: string;
  location?: string;
  description?: string;
  uid?: string;
  status?: string;
}
```

---

## AI Mapping Spec (Single Call)

### Why mapping spec only

The model should not rewrite every row/event. It should only return a minimal JSON spec describing:

- Which field/column represents the resource/court
- Which field/column(s) represent start/end times
- Which field represents reason/notes
- Optional: sport column (or "infer")
- Parsing hints (date order/time format/time zone fallback)

This keeps cost low and makes normalization deterministic.

### Mapping spec fields

- `resource`: where to read the "court" identity
- `sport`: where to read sport (optional) or infer
- `start`/`end`: datetime mapping mode
- `reason`: reason mapping
- `parsing`: date/time hints + tz fallback
- `filtering`: ignore cancelled/all-day, etc

### AI SDK call shape

```ts
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";

const { object: mappingSpec } = await generateObject({
  model: openai("gpt-5.2"),
  schema: NormalizationMappingSpecSchema,
  temperature: 0,
  prompt: buildPrompt({ format, headers, sampleRows, sampleEvents, timeZoneFallback }),
});
```

---

## Deterministic Normalization

### 1) Extract candidates

For each row/event:

- `resourceLabel`: derived via mapping spec
- `start`/`end`: converted to UTC ISO
- `reason`: optional
- `sportRaw`: optional

### 2) Detect multi-court + assign resource IDs

- Build unique labels set
- Sort labels (stable ordering)
- Assign `r1`, `r2`, ...

### 3) Sport detection (best-effort)

Resolution order:
1. Explicit sport column (tabular)
2. Keyword inference from resource label / reason
3. `unknown`

Allowed sports (current seed list):
`pickleball | basketball | badminton | tennis | unknown`

### 4) Validate blocks

- Ensure `resourceId` exists
- Ensure ISO datetimes parse
- Ensure `endTime > startTime`
- Collect invalid entries into `errors[]` and continue

---

## Example Output

```json
{
  "meta": {
    "format": "ics",
    "timeZoneFallback": "Asia/Manila",
    "isMultiCourt": true,
    "resources": [
      { "resourceId": "r1", "label": "Court 1", "sport": "pickleball" },
      { "resourceId": "r2", "label": "Court 2", "sport": "pickleball" }
    ],
    "sportsDetected": ["pickleball"]
  },
  "blocks": [
    {
      "resourceId": "r1",
      "startTime": "2026-01-25T01:00:00.000Z",
      "endTime": "2026-01-25T02:00:00.000Z",
      "reason": "Walk-in",
      "source": { "format": "ics", "uid": "abc123" }
    }
  ],
  "errors": []
}
```

---

## QA Checklist

- CSV: datetime columns vs date+time split columns
- XLSX: first sheet detection + header detection
- ICS: RRULE expansion within range
- Multi-court: resources list stable and blocks reference correct resourceId
- Sport: explicit column + inference fallback
- Deterministic rerun: `--mapping-file` produces identical blocks

---

## Verification

```bash
pnpm lint
TZ=UTC pnpm build
pnpm script:normalize-data -- --path="/abs/path/to/file.csv"
```
