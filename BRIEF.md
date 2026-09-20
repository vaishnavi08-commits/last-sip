# Last Sip: build brief for Claude Code

## Setup checklist

Do these once, before the first build session. Nothing here needs code.

- [x] **GitHub:** create an account if you don't have one, then a **private** repository named for the project. Claude Code on the web needs GitHub to work on your code.
- [x] **Claude Code on the web:** open claude.ai/code, connect GitHub and create your environment.
- [ ] **Put the docs in the repo:** save the PRD as `PRD.md` and this brief as `BRIEF.md`, plus a screenshot of every prototype screen in a `design` folder. Claude Code may not be able to open your private prototype link, so screenshots are the safe reference.
- [ ] **Supabase:** create a project for the database and Google sign-in. Check its current free-tier limits.
- [ ] **Google sign-in:** Supabase will ask for Google sign-in credentials. Ask Claude Code to walk you through it step by step.
- [ ] **Resend:** create an account for sending email. As far as I know you can only test by emailing yourself until you verify a domain, and you should verify your own domain before inviting anyone, or Gmail may file the emails under Spam.
- [ ] **Vercel:** connect the repo so every change gets a preview link you can open on your phone. Check its current free-tier limits.

**Secrets.** API keys and passwords go only in the environment-variable settings of Supabase, Resend and Vercel. Never put them in the chat, the repo or a screenshot. If one slips out, regenerate it.

## Master prompt for Claude Code

Paste this as the first message of your first Claude Code session, after the setup checklist is done. It is written to match the prototype, so the screenshots in the `design` folder are the visual truth. The prototype's "days since last restock" numbers are demo data, so the build should ignore them.

```
You are helping me, a non-coder product manager, build "Last Sip": a live web app that emails households when everyday groceries are about to run out. Read PRD.md and BRIEF.md first, and look at the screenshots in /design. Match those screens.

STACK
Next.js on Vercel, Supabase (database and Google sign-in), Resend (email). Mobile-first web app.

WHAT IT DOES
1. Welcome screen, then "Continue with Google" (name and email only, never inbox access).
2. First-time onboarding in 4 steps, with a progress bar and a Back button on every screen:
   a. Household size cards: Just me, Two of us, A small crew (3-4), A full house (5+).
   b. Items: chips grouped by category (Dairy and eggs, Fresh, Staples, Home care, Pets), with an "Add item" chip in each group. Use the catalog in BRIEF.md.
   c. Pack lengths: one card per picked item with a shorter/longer stepper ("How long does one pack last you?"), a "Can't wait / Can wait" toggle, and a pet name field for pet food. Default lengths come from the catalog, scaled by household size (pet food is not scaled).
   d. Grocery apps: a main app and a backup (Blinkit, Zepto, Instamart, BigBasket, Other), and a wait window: "Just tell me when I need it", "2 days", "Up to a week".
3. First pantry screen: date of the first basket email, the items in it, the items coming after, "Your answers" rows that reopen each step, a privacy note, and "Delete my data" with a confirmation.
4. Returning users skip onboarding and land on "Welcome back": next basket email date (or "You're stocked up" with the next date), Due soon items each with an "I've ordered" button, Stocked up items with order-by dates, Paused items with "Turn back on", "Add or remove items", Your answers, Privacy and Delete my data. After a few restocks, show a "What we've learned" card that offers to update an estimate (for example "You've restocked eggs about every 4 days lately, not every 6. Update to 4 days?").

PREDICTION AND EMAIL
- Each item's order-by date = last restock date + estimated days x 0.85.
- At most one basket email per user per day, sent around 8 AM India time, never at night. It goes out when the most urgent item reaches its order-by date and includes every item due within the user's wait window.
- Each item in the email has a playful message (10+ variants per item type, rotated; use the pet's name for pet food) and four buttons: Order now, I've ordered, Still have plenty, Add to my next basket. Footer links: Manage my pantry, Unsubscribe, Delete my data.
- Buttons work with one tap and no login, using unique signed links that expire.
  Order now: log the click, then redirect to the user's app searching for that item. Show a fallback line if the app opens on its home page.
  I've ordered: restart the item's clock and move the estimate toward the real gap between restocks.
  Still have plenty: lengthen the estimate slightly and delay the next nudge by a few days.
  Add to my next basket: park the item for the next basket email.
  No tap: one gentle follow-up, then pause that item and show it under Paused.
- Log every event (email sent, each tap, opt-out) so I can compute nudge action rate, still-have-plenty rate and ran-out-before-ordered rate.

NOT IN V1
Reading Gmail, price comparison, subscriptions, auto-ordering, ads, WhatsApp.

DESIGN
Warm cream background #FAF5EA, cards #FFFDF8 with #E2D9C3 borders, ink #1F2A24, green #1E5B45, yellow #F4B93E, red #9C2E19. Headings in Bricolage Grotesque, body in Figtree. Touch targets at least 44px. No emoji.

HOW TO WORK WITH ME
- I'm not a coder. Explain every step in plain English and tell me exactly what to click.
- Make a plan first and wait for my approval. Do not write code until I say go.
- Build one slice at a time (see BRIEF.md) and wait for me to test each one.
- Never put secrets in code or in the chat; use environment variables.
- Users must only ever see their own data. Explain in plain English how you enforce that.
- Start by proposing the database structure in plain English and ask me to confirm it.
```

## Build slices

After the master prompt and the approved plan, ask for one slice at a time. Test each on your own phone before asking for the next.

| Slice | Ask for | Your test |
| --- | --- | --- |
| 1 | Welcome screen and Google sign-in, landing on an empty home | Sign in with two different Gmail accounts; each sees only their own data |
| 2 | The 4 onboarding steps, saved to the database | Complete it on your phone, refresh, and check every answer was kept; use Back on each step |
| 3 | First pantry screen, then the returning-user home with order-by dates and "I've ordered" | Sign out and in again and confirm onboarding is skipped; tap I've ordered and watch the item move |
| 4 | The basket email with a "send me a test email" button | Open it in Gmail on your phone; note whether it lands in Promotions or Spam |
| 5 | The four one-tap buttons, including the tracked Order now redirect and the fallback line | Tap every button from your phone and check each item changes correctly; try an expired link |
| 6 | The daily schedule, follow-up then pause, one-email-a-day cap, event logging, privacy page and Delete my data | Run it on your own groceries for a week before inviting anyone |

Two habits save time. When something breaks, send Claude Code the exact error message or a screenshot rather than describing it. After each slice, ask it: "Explain in plain English what you just built and where the data is stored."

## Starting item catalog

These are the 27 items and starting pack lengths used in the prototype, for a household of two. They are guesses to check with a few friends, not measured data, and the app corrects them from real taps.

Household scaling: "Just me" lasts 1.6 times as long, "A small crew" (3-4) 0.65 times, and "A full house" (5+) 0.45 times. Pet food is not scaled.

| Category | Item | Pack lasts (2 people) | Can't wait |
| --- | --- | --- | --- |
| Dairy and eggs | Milk | 2 days | Yes |
| Dairy and eggs | Curd | 4 days | No |
| Dairy and eggs | Eggs | 6 days | No |
| Dairy and eggs | Butter | 20 days | No |
| Dairy and eggs | Paneer | 5 days | No |
| Fresh | Bread | 3 days | Yes |
| Fresh | Onions | 7 days | No |
| Fresh | Potatoes | 7 days | No |
| Fresh | Tomatoes | 5 days | No |
| Staples | Atta | 21 days | No |
| Staples | Rice | 30 days | No |
| Staples | Dal | 30 days | No |
| Staples | Cooking oil | 30 days | No |
| Staples | Ghee | 45 days | No |
| Staples | Sugar | 30 days | No |
| Staples | Salt | 60 days | No |
| Staples | Tea | 30 days | No |
| Staples | Coffee | 30 days | No |
| Home care | Dishwash liquid | 25 days | No |
| Home care | Laundry detergent | 30 days | No |
| Home care | Toothpaste | 45 days | No |
| Home care | Toilet paper | 30 days | No |
| Home care | Handwash | 25 days | No |
| Home care | Garbage bags | 30 days | No |
| Home care | Floor cleaner | 30 days | No |
| Pets | Cat food | 14 days | Yes |
| Pets | Dog food | 21 days | Yes |

## Safety review before inviting real users

Because Last Sip stores what people buy and sends links that act without a login, ask an engineer friend to spend about 30 minutes on these points. Send them the repo and this list.

- [ ] **Data access:** every database table only returns a user's own rows (Supabase calls this row-level security). Try to read another user's data and confirm it fails.
- [ ] **One-tap links:** each link is unique, signed, expires, and can only change the item and user it was made for. An old or tampered link fails safely.
- [ ] **Order now redirect:** it only ever redirects to the grocery apps' own addresses, never to an address taken from the link.
- [ ] **Secrets:** no keys or passwords in the repo, the chat history or the build logs.
- [ ] **Email:** the sending domain is verified, and Unsubscribe and Delete my data both work from the email.
- [ ] **Delete my data:** deleting removes the user's items, tap history and email address from the database, not just from the screen.
- [ ] **Schedule:** run it for a week on your own items and check for duplicate emails, missed days and emails sent at night.

Tell your testers what you store and that it is a side project, and keep any test data private.
