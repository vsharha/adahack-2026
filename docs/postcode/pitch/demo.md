# Demo walkthrough

Show one household turning a shared pledge into confirmed participation and a repair voucher. The app runs at `http://localhost:3000`; the five tabs are Street, Goals, Activity, Rewards and You.

1. Open `/reset` and press **Reset demo**. Choose **Priya, House 1**. She starts with 10 self-reported contribution points and no rewards.
2. On **Street**, show the illustrated neighbourhood and the local-context panels: Nicolson Square Gardens, the saved 3 October air forecast and 2024 electricity for the EH8 district. Explain that these inform suggestions, not measured household savings.
3. Return to the litter-pick card and press **I’ll do it too**. Priya makes the third pledge. **It’s going ahead!** appears; the illustrated tree represents the unlocked goal. Press **Let’s do it**.
4. On **You**, use **Switch account** beside the profile. Choose **Margaret, House 7**, then **Goals**. On the litter pick, press **Mark activity as held**. The event is fictional and dated 3 October 2026 at 11:00 UK time; the control is unavailable before its scheduled time or before enough neighbours pledge.
5. Switch back to Priya through **You**. Open **Goals** and press **Report attendance**. Show **Awaiting confirmation**. She still has 10 contribution, zero rewards and one completed goal. A pledge alone gives no points.
6. Switch to Margaret and open **Activity**. Press **Confirm attendance** on Priya’s claim. Reactions stay separate. Margaret confirms observed attendance as a designated organiser outside Priya’s household.
7. Switch back to Priya and open **You**. Show 30 contribution and 20 available rewards. Press **View rewards** to open **Rewards** and show **20 of 100 earned this month**. The 100-point allowance is a trial household setting. It counts earnings when confirmed, in UK calendar months; spending cannot reopen it.
8. Scroll to **Bicycle repair discount**. Show its 20-point cost, £5 example benefit, restrictions and fictional partner label. Press **Redeem bicycle repair discount**. A **DEMO** voucher appears. Available rewards become zero; contribution stays at 30 and monthly earnings stay at 20.
9. Open **Street**: Priya’s house stays green and street contribution stays at 50. Reload **Rewards** to show that the voucher persists. Reset before the next judge.

The refill and secondhand offers also support demo redemption when the household has enough rewards. Each offer permits one voucher per household. Private habits remain self-reported and award contribution only; for example, adopting and completing line-drying adds 8 contribution with no rewards.

Do not claim real discounts, trees planted, measured savings, independently verified environmental impact, live household meters or secure production identity. Data context is real and dated; residents, activities, approvals and partner rewards are a browser-based demonstration. The source methods and geographic limits are in [`../local-data.md`](../local-data.md).

## Checks

From the repository root, run `pnpm fix:postcode`, `pnpm verify:postcode` and `pnpm build:postcode`. Run unit tests from `apps/postcode` with `pnpm dlx tsx --test tests/participation.test.ts`. They cover prerequisites, household approval rules, duplicate awards, declines and retry, reward caps, UK month boundaries, carry-forward balances, redemption, repeat occurrences, reset and old-state migration.
