import type { Role } from "@/lib/kinds";
import type { WeekKind, WeekPrompt, WeekPromptBody } from "@/lib/weekly-talk";

type SoloSpec = {
  titles: { dominant: string; submissive: string; switch: string };
  description: string;
  easy: string;
  hard: string;
  extreme: string;
};

function seat(role: Role) {
  if (role === "dominant") return "You are doing this alone. You still set the timer and the stop.";
  if (role === "submissive") return "You are doing this alone. Keep the rule you wrote when you were calm.";
  return "You are doing this alone. You hold both seats. Say out loud who is in charge before you start.";
}

const SOLO: Record<string, SoloSpec> = {
  "communication:say-one-instruction-they-do-it-once": {
    titles: {
      dominant: "Say one instruction. Then you do it",
      submissive: "Write one instruction. Then you do it once",
      switch: "One instruction — you say it, you do it",
    },
    description:
      "Write one short instruction you can actually do in this room. Say it out loud once. Do it. Say thank you to yourself, and your name. After: water. Journal the instruction if you want it again.",
    easy: "One instruction. Sit down. Thank you. Name. Water.",
    hard: "One body instruction: kneel, or hands on thighs. Hold it. Stand when the timer says so.",
    extreme: "One instruction, then 2 minutes of holding it. Do not fill the quiet. Then your name, and you may move.",
  },
  "communication:three-true-praises-before-they-sleep": {
    titles: {
      dominant: "Three true praises you write and then have to take",
      submissive: "Three true praises you wrote when kind, read at night",
      switch: "Three true lines before sleep. Stop if they turn to shame",
    },
    description:
      "Write 3 true sentences about how you were today. Be specific. Read them. Stop if they turn to shame. The page stays.",
    easy: "3 lines, one night. You may say stop.",
    hard: "3 nights this week. No extra tasks attached.",
    extreme: "Every night this week. Sunday keep the lines that landed.",
  },
  "communication:dirty-talk-from-a-page-you-wrote": {
    titles: {
      dominant: "Dirty talk from a page, then the kind opposites",
      submissive: "Dirty talk from a page you wrote calm, then repair",
      switch: "A list, once, then kindness in the same notebook",
    },
    description:
      "While clothed, write 5 words you want to hear. Read them once. Stop. Write the opposite kind sentences. Do not make up new mean words in the heat. A kind note for the morning, written now.",
    easy: "Read the 5 lines. Write the 5 kind opposites.",
    hard: "One line, repeated. Then its opposite. Morning note drafted.",
    extreme: "The full list, still once, still with repair the same night. If the page scares you in the morning, that is a complete answer.",
  },
  "communication:tease-them-with-words-while-you-edge-them": {
    titles: {
      dominant: "Tease yourself with words you wrote, while you edge",
      submissive: "Hear the tease you wrote, while you edge, then stop",
      switch: "A list, a hand, a stop at 8",
    },
    description:
      "Your hand or a toy you already know. Close to orgasm, then stop. Use playful mean words from a list you wrote while clothed. 8 on a 1-to-10 scale means you take your hand away. After: water, towel, a clear yes or no about coming later.",
    easy: "3 rounds: 2 minutes on, 1 off. One teasing line each stop. Then come, wait, or be held (blanket, tea).",
    hard: "Same rounds. Other hand still. You may still stop the words.",
    extreme: "A longer hold at 7. Keep the list. Then the planned yes or no. Do not add new mean words.",
  },
  "communication:a-name-they-asked-for-used-for-10-minutes": {
    titles: {
      dominant: "A name you chose, used for 10 minutes, then your legal name",
      submissive: "A name you asked for, used for 10 minutes, then yours back",
      switch: "A name for 10 minutes. Then the one on your ID",
    },
    description:
      "Pick a name you already said yes to. Use it for 10 minutes at home — out loud, in Journal, or in a voice note. When the timer rings, go back to your legal name. After: water.",
    easy: "5 minutes. The name, then your legal name. Drink.",
    hard: "10 minutes while you sit or kneel. Then tea and your legal name.",
    extreme: "An evening at home. The name inside. Legal name if anyone else can hear.",
  },
  "communication:you-tell-them-what-you-will-do-then-you-do-it": {
    titles: {
      dominant: "You tell yourself the next step. Then you do only that",
      submissive: "You hear the next step you wrote. Then you do only that",
      switch: "Name the step. Do the step. Name the next",
    },
    description:
      "Before you touch yourself, say the next step in plain words. Then do only that. You can say no to a step. After: say you are done. Your name. Water.",
    easy: "3 steps. Clothes stay on. Then done.",
    hard: "5 steps. Skip is allowed. Then your name.",
    extreme: "A longer map you named while clothed. Still one step at a time. Still no extra surprise.",
  },
  "public:a-remote-toy-on-low-a-short-shop": {
    titles: {
      dominant: "A remote toy on low, a short walk you run",
      submissive: "A remote toy on low, a short walk under a rule you wrote",
      switch: "Wear it. Hold the remote. Keep it low. Come home",
    },
    description:
      "Wear a small vibrator under ordinary clothes. You hold the remote. A walk or a known shop, 40 minutes or less. Lowest setting. If you cannot walk easily, go home. Strangers are not in the scene. After: out, wash, water, sit.",
    easy: "A 10-minute walk around the block on low. Then home. Out. Water.",
    hard: "A short known shop, 20 minutes. Stop means off now. Do not raise it in the aisle.",
    extreme: "40 minutes max. Still low. If your face feels like panic, not heat, go home. Praise the abort.",
  },
  "public:a-look-across-the-table-that-means-i-have-you": {
    titles: {
      dominant: "A look in a window that means I have you",
      submissive: "A look you give yourself in a window, then a text home",
      switch: "One look, in public, that only you know",
    },
    description:
      "Agree one look with yourself. Use it once in a cafe window, a shop glass, or a park. Nobody else should read it. After: a note that says the look landed, or that it felt silly. Silly is allowed.",
    easy: "Practise at home for 1 minute. Then once at a table you already sit at.",
    hard: "Once on a real outing. Then tea as a person.",
    extreme: "Twice this week, same look. Missing it is not a fail.",
  },
  "public:a-secret-item-under-clothes-on-a-short-walk": {
    titles: {
      dominant: "A secret item you chose, on a short walk",
      submissive: "A secret item you chose when calm, on a short walk",
      switch: "One item, under clothes, a known walk, off at home",
    },
    description:
      "One item you already own, under normal clothes, on a short walk you already take. You can take it out in a bathroom. After: home, off, your name. No photos in public.",
    easy: "A bracelet or underwear. 15-minute walk. Off at home.",
    hard: "Underwear you chose. A half-hour known walk. One check-in to Journal. Off at home.",
    extreme: "A plug you have already worn, a short walk, bathroom access the whole time. Out the moment you say so.",
  },
  "public:one-bathroom-stall-one-touch-then-back-to-you": {
    titles: {
      dominant: "One stall. One touch. Then back to the table",
      submissive: "One stall. One touch. Then you go back. You do not come",
      switch: "60 seconds, a lock, then you return",
    },
    description:
      "A lockable stall. Touch your genitals once, 60 seconds max. Do not come. Go back to the table. If the stall feels unsafe, skip it and do the 60 seconds at home. Skipping is the skill. After: home, water, a clear yes or no about coming later.",
    easy: "Practise 60 seconds at home first. Then once in a stall you know, if it still feels good.",
    hard: "Once on a real outing. Back to the table. Home.",
    extreme: "Twice this week, still 60 seconds, still no coming in the stall. A planned yes later.",
  },
  "public:a-text-that-heats-them-up-while-they-are-out": {
    titles: {
      dominant: "A note you send yourself while you are out",
      submissive: "A note you wrote when calm, opened while you are out",
      switch: "One dirty-enough, safe-to-glance note. Then a kind close",
    },
    description:
      "While you are out, open 1 to 3 short notes you wrote at home. Dirty enough to heat you up, clean enough that a stranger glancing would not know. No genital photos. After: a kind closing line so you are not left hanging.",
    easy: "One note. One kind close an hour later.",
    hard: "Three notes across an afternoon. A close before you sleep.",
    extreme: "A whole outing. Still 3 notes max. A planned yes or wait when you get home.",
  },
  "public:a-hand-on-the-small-of-their-back-in-a-queue": {
    titles: {
      dominant: "A hand on your own back in a queue — a private claim",
      submissive: "A private claim in a queue you already stand in",
      switch: "Ordinary. Claimed. Then a squeeze at home",
    },
    description:
      "In a real queue, rest your own hand at the small of your back for 10 seconds, or wear a bracelet there as the stand-in. Ordinary. After: a squeeze of your own hand when you are home. That is the close.",
    easy: "Practise at home, 10 seconds. Then once in a real queue.",
    hard: "Once on an outing you already planned. Then the private squeeze.",
    extreme: "Each time you queue this week. If it feels silly, that is allowed. The close still happens.",
  },
  "scene:you-wash-them-they-stay-still": {
    titles: {
      dominant: "You wash yourself. You stay still. You keep the clock",
      submissive: "A shower. Still. Then a towel and your name",
      switch: "Wash, still, towel, name",
    },
    description:
      "A shower. Wash slowly. Hands on the wall unless you need to be safe. 10 minutes is enough. After: towel, your name, a drink. Do not add sex unless that was the plan. Stop if you are cold.",
    easy: "10 minutes. Back and hair. Towel. Name.",
    hard: "15 minutes. Body you offered. Then a robe and a drink.",
    extreme: "20 minutes. Dry off. Sit. 10 minutes of quiet. Do not rush the next thing.",
  },
  "scene:over-the-knee-spanking-is-the-whole-scene": {
    titles: {
      dominant: "Over a pillow, a count, a landing longer than the spanking",
      submissive: "Over a pillow, a count you wrote, a landing you actually take",
      switch: "Spanking as the scene, not a warm-up",
    },
    description:
      "The spanking is the scene, not a warm-up for sex. Clothes on first. Hand only. Count you wrote while clothed. Landing is longer than the spanking: sit up, water, blanket, your name.",
    easy: "Clothes on. 10, check, 10. Sit up. 10 quiet minutes.",
    hard: "Underwear if you asked while calm. Then 15 minutes of landing.",
    extreme: "Bare if you asked while calm. Marks that show need a yes you wrote first. Landing is 20 minutes.",
  },
  "scene:kissing-they-cannot-start": {
    titles: {
      dominant: "Kissing you start on a timer, then you let yourself start",
      submissive: "Kissing you do not start until the timer says so",
      switch: "A kiss rule, a timer, then free",
    },
    description:
      "For a set time, you do not start a kiss (including a kiss to your own hand or a photo, if that is the stand-in). When the timer ends, you may. After: water, your name.",
    easy: "5 minutes of waiting. Then you may.",
    hard: "10 minutes of waiting. Then 5 minutes free.",
    extreme: "15 minutes. No sex after unless that was the plan.",
  },
  "scene:a-bench-they-sit-close-you-decide-when-they-may-": {
    titles: {
      dominant: "A bench. You sit. You decide when a hand may rest",
      submissive: "A bench. You sit close. You wait for the allowed touch",
      switch: "A public bench, ordinary clothes, one allowed hand",
    },
    description:
      "A public bench. Ordinary clothes. 10 minutes. You decide when a hand may rest on your own leg. No toys. No kissing that would make a stranger uncomfortable. After: walk as a person, then a private squeeze at home. If the bench gets busy, you leave.",
    easy: "5 minutes. Close. No extra touch. Then a private squeeze at home.",
    hard: "10 minutes. One allowed hand when you say so. Then you walk.",
    extreme: "20 minutes. Still ordinary. Busy bench means you leave. Leaving is the scene going well.",
  },
  "scene:want-fear-out-write-it-do-not-run-it": {
    titles: {
      dominant: "Want, fear, out — you do not run it tonight",
      submissive: "Want, fear, out — you do not have to be brave tonight",
      switch: "Three columns. The notebook closing is aftercare",
    },
    description:
      "You do not run CNC (pretend force) or breath play (hands or toys on the throat or airway) tonight. You write it. Wanting is not consent for tonight. Sleep on it. Closing the notebook is aftercare.",
    easy: "Want / fear / out. Tea. Closed. No scene.",
    hard: "A fuller page: aftercare, what never happens, who would know you are planning (not doing). Still no scene.",
    extreme: "Read it in the morning. Calendar only after sleep — or the page scares you. Do not write this on a train.",
  },
  "roleplay:late-to-work-you-are-the-boss": {
    titles: {
      dominant: "Late to work — you play both parts, then you say your name",
      submissive: "Late to work — you hear the boss, then your name",
      switch: "A 3-minute late meeting with yourself, then tea",
    },
    description:
      "A timer is the meeting. Play both parts in a voice note or in Journal. 3 to 8 minutes. When it rings, you are yourself. Silly is allowed. Do not take this to a real workplace.",
    easy: "3 minutes. One late line. One boss line. Then your name.",
    hard: "5 minutes. Then tea as a person.",
    extreme: "8 minutes, a little more heat, still a timer, still your name.",
  },
  "roleplay:you-hired-them-for-two-hours": {
    titles: {
      dominant: "You hired yourself for two hours. The card goes away on time",
      submissive: "Hired for two hours. Jobs on a card. Your name back",
      switch: "A card of jobs — you do them, you inspect them, you sit",
    },
    description:
      "Write 3 jobs: pour water, fold a throw, stand and wait. Do them. Thank or correct once. When the timer ends, the card goes away and you say your name. After: sofa, food.",
    easy: "20 minutes. 1 job. Thank you. Name. Drink.",
    hard: "1 hour. 3 jobs. Then the card away.",
    extreme: "2 hours. Still 3 jobs. Adult voice always works. Card in a drawer on time.",
  },
  "roleplay:homework-check": {
    titles: {
      dominant: "Homework check — you inspect, you end on what passed",
      submissive: "Homework check — you present, you hear what passed",
      switch: "One item, a note, tea",
    },
    description:
      "Bring one thing you did. Look. Say one true good thing. Write it. Tea. End on what passed.",
    easy: "One item. One kind sentence. Tea.",
    hard: "Two items. One question. Then tea as a person.",
    extreme: "The week. Still end on what passed. Do not invent a new standard in the middle.",
  },
  "roleplay:a-pet-coming-home-from-a-walk": {
    titles: {
      dominant: "A pet coming home — you own the clock and you keep the creature",
      submissive: "You come home as a pet. Your name comes back",
      switch: "Cushion, water, a name that returns",
    },
    description:
      "Sit on a cushion. Take off a necklace. Drink water. Pet name only if you asked for it. Then your real name and the sofa. No outdoor leads. No cages.",
    easy: "5 minutes. Cushion. Water. Real name. Snack.",
    hard: "10 minutes. Jewellery on, then off with your name. Three asks.",
    extreme: "20 minutes in the house only. If you laugh from discomfort, the pet is over.",
  },
  "roleplay:inspection-at-the-door": {
    titles: {
      dominant: "Inspection at the door — you look, you name one true thing",
      submissive: "Inspection at the door — you stand, you hear one true thing",
      switch: "Stand. Look. One true thing. Name. Drink",
    },
    description:
      "At home, door closed. Stand. Look in a mirror or at your clothes. Say one true thing you see. 2 minutes. Then your name. Do not inspect genitals at a real door a neighbour can see.",
    easy: "2 minutes in the hallway, door closed. One true thing. Name. Drink.",
    hard: "After a real short outing. Stand. Look. One true thing. Then tea.",
    extreme: "Each homecoming this week if you are alone. Skip if someone else is there.",
  },
  "roleplay:waiter-and-diner-at-your-own-table": {
    titles: {
      dominant: "Waiter and diner at your own table — you sit, you serve, you eat",
      submissive: "Waiter at your own table — you serve, then you eat as yourself",
      switch: "Pour, serve, timer, names, eat",
    },
    description:
      "Serve a simple thing you already have. Stay in role until a timer rings. Then your real name. Silly is allowed. After: eat as yourself.",
    easy: "10 minutes. Water poured. Thank you. Name. Eat.",
    hard: "20 minutes. A small plate. Then names and the rest of the meal as a person.",
    extreme: "A whole simple meal. Names back before dessert. Do not add humiliation unless that is on a written list.",
  },
  "task:a-photo-of-the-bed-made-by-a-time-you-set": {
    titles: {
      dominant: "A photo of the bed you made, by a time you set",
      submissive: "A photo of the bed, logged, by the time you wrote",
      switch: "Make the bed. Show it. One true sentence",
    },
    description:
      "Make the bed. Take a photo of the bed, not of your body, by a time you set. Reply to yourself with one true good sentence. Delete if your stomach flips later.",
    easy: "One photo by 10am. One true sentence.",
    hard: "Three mornings this week.",
    extreme: "Every morning this week. Sunday decide if it lives. Praise the boring.",
  },
  "task:sixty-seconds-of-kneeling-before-dinner": {
    titles: {
      dominant: "Sixty seconds of kneeling you will not skip without a note",
      submissive: "Sixty seconds of kneeling before dinner you already eat",
      switch: "A cushion, a minute, then you eat",
    },
    description:
      "Before dinner, kneel on a cushion for 60 seconds. Timer. Your name. Stand. Eat. Write it in Tasks. If the body makes it impossible, write that. That is also the task.",
    easy: "Practise once. 60 seconds. Log it.",
    hard: "Three meals this week.",
    extreme: "Each dinner this week. Sunday: keep, change, or stop.",
  },
  "task:permission-to-come-written-in-journal": {
    titles: {
      dominant: "Permission to come — you ask, you answer, you write it down",
      submissive: "Permission to come — asking is the task",
      switch: "Want, ask, answer, after — weather, not evidence",
    },
    description:
      "Write when you want to come, the answer you gave yourself while clothed, and how you felt after. Answer the same day. One planned yes so the week is not only waiting. Sunday read it like weather, not like evidence.",
    easy: "One note. If no, add one kind thing you may have instead.",
    hard: "Three days. One planned yes. Ordinary language only.",
    extreme: "The whole week. Sunday read as a person first. If the waiting was lonely, shorten the next week.",
  },
  "task:wear-the-item-you-chose-at-home-until-a-time": {
    titles: {
      dominant: "Wear the item you chose, at home, until the time you named",
      submissive: "Wear the item, at home, until the time you wrote",
      switch: "On, a clock, off with your name",
    },
    description:
      "One item you already own. Wear it at home until a time you name. Take it off with your real name. You may take it off if family walks in.",
    easy: "20 minutes. Off with your name. Water.",
    hard: "The evening at home. Off before sleep.",
    extreme: "A day at home. On in the morning. Off at a time you named.",
  },
  "task:one-check-in-at-a-named-time": {
    titles: {
      dominant: "One check-in at a named time you will actually keep",
      submissive: "One check-in at a named time — here, a colour, one true line",
      switch: "A clock, a line, a reply to yourself",
    },
    description:
      "Pick a time. Write: here, green or yellow, and one true line about the day. Reply to it the same day. A miss you report is not a fail.",
    easy: "One check-in. One true reply.",
    hard: "Three days, same time. Reply each day.",
    extreme: "Each day this week. Sunday decide if the time was kind.",
  },
  "task:twenty-spanks-on-a-calendar-slot": {
    titles: {
      dominant: "Twenty spanks on a calendar slot you will not raise",
      submissive: "Twenty spanks you put on the calendar and may lower",
      switch: "A count written calm, run on a calendar, closed with a hand",
    },
    description:
      "Put a 20-minute window on the calendar. Hand or a paddle you already know. Clothes on first. You may lower the number on the day. You may not raise it. Hand to close. A cancelled homework with honesty still counts.",
    easy: "Clothes on. 20. Hand to close. Stop if the day turned.",
    hard: "Ask about tomorrow's clothes. Two sets of 10 only if you still want it.",
    extreme: "A slightly fuller count, still scheduled, still cancellable. Homework, not ambush.",
  },
  "game:yes-no-ask-10-minutes": {
    titles: {
      dominant: "Yes, No, Ask — you ask the questions and you answer them",
      submissive: "Yes, No, Ask — you hold the small language",
      switch: "A timer, three words, then free speech",
    },
    description:
      "A timer. For 10 minutes you may only say yes, no, or ask, even in a voice note to yourself. Ask means bathroom, water, stop, or a repeat. A full sentence because you need it is a win. After: free speech, your name, water.",
    easy: "5 minutes. Easy questions in Journal. Then free speech and your name.",
    hard: "10 minutes. Thank every ask. Then tea.",
    extreme: "15 minutes. If you freeze, stop the game and hold yourself. Freezing is data.",
  },
  "game:repeat-the-instruction-then-do-it": {
    titles: {
      dominant: "Write the instruction. Say it. Repeat it. Do it",
      submissive: "Hear the instruction you wrote. Repeat it. Do it",
      switch: "Say it, say it back, do it, thank you",
    },
    description:
      "Write one short instruction. Say it. Say it back in your own words. Then do it. Three rounds. No trick instructions. After: thank you, your name, a drink.",
    easy: "3 easy rounds: sit, stand, drink water. Thank you.",
    hard: "5 rounds. One may use your body (kneel, hands on thighs). Then your name.",
    extreme: "8 rounds. If you miss, own the miss as the speaker first. Then one more, or stop.",
  },
  "game:red-yellow-green-a-practice-drill": {
    titles: {
      dominant: "Red, yellow, green — you name fake steps and you obey the colour",
      submissive: "Red, yellow, green — you practise the words",
      switch: "Fake steps. Real colours. Tea",
    },
    description:
      "No scene. Name a fake next step. Say green, yellow, or red. Obey the colour. Do this 5 times. Praise the reds. A red in practice is the whole point. Then tea.",
    easy: "5 fake steps. Praise every colour, especially red. Tea.",
    hard: "10 fake steps, mixed easy and spicy. Still no real scene.",
    extreme: "The drill, then one tiny real green you already planned — or stop on a yellow and call that a complete night.",
  },
  "game:posture-for-30-seconds-then-talk": {
    titles: {
      dominant: "Posture for 30 seconds, then you notice what it did",
      submissive: "Posture for 30 seconds, then one true thing",
      switch: "Stay. Come out. Say what it did in the head",
    },
    description:
      "A posture you already know: kneeling, hands behind, or a straight back in a chair. 30 seconds. Then one true thing about what it did in the head. After: shake the body out. Water.",
    easy: "Once. 30 seconds. One true sentence. Water.",
    hard: "Three times this week. Same posture. Compare the sentences.",
    extreme: "Once a day, three days. If the body cannot kneel, pick a chair. That is skill, not a fail.",
  },
  "game:three-small-wins-on-a-card": {
    titles: {
      dominant: "Three small role wins you will actually tick",
      submissive: "Three small wins on a card you can keep",
      switch: "Tiny, possible, ticked. Sunday you read them out",
    },
    description:
      "Write 3 tiny role wins for the week. Tick them when they happen. At the end of the week, read the ticks out loud and say thank you. Misses stay as weather, not as a trial.",
    easy: "Write 3. Tick 1 this week. Read it out. Thank you.",
    hard: "Tick all 3. Sunday read. Thank you.",
    extreme: "Keep the same 3 next week if they helped, or write 3 new ones. Retiring a win is also a win.",
  },
  "game:who-is-in-charge-for-10-minutes": {
    titles: {
      dominant: "Who is in charge for 10 minutes — you practise both seats",
      submissive: "Who is in charge for 10 minutes — you follow, then you say",
      switch: "A timer, a seat, a spoken swap",
    },
    description:
      "A timer. For 10 minutes, name who is in charge — even if both seats are you. Follow the clock. When it rings, swap or stop. Say the swap out loud. After: your name, a drink, one sentence about which seat was harder.",
    easy: "10 minutes. One seat. Then your name and a drink.",
    hard: "10 minutes each. A spoken swap. Then both sentences.",
    extreme: "20 minutes in one seat, only if you still want it. Ending the game is allowed.",
  },
  "training:kneeling-clock-add-it-to-training": {
    titles: {
      dominant: "Kneeling clock — you set it, you hold it, you log it",
      submissive: "Kneeling clock — you hold it, you log it in Training",
      switch: "A cushion, a timer, a log in Training",
    },
    description:
      "Kneel on a cushion. Timer you can see. When it rings, say your name and stand. Log it in Training. A chair with a straight back is allowed. After: shake the legs out, water.",
    easy: "30 seconds. Name. Stand. Log it.",
    hard: "60 seconds, three days this week. Log each one.",
    extreme: "2 minutes, three days. If you come up early, log the real time. Thank the telling.",
  },
  "training:position-names-present-kneel-stand": {
    titles: {
      dominant: "Position names — you say them, you take them, you log it",
      submissive: "Position names — you take the shape you wrote",
      switch: "Present, kneel, stand — say, take, thank",
    },
    description:
      "Write 3 names: present, kneel, stand. Say the name once. Take the shape. Wait 10 seconds. Next name. Log it in Training. After: your name, a drink, shake out.",
    easy: "One round of the 3 names. Thank you. Log it.",
    hard: "Three rounds. If you miss, say the name again, once, more clearly.",
    extreme: "Five rounds, or a 5-minute drill. End on stand, then tea.",
  },
  "training:hands-still-on-their-thighs": {
    titles: {
      dominant: "Hands still on your thighs — you keep the clock",
      submissive: "Hands still on your thighs — the timer you wrote",
      switch: "Hands on thighs until the timer. Then your name",
    },
    description:
      "No rope. Hands on your thighs until the timer ends. If you need to move, say so and move. Log the real time in Training. After: your name, water.",
    easy: "2 minutes on the sofa. Log it.",
    hard: "5 minutes, three days. Log each hold.",
    extreme: "10 minutes, twice. Ordinary words if you need to move.",
  },
  "training:edge-count-stop-at-8": {
    titles: {
      dominant: "Edge count — you stop at 8, you log the real numbers",
      submissive: "Edge count — you say 8, you stop, you log it",
      switch: "A number, a stop, a log in Training",
    },
    description:
      "Your hand or a toy you already know. 8 on a 1-to-10 scale means stop. Do 3 stops. Log it in Training. After: water, towel, a clear yes or no about coming.",
    easy: "3 stops. Then the planned yes or no. Log it.",
    hard: "5 stops. Other hand still if you can. Log it.",
    extreme: "A longer hold at 7 after the stops, then the planned yes or no. Log the real numbers.",
  },
  "training:fetch-and-present": {
    titles: {
      dominant: "Fetch and present — you name it, you bring it, you thank you",
      submissive: "Fetch and present — you bring it on open hands",
      switch: "Name, fetch, present, thank you, sit",
    },
    description:
      "Name one object. Fetch it. Present it on open hands. Say thank you and your name. Log it in Training. After: sit as a person.",
    easy: "1 fetch. Water. Thank you. Name. Log it.",
    hard: "3 fetches. Then sit.",
    extreme: "5 fetches, still in the house. Adult voice always works. Then sit.",
  },
  "training:honorific-for-one-meal": {
    titles: {
      dominant: "Honorific for one meal — you keep it, then your legal name",
      submissive: "Honorific for one meal — a name you asked for",
      switch: "One meal, one name, then the one on your ID",
    },
    description:
      "For one meal at home, use a name you already said yes to. When the plates are down, legal name. Log it in Training. After: tea as a person.",
    easy: "5 minutes of the name. Then legal name. Log it.",
    hard: "One full meal. Legal name if anyone else can hear.",
    extreme: "Three meals this week. Sunday ask if the name still fits.",
  },
  "reward:they-pick-the-orgasm-add-it-to-rewards": {
    titles: {
      dominant: "You pick the orgasm — add it to Rewards and cash it",
      submissive: "You pick the orgasm — add it to Rewards, then take it",
      switch: "Add it. Cash it. Run the one you named",
    },
    description:
      "Add this to Rewards. When you cash it, pick: your hand, a toy you already like, or being held with no orgasm. Run only that. After: water, towel, your name.",
    easy: "Add it. Cash: 10 unhurried minutes of what you picked.",
    hard: "Add it. Cash: you also pick the room and the music.",
    extreme: "Add it. Cash: a longer night, still with a clock and a stop. Morning tea is part of it.",
  },
  "reward:a-bath-they-do-not-have-to-run": {
    titles: {
      dominant: "A bath you actually run for yourself, logged as a Reward",
      submissive: "A bath you do not have to earn — add it, cash it",
      switch: "Water, towel, robe — add it to Rewards",
    },
    description:
      "Add this to Rewards. When you cash it, run the water, check the heat, put a towel ready. Do not turn it into a scene unless you asked. After: a robe, a drink, your name.",
    easy: "Add it. Cash: 15 minutes. Water and towel. Then your name.",
    hard: "Add it. Cash: wash your hair slowly. Then a robe and a drink.",
    extreme: "Add it. Cash: bath, hair, a quiet sit after. No extra tasks hiding in the aftercare.",
  },
  "reward:a-scene-from-a-list-of-3-they-wrote": {
    titles: {
      dominant: "A scene from a list of 3 — you write, you pick, you run",
      submissive: "A scene from a list of 3 you wrote, then you take it",
      switch: "Three wants. Cash one. Run that one",
    },
    description:
      "Add this to Rewards. Write 3 scenes you actually want, while calm. When you cash it, pick one. Run that one. After: your name, water.",
    easy: "Add it. Cash: 15 minutes of the one you pick.",
    hard: "Add it. Cash: 30 minutes, plus the aftercare you named on the card.",
    extreme: "Add it. Cash: the fuller night, still with a clock. Morning note drafted.",
  },
  "reward:a-free-evening-no-protocol": {
    titles: {
      dominant: "A free evening — you cash the off-switch",
      submissive: "A free evening — no protocol, on purpose",
      switch: "Names off. Kneeling off. A show. Morning you say if you missed it",
    },
    description:
      "Add this to Rewards. When you cash it, names go ordinary, kneeling is off, honorifics are off. Do not sneak a rule back in. After: in the morning, say whether you missed the structure or enjoyed the air.",
    easy: "Add it. Cash: 1 hour as a person.",
    hard: "Add it. Cash: a whole evening. Phones, food, a show.",
    extreme: "Add it. Cash: a full day. A collar, if you wear one, comes off with your real name.",
  },
  "reward:the-toy-they-have-been-asking-for": {
    titles: {
      dominant: "The toy you have been saving — add it, cash it, use it",
      submissive: "The toy you have been asking for — add it and take it",
      switch: "Named toy, named time, wash after",
    },
    description:
      "Add this to Rewards. When you cash it, use the toy you have been wanting, the way you like, for a time you named while calm. After: wash, water, your name.",
    easy: "Add it. Cash: 10 minutes, your pace.",
    hard: "Add it. Cash: 20 minutes. You may slow down.",
    extreme: "Add it. Cash: longer, still the named toy. A second toy only if you ask.",
  },
  "reward:you-serve-them-breakfast": {
    titles: {
      dominant: "Breakfast you actually sit down to — add it as a Reward",
      submissive: "Breakfast you do not have to perform for",
      switch: "A simple plate, a drink, your name, a normal morning",
    },
    description:
      "Add this to Rewards. When you cash it, make a simple breakfast you already eat. Sit. This is not a humiliation meal unless that is on a written list. After: your name. A normal morning.",
    easy: "Add it. Cash: tea or coffee, sitting down. Then your name.",
    hard: "Add it. Cash: a simple plate plus a drink. You sit.",
    extreme: "Add it. Cash: breakfast, then 20 minutes where the small chores wait.",
  },
  "punishment:corner-time-add-it-to-punishments": {
    titles: {
      dominant: "Corner time — add it, run the minutes on the card",
      submissive: "Corner time — you take the minutes you agreed",
      switch: "A wall, a timer, a name, a hand, water",
    },
    description:
      "Add this to Punishments. Stand or sit facing a wall, in the house, for a time you named while calm. You can speak. A red ends it. After: your name, a hand on your back, water. Do not add extra minutes because you are still annoyed.",
    easy: "Add it. Run: 2 minutes. Then name, hand, water.",
    hard: "Add it. Run: 5 minutes. Then name and water.",
    extreme: "Add it. Run: 10 minutes only if you have done 5. No extra task stacked on after.",
  },
  "punishment:written-lines-add-it-to-punishments": {
    titles: {
      dominant: "Written lines — a true miss, not a worth wound",
      submissive: "Written lines — you write the true one",
      switch: "A short line, a set number, drawer or tear",
    },
    description:
      "Add this to Punishments. Write a short true line about a miss, not about your worth. Read them. Thank you. Drawer, or tear them up if you want them gone.",
    easy: "Add it. Run: 5 lines. Thank you. Drawer or tear.",
    hard: "Add it. Run: 10 lines. Then tea as a person.",
    extreme: "Add it. Run: 20 only if 10 still felt like repair. If it shames, stop and hold yourself.",
  },
  "punishment:counted-hand-spanking-add-it-to-punishments": {
    titles: {
      dominant: "Counted hand spanking — the number on the card, not the mood",
      submissive: "Counted hand spanking — you take the card number",
      switch: "Clothes on first. Count. Sit up. Water",
    },
    description:
      "Add this to Punishments with a number you wrote while calm. Clothes on first. Hand only unless the card names a paddle you already know. You may lower the number on the day. After: sit up, water, a hand, your name.",
    easy: "Add it. Run: 10, clothes on. Sit up. Water.",
    hard: "Add it. Run: the card number, underwear if you asked. Hand to close.",
    extreme: "Add it. Run: still the card number. Bare only if the card says so. Landing is longer than the spanking.",
  },
  "punishment:no-toy-tonight-add-it-to-punishments": {
    titles: {
      dominant: "No toy tonight — the drawer rule you wrote",
      submissive: "No toy tonight — hands and holding still allowed",
      switch: "Toys away. A kind close. A planned yes still exists",
    },
    description:
      "Add this to Punishments. Toys stay in the drawer. Hands, kissing, and being held are still allowed unless the card says otherwise. After: a kind close. Put one planned yes on the calendar.",
    easy: "Add it. Run: one evening. Kind close.",
    hard: "Add it. Run: two evenings, not stacked on a bad day. A planned yes still on the week.",
    extreme: "Add it. Run: 24 hours. If the wait turns lonely, shorten it.",
  },
  "punishment:extra-kneel-before-the-next-meal": {
    titles: {
      dominant: "Extra kneel before the next meal — once, then you eat",
      submissive: "Extra kneel — you hold it, then you eat",
      switch: "One extra. Timer. Name. Stand. Ordinary meal",
    },
    description:
      "Add this to Punishments. One extra kneel, on a cushion, before the next meal. Timer. Your name. Stand. Eat. Do not stack a second extra.",
    easy: "Add it. Run: 30 seconds. Name. Stand. Eat.",
    hard: "Add it. Run: 60 seconds. Then the meal as a person.",
    extreme: "Add it. Run: 2 minutes only if 60 still felt like repair. No speech about the miss at the table.",
  },
  "punishment:a-24-hour-pause-on-one-named-privilege": {
    titles: {
      dominant: "A 24-hour pause on one privilege you named",
      submissive: "A 24-hour pause — one thing, everything else stays",
      switch: "One named thing off. It comes back out loud",
    },
    description:
      "Add this to Punishments. Name one small privilege while calm. Pause that one thing for 24 hours. Everything else stays. After: it comes back out loud, with your name.",
    easy: "Add it. Run: 24 hours off one small thing. Then it comes back.",
    hard: "Add it. Run: the same, plus a halfway check: still fair?",
    extreme: "Add it. Run: 48 hours only if the card says 48. If it feels like exile, end it early and say so.",
  },
  "kink:wrists-wrapped-a-bow-they-can-undo": {
    titles: {
      dominant: "Wrists wrapped, a bow you can undo",
      submissive: "Wrists wrapped. You stay because you chose to",
      switch: "A scarf, a bow, a timer, wrists rubbed",
    },
    description:
      "A scarf or soft rope. Wrists in front. A bow you can undo. Timer. Scissors in reach. After: undo, rub wrists, water, a sentence that you could have left.",
    easy: "5 minutes. Then off. Rub wrists.",
    hard: "15 minutes. Check halfway that fingers are warm and pink.",
    extreme: "30 minutes. Same bow. No gag and no ankles at the same time tonight.",
  },
  "kink:a-counted-spanking-clothes-on-first": {
    titles: {
      dominant: "A counted spanking, clothes on first, a landing after",
      submissive: "A counted spanking you take, clothes on first",
      switch: "A number written calm. Count. Sit up. Water",
    },
    description:
      "Clothes on first. Hand, or a paddle you already know. Number written while calm. You may lower it. After: sit up, water, a hand on your back, look at the skin.",
    easy: "Clothes on. 10, check, 10. Sit up. Water.",
    hard: "Underwear if you asked while calm. Same number. Hand to close.",
    extreme: "Bare if you asked. Marks that show need a yes you wrote first. Landing is 15 minutes.",
  },
  "kink:one-house-rule-on-a-card": {
    titles: {
      dominant: "One house rule you write and actually keep",
      submissive: "One house rule you can keep without a witness",
      switch: "One rule. A card. Down at the end",
    },
    description:
      "One rule. Written. Small enough for a real life. Run it, then take the card down. Ask if it lives.",
    easy: "Write the rule. 1 hour. Release on time. Tea.",
    hard: "One evening. Catch once, kindly, or not at all.",
    extreme: "Keep it a week if you liked it. Ending a rule is also protocol.",
  },
  "kink:they-serve-one-small-thing-then-they-sit": {
    titles: {
      dominant: "Serve one small thing, then sit as a person",
      submissive: "Serve one small thing, then you sit",
      switch: "One job. Thank you. Sit. Drink",
    },
    description:
      "One act: pour water, fold a throw, bring a towel. Do it. Thank you. Sit as a person. After: drink.",
    easy: "One job. Thank you. Sit. Drink.",
    hard: "Three small jobs on a card. Then the card away and you sit.",
    extreme: "A 30-minute window of jobs you already need. Then you sit. Do not add more.",
  },
  "kink:a-cushion-a-bowl-of-water-a-name-that-comes-back": {
    titles: {
      dominant: "A cushion, water, a name that returns",
      submissive: "You sit on a cushion. Your name comes back",
      switch: "Pet for 10 minutes. Then the sofa and your name",
    },
    description:
      "Sit on a cushion. Drink water. Pet name only if you asked. Then your real name and the sofa. No outdoor leads. No cages.",
    easy: "5 minutes. Cushion. Water. Real name. Snack.",
    hard: "10 minutes. Jewellery on, then off with your name.",
    extreme: "20 minutes in the house only. If you laugh from discomfort, the pet is over.",
  },
  "kink:three-true-praises-spoken": {
    titles: {
      dominant: "Three true praises you write and then take",
      submissive: "Three true praises you have to take",
      switch: "Three true lines. Stop if they turn to shame",
    },
    description:
      "Say or write 3 true sentences about how you were today. Be specific. Stop if it turns to shame. The words can stay.",
    easy: "3 lines, one night. Stop means stop.",
    hard: "3 nights this week. No extra tasks attached.",
    extreme: "Every night this week. Sunday keep the lines that landed.",
  },
  "kink:playful-mean-words-from-a-page-then-kindness": {
    titles: {
      dominant: "Playful mean words from a page, then kindness",
      submissive: "Playful mean words you wrote calm, then repair",
      switch: "A list, once, then the opposite sentences",
    },
    description:
      "While clothed, write 5 lines. Read once. Stop. Write the opposite kind sentences. Morning note already drafted.",
    easy: "The 5 lines once. Then the 5 kind opposites.",
    hard: "One line, repeated, then its opposite.",
    extreme: "The full list, still once, still with repair the same night.",
  },
  "kink:they-ask-before-they-come": {
    titles: {
      dominant: "Ask before you come — you ask, you answer, you write it",
      submissive: "Ask before you come — asking is the kink",
      switch: "Want, ask, answer, after — weather, not evidence",
    },
    description:
      "Ask before you come. Answer the same day. If no, you still owe yourself warmth. One planned yes so the week is not only waiting.",
    easy: "One evening. Ask once. If no, a mug and a show you know.",
    hard: "Three days. One planned yes.",
    extreme: "The whole week. Sunday decide if it lives.",
  },
  "kink:they-show-you-in-the-house-on-purpose": {
    titles: {
      dominant: "You show, in the house, on purpose",
      submissive: "You show, in the house, and you say if there is touch",
      switch: "A look you asked for. Clothes after. A drink",
    },
    description:
      "Take off as much as you want. Look — a mirror counts. Touch only if you say so. 10 minutes. No photos unless that is a second yes. After: clothes, your name, a drink.",
    easy: "Clothes half off. Look for 2 minutes. Then your name.",
    hard: "You pick what comes off. Touch only if you say. Then clothes and a drink.",
    extreme: "A longer look. A mirror if you want. Still no photos unless you asked.",
  },
  "kink:ten-minutes-in-a-role-you-already-named": {
    titles: {
      dominant: "Ten minutes in a role you already named, then your name",
      submissive: "Ten minutes in a role, then your legal name",
      switch: "A timer. A role. Then tea",
    },
    description:
      "Pick a role you have already talked about. A timer. When it rings, legal name. Silly is allowed. After: water, a sentence about whether the role still fits.",
    easy: "5 minutes. One line. Timer. Name.",
    hard: "10 minutes. Then names and tea.",
    extreme: "20 minutes, still a timer, still your name back.",
  },
  "kink:a-short-chase-in-the-house": {
    titles: {
      dominant: "A short chase in the house — you count, you catch, you hold",
      submissive: "A short chase — you run, you get caught, you get held",
      switch: "Countdown, catch, hold, breath, your name",
    },
    description:
      "At home. Count down from 5. Run to another room. Catch with arms, not with pain, unless impact is also on your list. Then hold, breath, your name. No stairs. No glass. No outdoor chase.",
    easy: "One countdown. One catch. Hold. Name. Water.",
    hard: "Three short chases. Then a long hold.",
    extreme: "A 10-minute hunt, still in the house. If you are actually scared, it is over.",
  },
  "kink:warm-hands-then-a-cool-spoon": {
    titles: {
      dominant: "Warm hands, then a cool spoon, at a pace you run",
      submissive: "Warm hands, then a cool spoon you give yourself",
      switch: "Warm, cool, ask, towel, a warm drink",
    },
    description:
      "Warm oil or warm hands, then a metal spoon run under cold water, on skin you offered. Stop at enough. After: towel, blanket, a warm drink.",
    easy: "Clothes on. Shoulders. 5 minutes.",
    hard: "One area at a time. End with a towel.",
    extreme: "A longer map you named. You do not have to have sex after.",
  },
  "kink:a-blindfold-they-can-take-off": {
    titles: {
      dominant: "A blindfold you can take off, a voice you keep",
      submissive: "A blindfold you can take off",
      switch: "Mask on, timer, voice, light, your name",
    },
    description:
      "A sleep mask or a scarf you can pull down. Keep talking, or keep a podcast on so the quiet is not too big. After: light, your name, water, sit. Do not add a gag the first time.",
    easy: "2 minutes. You can pull it down. Then name and water.",
    hard: "5 minutes. Keep a voice in the room. Then light, name, sit.",
    extreme: "10 minutes only if you have done 5. Still able to take it off.",
  },
  "kink:one-poke-then-they-take-the-answer": {
    titles: {
      dominant: "One poke, one answer, then the evening continues",
      submissive: "One poke, then you take the answer",
      switch: "Sass on purpose. One answer. A drink",
    },
    description:
      "One poke: a sass, a delay, a grin — even in a journal line. One clear answer. Then the poke is over. After: your name, a drink, a laugh if there is one.",
    easy: "One poke. One answer. Drink.",
    hard: "Three pokes this week, not stacked in one hour.",
    extreme: "A named brat window of 10 minutes, then you drop it on the timer.",
  },
  "kink:a-hickey-they-asked-for-where-they-said": {
    titles: {
      dominant: "A hickey you asked for, where you said",
      submissive: "A hickey you asked for, where you said it could live",
      switch: "One mark. Look. Ordinary evening or ice",
    },
    description:
      "A suck-mark on a place you named. Agree if it may show tomorrow. Do not break the skin. After: look, ice or nothing.",
    easy: "One small mark. Sit and look. Ordinary evening.",
    hard: "A place you can cover. Ask about tomorrow before you start.",
    extreme: "A place you want to see in the mirror. Still one mark.",
  },
  "kink:a-furniture-minute-they-hold-still-then-they-are": {
    titles: {
      dominant: "A furniture minute — you hold still, then you are a person",
      submissive: "A furniture minute — then your name first",
      switch: "A clock, still, your name, water",
    },
    description:
      "Kneel or sit as a table or a footrest for a time you named — no weight that hurts. When the timer rings, say your name first, then thank you. After: sit as a person, water.",
    easy: "1 minute. Then your name, thank you, sit.",
    hard: "5 minutes. Then name and water.",
    extreme: "10 minutes only if 5 still felt like play. If you go quiet in a way that is not heat, end it.",
  },
  "kink:want-fear-out-write-the-edge-do-not-run-it": {
    titles: {
      dominant: "Want, fear, out — you do not run it tonight",
      submissive: "Want, fear, out — you do not have to be brave tonight",
      switch: "Three columns. The notebook closing is aftercare",
    },
    description:
      "You do not run CNC or breath play tonight. You write it. Wanting is not consent for tonight. Sleep on it. Closing the notebook is aftercare.",
    easy: "Want / fear / out. Tea. Closed. No scene.",
    hard: "A fuller page. Still no scene. Still sleep.",
    extreme: "Morning read. Calendar only after sleep — or the page scares you.",
  },
};

function fallback(prompt: WeekPrompt): SoloSpec {
  const kind = prompt.kind as WeekKind;
  const baseTitle = prompt.dominant.title.replace(/\s+they\b/gi, " you").replace(/\s+them\b/gi, " yourself");
  return {
    titles: { dominant: baseTitle, submissive: baseTitle, switch: baseTitle },
    description: `You do this week's ${kind} alone. Write the rule while calm. Keep a timer. Keep a stop. Aftercare is food, water, and three sentences in Journal.`,
    easy: prompt.dominant.easy,
    hard: prompt.dominant.hard,
    extreme: prompt.dominant.extreme,
  };
}

export function soloBody(prompt: WeekPrompt, role: Role): WeekPromptBody {
  const spec = SOLO[prompt.id] ?? fallback(prompt);
  return {
    title: spec.titles[role],
    description: `${seat(role)} ${spec.description}`,
    easy: spec.easy,
    hard: spec.hard,
    extreme: spec.extreme,
  };
}
