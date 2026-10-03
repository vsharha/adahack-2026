# Greener by postcode

Greener by postcode helps neighbours turn concern for their local environment into action together. It connects local green-space, air-quality and electricity information to practical goals, with a simple promise: “I'll do it if enough neighbours join.” As households contribute, their illustrated street becomes greener. Organiser-confirmed activities earn reward points, with fictional vouchers demonstrating how local partners could support participation. The more neighbours join, the more shared goals can go ahead.

## Inspiration

The Postcode Lottery challenge asks people to keep their postcode area green together. We focused on the hesitation behind a shared activity: someone may want to join a litter pick or improve a green space, but be reluctant to commit alone. Greener makes that commitment conditional on enough neighbours taking part and gives local environmental information a practical next step.

## What it does

Neighbours join with a postcode, a name and their interests. They can explore goals for the whole postcode, groups with shared interests, and their own household. Shared goals go ahead when their pledge threshold is reached. Household suggestions offer smaller actions people can take themselves.

The Street screen connects a nearby public garden, a dated air-quality forecast and district domestic electricity use to relevant goals. An illustrated 3D street shows household contribution through greener houses and adds trees when shared goals unlock. These visuals represent participation, rather than measured environmental savings.

Our main demo follows a garden litter pick. Priya supplies the third pledge, reports attendance after the scheduled activity, and Margaret confirms it as an organiser outside Priya's household. Confirmation awards contribution and reward points. Priya can then redeem a fictional bicycle-repair voucher without losing contribution or making her house less green. Private actions earn self-reported contribution only; spendable rewards require organiser confirmation.

## How we built it

We built a Next.js and React web app with Tailwind CSS v4 and shadcn/ui. Three.js, through React Three Fiber, renders the street. The interface fills a phone screen and sits inside a phone frame on larger displays, with separate Street, Goals, Activity, Rewards and You tabs.

The prototype uses seeded neighbours and goals, with state saved in the browser. Local context comes from a small saved snapshot with source links, dates and geographic labels. Goal suggestions are written from that context. The demo needs no database or model call, and its saved data keeps the presentation independent of live data services.

## Challenges we ran into

Different sources describe different areas and dates. We label district electricity data as EH8 rather than implying it measures an individual household or the demo postcode, EH8 9YL. The air forecast also retains its date.

Rewards required a separate balance from contribution, so spending a voucher would not erase a household's progress. Attendance confirmation, duplicate-award prevention and a monthly earning allowance make that distinction work throughout the demo. The 3D street also stays mounted across tab changes to avoid rebuilding the scene each time.

## Accomplishments that we're proud of

The prototype connects local information to a complete participation flow: discover a goal, pledge, report attendance, receive organiser confirmation and redeem a reward. More neighbours help more shared goals reach their threshold, directly addressing the challenge's stretch goal.

The project records browser checks of that full flow, persistent balances and vouchers, and phone layouts in light and dark themes. Eighteen participation tests cover rules including pledge and date prerequisites, organiser approval, starting rewards and monthly allowances.

## What we learned

Collective action needs a clear next step as well as information. A pledge threshold makes the condition for taking part visible, while organiser confirmation gives shared activities a distinct completion step. Keeping contribution separate from rewards lets progress remain visible after a benefit is redeemed.

We also learned to make the boundaries of environmental data visible. A participation score can show engagement, but it cannot establish electricity savings or emissions reductions without additional evidence.

## What's next for Greener

We would test the flow with a real street, add recurring activities and refresh local forecasts. Nearby grant information and consented household meter data remain future work. A production service would also need shared storage, verified household membership, organiser permissions and funded partner agreements.

The current prototype uses demo residents and activities, saved environmental data, browser-local state and fictional offers and vouchers. It demonstrates the participation mechanism; real-world environmental impact has not yet been measured.

## Repository

This repository contains three independent AdaHack projects. The code for Greener by postcode is in [`apps/postcode/`](https://github.com/vsharha/adahack-2026/tree/main/apps/postcode).
