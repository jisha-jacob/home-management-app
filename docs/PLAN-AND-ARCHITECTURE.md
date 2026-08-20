# Home Management App — Product Plan & Architecture

## 1. Project Overview

### Working Goal
Build a lightweight, family-friendly home management web app that helps a family of six run the household smoothly without creating more mental load.

The app should function as a **family command center** inspired by the simplicity and at-a-glance usefulness of products such as Skylight Calendar and Hearth Display, while remaining:

- Simple
- Fast
- Easy for children to use
- Easy for parents to edit
- Responsive on phones and laptops
- Ready for a future dedicated tablet display
- Free to run if possible
- Easy to build and maintain phase by phase

The app is not intended to reproduce every Skylight or Hearth feature. It should solve this family's actual home-management needs with as little complexity as possible.

---

## 2. Household Context

Family of six:

- Mom
- Dad
- Child 1 — age 11
- Child 2 — age 8
- Child 3 — age 8
- Child 4 — toddler, age 2.5

Home:

- 3-bedroom, 3.5-bath townhouse
- Kids share one bedroom
- Parents and toddler share one bedroom
- One bedroom is used as an office
- Basement hangout room used by the oldest child and friends

Current household priorities:

- Keep the kitchen under control
- Reduce dish-related mess
- Keep bathrooms reasonably clean
- Keep floors from becoming excessively dirty
- Reduce daily meal-planning decisions
- Stop cooking a completely new dinner every day
- Keep bedrooms reset without constant parental nagging
- Give Mom protected daytime study/course time
- Make household responsibility visible and shared
- Make weekends lighter and more enjoyable

Target household standard:

> Comfortably maintained most of the time, with a separate "guest-ready" standard when needed.

---

## 3. Core Product Principles

### 3.1 The app should reduce remembering
The app should remember:

- What chores recur
- When they are due
- Who normally owns them
- Whether they are complete today
- What meals are planned
- What calendar events are coming up
- What belongs in the weekly Family Reset

Parents should mainly manage **exceptions**, not recreate routine work.

### 3.2 The app should not become another chore
The interface must remain simple enough that maintaining the app does not create more work than it removes.

### 3.3 Today's view should be calm
Children should not see a giant master task list every day.

The home dashboard should show only what matters **today**.

### 3.4 Shared ownership
The household model is:

> Everyone who lives here participates in maintaining the home.

The app should support ownership rather than "helping Mom."

### 3.5 Parent flexibility
Life happens.

Parents need to be able to:

- Reassign a task temporarily
- Change the normal owner
- Skip a task for today
- Add or edit chores
- Edit meal plans
- Change family settings

### 3.6 Build for the weakest reasonable device
The original Lenovo tablet is no longer considered a dependable primary device.

Version 1 will target:

- Modern phones
- Laptops/desktops
- Responsive browser layouts

The UI should remain lightweight enough to work well on a basic future tablet.

---

## 4. Cost Requirement

### Primary requirement
Aim for:

> **$0 ongoing cost**

Avoid services that require paid plans or credit cards unless absolutely necessary.

### Proposed free-first stack

- Frontend: HTML + CSS + JavaScript
- Hosting: Firebase Hosting, Spark/free tier
- Database: Cloud Firestore, Spark/free tier
- Authentication: Firebase Authentication
- Calendar: Read-only Google Calendar integration
- Domain: Use Firebase-provided domain initially
- Notifications: None
- File/image storage: None
- Native mobile app: None
- Paid APIs: None

### Important cost-control choices

- No Cloud Functions for routine chore generation
- No scheduled backend jobs
- No push notifications
- No file uploads
- No image storage
- No analytics-heavy features
- No premium domain required
- No App Store or Play Store deployment

---

## 5. Technical Architecture

## 5.1 Frontend

### Recommendation
Use:

- `index.html`
- `styles.css`
- `app.js`

Additional JavaScript modules may be added later as the app grows.

### Why plain HTML/CSS/JavaScript

- Smaller bundle
- Faster load time
- Lower memory usage
- Easier compatibility with older tablets
- Easier debugging
- No framework dependency
- Sufficient for the required interaction model

React is intentionally excluded from Version 1 unless the project later becomes complex enough to justify it.

---

## 5.2 Hosting

Use Firebase Hosting.

Initial app can be developed locally before Firebase is introduced.

Development sequence:

1. Static local prototype
2. Responsive testing
3. Firebase Hosting
4. Firestore data foundation and seed data
5. Minimum Firebase Authentication required for secure Firestore access
6. Secure Firestore-backed persistence and synchronization
7. Parent Mode and authorization controls
8. Calendar integration

This prevents infrastructure from slowing down UI design.

---

## 5.3 Database

Use Cloud Firestore.

The app's household usage is expected to be very small.

Proposed conceptual data structure:

```text
families/
  {familyId}/
    settings/
    members/
    chores/
    completions/
    choreOverrides/
    meals/
    mealFavorites/
```

A single-family implementation is sufficient initially.

---

## 5.4 Authentication

### Parents
Mom and Dad have equal administrative permissions.

Preferred eventual authentication:

- Google sign-in or Firebase-supported parent authentication

Authentication must be initialized before the browser app is allowed to read
or write private Firestore data. Phase 5 therefore includes the minimum parent
sign-in gate needed for secure persistence. Full Parent Mode authorization,
editing controls, and the convenience PIN remain in Phase 6.

### Kids
Children do not need separate login credentials.

Kids interact through their family profile after the shared device is signed in.

### Parent Mode
Editing/admin actions are protected by a simple 4-digit Parent PIN.

The PIN is a convenience lock against accidental child edits, not the real security layer.

Actual data security should be enforced with Firebase Authentication and Firestore security rules.

---

## 5.5 Calendar

Google Calendar remains the family's source of truth.

Version 1 calendar integration is **read-only**.

The app should display:

- Today's calendar events
- Small preview of upcoming events

The app will NOT initially support:

- Creating Google Calendar events
- Editing Google Calendar events
- Deleting Google Calendar events

Combined calendar view is sufficient for Version 1.

---

## 6. Primary Navigation

Recommended application navigation:

### Laptop/Desktop
- Home
- Chores
- Meals
- Shopping
- Family Reset
- More

### Phone
Use a bottom navigation bar:

- Home
- Chores
- Meals
- Shopping
- Reset
- More

The same application should responsively adapt to both.

---

# 7. Home Dashboard

The Home screen is the central family command center.

It should answer:

> What is happening today, what do I need to do, and what are we eating?

## 7.1 Home screen content

Display only:

1. Current date
2. Family profile filters
3. Today's calendar
4. Today's chores
5. Today's three meals
6. One household reminder
7. Small upcoming-event preview

Do NOT show:

- Full master chore list
- Grocery list
- Detailed history
- Monthly cleaning backlog
- Full Family Reset list
- Long-term analytics

---

## 7.2 Date

Show date only.

Example:

```text
TUESDAY, AUGUST 18
```

No clock is required.

---

## 7.3 Family Profiles

Profiles:

- Family
- Mom
- Dad
- Child 1
- Child 2
- Child 3
- Toddler

Each person has:

- Name
- Color
- Optional avatar/icon later
- Display order

### Behavior

Tap `Family`:
- Show shared family view

Tap a person:
- Filter chores to that person
- Filter calendar events if possible/relevant
- Keep meals visible

The toddler profile should use especially large, simple controls.

---

## 7.4 Today's Chores

Show only chores due today.

Each chore should show:

- Assignee
- Task name
- Large checkbox
- Family color indicator

Example:

```text
Child 1     [✓] Unload dishwasher
Child 2     [ ] Wipe dining table
Child 3     [ ] Vacuum under dining table
Toddler     [ ] Put toys away
Dad         [ ] Kitchen close
```

Completed chores can visually fade or move to a completed section.

---

## 7.5 Today's Meals

Display:

- Breakfast
- Lunch
- Dinner

Example:

```text
Breakfast   Eggs + toast + fruit
Lunch       Leftover dal + rice
Dinner      Chicken curry + rice
```

Keep this concise.

Optional short tags later:

- Leftovers
- Freezer
- Batch cooked
- Easy meal

---

## 7.6 Household Reminder

Only one prominent reminder at a time.

Examples:

- Laundry tonight
- Towels today
- Family Reset today
- Sheets this weekend
- 3 weekly chores due

No push notifications.

The dashboard itself is the reminder mechanism.

---

## 7.7 Upcoming Preview

Show one or two important upcoming events.

Example:

```text
Tomorrow: Dentist — 10:30 AM
```

---

# 8. Chores System

## 8.1 Chore Views

Chores screen should support:

### Today
Only chores due today.

### By Room
View all active routine chores grouped by room.

This is a planning view rather than a second copy of Today's list. Each chore
must show:

- Chore name
- Normal owner
- Calculated next-due timing
- Recurrence as supporting context

Use calm, human-readable next-due labels:

- `Today` when currently due
- `Tomorrow` when next due the following day
- A weekday name, such as `Friday`, when next due within seven days
- A short date, such as `Sep 1`, when due later

Today's temporary overrides must be visible in this view. A reassigned chore
should identify today's temporary owner, while a skipped chore should say that
it is skipped today and show its next due date.

Examples:

```text
Unload dishwasher
Child 1 · Today · Daily

Clean out fridge
Mom · Sep 1 · Monthly

Wipe dining table
Child 2 · Skipped today · Tomorrow · Daily
```

Do not add editing controls to By Room before the planned parent editing
phases.

### All Tasks
Parent-focused master task list.

Do not load the full chore collection automatically when this view opens. Show
room, owner, and frequency filters first so the family can request only the
records they need. Provide an explicit Show All Tasks option when the complete
master list is required.

---

## 8.2 Rooms

Initial rooms/categories:

- Kitchen
- Dining Area
- Living Room / Family Room
- Entryway
- Stairs / Hallways
- Kids' Bedroom
- Parents / Toddler Bedroom
- Office
- Basement Hangout Room
- Kids' Bathroom
- Primary Bathroom
- Powder Room 1
- Powder Room 2
- Laundry Area
- Whole House
- Household Admin

Rooms must be editable later.

---

## 8.3 Initial Master Task List

The previously created room-by-room household cleaning checklist will seed the app.

It includes tasks across:

- Kitchen
- Dining
- Living room
- Entryway
- Hallways/stairs
- Bedrooms
- Office
- Basement
- Bathrooms
- Laundry
- Floors
- Trash/recycling
- Pantry/fridge
- Bedding/towels
- Household admin
- Household maintenance
- Decluttering

The initial app should NOT require manually retyping all of these tasks.

They should be imported or seeded into Firestore when the database phase begins.

---

## 8.4 Chore Fields

Each chore should support:

```text
id
name
room
defaultOwner
frequency
dayOfWeek
dayOfMonth
active
familyReset
notes
```

Not every field is required for every task.

---

## 8.5 Supported Frequencies

Keep recurrence intentionally simple.

Version 1:

- Daily
- Weekdays
- Weekends
- Weekly
- Every 2 Weeks
- Monthly

Avoid complex recurrence rules initially.

---

## 8.6 Automatic Recurrence

Recurring chores should appear automatically when due.

Do not create thousands of future chore documents.

Instead:

1. Store the chore definition
2. Calculate whether it is due today when the app loads
3. Check whether today's completion already exists
4. Display the chore if due and incomplete

Example chore:

```text
Name: Unload dishwasher
Frequency: Daily
Owner: Child 1
```

Example completion:

```text
choreId: unload-dishwasher
date: 2026-08-18
completed: true
```

Tomorrow, the chore becomes due again automatically.

---

## 8.7 Task Assignment

Tasks can be assigned to:

- Mom
- Dad
- Child 1
- Child 2
- Child 3
- Toddler
- Family
- Unassigned

Most routine chores should have a default owner.

Some Family Reset tasks can remain shared/unassigned.

---

## 8.8 Temporary Reassignment

Parents need two reassignment options:

### Today only
Example:
Child is sick, so Dad handles today's bathroom chore.

### All future occurrences
Changes the default owner.

This distinction is important.

---

## 8.9 Skip Today

Parents can select:

> Skip today

Use when the task genuinely does not need to happen.

Kids cannot skip tasks.

---

## 8.10 Completion

Kids and parents can mark tasks complete.

No approval workflow in Version 1.

The goal is getting household work done, not tracking performance.

---

## 8.11 History

Minimal history only.

Keep enough data to know:

- Was today's chore completed?
- Was this weekly chore already completed for this cycle?

Do NOT build:

- Leaderboards
- Performance charts
- Streak analytics
- Chore scoring
- Weekly compliance reports

---

# 9. Meal Planner

## 9.1 Weekly Plan

Plan all three meals for all seven days:

- Breakfast
- Lunch
- Dinner

Example:

| Day | Breakfast | Lunch | Dinner |
|---|---|---|---|
| Monday | Oatmeal | Dal + rice | Chicken curry |
| Tuesday | Eggs | Leftovers | Leftovers |
| Wednesday | Idli | Sandwich | Pasta |

---

## 9.2 Meal Editing

Parents can:

- Type any meal freely
- Edit any meal
- Clear a meal
- Copy a previous week's plan

---

## 9.3 Saved Favorites

Support reusable favorites/templates.

Possible groups:

### Breakfast
- Eggs + toast
- Oatmeal
- Dosa
- Idli
- Cereal

### Lunch
- Leftovers
- Sandwiches
- Wraps
- Dal + rice

### Dinner
- Chicken curry
- Pasta
- Rajma
- Biryani
- Freezer meal

---

## 9.4 Copy Previous Week

Provide:

> Copy Last Week

This should populate the current week so parents only change what is different.

---

## 9.5 Grocery Integration

Explicitly OUT of scope for Version 1.

The family's existing fridge notepad continues to handle groceries.

Possible later feature only if needed.

---

# 10. Family Reset Mode

The family does one 60–90 minute reset each week.

The app should support a dedicated reset screen.

## 10.1 Family Reset Screen

Include:

- Start Family Reset button
- Tasks grouped by person
- Large checkboxes
- Overall progress indicator
- Parent reassignment
- Family/unassigned tasks

Example:

```text
FAMILY RESET

11 / 18 COMPLETE

MOM
[ ] Master bathroom
[ ] Meal plan
[✓] Fridge check

DAD
[ ] Stovetop
[✓] Vacuum stairs

CHILD 1
[ ] Basement vacuum
[✓] Bedroom

TODDLER
[✓] Put toys away
```

---

## 10.2 No Timer Initially

Do not add a countdown timer in Version 1.

The reset has a target duration in real life, but the app does not need to enforce it.

---

# 11. Parent Mode

## 11.1 Access

Parent Mode requires a 4-digit PIN.

Mom and Dad have equal access.

---

## 11.2 Parent Capabilities

Parents can:

- Add chore
- Edit chore
- Delete/deactivate chore
- Assign chore
- Reassign chore
- Skip chore today
- Change recurrence
- Change room
- Mark task as Family Reset task
- Add/edit family members
- Change family colors
- Edit meals
- Save favorite meals
- Copy last week's meal plan
- Change settings

---

## 11.3 Kid Capabilities

Kids can:

- View dashboard
- Tap their profile
- View today's chores
- Mark chores complete
- View meals
- View calendar
- Participate in Family Reset

Kids cannot:

- Add/delete chores
- Reassign chores
- Skip chores
- Change recurrence
- Edit meals
- Change settings

---

# 12. Toddler Experience

The toddler should be included as a real family member.

Toddler tasks should be:

- Very simple
- Large text
- Large checkboxes
- Ideally icon-friendly later

Examples:

- Put toys in basket
- Put books away
- Carry clothes to hamper
- Put shoes away

No rewards or gamification in Version 1.

The checkmark itself is enough initially.

---

# 13. Family Colors

Every family member receives a consistent color.

Use the same color for:

- Profile button
- Chore indicator
- Calendar indicator where feasible
- Family Reset section

Do not rely on color alone for meaning; always show the person's name too.

---

# 14. Responsive Design

## 14.1 Phone

Priorities:

- Single-column layout
- Large touch targets
- Bottom navigation
- Easy scrolling
- No hover-dependent controls

---

## 14.2 Laptop/Desktop

Priorities:

- Wider dashboard
- Cards can sit side by side
- Easier Parent Mode editing
- Meal planning table can use more horizontal space

---

## 14.3 Tablet Support

The same app should support a 10-inch tablet layout without requiring a separate codebase.

### Primary tablet target
A future basic modern tablet should be able to use:

- Landscape display
- Larger family command-center layout
- Home-screen shortcut
- Potential standalone/PWA display

### Legacy compatibility test
The existing Lenovo TB-X304F may be tested as an optional household display.

Known device baseline:

- Lenovo TB-X304F
- Android 8.1.0
- Chrome 132
- 10.1-inch display
- Older hardware with possible heat/battery concerns

The app should therefore avoid depending on very new browser-only features for core functionality.

For the Lenovo test:

- Use the normal web app in Chrome first
- Prefer landscape orientation
- Keep animations minimal
- Use large touch targets
- Avoid unnecessary background polling
- Avoid high-frequency refreshes
- Do not require PWA installation
- Treat Add to Home Screen / fullscreen behavior as optional
- Monitor device temperature during short trial use
- Do not assume the tablet is safe for permanent always-on charging

The Lenovo is a **compatibility target only**, not a project dependency. If it proves unreliable, phones and laptops remain the supported primary devices.

No rewrite should be required if the family later moves to a newer tablet.

---

# 15. Visual Design Direction

Inspired by the clarity of Skylight/Hearth, but not copied.

Design qualities:

- Light theme only initially
- Large readable typography
- Rounded cards
- Lots of whitespace
- Clear family colors
- Large checkboxes
- Minimal decorative elements
- No heavy animations
- Fast transitions
- Touch-first controls
- Calm, uncluttered dashboard

---

# 16. Offline Support

Not a Version 1 requirement.

The family has reliable Wi-Fi.

If straightforward later:

- Cache core HTML/CSS/JS
- Cache last dashboard state
- Allow read-only fallback during brief outage

Do NOT initially build complex offline synchronization.

---

# 17. Notifications

Explicitly out of scope.

No:

- Push notifications
- Email reminders
- SMS reminders
- Sound alerts

The app dashboard itself is the reminder system.

---

# 18. Explicitly Out of Scope for Version 1

Do not add:

- Grocery list
- Pantry inventory
- Rewards
- Points
- Stars
- Chore streaks
- Leaderboards
- Detailed chore analytics
- Push notifications
- AI meal generation
- Voice assistant
- Photo uploads
- File uploads
- Family chat
- Messaging
- Full offline synchronization
- Google Calendar editing
- Native Android app
- Native iOS app
- App Store distribution
- Play Store distribution
- Paid domain
- Paid APIs
- Cloud Functions unless later proven necessary

---

# 19. Security Model

## 19.1 Real Security
Use:

- Firebase Authentication
- Firestore security rules

Only authorized parents/family should access household data.

Do not use open Firestore "test mode" rules to bridge the gap between database
setup and authentication. Seed operations may use narrowly scoped temporary
create-only rules, but the closed rules must be restored immediately afterward.
Browser reads and writes begin only after the minimum authentication gate and
authenticated Firestore rules are in place.

## 19.2 Parent PIN
The PIN only prevents accidental editing from the shared family interface.

It should not be treated as internet-grade authentication.

---

# 20. Data Model — Initial Draft

## Family Member

```json
{
  "name": "Child 1",
  "role": "child",
  "color": "#...",
  "displayOrder": 3,
  "active": true
}
```

## Chore

```json
{
  "name": "Unload dishwasher",
  "room": "Kitchen",
  "defaultOwnerId": "child-1",
  "frequency": "daily",
  "dayOfWeek": null,
  "dayOfMonth": null,
  "active": true,
  "familyReset": false
}
```

## Completion

```json
{
  "choreId": "abc123",
  "date": "2026-08-18",
  "completed": true,
  "completedBy": "child-1"
}
```

## Temporary Override

```json
{
  "choreId": "abc123",
  "date": "2026-08-18",
  "assignedTo": "dad",
  "skipped": false
}
```

## Meal Plan

```json
{
  "date": "2026-08-18",
  "breakfast": "Eggs + toast",
  "lunch": "Leftover dal + rice",
  "dinner": "Chicken curry + rice"
}
```

## Shopping Item

```json
{
  "name": "Bananas",
  "addedAt": "server timestamp",
  "addedBy": "child-1"
}
```

Shopping items are shared household data and update in real time across signed-in devices. Real family display names remain in Firestore; repository sample data continues to use generic member identifiers.

---

# 21. Implementation Phases

The project should be implemented **one phase at a time**.

Each phase must be verified before moving to the next.

---

## Phase 0 — Project Setup & Documentation

### Goal
Create the project structure and keep this architecture document as the source of truth.

### Deliverables

- Repository/project folder
- `README.md`
- `PLAN-AND-ARCHITECTURE.md`
- Basic folder structure

Possible initial structure:

```text
home-management-app/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── data/
│   └── sample-data.js
├── docs/
│   └── PLAN-AND-ARCHITECTURE.md
└── README.md
```

### Acceptance Check

- Project opens locally
- Architecture file is stored with the code
- No Firebase yet

---

## Phase 1 — Static Responsive Home Dashboard

### Goal
Get the UI and family-dashboard experience right before adding any backend.

The primary targets are phones and laptops, with a responsive 10-inch tablet layout included from the beginning. The Lenovo Android 8.1 / Chrome 132 device should be used as an optional legacy compatibility test if it remains usable.

### Use fake/sample data only.

### Build

- Date header
- Family profile buttons
- Today's calendar card
- Today's chores card
- Today's meals card
- Household reminder
- Upcoming event preview
- Responsive phone layout
- Responsive laptop layout

### Acceptance Check

Verify:

- Looks good on laptop
- Looks good on phone
- Looks good in a 10-inch landscape tablet layout
- Text is easy to read
- Buttons are easy to tap
- Dashboard feels calm, not crowded
- Family profile filters are visually clear
- Core dashboard works in Chrome 132 / Android 8.1 if the Lenovo is available for testing
- No essential feature depends on PWA installation or a newer browser
- Lenovo temperature is observed during a short browser-based trial before considering extended display use

No database work until this is approved.

---

## Phase 2 — Static Navigation & Screens

### Goal
Create the full app shell.

### Build

- Home
- Chores
- Meals
- Family Reset
- More

Still use sample data.

### Chores screen
- Today
- By Room
- All Tasks

### Meals screen
- 7-day × 3-meal layout

### Family Reset
- Grouped sample tasks
- Progress bar

### Acceptance Check

- Navigation works
- Phone bottom nav works
- Desktop nav works
- Every screen is usable
- No broken responsive layouts

---

## Phase 3 — Chore Logic Without Database

### Goal
Prove recurrence and assignment logic locally before introducing Firestore.

### Build

- Daily recurrence
- Weekdays
- Weekends
- Weekly
- Every 2 Weeks
- Monthly
- Task completion
- Profile filtering
- Temporary reassignment
- Skip today
- Family Reset flag

Use local/sample JavaScript data.

### Acceptance Check

Test examples:

- Daily chore appears today
- Weekly chore only appears on correct day
- Completed chore does not remain open
- Temporary reassignment affects only today
- Permanent reassignment changes future owner
- Skipped task disappears for today
- Profile filter shows correct chores

---

## Phase 4 — Firebase Hosting

### Goal
Put the static app online at no cost.

### Build

- Create Firebase project
- Use Spark plan
- Enable Firebase Hosting
- Deploy app

### Acceptance Check

- App loads from Firebase URL
- Works on phone
- Works on laptop
- HTTPS works
- No billing account required

---

## Phase 5 — Firestore Data

### Goal
Replace sample data with persistent household data without exposing private
household records to unauthenticated browsers.

### Security dependency

Firestore data setup happens before browser integration. Before the frontend
reads or writes Firestore, add the minimum Firebase Authentication sign-in gate
for approved parent accounts and deploy authenticated security rules.

This is an infrastructure prerequisite for Phase 5 persistence, not the full
Parent Mode feature set. Do not add the Parent PIN, chore-management forms, or
other Phase 6 editing controls here.

### Build collections:

- members
- chores
- completions
- overrides
- meals
- mealFavorites
- settings

### Seed data

Import:

- Six family profiles
- Master room-by-room cleaning task list
- Initial meal examples

Imported master chores that do not yet have an owner must be stored as:

- `defaultOwner: "unassigned"`
- `active: false`
- Their suggested frequency from the master checklist

These records do not appear in Today's chores until a parent configures and
activates them in Phase 7.

### Secure frontend connection

- Enable the approved Firebase Authentication provider
- Allow only approved parent accounts to sign in
- Require authentication in Firestore security rules
- Replace sample reads and local-only writes with Firestore operations
- Keep children credential-free by using a parent-authenticated shared device
- Never allow unauthenticated public Firestore reads or writes

### Acceptance Check

- Unauthenticated browsers cannot access household data
- An approved parent can sign in
- Refresh does not lose changes
- Multiple devices see the same data
- Chore completion syncs
- Meal data loads from Firestore and syncs across devices
- Changes appear across phone/laptop

---

## Phase 6 — Parent Authorization & Parent Mode

### Goal
Protect household editing and separate parent capabilities from the
child-friendly shared interface.

### Build

- Recognize Mom and Dad as approved parent accounts
- Give Mom and Dad equal authorization
- Shared-family viewing
- Parent Mode
- 4-digit PIN convenience lock
- Parent-only editing controls

Phase 6 builds on the minimum Firebase sign-in gate introduced in Phase 5. It
does not replace Firestore security rules, and the PIN is not used as the real
security boundary.

### Acceptance Check

- Parent can edit
- Kids cannot access editing through normal UI
- Unauthorized browser cannot access private household data
- Mom and Dad have equal admin rights

---

## Phase 7 — Full Chore Management

### Goal
Make chores fully editable.

### Build

Parent actions:

- Add chore
- Edit chore
- Deactivate/delete chore
- Assign owner
- Reassign today
- Reassign future
- Skip today
- Change recurrence
- Change room
- Mark as Family Reset task

### Acceptance Check

Create and test several real household chores from start to finish.

---

## Phase 8 — Meal Planner

### Goal
Eliminate daily meal decision fatigue.

### Build

- Seven-day planner
- Breakfast
- Lunch
- Dinner
- Free typing
- Favorites
- Copy Last Week

### Acceptance Check

- Parent can create full weekly plan
- Today's meals show automatically on Home
- Favorites work
- Previous week can be copied and edited

---

## Phase 9 — Family Reset

### Goal
Support the family's weekly 60–90 minute reset.

### Build

- Start Family Reset
- Show reset chores
- Group by person
- Completion progress
- Parent reassignment
- Shared/unassigned tasks

### Acceptance Check

Run one real family reset using the app.

Record usability issues before adding anything else.

---

## Phase 10 — Read-Only Google Calendar

### Goal
Display the family's existing Google Calendar.

### Build

- Google Calendar authorization
- Read today's events
- Show small upcoming preview
- Combined view only
- Persistent server-side OAuth connection
- Secure refresh-token storage inaccessible to browser clients
- Automatic token renewal, app-load refresh, and new-day refresh
- Parent Mode controls to disconnect or change the connected account

### Do not build
- Event creation
- Event editing
- Event deletion

### Acceptance Check

- Calendar shows correct events
- App does not duplicate calendar management
- Calendar errors do not break chores/meals

---

## Phase 11 — Polish & Real-World Trial

### Goal
Use the app in real family life.

### Trial period
Approximately 2–4 weeks.

### Approved Enhancement — Shared Shopping List

Add a lightweight Shopping page that all family members can use while Parent Mode is locked.

Build:

- Manual item entry with a large tablet-friendly input and Add button
- Optional in-app voice recognition using the browser Web Speech API when supported
- Full support for the tablet keyboard's built-in dictation
- Graceful manual-entry fallback when browser speech recognition is unavailable
- Real-time Firestore synchronization across signed-in family devices
- A touch-friendly Remove button for each item
- A Clear All action with confirmation for the end of a shopping trip
- A short Undo option after accidental removal
- Empty-list state, blank-item prevention, and a reasonable item-length limit

Keep Version 1 intentionally simple. Do not initially add quantities, prices, stores, categories, recurring items, or external grocery integrations.

Cost and privacy constraints:

- Do not add another Cloud Function or paid speech-to-text service
- Store one small Firestore document per active shopping item
- Keep expected reads, writes, deletes, and storage within normal family-scale free quotas
- Treat browser speech recognition as optional because support varies and some browsers may use a server-based recognition engine

Acceptance checks:

- Children can add and remove items without unlocking Parent Mode
- Manual typing always works
- The microphone control appears only when speech recognition is supported
- Recognized speech fills the input for review before the item is added
- Changes appear on another signed-in device without refreshing
- Removed items can be restored briefly with Undo
- Clearing the full list requires confirmation and can be undone briefly
- The layout remains easy to use on tablet and phone screens

### Approved Enhancement — Filtered All Tasks Loading

Change the Chores screen's All Tasks view so it does not automatically download
the complete chore collection.

Build:

- Show the filter controls before any task records are loaded
- Provide filters for room, normal owner, and frequency
- Include an Any option for each filter so filters can be combined flexibly
- Add a Show Results action that queries Firestore using the selected filters
- Add an explicit Show All Tasks action that loads the complete collection
- Add a Clear Filters action that returns the view to its initial unloaded state
- Show the number of returned records, such as `12 matching tasks`
- After adding or editing a chore, refresh the current query rather than automatically loading every task
- Keep filtering available while Parent Mode is locked because it is read-only; keep chore editing protected by Parent Mode
- Use compact controls on larger screens and stacked, touch-friendly controls on phones

Data and cost constraints:

- Perform the selected filtering in Firestore so nonmatching records are not downloaded
- Do not add a Cloud Function or new collection
- Create only the Firestore composite indexes that actual combined queries require
- Preserve the existing authenticated household security rules

Acceptance checks:

- Opening All Tasks performs no chore-list read until the user requests results
- Each room, owner, and frequency filter works independently
- Multiple filters work together
- Any correctly removes that field from the query
- Show All Tasks returns the complete master list
- Clear Filters removes the results and returns to the unloaded state
- Result counts are accurate
- Editing a returned chore preserves and refreshes the active filter selection
- The controls remain usable on phone, tablet, and desktop layouts

### Observe

- Do kids actually check tasks?
- Are task names clear?
- Is Parent Mode easy enough?
- Is Today too crowded?
- Are recurring chores correct?
- Is meal planning easier?
- Is Family Reset easier?
- Does Mom spend less time remembering household tasks?
- Does Dad use the app independently?

### Only after trial consider

- Rewards/stars
- Better offline support
- Dedicated tablet
- Guest Mode
- More advanced meal features
- Additional recurrence rules
- Grocery integration

---

# 22. Future Features — Not Yet Approved

Possible later additions:

## Rewards / Gamification
Revisit after approximately one month of actual use.

Possible:

- Stars
- Points
- Simple weekly total

Only add if the children need motivation.

## Guest Mode
Could generate a short guest-ready cleaning list:

- Kitchen counters
- Main floors
- Powder room
- Entryway
- Visible clutter

## Dedicated Tablet
If the app proves useful, consider an inexpensive modern tablet later.

The web app should work without changes.

## Basic Offline Support
Add only if needed.

## Grocery Integration
Only revisit if the fridge notepad stops working well.

---

# 23. Definition of Version 1 Success

Version 1 succeeds if:

- Parents can see what matters today
- Kids can independently see and complete their chores
- Mom and Dad can reassign tasks when life changes
- Recurring chores appear automatically
- The full cleaning system is editable
- Meals are planned for breakfast, lunch, and dinner
- The family can reuse meal plans
- Weekly Family Reset is easier to coordinate
- Google Calendar is visible without becoming a second calendar
- The app works well on phones and laptops
- Running cost remains $0
- The app reduces mental load instead of adding to it

---

# 24. Working Rule for Implementation

> Build the smallest useful piece, test it, and only then add the next layer.

For each phase:

1. Implement one small feature set
2. Run it
3. Verify expected output
4. Fix issues
5. Commit/save
6. Move to the next phase

Do not jump ahead to advanced features before the current phase is stable.

---

# 25. Immediate Next Step

Start **Phase 0**.

Create the initial project structure and store this file as:

```text
docs/PLAN-AND-ARCHITECTURE.md
```

Then begin **Phase 1: Static Responsive Home Dashboard** with sample data only.

No Firebase, Firestore, authentication, or Google Calendar integration should be added until the static dashboard has been reviewed and approved.
