"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { StreetDrawing } from "@/components/street-drawing";
import { Button } from "@/components/ui/button";
import { households, interestGroups } from "@/data/seed";
import { dispatch, useDemoState } from "@/lib/demo-store";
import type { InterestId } from "@/lib/types";
import { cn } from "@/lib/utils";

const steps = ["postcode", "street", "house", "name", "interests"] as const;
type Step = (typeof steps)[number];

function namesSummary(names: string[]) {
  if (names.length === 0) return "No one yet. Start it off.";
  if (names.length === 1) return `${names[0]} is in it`;
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]} and ${names.length - 1} others`;
}

export function Onboarding({
  onCancel,
  onFinish,
}: {
  onCancel: () => void;
  onFinish: () => void;
}) {
  const state = useDemoState();
  const [step, setStep] = useState<Step>("postcode");
  const [postcode, setPostcode] = useState("EH8 9YL");
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [interests, setInterests] = useState<InterestId[]>([]);

  const index = steps.indexOf(step);
  const back = () => (index === 0 ? onCancel() : setStep(steps[index - 1]));
  const next = () => setStep(steps[index + 1]);

  const house = households.find((h) => h.id === householdId);
  const housemates = state.users.filter((u) => u.householdId === householdId);

  function checkPostcode() {
    const district = postcode.trim().toUpperCase().split(/\s+/)[0];
    if (!/^[A-Z]{1,2}\d[A-Z\d]?$/.test(district ?? "")) {
      setPostcodeError("Enter a full UK postcode, like EH8 9YL.");
      return;
    }
    if (district !== "EH8") {
      setPostcodeError(
        `Greener by postcode isn't in ${district} yet. Try an EH8 postcode.`,
      );
      return;
    }
    setPostcodeError(null);
    next();
  }

  function finish() {
    if (!householdId) return;
    dispatch({ type: "add-user", name, householdId, interests });
    onFinish();
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 px-3 pt-3">
        <Button variant="ghost" size="icon-lg" onClick={back} aria-label="Back">
          <ArrowLeft className="size-5" />
        </Button>
        <ol
          className="flex flex-1 gap-1.5 pr-4"
          aria-label={`Step ${index + 1} of ${steps.length}`}
        >
          {steps.map((s, i) => (
            <li
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= index ? "bg-moss" : "bg-muted",
              )}
            />
          ))}
        </ol>
      </header>

      <div
        key={step}
        className="step-in flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-6 pb-6"
      >
        {step === "postcode" && (
          <form
            className="flex flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              checkPostcode();
            }}
          >
            <p className="font-sign text-sm font-semibold tracking-[0.2em] text-moss">
              GREENER BY POSTCODE
            </p>
            <h1 className="mt-3 text-3xl leading-tight font-bold">
              Where do you live?
            </h1>
            <p className="mt-2 text-muted-foreground">
              We&apos;ll show you what&apos;s happening on your street, and who
              you can act with.
            </p>
            <label htmlFor="postcode" className="mt-8 text-sm font-bold">
              Your postcode
            </label>
            <input
              id="postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              autoComplete="postal-code"
              aria-invalid={postcodeError ? true : undefined}
              aria-describedby={postcodeError ? "postcode-error" : undefined}
              className="mt-2 h-14 rounded-xl border-2 bg-card px-4 font-mono text-2xl tracking-wider uppercase outline-none focus-visible:border-moss aria-invalid:border-destructive"
            />
            {postcodeError && (
              <p id="postcode-error" className="mt-2 text-sm text-destructive">
                {postcodeError}
              </p>
            )}
            <Button type="submit" size="lg" className="mt-auto h-12 text-base">
              Find my street
            </Button>
          </form>
        )}

        {step === "street" && (
          <div className="flex flex-1 flex-col">
            <h1 className="text-3xl leading-tight font-bold">
              {state.users.length} of your neighbours already use the app
            </h1>
            <ul className="mt-6 flex flex-wrap gap-4">
              {state.users.map((u) => (
                <li key={u.id} className="flex flex-col items-center gap-1">
                  <Avatar user={u} className="size-12 text-lg" />
                  <span className="text-sm">{u.name}</span>
                </li>
              ))}
            </ul>
            <div className="-mx-6 mt-6">
              <StreetDrawing showNeighbours />
            </div>
            <p className="mt-4 text-muted-foreground">
              Together they&apos;ve earned points for the street. Every goal you
              join brings the next one closer.
            </p>
            <Button size="lg" className="mt-auto h-12 text-base" onClick={next}>
              Find my house
            </Button>
          </div>
        )}

        {step === "house" && (
          <div className="flex flex-1 flex-col">
            <h1 className="text-3xl leading-tight font-bold">
              Which house is yours?
            </h1>
            <p className="mt-2 text-muted-foreground">
              Tap your house. Houses stay anonymous: neighbours only see the
              street, never your address.
            </p>
            <div className="-mx-6 mt-6">
              <StreetDrawing
                youHouseholdId={householdId ?? undefined}
                onPick={setHouseholdId}
              />
            </div>
            <p className="mt-4 min-h-12" aria-live="polite">
              {house &&
                (housemates.length > 0 ? (
                  <>
                    <span className="font-bold">{house.label}.</span>{" "}
                    You&apos;ll join{" "}
                    {housemates.map((u) => u.name).join(" and ")}&apos;s
                    household.
                  </>
                ) : (
                  <>
                    <span className="font-bold">{house.label}.</span> No one
                    from here is on the app yet.
                  </>
                ))}
            </p>
            <Button
              size="lg"
              className="mt-auto h-12 text-base"
              disabled={!householdId}
              onClick={next}
            >
              This is my house
            </Button>
          </div>
        )}

        {step === "name" && (
          <form
            className="flex flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) next();
            }}
          >
            <h1 className="text-3xl leading-tight font-bold">
              What should neighbours call you?
            </h1>
            <p className="mt-2 text-muted-foreground">
              Your first name is enough.
            </p>
            <label htmlFor="name" className="sr-only">
              Your name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              autoFocus
              maxLength={24}
              placeholder="Your first name"
              className="mt-8 h-14 rounded-xl border-2 bg-card px-4 text-2xl outline-none focus-visible:border-moss"
            />
            <Button
              type="submit"
              size="lg"
              className="mt-auto h-12 text-base"
              disabled={!name.trim()}
            >
              Continue
            </Button>
          </form>
        )}

        {step === "interests" && (
          <div className="flex flex-1 flex-col">
            <h1 className="text-3xl leading-tight font-bold">
              What do you care about, {name.trim()}?
            </h1>
            <p className="mt-2 text-muted-foreground">
              Pick any. You&apos;ll join a group of neighbours for each.
            </p>
            <ul className="mt-6 space-y-2">
              {interestGroups.map((group) => {
                const selected = interests.includes(group.id);
                const members = state.users
                  .filter((u) => u.interests.includes(group.id))
                  .map((u) => u.name);
                return (
                  <li key={group.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setInterests(
                          selected
                            ? interests.filter((i) => i !== group.id)
                            : [...interests, group.id],
                        )
                      }
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 bg-card px-4 py-3 text-left outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                        selected ? "border-moss bg-moss/10" : "border-border",
                      )}
                    >
                      <span className="flex-1">
                        <span className="block font-bold">{group.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {namesSummary(members)}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "grid size-6 place-items-center rounded-full border-2",
                          selected
                            ? "border-moss bg-moss text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {selected && <Check className="size-4" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="sticky -bottom-6 -mx-6 mt-4 bg-gradient-to-t from-background from-70% px-6 pt-6 pb-6">
              <Button
                size="lg"
                className="h-12 w-full text-base"
                disabled={interests.length === 0}
                onClick={finish}
              >
                Join the street
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
