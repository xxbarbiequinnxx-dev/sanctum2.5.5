import { EXPERIENCE_LEVELS } from "./experience";

export type PlaybookNote = {
  key: string;
  title: string;
  category: string;
  sort: number;
  body: string;
};

function p(text: string) {
  return `<p>${text}</p>`;
}
function h(text: string) {
  return `<h2>${text}</h2>`;
}
function ul(...items: string[]) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}
function ol(...items: string[]) {
  return `<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`;
}
function callout(text: string) {
  return `<blockquote><p><strong>Hold this.</strong> ${text}</p></blockquote>`;
}
function doc(...parts: string[]) {
  return parts.join("");
}

export const PLAYBOOK_LIBRARY: PlaybookNote[] = [
  {
    key: "pb-curious",
    title: "Curious — first language",
    category: "curious",
    sort: 10,
    body: doc(
      p("Curious means you are naming power on purpose for the first time, or the first time with this person. You do not need a dungeon, a wardrobe, or a title. You need words, a safeword, and the humility to go smaller than the fantasy."),
      callout("Nothing you saw in porn is a lesson plan. Your first job is not intensity. It is a clean yes, a usable no, and a landing."),
      h("What this level is for"),
      ul(
        "Learning the difference between a picture you like and a practice you can run.",
        "Building a yes / maybe / no list while you are clothed and fed.",
        "Trying one flavour at a time: voice, a kneel, a hold, a light spank, a collar that comes off.",
        "Finding out whether you want to lead, follow, or flip — without marrying an identity this month.",
      ),
      h("Do this"),
      ol(
        "Write hard nos. Breath, blood, face, bathrooms, names, anything that is simply off. Nos do not need a speech.",
        "Pick a traffic-light: green, yellow, red. Practise saying yellow when nothing is wrong, so the word exists in your mouth.",
        "Negotiate one small scene with a clock. Twenty minutes is a scene. Close it out loud.",
        "Do aftercare even if the scene was mild. You are training the landing, not proving toughness.",
        "Debrief the next day: keep, tweak, never. Put keepers in Notes.",
      ),
      h("Do not do this yet"),
      ul(
        "CNC, breath play, leaving someone bound, public play with strangers in it, stacking three kinks because you are excited.",
        "24/7 protocol. You do not have the repair skill for a life you have not practised in an evening.",
        "Punishments for ordinary relationship friction. That is a fight, not a scene.",
      ),
      h("For the Dominant-curious"),
      p("Your ego wants to look like you already know. Your partner needs you to ask, watch breath, and stop on yellow without sulking. Read Aftercare and How to negotiate a scene in Education. Lead a small thing well."),
      h("For the submissive-curious"),
      p("You are allowed to want it and still say no to the version in front of you. Subspace is not a test you pass. If you go quiet, they should check, not add more. Read Subspace. Use the word."),
      h("For switches"),
      p("Pick a seat per scene. Flipping mid-way is a later skill. Say who is running tonight before anyone is naked."),
    ),
  },
  {
    key: "pb-exploring",
    title: "Exploring — first structure",
    category: "exploring",
    sort: 20,
    body: doc(
      p("Exploring means you have had enough play to know it is not a one-off mood. You want language, a few standing agreements, and experiments that are still reversible. This is where people either get precise or get sloppy because they are bored of being careful."),
      callout("Curiosity without a debrief is just chaos with better lighting. Write what you try."),
      h("What this level is for"),
      ul(
        "Building a small protocol: a title, a check-in, a kneel, a collar rule that has an off switch.",
        "Trying impact, bondage, or orgasm control as named practices, not accidents.",
        "Learning your drop and theirs. Aftercare stops being a vibe and becomes a kit.",
        "Meeting brat energy as a game with catches, not as a personality defect.",
      ),
      h("Practices"),
      ol(
        "Keep a living yes/maybe/no. Review it monthly, not only after a scare.",
        "Add one toy or one restraint from the Catalogue. Learn it on a calm night.",
        "Run a scene from a written outline in Scenes: who leads, acts, intensity, aftercare, next-day check.",
        "If you brat or tame, write three catches you both think are fair. Do not invent cruelty in the moment.",
        "Open Education: Aftercare, Subspace, Domspace. You are now deep enough to miss a yellow.",
      ),
      h("Risks of this stage"),
      ul(
        "Skipping negotiation because “we know each other now.” That is how limits quietly move.",
        "Using the dynamic to avoid a real fight. Out of dynamic means out.",
        "Comparing your bedroom to people who have been doing this for a decade.",
        "Topping from panic, or submitting from people-pleasing. Both feel like heat until they do not.",
      ),
      h("A week of exploring"),
      p("One negotiated scene. One ordinary night with no protocol so you remember you like each other. One journal page. One conversation that is not horny: sleep, food, a limit that wobbled."),
    ),
  },
  {
    key: "pb-practiced",
    title: "Practiced — a regular dynamic",
    category: "practiced",
    sort: 30,
    body: doc(
      p("Practiced means this is part of how you love, not a costume you take out on Fridays. You know your tastes. You can negotiate them. You have dropped, repaired, and come back. The work now is consistency — and not confusing familiarity with consent."),
      callout("A regular dynamic still needs a yellow. History is not a safeword."),
      h("What this level is for"),
      ul(
        "Standing rules that are few enough to remember. Review them when you are not high.",
        "Scenes with an arc, not only a peak. Aftercare that is specific to this body.",
        "Training that has a marker and a mercy. Positions, cues, service — drilled, then used.",
        "Owning your archetype without forcing your partner into the matching cliché.",
      ),
      h("The craft"),
      ol(
        "Write protocol that survives a bad week. If you cannot keep it on a worknight, it is theatre. Cut it.",
        "Build a toy and restraint literacy: materials, circulation, time-caps, a cutting tool in reach.",
        "Learn each other's drop windows. Put the next-day check in the calendar, not in hope.",
        "Practise ending. A scene that fizzles because someone got tired is a drop you scheduled by accident.",
        "Keep Education and the Playbook beside the fun. Edging, orgasm on command, brat-taming — skill, not mood.",
      ),
      h("Power that lasts"),
      p("The Dominant's job is still the frame, the check, the landing. The submissive's job is still the truth soon enough to be usable. Switches need a way to hand the hat over that is not a sulk. If you are 24/7-curious, run longer protocol in bounded blocks before you call your life a total power exchange."),
      h("Repair"),
      p("You will miss. You will use a word that was out. You will drop and go sharp. Repair is: name it, stop the dynamic if needed, make the next round safer, do not extract a performance of forgiveness. Put ruptures in Journal if that helps you not repeat them as folklore."),
    ),
  },
  {
    key: "pb-seasoned",
    title: "Seasoned — specific and durable",
    category: "seasoned",
    sort: 40,
    body: doc(
      p("Seasoned means you are specific. You know the difference between a kink you can run and a kink you only like in a story. You have done repair that was ugly and still true. Intensity is available. So is boredom, which is the real test of a dynamic that was built on novelty."),
      callout("At this depth, sloppiness is a choice. You already know better. Act like it."),
      h("What this level is for"),
      ul(
        "Heavy protocol that is still kind. Titles that mean something on a grocery run, or a clear off-switch.",
        "Edge-adjacent play only with study: long bondage, serious impact, humiliation with a written lexicon, orgasm control measured in days not minutes.",
        "Mentoring your own past selves — the urge to skip the skeleton because you are good at this.",
        "Holding a brat or a sadist without becoming the worst version of the role.",
      ),
      h("Standards"),
      ol(
        "Re-negotiate after life changes: meds, grief, a new job, a pregnancy scare, an injury. Last year's yes is not this body's.",
        "First aid for the play you actually do. Marks versus problems. When to stop and when to go to a clinician without shame.",
        "No stacking edge on a night you are angry at each other.",
        "Domspace and subspace are known states. You have tells, and you have a close. Read those Education notes until they are boring.",
        "If you play with fear, CNC, or public-shaped fantasy, it is scripted, sober, and has a non-verbal red. No exceptions because you are seasoned.",
      ),
      h("The long dynamic"),
      p("Pride looks like they are more themselves with you, not less. They can still say never. You can still stop. The collar is not a substitute for a relationship. If the only time you are tender is after you have hurt them, that is a pattern, not a style. Fix the pattern."),
    ),
  },
  {
    key: "pb-established",
    title: "Established — long power, studied edge",
    category: "established",
    sort: 50,
    body: doc(
      p("Established means this has years in it, or the weight of edge play you have actually studied — not just survived. You may run heavy protocol, TPE-shaped structures, or scenes that would be reckless in curious hands. The standard is higher, not lower. People get hurt here when they confuse seniority with immunity."),
      callout("Breath, blood, fire, electricity, leaving someone bound, CNC that is not a script — these are still edge. Experience is not a force field. Study, tools, a way out that does not depend on the person in the scene keeping their nerve."),
      h("What this level is for"),
      ul(
        "Structures that govern more than the bedroom, with reviews, not just intensity.",
        "Edge play with educators, medical literacy, and the willingness to refuse a scene that is fashionable but stupid.",
        "Holding a partner through drops that last days, and having your own aftercare without making them parent you.",
        "Knowing when to stop being in role because the person is in trouble.",
      ),
      h("Non-negotiables"),
      ol(
        "A safeword that always works, including non-verbal, including when you are in deep domspace.",
        "No play that requires you to ignore a yellow to get the aesthetic.",
        "Contracts and rules written, dated, revisable. A total power exchange without a revision clause is a trap.",
        "If you use fear, pain, or humiliation at this depth, you debrief. You watch for damage that looks like loyalty.",
        "You still read Aftercare. You still eat. You still sleep. A high-protocol Dominant who cannot keep a body alive is not elite.",
      ),
      h("The quiet work"),
      p("The fantasy is the dungeon. The practice is the Tuesday you are both tired and the collar still means something because you chose it again. Established play is mostly character: you stop when it is time, you repair without theatre, you do not need an audience. If you are bored, do not reach for danger. Reach for a conversation, a new negotiated flavour, or rest."),
      p("Keep the rest of Education beside this page. Depth is a privilege you pay for with attention."),
    ),
  },
];

export const PLAYBOOK_CATEGORIES = EXPERIENCE_LEVELS.map((item) => ({
  value: item.value,
  label: item.label,
}));
