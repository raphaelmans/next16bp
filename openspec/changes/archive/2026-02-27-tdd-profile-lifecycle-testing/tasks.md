## 1. Service Coverage

- [x] 1.1 Add `ProfileService.getProfile` success/not-found tests
- [x] 1.2 Add `ProfileService.getProfileById` success/not-found tests
- [x] 1.3 Add `ProfileService.getOrCreateProfile` existing and create path tests
- [x] 1.4 Add `ProfileService.updateProfile` existing and auto-create path tests
- [x] 1.5 Add `ProfileService.uploadAvatar` success and missing-url failure tests

## 2. Router Coverage

- [x] 2.1 Add `profileRouter.me` contract tests
- [x] 2.2 Add `profileRouter.update` contract tests
- [x] 2.3 Add `profileRouter.uploadAvatar` contract tests
- [x] 2.4 Add `profileRouter.getById` success and `NOT_FOUND` mapping tests

## 3. Cross-Flow Regression

- [x] 3.1 Add targeted reservation-router profile-bootstrap regression assertions

## 4. Validation

- [x] 4.1 Run `pnpm lint`
- [x] 4.2 Run targeted vitest suites for profile and reservation-router changes
