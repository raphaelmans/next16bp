# Chat (Owner Contracts) - Optional

Owner app contract expects chat side effects but can defer implementation.

Maps to (tRPC)
- `chat.getAuth`
- `reservationChat.getSession`
- `supportChat.getClaimSession` / `supportChat.getVerificationSession`

Notes:
- Keep chat provisioning best-effort (do not break primary mutations).
