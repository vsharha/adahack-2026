# Demo walkthrough

Show a household joining a shared goal, reporting attendance and receiving rewards after one organiser confirms. The app runs at `http://localhost:3000`; the tabs are Street, Goals, Activity, Rewards and You.

1. Open `/reset`, press **Reset demo**, then choose **Priya, House 1**. She starts with 10 contribution and 20 demo rewards. Every household starts with 20 rewards, enough for the repair offer; new neighbours receive their household’s balance too. These starting rewards do not use the monthly earning allowance.
2. On **Street**, show EH8 9YL and the invitation. Scroll to Nicolson Square Gardens, the saved 3 October air forecast and 2024 EH8 district electricity. Their links open relevant goals. Explain that these inform suggestions, not measured household savings.
3. Return to **Street** and press **I’ll do it too**. Priya makes the third pledge. Press **View activity** in the celebration. The card shows the date, reward amount and a three-step progress bar captioned “Pledged · report attendance after the activity”. **Back to Street** instead shows Accepted after the celebration closes, then the next invitation.
4. Press **Report attendance**. No organiser has to mark the activity held first. Reports become available once the pledge threshold is reached and the scheduled time has passed. Priya’s report is pending; her contribution stays at 10 and rewards stay at 20. A pledge or report alone awards nothing. **View report** opens the exact Activity entry.
5. On **You**, press **Switch account** and choose **Margaret, House 7**, labelled **Activity organiser**. Open **Activity** and press **Confirm attendance** under **Needs your confirmation**. One confirmation from Margaret or Isla, outside the claiming household, awards the points. The queue becomes empty. **Decline** reveals a required reason; a declined report can be resubmitted.
6. Switch back to Priya and open **Goals**. The card names Margaret and shows +20 contribution and +20 rewards. **View rewards** opens a balance of 40 and **20 of 100 earned this month**. The 100-point household allowance is a trial setting, counted in UK calendar months when participation is confirmed.
7. Redeem **Bicycle repair discount** for 20 points. A saved **DEMO** voucher appears; available rewards become 20, monthly earnings remain 20, and contribution remains 30. Reload Rewards to show persistence. Households can alternatively redeem the repair offer immediately from their starting balance, without reporting attendance first.
8. Finish on **Street**: Priya’s house stays green and street contribution stays at 50. Reset before the next judge.

The refill and secondhand offers cost 30 and 40 rewards. Every offer permits one voucher per household. Private habits remain self-reported and award contribution only; completing line-drying adds 8 contribution with no rewards.

Residents, activities, starting rewards, approvals and partner vouchers are a browser-based demonstration. Do not claim real discounts, trees planted, measured savings, live household meters or secure production identity. Local context is real and dated; its source methods and geographic limits are in [`../local-data.md`](../local-data.md).

## Checks

From the repository root, run `pnpm fix:postcode`, `pnpm verify:postcode` and `pnpm build:postcode`. Run `pnpm dlx tsx --test tests/participation.test.ts` from `apps/postcode`. The tests cover pledge and date prerequisites, one-organiser confirmation, household approval rules, duplicate awards, decline and retry, reward caps, UK months, redemption, reset, starting rewards and migration without duplicate grants.

Use [`script.md`](script.md) for narration and operator cues. Rehearse from reset, and keep a local captured-screen walkthrough ready as a backup.
