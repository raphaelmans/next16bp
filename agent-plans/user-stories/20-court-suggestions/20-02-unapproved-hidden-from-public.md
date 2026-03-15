# US-20-02: Unapproved Suggested Courts Are Hidden From Public Discovery

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As a **platform**, I want **unapproved suggested listings to be hidden** so that **only vetted curated places appear in public discovery**.

---

## Acceptance Criteria

### Not Listed

- Given a curated place is created via user suggestion and is not approved
- When a public user visits `/courts`
- Then the place does not appear in results (search, filters, pagination)

### Not Accessible by Direct Link

- Given a curated place is created via user suggestion and is not approved
- When a public user visits `/places/{id}` directly
- Then they receive a not found response

### Side-Effect Requests Blocked

- Given a curated place is not approved
- When a user attempts any request flow that targets that place (e.g., claim/removal requests)
- Then the platform rejects the attempt as not found or not allowed

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Place is approved later | Place becomes publicly visible normally |
| Place is rejected | Place remains hidden and is treated as inactive |
