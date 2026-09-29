# Security Spec for Lingban Space Firestore Rules

## 1. Data Invariants
- Each user owns their own subcollections (/users/{userId}/messages, /users/{userId}/tracks, /users/{userId}/bookmarks).
- Only the document owner (`request.auth.uid == userId`) may read, create, update, or delete tracks under `/users/{userId}/tracks/{trackId}`.
- Tracks cannot have unbounded field lengths:
  - `title` is string, length 1..120
  - `artist` is string, length 1..80
  - `notes` is optional string, length 0..500
  - `lastPlayedProgress` is optional number >= 0 and <= 86400
  - `duration` is optional number >= 0 and <= 86400
  - `category` is optional string <= 40
  - `fileSize` is optional string <= 20
  - `synthPreset` is optional string <= 32
  - `lyrics` is optional list with size <= 200
  - `createdAt` is optional string <= 64
  - `updatedAt` is optional string <= 64
- No shadow fields or unvalidated parameters during create or update.

## 2. The Dirty Dozen Payloads (Designed to break Identity, Integrity, and State)
1. **Unauthenticated Read/Write**: Attempt to read/write `/users/{userId}/tracks/{trackId}` without `request.auth`.
2. **Identity Spoofing**: User A attempts to write to `/users/{userB}/tracks/{trackId}`.
3. **Payload Spoofing**: User A attempts to set `userId: userB` inside data while writing to User A's path.
4. **Oversized String Injection**: Attempt to set `title` with 10,000 characters.
5. **Ghost Field Poisoning**: Attempt to insert unapproved field `isAdmin: true` into `tracks`.
6. **Negative / NaN Progress**: Attempt to set `lastPlayedProgress: -500` or a string `"five_minutes"`.
7. **Negative Duration**: Attempt to set `duration: -100`.
8. **Oversized Notes**: Attempt to set `notes` with 5,000 characters to bloat storage.
9. **Oversized Lyrics List**: Attempt to insert 1,000 lines of lyrics.
10. **Foreign Path Access**: Attempt to enumerate `/users` collection without user ownership.
11. **Malicious ID Injection**: Attempt to use invalid characters or >128 chars for `trackId`.
12. **Immutable Field Modification**: Attempt to mutate `userId` during track update.
