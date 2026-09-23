import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DiscoveryQuizzes } from "@/components/discovery-quiz";
import { CategoryManager, KindPage } from "@/components/kind-page";
import { MoreInfoButton } from "@/components/library-reader";
import { Button } from "@/components/ui/button";
import { RichEditor, RichText } from "@/components/rich-text";
import { getMe, listCategories, listTalkAnswers, saveTalkAnswer } from "@/lib/api";
import { SaveHint, useAutoSave } from "@/lib/auto-save";
import { KINK_RATINGS, STARTER_KINKS, dayKey, todaysCard } from "@/lib/talk-content";
import {
  WEEK_KIND_LABEL,
  coupleLevel,
  formatTalkWeek,
  talkWeekKey,
  weeklyQuizzesFor,
  weeklySeed,
  weeklyTryPrompts,
} from "@/lib/weekly-talk";
import { experienceLabel } from "@/lib/experience";
import { ALL_KINK_OPTIONS, tagLabel } from "@/lib/kinks";
import type { Role } from "@/lib/kinds";
import type { Category, Me, TalkAnswer } from "@/lib/types";
import { sortNamed } from "@/lib/sort";
import { cn } from "@/lib/utils";
import { useLiveReload } from "@/lib/live-sync";

type TalkSave = (
  topic: string,
  body?: string,
  rating?: string | null,
  visibility?: "shared" | "private",
) => Promise<boolean>;

export function TalkView() {
  const [me, setMe] = useState<Me | null>(null);
  const [answers, setAnswers] = useState<TalkAnswer[]>([]);
  const [tab, setTab] = useState("today");
  const [cats, setCats] = useState<Category[]>([]);
  const [manage, setManage] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mine, rows, categories] = await Promise.all([
        getMe(),
        listTalkAnswers(),
        listCategories({ data: { kind: "talk" } }),
      ]);
      setMe(mine);
      setAnswers(rows);
      setCats(categories);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load talk.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useLiveReload(load);

  function answersFor(topic: string) {
    return answers.filter((item) => item.topic === topic);
  }

  function remember(saved: TalkAnswer) {
    setAnswers((prev) => {
      const rest = prev.filter((item) => !(item.topic === saved.topic && item.userId === saved.userId));
      return [saved, ...rest];
    });
  }

  async function save(topic: string, body?: string, rating?: string | null, visibility?: "shared" | "private") {
    try {
      remember(await saveTalkAnswer({ data: { topic, body, rating, visibility } }));
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save.");
      return false;
    }
  }

  const parentCats = useMemo(
    () => sortNamed(cats.filter((item) => !item.parentSlug && !item.archived)),
    [cats],
  );

  const tabs = useMemo(() => {
    const extras = parentCats
      .filter((item) => item.slug !== "question" && item.slug !== "quiz" && item.slug !== "week")
      .map((item) => ({
        id: item.slug,
        label: item.name,
        pane: item.slug === "kink" ? ("kinks" as const) : ("entries" as const),
      }));
    return [
      { id: "today", label: "Today", pane: "today" as const },
      { id: "week", label: "This week", pane: "week" as const },
      ...extras,
      { id: "quizzes", label: "Quizzes", pane: "quizzes" as const },
    ];
  }, [parentCats]);

  const active = tabs.some((item) => item.id === tab) ? tab : "today";
  const activePane = tabs.find((item) => item.id === active)?.pane ?? "today";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">The table</p>
          <h1 className="mt-1 font-display text-4xl font-medium">Talk</h1>
        </div>
        <Button variant="outline" onClick={() => setManage(true)}>
          Categories
        </Button>
      </header>
      <p className="-mt-4 max-w-xl text-sm text-muted-foreground">
        One shared card each day, a weekly try-or-pass, quizzes that follow your experience, kink inventories, fantasies, and issues. On a relevant prompt, More info opens the matching Education and Activities notes.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "h-10 rounded-full px-4 text-sm",
              active === item.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {activePane === "today" ? (
        <DailyQuestion me={me} answers={answersFor(`daily:${dayKey()}`)} onRemember={remember} />
      ) : null}
      {activePane === "week" ? <ThisWeekBoard me={me} answers={answers} onSave={save} /> : null}
      {activePane === "kinks" ? <KinkBoard me={me} answers={answers} onSave={save} /> : null}
      {activePane === "quizzes" ? (
        <QuizBoard
          me={me}
          answers={answers}
          onSave={save}
          onQuizSaved={(row) =>
            setAnswers((prev) => {
              const rest = prev.filter((item) => !(item.topic === row.topic && item.userId === row.userId));
              return [row, ...rest];
            })
          }
        />
      ) : null}
      {activePane === "entries" ? (
        <KindPage key={active} kind="talk" hideHeader initialFilter={active} />
      ) : null}
      <CategoryManager
        kind="talk"
        open={manage}
        cats={cats}
        onClose={() => setManage(false)}
        onChange={setCats}
      />
    </div>
  );
}

function DailyQuestion({
  me,
  answers,
  onRemember,
}: {
  me: Me | null;
  answers: TalkAnswer[];
  onRemember: (row: TalkAnswer) => void;
}) {
  const card = todaysCard();
  const topic = `daily:${card.date}`;
  const mine = answers.find((a) => a.userId === me?.profile?.userId);
  const theirs = answers.find((a) => a.userId === me?.partner?.userId);
  const [text, setText] = useState(mine?.body ?? "");
  const dirty = useRef(false);

  useEffect(() => {
    if (dirty.current) return;
    setText(mine?.body ?? "");
  }, [mine?.body]);

  const saveStatus = useAutoSave(
    text,
    async () => {
      const saved = await saveTalkAnswer({ data: { topic, body: text } });
      onRemember(saved);
    },
    { delay: 600, resetKey: topic },
  );

  return (
    <section className="space-y-4">
      <div className="mx-auto max-w-xl rounded-[28px] border border-ivory/15 bg-ivory px-8 py-10 text-ink shadow-soft">
        <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-oxblood">
          <span>Today's card</span>
          <span>
            {card.number} / {card.total}
          </span>
        </div>
        <h2 className="mt-6 font-display text-3xl font-medium leading-tight text-ink sm:text-4xl">
          {card.prompt}
        </h2>
        <p className="mt-6 text-sm text-ink/60">
          Same prompt for both of you today. Answers stay between you.
        </p>
        <div className="mt-6">
          <MoreInfoButton text={card.prompt} tone="onIvory" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div>
          <RichEditor
            value={text}
            onChange={(value) => {
              dirty.current = true;
              setText(value);
            }}
            placeholder="Your answer — private to the two of you."
          />
        </div>
        <div className="mt-3">
          <SaveHint status={saveStatus} />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <AnswerCard label="You" body={text || mine?.body} />
          <AnswerCard
            label={me?.partner?.displayName || "Partner"}
            body={theirs?.body}
            empty={me?.partner ? "Waiting for them." : "Connect a partner to see both sides."}
          />
        </div>
      </div>
    </section>
  );
}

function weekContext(me: Me | null) {
  const week = talkWeekKey();
  const level = coupleLevel(me?.profile?.experience, me?.partner?.experience);
  const seed = weeklySeed(me?.profile?.bondId || me?.profile?.userId || "solo", week);
  const role = (me?.profile?.role ?? "switch") as Role;
  const kinks = [...new Set([...(me?.profile?.kinks ?? []), ...(me?.partner?.kinks ?? [])])];
  const solo = !me?.partner;
  return { week, level, seed, role, kinks, solo };
}

function ThisWeekBoard({
  me,
  answers,
  onSave,
}: {
  me: Me | null;
  answers: TalkAnswer[];
  onSave: TalkSave;
}) {
  const { week, level, seed, role, kinks, solo } = weekContext(me);
  const prompts = useMemo(
    () => weeklyTryPrompts(level, seed, role, kinks, solo),
    [level, seed, role, kinks, solo],
  );
  const partner = me?.partner ?? null;
  const partnerName = partner?.displayName || partner?.username || "Partner";

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Ten prompts for the week of {formatTalkWeek(week)} — communication, public play, a scene, a roleplay, a
        task, a game, training, a reward, a punishment, and a kink from your profile. Written in your {role} voice, at {experienceLabel(level).toLowerCase()} experience
        {kinks.length
          ? `, using the kinks on your profile${partner?.kinks?.length ? " and theirs" : ""}`
          : ""}.{" "}
        Each prompt tells you what to do. Easy, Hard, and Extreme are three versions of the same idea — pick one. Press
        Try if you will do it this week, or Pass if you will not. They change every Monday.
        {kinks.length ? "" : " Add kinks on your profile to pull these closer to your tastes."}
        {solo
          ? " Written for you alone — every one can be finished without a partner in the room."
          : partner
            ? ` You both see the same ten, each in your own role. ${partnerName} can see whether you choose Try or Pass.`
            : ""}
      </p>
      {prompts.map((prompt) => {
        const topic = `weektry:${week}:${prompt.kind}`;
        const mine = answers.find((a) => a.topic === topic && a.userId === me?.profile?.userId);
        const theirs = answers.find((a) => a.topic === topic && a.userId === partner?.userId);

        return (
          <section key={prompt.kind} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
                {WEEK_KIND_LABEL[prompt.kind]}
              </p>
              <MoreInfoButton
                weekKind={prompt.kind}
                text={`${prompt.title} ${prompt.description}`}
                texts={[prompt.easy, prompt.hard, prompt.extreme]}
              />
            </div>
            <h2 className="mt-2 font-display text-2xl">{prompt.title}</h2>
            {prompt.matchedKinks.length ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Drawn from {prompt.matchedKinks.map((item) => tagLabel(item, ALL_KINK_OPTIONS)).join(", ")}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{prompt.description}</p>
            <LevelCard level="Easy" text={prompt.easy} />
            <LevelCard level="Hard" text={prompt.hard} />
            <LevelCard level="Extreme" text={prompt.extreme} />
            <div className="mt-4 flex flex-wrap gap-2">
              {(["try", "pass"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => void onSave(topic, prompt.title, value, "shared")}
                  className={cn(
                    "h-10 rounded-full px-4 text-sm",
                    mine?.rating === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                  )}
                >
                  {value === "try" ? "Try" : "Pass"}
                </button>
              ))}
            </div>
            {partner ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <TryPassCard label="You" rating={mine?.rating} empty="Not chosen yet." />
                <TryPassCard
                  label={partnerName}
                  rating={theirs?.rating}
                  empty="Waiting for them."
                />
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function LevelCard({ level, text }: { level: "Easy" | "Hard" | "Extreme"; text: string }) {
  return (
    <div className="mt-3 rounded-lg bg-secondary/70 px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">{level}</p>
      <p className="mt-1.5 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

function KinkBoard({
  me,
  answers,
  onSave,
}: {
  me: Me | null;
  answers: TalkAnswer[];
  onSave: TalkSave;
}) {
  const [custom, setCustom] = useState("");
  const extras = useMemo(() => {
    const known = new Set(STARTER_KINKS.map((k) => k.slug));
    const found = new Map<string, string>();
    for (const row of answers) {
      if (!row.topic.startsWith("kink:")) continue;
      const slug = row.topic.slice(5);
      if (!known.has(slug)) found.set(slug, row.body || slug);
    }
    return [...found.entries()].map(([slug, label]) => ({ slug, label }));
  }, [answers]);
  const list = [...STARTER_KINKS, ...extras];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Mark each yes, maybe, curious, no, or hard limit. Both profiles show on the same row.
      </p>
      <div className="space-y-2">
        {list.map((kink) => {
          const topic = `kink:${kink.slug}`;
          const mine = answers.find((a) => a.topic === topic && a.userId === me?.profile?.userId);
          const theirs = answers.find((a) => a.topic === topic && a.userId === me?.partner?.userId);
          return (
            <div key={kink.slug} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{kink.label}</p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <MoreInfoButton kinkSlug={kink.slug} text={kink.label} />
                  {theirs?.rating ? (
                    <p className="text-xs text-muted-foreground">
                      {me?.partner?.displayName || "Partner"}:{" "}
                      {KINK_RATINGS.find((r) => r.value === theirs.rating)?.label ?? theirs.rating}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {KINK_RATINGS.map((rating) => (
                  <button
                    key={rating.value}
                    type="button"
                    onClick={() => void onSave(topic, kink.label, rating.value)}
                    className={cn(
                      "h-8 rounded-full px-2.5 text-xs",
                      mine?.rating === rating.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {rating.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!custom.trim()) return;
          const slug = custom.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
          void onSave(`kink:${slug}`, custom.trim(), "curious");
          setCustom("");
        }}
      >
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Add a kink"
          className="h-11 flex-1 rounded-md border border-input bg-secondary px-3 text-sm"
        />
        <Button type="submit">Add</Button>
      </form>
    </div>
  );
}

function QuizBoard({
  me,
  answers,
  onSave,
  onQuizSaved,
}: {
  me: Me | null;
  answers: TalkAnswer[];
  onSave: TalkSave;
  onQuizSaved: (row: TalkAnswer) => void;
}) {
  const { week, level, seed } = weekContext(me);
  const quizzes = useMemo(() => weeklyQuizzesFor(level, seed), [level, seed]);
  const [open, setOpen] = useState<string | null>(quizzes[0]?.id ?? "love");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Always-on discovery. Take the BDSM test (25-question Quick Quiz or 125-question Full Profile) and love languages. Share the scores with your partner, or keep them private. Individual answers stay with you.
        </p>
        <DiscoveryQuizzes
          answers={answers}
          meId={me?.profile?.userId}
          partnerId={me?.partner?.userId}
          partnerName={me?.partner?.username || me?.partner?.displayName || "Partner"}
          onSaved={onQuizSaved}
        />
      </div>
      <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Weekly packs — love languages, kink, roleplay, scenes, aftercare, relationship, and communication — four questions each, drawn for {experienceLabel(level).toLowerCase()} experience. New set every Monday at 00:01 UTC (week of {formatTalkWeek(week)}).
      </p>
      {quizzes.map((quiz) => (
        <section key={quiz.id} className="rounded-xl border border-border bg-card p-5">
          <button type="button" className="w-full text-left" onClick={() => setOpen(open === quiz.id ? null : quiz.id)}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-2xl">{quiz.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{quiz.blurb}</p>
              </div>
            </div>
          </button>
          <div className="mt-3">
            <MoreInfoButton
              quizId={quiz.id}
              text={`${quiz.title} ${quiz.blurb}`}
              texts={quiz.questions.map((item) => item.prompt)}
            />
          </div>
          {open === quiz.id
            ? quiz.questions.map((q, qi) => {
                const topic = `weekquiz:${week}:${quiz.id}:${qi}`;
                const mine = answers.find((a) => a.topic === topic && a.userId === me?.profile?.userId);
                const theirs = answers.find((a) => a.topic === topic && a.userId === me?.partner?.userId);
                return (
                  <div key={topic} className="mt-4 border-t border-border pt-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-sm font-medium">{q.prompt}</p>
                      <MoreInfoButton quizId={quiz.id} text={q.prompt} />
                    </div>
                    <div className="mt-2 grid gap-1">
                      {q.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => void onSave(topic, opt.label, opt.value)}
                          className={cn(
                            "rounded-md border px-3 py-2 text-left text-sm",
                            mine?.rating === opt.value
                              ? "border-primary bg-primary/10"
                              : "border-border",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {theirs?.body ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {me?.partner?.displayName || "Partner"} chose: {theirs.body}
                      </p>
                    ) : null}
                  </div>
                );
              })
            : null}
        </section>
      ))}
      </div>
    </div>
  );
}

function TryPassCard({
  label,
  rating,
  empty,
}: {
  label: string;
  rating?: string | null;
  empty: string;
}) {
  const chosen = rating === "try" ? "Try" : rating === "pass" ? "Pass" : null;
  return (
    <div className="rounded-lg bg-secondary p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-sm", chosen ? "font-medium" : "text-muted-foreground")}>
        {chosen ?? empty}
      </p>
    </div>
  );
}

function AnswerCard({
  label,
  body,
  empty = "Not answered yet.",
}: {
  label: string;
  body?: string;
  empty?: string;
}) {
  return (
    <div className="rounded-lg bg-secondary p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      {body ? <RichText html={body} className="mt-2" /> : <p className="mt-2 text-sm">{empty}</p>}
    </div>
  );
}
