# Postcode Lottery: product

The brief is in [`brief.md`](brief.md). [`status.md`](status.md) records what is built, mocked, planned or cut.

## What it is

A neighbourhood app for keeping a postcode area green together. A neighbour enters their postcode and sees what is happening locally: green space nearby, the air-quality forecast, domestic electricity use, and Postcode Trust grants made to recipients nearby. Goals suggested from that data are taken on at three levels:

- **Postcode-wide goals**, for everyone in the area.
- **Interest-group goals**, for neighbours who chose the same interest when joining.
- **Household goals**, for one household.

A postcode or group goal starts as a suggestion and goes ahead only when enough members pledge to it ("I'll do it if five neighbours do"). Households report actions they have completed, and neighbours can react to them. Each completed action earns its household points. A drawing of the locality shows every house getting greener as its household contributes, and the whole locality greening as goals unlock. The more of the street joins, the more goals reach their threshold, which is the brief's stretch goal.

## Who it is for

Neighbours who share a postcode. The poster names two player groups, and the demo uses one of each:

- a household, matching the poster's fastest-growing group of young families and professionals;
- a neighbour who joins through shared interests, such as heritage and green spaces, matching the poster's biggest active group, "later in life and motivated by local community and historical preservation charities".

## Interest groups

Chosen by each user when joining; a user can join several.

- Gardening and growing
- Walking and cycling
- Wildlife and tidy-ups
- Energy at home
- Heritage and green spaces
- Repair and reuse
- Food and composting
- Families and kids

## What sets it apart

Not yet checked against existing projects. Candidates to check include conditional pledge platforms such as mySociety's PledgeBank and neighbourhood apps such as Nextdoor. The intended difference is goals suggested from the area's own environmental data, pledged conditionally, and shown as a locality that greens with participation.

## Decisions

- Goals exist at three levels, postcode-wide, interest group and household, so people can act alone, with like-minded neighbours or with the whole area. 3 October 2026.
- Postcode and group goals use a conditional pledge threshold, and households pick their own goals from suggestions or write their own; acting together is the brief's ask, and a threshold removes the reason not to act alone. 3 October 2026.
- Users choose interests when joining, from eight premade groups (listed above), and are placed in the matching groups; groups form around what neighbours already care about. 3 October 2026.
- Houses in the locality visual are plain, anonymous blocks with pitched roofs and no other detail, not tied to real addresses; neighbours see their household's progress without revealing where they live. 3 October 2026.
- Each completed action gives its household points, which colour its house; the locality greens by total points, with goals as milestones; this shows progress continuously rather than only when goals complete. 3 October 2026.
- Households self-report completed actions, with an optional photo, and neighbours can react; trust-based reporting keeps friction low, and no data source could verify the actions. 3 October 2026.
- Goal suggestions are LLM-generated from the local data, including nearby grants. In production they would run on a locally hosted model or a sustainable provider; for the demo they are pre-generated and shipped as data, so the demo needs no live model call or API key. 3 October 2026.
- No database: premade users and their activity are seeded data, and all state, including users added during the demo, lives in the browser; this avoids backend work in the time available. 3 October 2026.
- The demo looks and behaves like a phone app: it shows in a phone frame on a laptop, with a bottom tab bar (Street, Goals, Activity, You); a long dashboard page reads as a hackathon demo. Each tab is its own route (`/street`, `/goals`, `/activity`, `/you`), so the back button, refreshing and direct links behave as in a real app. The page around the phone mockup stays one neutral grey in both themes, so a theme change reads as the phone changing. 3 October 2026.
- In the phone frame, notifications start below the drawn status bar, and the whole status bar, including the Dynamic Island, stays above app overlays. This keeps notifications and celebrations from covering the phone's system chrome. 3 October 2026.
- The first screen is an account picker ("Who's using Greener by postcode?") showing the premade neighbours and a "Join your street" option, so the presenter can choose a persona walk-through or a fresh onboarding for each judge. 3 October 2026.
- Joining starts an onboarding flow that makes the app personal: finding your street by postcode, how many neighbours already use the app, a name and interests. A "Use my location" button fills in the demo postcode, EH8 9YL, without asking the browser for a real location; it changes nothing else in the app. Each new user is given the next free house rather than choosing one, because the drawn street is not their real street; the street then scrolls to it and tags it "You". When every house is taken, new users join the household with the fewest members. The user it creates joins the street, so the neighbour count grows as people join. 3 October 2026.
- Five premade neighbours live in 5 of the 12 houses, so "5 of your neighbours already use the app" is true and there are free houses to pick. 3 October 2026.
- Users added during the demo can be deleted, along with their pledges, actions and reactions; premade neighbours cannot, so the demo story cannot break mid-demo. `/reset` restores the seed between judges after a "Reset demo" button is pressed, so opening the page by accident changes nothing. 3 October 2026.
- Premade neighbours act on their own during the demo (scripted pledges and reactions, shown as notifications), and a goal reaching its threshold gets a full-screen celebration; the street should feel lived in. 3 October 2026.
- The demo is built around EH8, Edinburgh, where the electricity and grant data were tested on 2 October 2026. The carbon-intensity panel is left out, because South Scotland's tested forecast was flat at zero. 3 October 2026.
- The app names the street by its full postcode, EH8 9YL, which covers about 15 addresses and matches how Postcode Lottery plays by postcode; "EH8" alone is a district of thousands of addresses. Data only available for the district still says "EH8". 3 October 2026.
- The postcode page shows green space nearby, the air-quality forecast, electricity per meter and "Funded near you" grant cards. Grants also feed the goal suggestions. Recipient postcodes are labelled as recipient addresses, not where money was spent. 3 October 2026.
- EH8 data ships as a small JSON snapshot (electricity rows, grants, green space); Open-Meteo is called live with a saved response as fallback; the 80 MB electricity CSV is never shipped. The demo then works offline. 3 October 2026.
- The locality visual is a 3D scene built with three.js through React Three Fiber: a three-quarter view from above of two rows of six houses either side of a road, full width with no frame, fading into the page at its top and bottom. Each house is one colour, roof included, easing from light grey with no points through light green at 10 points to a brighter green at 40; each shared goal that goes ahead plants a street tree, and neighbours appear as avatar pins over their houses. Its colours and light levels are design tokens, so it follows the light and dark themes. The Street tab stays mounted behind the other tabs, so the scene is built once per visit rather than on every tab switch. The 2D drawing is kept for browsers without WebGL. 3 October 2026.
- The frontend uses Tailwind CSS v4 and shadcn/ui, the repository's styling stack for any framework that supports them; it gives ready-made components and keeps the design consistent. 3 October 2026.
- Every colour in the app, including the street drawing, avatars and phone mockup, is a design token in `apps/postcode/app/globals.css`, and a theme is one set of token values selected by `data-theme` on `<html>`. The design follows a reference the team liked: soft leaf green on navy (dark) or on a cool white (light), with the street at evening with lit windows in dark and in daylight in light. An "Appearance" setting on the You tab offers System, Light and Dark; System, the default, follows the device setting, as real phone apps do, and lets the presenter pick whichever reads better at the judging table. 3 October 2026.
- Headings and brand text use Trebuchet MS where installed, with Atkinson Hyperlegible Next as fallback and body text. Digits come from Trebuchet MS wherever it is installed, because Atkinson's slashed zero looked odd; elsewhere Atkinson's own digits show. There is no monospace font, which read as technical rather than friendly. Shapes are consistent: avatars, chips and labels are fully rounded, and cards keep moderate corners; there are no one-off decorative shapes. This adopts the third mockup's friendly typography while keeping readability for families and older neighbours. 3 October 2026.
- If time runs short, cut the 3D visual first, then neighbour reactions. The three goal levels, pledges, points, data panels and the 2D visual are kept. 3 October 2026.
