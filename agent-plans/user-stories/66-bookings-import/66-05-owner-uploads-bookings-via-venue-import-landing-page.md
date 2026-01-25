# US-66-05: Owner Uploads Bookings via Venue Import Landing Page

**Status:** Active  
**Supersedes:** -  
**Superseded By:** -

---

## Story

As an **organization owner**, I want to **select a venue, choose the import source type, and upload my export via drag-and-drop** so that **the platform can route my file through the correct normalization pipeline and I can start the migration confidently**.

---

## Acceptance Criteria

### Venue Selection Is Required

- Given I have access to one or more venues
- When I open the bookings import page
- Then I must select a venue before I can upload

### Source Type Selection Is Required (No Auto-Detect)

- Given I am on the bookings import page
- When I try to upload a file without selecting a source type
- Then the platform prevents the upload
- And I am prompted to select one of: ICS, CSV, XLSX, Calendar Screenshot

### Drag-and-Drop Upload Supports Source-Specific File Types

- Given I selected a source type
- When I drag and drop a file into the dropzone
- Then the platform accepts only supported file extensions for that source type
- And unsupported files are rejected with an inline error near the dropzone

### File Validation Feedback Is Inline and Actionable

- Given I upload an unsupported file type, too-large file, or multiple files
- When the dropzone validates the selection
- Then I see errors next to the dropzone
- And I can remove/replace the selected file and try again

### Import Flow Has a Clear Progress Indicator

- Given I am completing the import flow
- Then the UI shows a step indicator (e.g., Step 1 of 4)

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| User drops multiple files | Platform rejects extras and explains that only one file is allowed |
| User selects the wrong source type for the file | Platform rejects the file and explains supported extensions |
| AI is already used for the venue | UI still allows upload + review, but disables the AI normalization action and explains why |

---

## Form Fields

| Field | Type | Required |
|-------|------|----------|
| Venue | select | Yes |
| Source Type | radio/select | Yes |
| Upload File | file | Yes |

---

## References

- Design System: `business-contexts/kudoscourts-design-system.md`
- Dropzone: https://react-dropzone.js.org/
- Related domain: `agent-plans/user-stories/66-bookings-import/`
