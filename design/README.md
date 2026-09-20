# Last Sip: design reference

This folder is the visual and copy reference for the app. The screens were designed as a clickable prototype. The files in `prototype/` are that prototype's own source, so they hold the exact layout, wording, colors and behavior. Use them as a design reference, not as code to run.

## How to read the prototype files

The files are HTML with a few custom tags:

- `<sc-if value="{{x}}">` shows its content only when `x` is true.
- `<sc-for list="{{items}}" as="item">` repeats its content for each entry.
- `{{name}}` is a value filled in by the script at the bottom of the file, and `onClick="{{fn}}"` is a tap handler.
- `<a href="Other.dc.html">` moves to another screen.
- Inline `style="..."` attributes hold the real spacing, sizes and colors.

The script at the bottom of each file holds the rules (durations, dates, what each tap does). The prototype's "days since last restock" numbers (`AGO`) are demo data and must not be copied into the real app.

## Files

| File | What it is |
| --- | --- |
| `prototype/Main.dc.html` | The whole app in one file. Screens are switched by state: welcome, household, items, packs, apps, pantry (first time), home (returning) |
| `prototype/Email.dc.html` | The restock basket email as seen in a phone inbox |
| `prototype/Returning.dc.html` | Opens the app straight on the returning-user home |
| `prototype/canvas.json` | How the three artboards were laid out. Not needed to build the app |

## Screen flow

New user:

1. **Welcome:** glass-of-milk illustration, headline "We'll tell you before the milk runs out.", "Continue with Google", privacy line.
2. **Step 1, household:** four cards (Just me, Two of us, A small crew, A full house).
3. **Step 2, items:** chips grouped by category, an "Add item" chip per group.
4. **Step 3, pack lengths:** one card per item with a shorter/longer stepper, a Can't wait / Can wait toggle, and a pet-name field for pet food.
5. **Step 4, apps:** main app, backup app, and the wait window options.
6. **First pantry:** first basket email date, items in it, items coming after, "Your answers" rows that reopen each step, privacy note and Delete my data with a confirmation.

Steps 1-4 show a progress bar and a Back button. On the pantry, Back returns to step 4. Tapping a "Your answers" row reopens that step, and Save changes returns to where the person came from.

Returning user (skips steps 1-4):

- **Home ("Welcome back"):** next basket email card, an optional "What we've learned" card, Due soon rows with "I've ordered", a Stocked up list, Paused items with "Turn back on", "Add or remove items", Your answers, Privacy and Delete my data.
- The prototype reaches it from a prototype-only link on the welcome screen and from "Manage my pantry" in the email. The real app should send returning users there after sign-in.

Email:

- Header shows a back arrow to Inbox, the subject line, and the sender "Last Sip".
- One card per item with a due tag, a playful line, an Order now button (with the app's name) and three buttons: I've ordered, Still have plenty, Add to my next basket.
- After a tap the card shows a green confirmation with Undo. After Order now it also offers "Try the backup app instead".
- Footer: a "Manage my pantry" link, Unsubscribe and Delete my data.

## Design tokens

| Token | Value |
| --- | --- |
| Page background | `#FAF5EA` |
| Cards | `#FFFDF8` with a 1.5px `#E2D9C3` border |
| Input and secondary borders | `#D9CFB6` |
| Ink (text) | `#1F2A24` |
| Body text | `#4A544D`, muted text `#5B655E` |
| Primary green | `#1E5B45`, light green `#E6EFE6` |
| Yellow | `#F4B93E` |
| Red (urgent, delete) | `#9C2E19`, tint `#FBE3DC` |
| Disabled | `#8A9088` |
| Headings | Bricolage Grotesque, 700, tight letter-spacing |
| Body | Figtree |
| Layout | Phone width 390px. Touch targets at least 44px. Cards 16-22px radius, buttons 12-16px, chips fully rounded |

## Screenshots

Real screenshots are optional. If you add them, save them here as PNG files named in order, for example `01-welcome.png`, `02-household.png`.
