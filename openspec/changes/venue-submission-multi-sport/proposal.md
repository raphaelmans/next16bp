# Venue Submission Multi-Sport

## Problem
The "Submit a Court" feature creates a place record with a single sportId but no actual court records. The terminology is misleading - users submit venues (places), not individual courts.

## Solution
1. Rename all user-facing copy from "court" to "venue"
2. Replace single sportId with a courts array: { sportId, count }[]
3. Create actual court records in the DB during submission
4. Update admin moderation UI to show sports/court info with venue terminology

## Constraints
- URL path `/submit-court` stays as-is (only UI copy changes)
- Internal module names stay as `court-submission` (no folder/table/router renames)
- Court labels are sequential across all sports: "Court 1" through "Court N"
