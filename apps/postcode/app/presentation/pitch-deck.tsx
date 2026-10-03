"use client";

import { useContext } from "react";
import { Deck, DeckContext, Notes, Slide, SlideContext } from "spectacle";
import styles from "./presentation.module.css";

function Controls() {
  const deck = useContext(DeckContext);

  if (deck.inPrintMode) return null;

  return (
    <footer
      className={styles.controls}
      style={{
        color:
          deck.activeView.slideIndex === 2
            ? "var(--on-moss)"
            : "var(--foreground)",
      }}
    >
      <span>Greener by postcode</span>
      <nav aria-label="Presentation controls">
        <a
          href="/presentation?exportMode=true"
          target="_blank"
          rel="noreferrer"
        >
          Print / PDF
        </a>
        <button
          type="button"
          aria-label="Previous slide"
          disabled={deck.activeView.slideIndex === 0}
          onClick={() => deck.regressSlide()}
        >
          ←
        </button>
        <span aria-live="polite">
          {deck.activeView.slideIndex + 1} / {deck.slideCount}
        </span>
        <button
          type="button"
          aria-label="Next slide"
          disabled={deck.activeView.slideIndex === deck.slideCount - 1}
          onClick={() => deck.advanceSlide()}
        >
          →
        </button>
      </nav>
    </footer>
  );
}

function LiveApp() {
  const { isSlideActive } = useContext(SlideContext);
  const { inPrintMode } = useContext(DeckContext);

  return (
    <div className={styles.liveApp}>
      {isSlideActive && !inPrintMode ? (
        <iframe title="Greener by postcode live demo" src="/" />
      ) : (
        <div className={styles.printDemo}>
          <strong>One household’s litter pick</strong>
          <p>
            Pledge, report attendance, get confirmation, redeem a demo voucher.
          </p>
          <p>Open the app alongside the presentation.</p>
        </div>
      )}
    </div>
  );
}

export default function PitchDeck() {
  return (
    <div className={styles.presentation}>
      <Deck
        theme={{
          size: { width: 1366, height: 768 },
          colors: {
            primary: "var(--foreground)",
            secondary: "var(--background)",
            tertiary: "var(--background)",
          },
          fonts: {
            header: '"Trebuchet MS", var(--font-body), sans-serif',
            text: "var(--font-body), Arial, sans-serif",
          },
          backdropStyle: {
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100dvh",
            background: "var(--background)",
          },
        }}
        transition={{}}
        template={<Controls />}
      >
        <Slide padding={0}>
          <section className={`${styles.canvas} ${styles.cover}`}>
            <p className={styles.eyebrow}>AdaHack 2026 / Postcode Lottery</p>
            <h1>
              Greener
              <br />
              <span>by postcode</span>
            </h1>
            <p className={styles.coverLine}>
              Keep your area green.
              <br />
              Give your neighbours a reason to join in.
            </p>
            <p className={styles.caption}>Built around EH8 9YL, Edinburgh</p>
          </section>
          <Notes>
            Greener by postcode helps neighbours act together where they live.
            Our prototype connects local environmental information with shared
            pledges and visible household participation. Source: the Postcode
            Lottery challenge brief and docs/postcode/product.md.
          </Notes>
        </Slide>

        <Slide padding={0}>
          <section className={styles.canvas}>
            <p className={styles.eyebrow}>The problem</p>
            <h2>Who wants to organise it alone?</h2>
            <p className={styles.largeCopy}>
              A cleaner local garden needs neighbours who will show up together.
            </p>
            <div className={styles.bottomLine}>
              <p>Households can start small.</p>
              <p>Interest groups find like-minded neighbours.</p>
              <p>A shared postcode brings everyone together.</p>
            </div>
          </section>
          <Notes>
            People can care about their area but hesitate to organise an
            activity alone. We support household, interest-group and
            postcode-wide goals. These are the product’s design assumptions, not
            findings from user research. The challenge asks for collective
            action and a product that works better as more neighbours join.
          </Notes>
        </Slide>

        <Slide
          padding={0}
          backgroundColor="var(--moss)"
          textColor="var(--on-moss)"
        >
          <section className={`${styles.canvas} ${styles.pledge}`}>
            <p className={styles.eyebrow}>
              Local information becomes a shared goal
            </p>
            <h2>“I’ll do it if enough neighbours do.”</h2>
            <p className={styles.largeCopy}>
              A pledge threshold turns interest into a plan.
            </p>
            <div className={styles.sources}>
              <div>
                <h3>A garden nearby</h3>
                <p>
                  Nicolson Square Gardens informs the litter-pick suggestion.
                </p>
              </div>
              <div>
                <h3>Air and electricity</h3>
                <p>
                  A dated air forecast and district electricity inform other
                  goals.
                </p>
              </div>
            </div>
            <p className={styles.caption}>
              Saved local data. Demo suggestions. More neighbours help more
              goals reach their threshold.
            </p>
          </section>
          <Notes>
            The local context names its source, date and geography. Garden data
            comes from Edinburgh Council. The air forecast is a saved
            Open-Meteo/CAMS forecast for 3 October 2026. Electricity is the
            government’s 2024 EH8 district data, not household meter readings.
            Suggestions are written demo data, not model-generated. Sources and
            geographic limits: docs/postcode/local-data.md. The litter pick
            needs three pledges. The illustrated trees show unlocked goals, not
            actual trees planted or measured environmental savings.
          </Notes>
        </Slide>

        <Slide padding={0}>
          <section className={`${styles.canvas} ${styles.demo}`}>
            <div>
              <p className={styles.eyebrow}>Live demo</p>
              <h2>
                One pledge.
                <br />A shared litter pick.
              </h2>
              <ol className={styles.demoSteps}>
                <li>Priya supplies the third pledge.</li>
                <li>Priya reports attendance after the activity.</li>
                <li>One organiser confirms and awards points.</li>
                <li>Rewards buy a fictional repair voucher.</li>
              </ol>
              <a
                className={styles.demoLink}
                href="/"
                target="_blank"
                rel="noreferrer"
              >
                Open live app ↗
              </a>
              <p className={styles.caption}>
                The street shows participation. Spending rewards keeps
                contribution.
              </p>
            </div>
            <LiveApp />
          </section>
          <Notes>
            Before presenting, reset the demo in a separate tab and choose
            Priya. Show local context, then pledge to the litter pick and report
            attendance. Switch to Margaret through You and confirm from
            Activity. Confirmation adds contribution and earned rewards. Redeem
            the bicycle repair offer and show that spending rewards leaves
            contribution unchanged. This is the main portion of the pitch. Use
            docs/postcode/pitch/demo.md for the full walkthrough. The iframe
            uses the same browser demo state as the app. A separate app tab
            gives a larger view. The event is fictional and scheduled for 3
            October 2026 at 11:00 UK time.
          </Notes>
        </Slide>

        <Slide padding={0}>
          <section className={styles.canvas}>
            <p className={styles.eyebrow}>What comes next</p>
            <h2>
              More neighbours.
              <br />
              More goals going ahead.
            </h2>
            <div className={styles.sources}>
              <div>
                <h3>The prototype</h3>
                <p>
                  Local context, shared pledges, confirmed attendance and saved
                  demo vouchers.
                </p>
              </div>
              <div>
                <h3>A real street trial</h3>
                <p>
                  Test participation with residents and arrange funded partner
                  rewards.
                </p>
              </div>
            </div>
            <p className={styles.disclosure}>
              Residents, activities and rewards are demo data. Environmental
              savings have not been measured. Production identity and organiser
              permissions remain future work.
            </p>
          </section>
          <Notes>
            Finish by connecting the prototype to the brief’s stretch goal: more
            neighbours make it easier for shared goals to reach their threshold.
            A real street trial and funded partner agreements are proposed next
            steps. They have not happened. The prototype stores its state in the
            browser and offers an account picker. It does not provide secure
            production identity or funded rewards. Refer to
            docs/postcode/status.md for built and planned features. Each
            teammate should describe their actual contribution if asked about
            teamwork.
          </Notes>
        </Slide>
      </Deck>
    </div>
  );
}
