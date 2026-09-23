import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveTalkAnswer } from "@/lib/api";
import { LIKERT_OPTIONS } from "@/lib/bdsm-quiz-bank";
import {
  BDSM_FULL_QUIZ,
  BDSM_QUICK_QUIZ,
  BDSM_SECTION_TITLES,
  LOVE_QUIZ,
  KINK_TO_TALK,
  orderedQuestions,
  parseQuizBody,
  picksComplete,
  questionsForFilter,
  rankRows,
  scoreQuiz,
  topKey,
  type BdsmRoleFilter,
  type DiscoveryQuiz,
  type QuizPicks,
  type QuizResultRow,
  type QuizSection,
} from "@/lib/discovery-quizzes";
import type { TalkAnswer } from "@/lib/types";
import { cn } from "@/lib/utils";

function padPicks(raw: QuizPicks, len: number): QuizPicks {
  const next = raw.map((row) => row.slice());
  while (next.length < len) next.push([]);
  return next.slice(0, len);
}

function answeredCount(picks: QuizPicks) {
  return picks.filter((row) => row.length > 0).length;
}

function quizStatus(
  quiz: DiscoveryQuiz,
  picks: QuizPicks,
  hasSections: boolean,
  savedSize?: number,
  savedFilter: BdsmRoleFilter = "full",
): "done" | "in-progress" | "fresh" {
  const indices = quiz.questions.map((_, i) => i);
  if (picksComplete(picks, indices)) return "done";
  const n = answeredCount(picks);
  if (savedSize === quiz.questions.length && n > 0) {
    const vis = questionsForFilter(quiz, quiz.multi ? savedFilter : "full");
    if (picksComplete(picks, vis.map((row) => row.index))) return "done";
    return "in-progress";
  }
  if (hasSections) return "done";
  if (n > 0) return "in-progress";
  return "fresh";
}

function statusFromAnswers(quiz: DiscoveryQuiz, answers: TalkAnswer[], meId?: string) {
  const existing = answers.find((item) => item.topic === quiz.topic && item.userId === meId);
  const parsed = parseQuizBody(existing?.body);
  return quizStatus(
    quiz,
    padPicks(parsed?.picks ?? [], quiz.questions.length),
    Boolean(parsed?.sections?.length),
    parsed?.quizSize,
  );
}

function InterestRadar({ quiz, rows }: { quiz: DiscoveryQuiz; rows: QuizResultRow[] }) {
  const keys = quiz.groups[0]?.keys ?? [];
  const data = keys.map((key) => {
    const row = rows.find((item) => item.key === key);
    return {
      axis: quiz.shortLabels?.[key] ?? quiz.labels[key] ?? key,
      value: row?.pct ?? 0,
    };
  });
  if (data.length < 3) return null;
  return (
    <div className="mx-auto h-72 w-full max-w-md">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="52%" outerRadius="68%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.22}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScoreBar({ row, independent, rank }: { row: QuizResultRow; independent: boolean; rank?: number }) {
  return (
    <li>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span>
          {rank != null ? <span className="mr-2 tabular-nums text-muted-foreground">{rank}.</span> : null}
          {row.label}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {row.pct}
          {independent ? "" : "%"}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${row.pct}%` }} />
      </div>
    </li>
  );
}

export function QuizResults({
  quiz,
  sections,
  empty = "No scores yet.",
}: {
  quiz?: DiscoveryQuiz;
  sections: QuizSection[];
  empty?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = sections
    .map((section) => ({
      ...section,
      rows: section.rows.filter((row) => (quiz?.scoring === "independent" ? true : row.score > 0)),
    }))
    .filter((section) => section.rows.length > 0);
  if (!visible.length) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  const independent = quiz?.scoring === "independent";
  const ranked = independent ? rankRows(visible[0]?.rows ?? []) : visible[0]?.rows ?? [];
  const lead = ranked[0];
  const others = ranked.slice(1);
  const preview = independent && others.length > 2 ? others.slice(0, 2) : others;
  const hidden = independent && others.length > 2 ? others.slice(2) : [];
  const collapse = Boolean(independent && quiz?.id === "bdsm-full" && hidden.length);
  const shownOthers = collapse && !showAll ? preview : others;

  return (
    <div className="space-y-5">
      {quiz?.chart === "radar" ? <InterestRadar quiz={quiz} rows={visible[0]?.rows ?? []} /> : null}
      {independent && lead ? (
        <div className="rounded-lg bg-secondary p-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Strongest match</p>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <h3 className="font-display text-2xl">{lead.label}</h3>
            <p className="tabular-nums text-2xl text-primary">{lead.pct}</p>
          </div>
          {quiz.blurbs?.[lead.key] ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{quiz.blurbs[lead.key]}</p>
          ) : null}
        </div>
      ) : null}
      {visible.map((section) => (
        <div key={section.id}>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {independent ? (quiz?.id === "bdsm-full" ? "Other strong matches" : section.title) : section.title}
          </p>
          <ul className="mt-2 space-y-2">
            {(independent ? shownOthers : section.rows).map((row, index) => (
              <ScoreBar
                key={row.key}
                row={row}
                independent={Boolean(independent)}
                rank={independent && quiz?.id === "bdsm-full" ? index + 1 : undefined}
              />
            ))}
          </ul>
          {collapse ? (
            <button
              type="button"
              onClick={() => setShowAll((open) => !open)}
              className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={cn("size-4 transition-transform", showAll && "rotate-180")} />
              {showAll ? "Show less" : `+${hidden.length} more roles and interests`}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function LikertScale({
  value,
  onChange,
  disabled,
}: {
  value?: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const selected = typeof value === "number" ? LIKERT_OPTIONS[value] : null;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>Disagree</span>
        <span>Agree</span>
      </div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="How much do you agree?">
        {LIKERT_OPTIONS.map((opt) => {
          const on = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={opt.label}
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className="flex h-11 min-h-11 flex-1 items-center justify-center"
            >
              <span
                className={cn(
                  "size-7 rounded-full border-2 sm:size-8",
                  on ? "border-primary bg-primary" : "border-border bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-muted-foreground">{selected ? selected.label : "How much do you agree?"}</p>
    </div>
  );
}

export function BdsmTestChooser({
  onPick,
  answers,
  meId,
}: {
  onPick: (id: "quick" | "full") => void;
  answers?: TalkAnswer[];
  meId?: string;
}) {
  const cards = [
    { id: "quick" as const, quiz: BDSM_QUICK_QUIZ, start: "Start quick quiz" },
    { id: "full" as const, quiz: BDSM_FULL_QUIZ, start: "Start full profile" },
  ];
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Choose the quick BDSM quiz for seven interest scores, or take the full kink test to rank all 24 roles and
        interests.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ id, quiz, start }) => {
          const status = answers ? statusFromAnswers(quiz, answers, meId) : "fresh";
          const cta = status === "done" ? "See results" : status === "in-progress" ? "Continue" : start;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPick(id)}
              className="rounded-xl border border-border bg-card p-5 text-left hover:border-primary/50"
            >
              <p className="font-display text-2xl">{quiz.title}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {quiz.countHint} · {quiz.timeHint}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">{quiz.blurb}</p>
              <p className="mt-4 text-sm font-medium text-primary">{cta}</p>
            </button>
          );
        })}
      </div>
      <div className="rounded-lg bg-secondary p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          What this test measures
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The Quick Quiz plots seven dimensions on a radar: Dominance, Submission, Sensation & Impact,
          Psychological Play, Bondage & Restraint, Trust & Vulnerability, and Adventurousness. The Full
          Profile ranks 24 roles and interests independently — a high Dominant score does not reduce Submissive.
        </p>
      </div>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">How long?</span> About five minutes for 25 questions, or
          fifteen for 125.
        </p>
        <p>
          <span className="font-medium text-foreground">What do results mean?</span> The Quick Quiz ranks seven
          interest scores. The Full Profile ranks 24 roles — Dominant, Submissive, Switch, Brat, Rigger, and
          more — as a starting point for you, or a conversation with a partner.
        </p>
        <p>
          <span className="font-medium text-foreground">Can we compare?</span> Yes. Share the scores, not the
          individual answers. A connected partner sees the same charts after they take it too.
        </p>
      </div>
    </div>
  );
}

export function DiscoveryQuizRun({
  quiz,
  answers,
  meId,
  onSaved,
  onFinished,
  onExit,
  compact,
  startOnMount,
}: {
  quiz: DiscoveryQuiz;
  answers: TalkAnswer[];
  meId?: string;
  onSaved?: (answer: TalkAnswer) => void;
  onFinished?: (sections: QuizSection[]) => void;
  onExit?: () => void;
  compact?: boolean;
  startOnMount?: boolean;
}) {
  const existing = answers.find((item) => item.topic === quiz.topic && item.userId === meId);
  const parsed = parseQuizBody(existing?.body);
  const multi = Boolean(quiz.multi);
  const likert = Boolean(quiz.likert);
  const [picks, setPicks] = useState<QuizPicks>(() => padPicks(parsed?.picks ?? [], quiz.questions.length));
  const startFilter: BdsmRoleFilter = "full";
  const initialStatus = quizStatus(
    quiz,
    padPicks(parsed?.picks ?? [], quiz.questions.length),
    Boolean(parsed?.sections?.length),
    parsed?.quizSize,
    startFilter,
  );
  const [phase, setPhase] = useState<"hub" | "results" | "questions">(() => {
    if (initialStatus === "done") return "results";
    if (initialStatus === "in-progress") return "questions";
    return startOnMount ? "questions" : "hub";
  });
  const visible = useMemo(() => orderedQuestions(quiz), [quiz]);
  const [index, setIndex] = useState(() => {
    if (initialStatus === "done") return 0;
    const first = visible.findIndex(({ index: qi }) => (parsed?.picks?.[qi]?.length ?? 0) === 0);
    return first >= 0 ? first : 0;
  });
  const [busy, setBusy] = useState(false);
  const [shared, setShared] = useState(existing?.visibility !== "private");
  const scored = useMemo(() => scoreQuiz(quiz, picks), [quiz, picks]);
  const current = visible[index];
  const question = current?.item;
  const origIndex = current?.index ?? 0;
  const selected = picks[origIndex] ?? [];
  const options = likert
    ? LIKERT_OPTIONS.map((item) => ({ label: item.label, value: item.value }))
    : (question?.options ?? []).map((item, oi) => ({ label: item.label, value: oi }));
  const sectionTitle = question?.section ? (BDSM_SECTION_TITLES[question.section] ?? question.section) : "";

  async function persist(nextPicks: QuizPicks, visibility: "shared" | "private", final: boolean) {
    const padded = padPicks(nextPicks, quiz.questions.length);
    const result = scoreQuiz(quiz, padded);
    if (final) setBusy(true);
    try {
      const saved = await saveTalkAnswer({
        data: {
          topic: quiz.topic,
          body: JSON.stringify({
            picks: padded,
            sections: result.sections,
            at: new Date().toISOString(),
            filter: "full",
            quizSize: quiz.questions.length,
          }),
          rating: topKey(result.sections[0]),
          visibility,
        },
      });
      onSaved?.(saved);
      if (final && (quiz.id === "bdsm-full" || quiz.id === "bdsm-quick")) {
        const rows = result.sections[0]?.rows ?? [];
        for (const row of rows) {
          const slug = KINK_TO_TALK[row.key];
          if (!slug || row.pct < 55) continue;
          const rating = row.pct >= 70 ? "yes" : "curious";
          await saveTalkAnswer({ data: { topic: `kink:${slug}`, body: row.label, rating, visibility } }).catch(() => null);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the quiz.");
    } finally {
      if (final) setBusy(false);
    }
  }

  function toggleOption(optionIndex: number) {
    const next = padPicks(picks, quiz.questions.length);
    const row = new Set(next[origIndex]);
    if (row.has(optionIndex)) row.delete(optionIndex);
    else row.add(optionIndex);
    next[origIndex] = [...row].sort((a, b) => a - b);
    setPicks(next);
  }

  function chooseSingle(optionIndex: number) {
    const next = padPicks(picks, quiz.questions.length);
    next[origIndex] = [optionIndex];
    setPicks(next);
    const last = index + 1 >= visible.length;
    if (last) {
      setPhase("results");
      void persist(next, shared ? "shared" : "private", true);
      return;
    }
    setIndex(index + 1);
    if ((index + 1) % 5 === 0) void persist(next, shared ? "shared" : "private", false);
  }

  function goNext() {
    if (multi && selected.length === 0) {
      toast.error("Pick at least one option. You can pick several.");
      return;
    }
    const last = index + 1 >= visible.length;
    const nextPicks = padPicks(picks, quiz.questions.length);
    if (last) {
      setPhase("results");
      void persist(nextPicks, shared ? "shared" : "private", true);
      return;
    }
    setIndex(index + 1);
    void persist(nextPicks, shared ? "shared" : "private", false);
  }

  function goBack() {
    if (index <= 0) return;
    setIndex(index - 1);
  }

  async function toggleShare(next: boolean) {
    setShared(next);
    if (phase !== "results") return;
    await persist(picks, next ? "shared" : "private", true);
  }

  function startRun(wipe: boolean) {
    const next = wipe ? quiz.questions.map(() => [] as number[]) : padPicks(picks, quiz.questions.length);
    setPicks(next);
    setIndex(0);
    setPhase("questions");
  }

  async function saveAndExit() {
    await persist(picks, shared ? "shared" : "private", false);
    onExit?.();
  }

  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", compact && "p-4")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl">{quiz.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {quiz.countHint ? `${quiz.countHint} · ${quiz.timeHint}` : quiz.blurb}
          </p>
        </div>
        {phase === "results" ? (
          <Button variant="outline" onClick={() => startRun(true)} disabled={busy}>
            Retake
          </Button>
        ) : phase === "questions" ? (
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Question {index + 1} of {visible.length}
          </p>
        ) : null}
      </div>

      {phase === "hub" ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-muted-foreground">
            {quiz.questions.length} statements. {quiz.timeHint ?? "Work through them in one sitting."} Rate how much you
            agree with each one.
          </p>
          <Button onClick={() => startRun(initialStatus !== "in-progress")}>
            {initialStatus === "in-progress" ? "Continue" : `Start ${quiz.title.toLowerCase()}`}
          </Button>
        </div>
      ) : null}

      {phase === "results" ? (
        <div className="mt-5 space-y-4">
          <QuizResults
            quiz={quiz}
            sections={scored.sections.length ? scored.sections : parsed?.sections ?? []}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant={shared ? "default" : "outline"} onClick={() => void toggleShare(true)} disabled={busy}>
              Share with partner
            </Button>
            <Button variant={!shared ? "default" : "outline"} onClick={() => void toggleShare(false)} disabled={busy}>
              Keep private
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {shared
              ? "Your partner can see these scores on Talk. Individual answers stay with you."
              : "Only you can see these results. You can share the scores later."}
          </p>
          {onFinished ? (
            <Button className="w-full" onClick={() => onFinished(scored.sections.length ? scored.sections : parsed?.sections ?? [])}>
              Continue
            </Button>
          ) : null}
          {onExit && !onFinished ? (
            <Button variant="ghost" className="w-full" onClick={onExit}>
              Back to quizzes
            </Button>
          ) : null}
        </div>
      ) : null}

      {phase === "questions" && question ? (
        <div className="mt-5 space-y-3">
          {sectionTitle ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{sectionTitle}</p>
          ) : null}
          <div className="h-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${Math.round(((index + 1) / Math.max(visible.length, 1)) * 100)}%` }}
            />
          </div>
          <p className="text-sm font-medium leading-relaxed">{question.prompt}</p>
          {likert ? (
            <LikertScale
              value={selected[0]}
              disabled={busy}
              onChange={(n) => chooseSingle(n)}
            />
          ) : (
            <>
              {multi ? (
                <p className="text-xs text-muted-foreground">Select every option that is true. You can pick more than one.</p>
              ) : null}
              <div className="grid gap-1.5">
                {options.map((opt) => {
                  const on = selected.includes(opt.value);
                  return (
                    <button
                      key={`${origIndex}-${opt.value}`}
                      type="button"
                      disabled={busy}
                      onClick={() => (multi ? toggleOption(opt.value) : chooseSingle(opt.value))}
                      className={cn(
                        "min-h-11 rounded-md border px-3 py-2.5 text-left text-sm hover:border-primary/50 hover:bg-primary/5",
                        on ? "border-primary bg-primary/10" : "border-border",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" onClick={goBack} disabled={busy || index === 0}>
              Back
            </Button>
            {multi ? (
              <Button onClick={goNext} disabled={busy || selected.length === 0}>
                {index + 1 >= visible.length ? "See results" : "Next"}
              </Button>
            ) : null}
            {onExit ? (
              <Button variant="ghost" onClick={() => void saveAndExit()} disabled={busy}>
                Save and exit
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function DiscoveryQuizzes({
  answers,
  meId,
  partnerId,
  partnerName,
  onSaved,
}: {
  answers: TalkAnswer[];
  meId?: string;
  partnerId?: string;
  partnerName?: string;
  onSaved?: (answer: TalkAnswer) => void;
}) {
  const [active, setActive] = useState<"quick" | "full" | "love" | null>(null);
  const partnerQuick = answers.find((item) => item.topic === BDSM_QUICK_QUIZ.topic && item.userId === partnerId);
  const partnerFull = answers.find((item) => item.topic === BDSM_FULL_QUIZ.topic && item.userId === partnerId);
  const partnerLove = answers.find((item) => item.topic === LOVE_QUIZ.topic && item.userId === partnerId);
  const partnerQuickSections = parseQuizBody(partnerQuick?.body)?.sections ?? [];
  const partnerFullSections = parseQuizBody(partnerFull?.body)?.sections ?? [];
  const partnerLoveSections = parseQuizBody(partnerLove?.body)?.sections ?? [];
  const partnerShared = partnerQuickSections.length || partnerFullSections.length || partnerLoveSections.length;
  const running = active === "quick" ? BDSM_QUICK_QUIZ : active === "full" ? BDSM_FULL_QUIZ : active === "love" ? LOVE_QUIZ : null;

  if (running) {
    return (
      <DiscoveryQuizRun
        quiz={running}
        answers={answers}
        meId={meId}
        onSaved={onSaved}
        startOnMount
        onExit={() => setActive(null)}
      />
    );
  }

  const loveStatus = statusFromAnswers(LOVE_QUIZ, answers, meId);
  const loveCta = loveStatus === "done" ? "See results" : loveStatus === "in-progress" ? "Continue" : "Start love languages";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-display text-2xl">Free BDSM test</h2>
        <p className="mt-1 text-sm text-muted-foreground">See your kink profile. Instant results. Share scores, not answers.</p>
        <div className="mt-5">
          <BdsmTestChooser answers={answers} meId={meId} onPick={setActive} />
        </div>
      </section>
      <button
        type="button"
        onClick={() => setActive("love")}
        className="w-full rounded-xl border border-border bg-card p-5 text-left hover:border-primary/50"
      >
        <p className="font-display text-2xl">{LOVE_QUIZ.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{LOVE_QUIZ.blurb}</p>
        <p className="mt-4 text-sm font-medium text-primary">{loveCta}</p>
      </button>
      {partnerId && partnerShared ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-2xl">{partnerName || "Partner"} shared</h2>
          <p className="mt-1 text-sm text-muted-foreground">Scores they chose to show you — not their individual answers.</p>
          {partnerQuickSections.length ? (
            <div className="mt-5">
              <p className="text-sm font-medium">{BDSM_QUICK_QUIZ.title}</p>
              <div className="mt-3">
                <QuizResults quiz={BDSM_QUICK_QUIZ} sections={partnerQuickSections} />
              </div>
            </div>
          ) : null}
          {partnerFullSections.length ? (
            <div className="mt-5">
              <p className="text-sm font-medium">{BDSM_FULL_QUIZ.title}</p>
              <div className="mt-3">
                <QuizResults quiz={BDSM_FULL_QUIZ} sections={partnerFullSections} />
              </div>
            </div>
          ) : null}
          {partnerLoveSections.length ? (
            <div className="mt-5">
              <p className="text-sm font-medium">{LOVE_QUIZ.title}</p>
              <div className="mt-3">
                <QuizResults quiz={LOVE_QUIZ} sections={partnerLoveSections} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export { discoveryById } from "@/lib/discovery-quizzes";
