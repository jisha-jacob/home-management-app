# Home Management App

A responsive family command center for coordinating recurring chores, meals, shared shopping, weekly reset work, and calendar events without adding another complicated system to maintain.

This repository is a portfolio case study of an AI-assisted development workflow. I defined the product requirements and technical architecture, used OpenAI Codex as a coding agent for constrained implementation tasks, reviewed and tested meaningful changes, and preserved progress through incremental Git commits.

The public repository and architecture document have been sanitized to remove private household details.

## Screenshots

### Home Dashboard

A calm daily overview of calendar events, chores, meals, and family profiles.

<p align="center">
  <img src="https://github.com/user-attachments/assets/23b79b9b-514a-456e-a0e7-744728e45f48" alt="Home Dashboard" width="850">
</p>

### Chore Management

Parents can edit chore assignments, recurrence, rooms, activity status, and Family Reset participation.

<p align="center">
  <img src="https://github.com/user-attachments/assets/9f636d5d-e464-42b1-81bb-6f8b13f406cd" alt="Chore Management" width="750">
</p>

### Family Reset

Weekly household tasks grouped by family member, with shared progress tracking.

<p align="center">
  <img src="https://github.com/user-attachments/assets/b5fc7b8f-283b-4819-96df-6d15212503f8" alt="Family Reset" width="750">
</p>

## Problem and Motivation

Household coordination often depends on one person remembering recurring work, communicating exceptions, planning meals, and keeping several disconnected lists current. The goal of this app is to make that work visible and shared while keeping the daily experience calm enough for both adults and children.

The product was designed around a few practical constraints:

- Show only what matters today on the main dashboard.
- Calculate recurring work instead of creating large numbers of future records.
- Let parents manage exceptions such as temporary reassignment or skipping a task.
- Keep children credential-free on a parent-authenticated shared device.
- Reuse the household's existing Google Calendar rather than creating a second calendar system.
- Stay lightweight, responsive, and inexpensive to operate.

## Key Features

- **Home dashboard:** date, profile filters, today's calendar events, chores, meals, a household reminder, and an upcoming-event preview.
- **Family profile filtering:** switches the dashboard and chore views between the full household and individual profiles.
- **Per-person progress and celebration:** a kiosk-readable "X of Y done" progress bar on each individual profile view, plus a brief, dismissible confetti celebration (reduced-motion friendly) the first time that person finishes their list for the day.
- **Celebration sound and evening reminders:** three rotating celebration sounds generated with the Web Audio API (no audio files), plus optional 7pm "check your list" and 8pm "names" reminders for anyone with incomplete chores. Each is configurable from Parent Mode, respects quiet hours, and degrades gracefully when audio is blocked or unavailable.
- **Recurring chores:** supports daily, weekday, weekend, weekly, every-two-weeks, and monthly schedules.
- **Chore management:** parents can add, edit, permanently delete, activate, assign, and categorize chore definitions.
- **Daily exceptions:** temporary reassignment, skip-today behavior, and one-time chores assigned for a specific day.
- **Completion tracking:** Firestore-backed completion state shared between the daily task views and Family Reset.
- **Filtered master task loading:** room, owner, and frequency filters avoid loading the entire chore collection until requested.
- **Meal planning:** a rolling seven-day breakfast, lunch, and dinner planner with saved favorites and Copy Previous 7 Days.
- **Family Reset:** calculates eligible weekly, biweekly, and monthly work for the current week, groups it by owner, and displays shared progress.
- **Shared shopping list:** real-time item updates, removal, Clear All confirmation, short undo support, and optional browser voice recognition where available.
- **Parent Mode:** a four-digit convenience PIN protects editing controls from accidental use on a shared device.
- **Authentication and authorization:** Google sign-in, verified-email checks, and private UID-based parent authorization.
- **Read-only Google Calendar:** server-side OAuth token handling, combined event display, refresh, disconnect, and account-change controls.
- **Responsive layouts:** phone, desktop, and tablet-oriented interfaces with large touch targets and no dependency on hover interactions.

## Tech Stack

- Plain HTML
- CSS
- JavaScript using browser-native ES modules
- Firebase Hosting
- Cloud Firestore
- Firebase Authentication with Google sign-in
- Firebase Cloud Functions, running on Node.js
- Google Calendar API with read-only OAuth scope
- Browser Web Speech API as an optional shopping-list input enhancement

The frontend deliberately avoids a framework to keep the bundle small, the runtime straightforward, and the interface usable on modest hardware.

## Architecture Overview

```text
Browser UI (HTML, CSS, JavaScript)
  ├── Firebase Authentication → verified Google account
  ├── Firestore → household data and UID authorization document
  └── Callable Cloud Functions → read-only Google Calendar integration
                                      └── private server-side OAuth tokens
```

The browser initializes authentication before loading private data. A signed-in user is treated as an approved parent only when the account's email is verified and an authorization document exists for that Firebase Authentication UID. Firestore rules enforce the same boundary for household collections; clients cannot create or modify authorization documents.

Recurring chores are stored as definitions. The browser calculates whether a chore is due for a date and combines that result with completion records and temporary overrides. This avoids pre-generating future task documents. Family Reset uses the same chore definitions and scheduled-date completions so its progress remains consistent with daily task views.

Cloud Functions are limited to the Google Calendar integration. They validate approved-parent authorization independently, keep OAuth refresh tokens outside browser-readable collections, and return only the event fields needed by the interface.

The detailed product and technical decisions are documented in [docs/PLAN-AND-ARCHITECTURE.md](docs/PLAN-AND-ARCHITECTURE.md).

## How I Used Codex

I wrote and maintained the architecture document as the source of truth. Codex did not independently define the product: I supplied the requirements, constraints, priorities, and acceptance criteria, then used Codex as a coding agent for bounded tasks.

Typical task instructions required Codex to:

- Read the architecture document before implementation.
- Work on one approved phase or feature at a time.
- Make the smallest useful change and avoid future-phase work.
- Preserve existing behavior outside the requested scope.
- Summarize every changed file and provide verification steps.
- Stop for review and approval before continuing.
- Avoid committing, pushing, or deploying unless explicitly requested.

The working loop was:

```text
Plan → Scoped Codex task → Review → Test → Refine → Commit
```

This approach kept product ownership and judgment with me while using Codex to accelerate implementation, code inspection, targeted refactoring, and verification.

## Development Workflow

The project progressed through small, reviewable increments:

1. Define the product behavior and constraints in the architecture document.
2. Give Codex a narrowly scoped implementation task with explicit exclusions.
3. Inspect the generated diff and test the affected behavior.
4. Refine the UI, data flow, or edge cases based on observed results.
5. Run focused syntax, formatting, privacy, and deployment checks as appropriate.
6. Commit the verified increment with a descriptive Git message.

The phase sequence moved from a static responsive prototype through local recurrence logic, Firebase persistence and authentication, parent editing, meal planning, Family Reset, Calendar integration, and later usability enhancements. Features were not treated as complete solely because code had been generated; meaningful steps were reviewed and manually tested before the next increment.

## Privacy and Security

- The public documentation and repository content are sanitized for portfolio use.
- Real household names, personal email addresses, authentication UIDs, private calendar data, and authorization records are not documented here.
- Household data requires Firebase Authentication, a verified email, and a private UID-based authorization document.
- A user may read only their own authorization document; browser clients cannot create, update, or delete authorization records.
- Firestore denies other data by default and limits household collection access to approved parents.
- The Parent Mode PIN is a convenience control for a shared screen, not the internet-facing security boundary.
- Google Calendar access is read-only, and OAuth refresh tokens are handled by Cloud Functions in browser-inaccessible storage.
- Calendar authorization and application authorization are kept separate.

## Current Project Status

The planned Version 1 workflow is implemented and has been exercised with Firebase-backed household data. The current repository includes the responsive dashboard, chore recurrence and editing, completion synchronization, rolling meal planning, Family Reset, shared shopping, parent authentication and authorization, Parent Mode, read-only Google Calendar integration, and an opt-in celebration sound with evening chore reminders.

The app is a focused single-household implementation rather than a multi-tenant product. Some lower-frequency configuration changes use one-time Firestore reads, so another active device may need a refresh to see those edits. Frequently changing data—including completions, meals, Family Reset progress, shopping items, and household content—uses Firestore listeners.

This repository is intended primarily as a portfolio case study, not as a turnkey deployment template.

## Lessons Learned

- A detailed source-of-truth document makes AI-assisted implementation more consistent and easier to review.
- Narrow prompts with explicit exclusions reduce unintended scope growth.
- Building recurrence logic before adding persistence made database integration easier to reason about.
- Shared views should derive from the same records; using scheduled-date completions keeps daily chores and Family Reset aligned.
- Convenience controls such as a parent PIN must remain separate from actual authentication and authorization.
- Privacy work includes source code, security rules, server-side flows, documentation, and sample content—not only secrets.
- Manual review and real-device testing remain essential even when implementation is accelerated by a coding agent.

## Repository Structure

```text
.
├── assets/                 App icons
├── css/styles.css          Responsive visual design
├── data/sample-data.js     Generic initial UI data and fallback structures
├── docs/                   Product plan and technical architecture
├── functions/              Calendar-related Firebase Cloud Functions
├── js/app.js               UI state, rendering, and interaction logic
├── js/auth.js              Authentication, authorization, and Calendar UI flow
├── js/firestore-data.js    Firestore reads, writes, queries, and listeners
├── firestore.rules         Firestore authorization rules
├── firebase.json           Firebase component configuration
├── index.html              Application shell and screens
└── manifest.webmanifest    Web app metadata
```

## Running Locally

The static files can be served with any local HTTP server, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Recorded audio clips (celebration sounds, name announcements, and reminder clips) are not included in this repository, since they come from sources not licensed for redistribution. They're expected at `assets/celebrate/celebrate-1.mp3` through `celebrate-12.mp3` (or `.wav`), `assets/names/<member-id>.mp3`, `assets/check-tasks.mp3`, and `assets/not-done.mp3`. Any missing clip is skipped silently, with the app falling back to synthesized sound or a visual-only celebration.

Firebase-backed features require a separate Firebase project, authentication provider, Firestore data, security rules, and Calendar OAuth configuration. Private credentials, account identifiers, authorization documents, and household data are intentionally not provided as setup material.
