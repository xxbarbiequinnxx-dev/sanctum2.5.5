#!/usr/bin/env python3
"""Generate src/lib/bdsm-quiz-bank.ts — 300 BDSM discovery questions."""

from __future__ import annotations

from collections import Counter
from pathlib import Path

OUT = Path("/workspace/src/lib/bdsm-quiz-bank.ts")

ITEMS: list[dict] = []


def W(spec: str) -> dict[str, int]:
    weights: dict[str, int] = {}
    for part in spec.split(","):
        key, val = part.strip().split(":")
        weights[key] = int(val)
    return weights


def add(section: str, role: str, prompt: str, options: list[tuple[str, str]]) -> None:
    if len(options) != 6:
        raise SystemExit(f"{len(options)} options for: {prompt}")
    ITEMS.append(
        {
            "section": section,
            "role": role,
            "prompt": prompt,
            "options": [{"label": label, "weights": W(spec)} for label, spec in options],
        }
    )


def ts_str(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def ts_weights(weights: dict[str, int]) -> str:
    inner = ", ".join(f"{ts_str(k) if not k.isidentifier() and '-' in k or True else k}: {v}" for k, v in weights.items())
    # always quote keys that aren't valid identifiers
    parts = []
    for k, v in weights.items():
        key = k if k.isidentifier() else ts_str(k)
        parts.append(f"{key}: {v}")
    return "{ " + ", ".join(parts) + " }"


# ---------------------------------------------------------------------------
# Role — 20 (7 D / 7 s / 6 switch)
# ---------------------------------------------------------------------------

add("role", "dominant", "When you hold the dynamic, what do you most want to be doing?", [
    ("Directing — deciding the next beat, watching them take it.", "dominant:3,trainer:1,owner:1"),
    ("Using their body. Heat, impact, restraint — I run the instrument.", "dominant:2,sadist:2,impact:1"),
    ("Care-and-control. Structure, food, bedtime-for-adults, a held day.", "dominant:2,caregiver:3,daddy:1"),
    ("Protocol. Positions, titles, a room that behaves.", "dominant:2,owner:1,trainer:1"),
    ("The hunt. Chase, catch, pin.", "dominant:2,primal:3"),
    ("I want to hold it, but I also want nights off the throne.", "dominant:1,switch:2"),
])
add("role", "dominant", "A rule gets broken on purpose, with a smirk. Your first move as the one in charge is…", [
    ("Catch them. The frame is the fun.", "dominant:2,brat-tamer:3,trainer:1"),
    ("A clean consequence that was already written. No theatre.", "dominant:2,owner:2,trainer:2"),
    ("I would rather there was no smirk — just a yes, a no, or a renegotiation.", "dominant:1,owner:2"),
    ("Laugh, pin them, and make the smirk expensive.", "dominant:2,brat-tamer:2,primal:1,sadist:1"),
    ("Ignore the bait until they ask properly. Bratting does not get the wheel.", "dominant:2,trainer:2,sir:1"),
    ("I might be the smirk on another night. I like both seats of that game.", "dominant:1,switch:2,brat-tamer:1"),
])
add("role", "dominant", "You want them to feel your control most through…", [
    ("Voice. A few words, meant.", "dominant:3,sir:1,trainer:1"),
    ("Hands, rope, a body that cannot leave until I say.", "dominant:2,rigger:2,bondage:1"),
    ("Rules that still apply when I am in the other room.", "dominant:2,owner:3"),
    ("Care they did not have to ask for, and cannot wriggle out of.", "dominant:2,caregiver:3,daddy:1"),
    ("Pain or intensity I pace on purpose.", "dominant:2,sadist:3,impact:1"),
    ("The collar, the name, the fact of being mine.", "dominant:2,owner:2,collaring:1"),
])
add("role", "dominant", "At the start of a scene you run, you typically…", [
    ("Tell them the shape. They drop into it.", "dominant:3,trainer:1"),
    ("Put them in position and start with the body, not a speech.", "dominant:2,primal:2,rigger:1"),
    ("Check the list, the word, the head — then I take.", "dominant:2,caregiver:1,trainer:1"),
    ("Let them offer, then I choose what we actually do.", "dominant:2,owner:1,service:1"),
    ("Warm them until they are liquid, then I decide the peak.", "dominant:2,sadist:1,sensory:1"),
    ("Sometimes I want them to start me. Not every night am I the engine.", "dominant:1,switch:2"),
])
add("role", "dominant", "When they ask you to decide something you had not planned, you…", [
    ("Decide. That is the job. I can say 'not now' if I mean it.", "dominant:3,owner:1"),
    ("I like being asked. Use me as the place choices go.", "dominant:2,daddy:1,caregiver:1"),
    ("I want a short menu from them, then I pick.", "dominant:2,trainer:1,service:1"),
    ("I will decide the frame and leave them a real choice inside it.", "dominant:2,owner:1"),
    ("If I am tired I will say so. Holding the dynamic is not a trance.", "dominant:2,caregiver:1"),
    ("Sometimes I want them to take that one. Switching the load is part of us.", "dominant:1,switch:2"),
])
add("role", "dominant", "Responsibility for what you opened — including aftercare — is…", [
    ("Mine. I close what I open.", "dominant:3,caregiver:2"),
    ("Mine to run, theirs to tell me the truth about what they need.", "dominant:2,caregiver:2,trainer:1"),
    ("Shared landing. I still check. I do not dump them in the hallway.", "dominant:2,caregiver:1,switch:1"),
    ("A ritual I like: water, blanket, the debrief, then quiet.", "dominant:2,caregiver:2,daddy:1"),
    ("I want them to serve the landing too — tea, kit away — under my eye.", "dominant:2,owner:1,service:2"),
    ("I can be held after I have held. Both nervous systems.", "dominant:1,switch:2,caregiver:1"),
])
add("role", "dominant", "The Dominant you actually want to be, on an ordinary Tuesday, is closer to…", [
    ("Owner / Master. Claim, standards, a life that belongs to me too.", "dominant:2,owner:3,master:2"),
    ("Sir or trainer. Drills, manners, getting better at a thing.", "dominant:2,sir:2,trainer:3"),
    ("Caregiver / Daddy. Structure with warmth, not only steel.", "dominant:2,caregiver:3,daddy:3"),
    ("Brat tamer. The game is the point.", "dominant:2,brat-tamer:3"),
    ("Sadist, rigger, or hunter. The scene is the cathedral, not the calendar.", "dominant:2,sadist:2,rigger:1,primal:2"),
    ("Someone who can put the title down and still be wanted.", "dominant:1,switch:2"),
])

add("role", "submissive", "When you offer the dynamic, what do you most want to be doing?", [
    ("Receiving — following, floating, being taken somewhere.", "submissive:3,praise:1"),
    ("Serving. Usefulness is the heat.", "submissive:2,service:3,slave:1"),
    ("Being used. My body as the point, not a meeting about feelings.", "submissive:2,objectification:2,masochist:1"),
    ("Being kept. Rules, a name, a place I belong.", "submissive:2,ownership:2,slave:1,pet:1"),
    ("Wrestling it until I lose on purpose — or almost.", "submissive:2,brat:3"),
    ("I want to offer it, and I also want nights where I take the wheel.", "submissive:1,switch:2"),
])
add("role", "submissive", "You broke a rule with a smirk. What did you actually want?", [
    ("To be caught. The frame is the fun.", "submissive:2,brat:3"),
    ("A real consequence. I poked because I wanted the line to hold.", "submissive:2,slave:1,brat:1"),
    ("Attention. I will take a lecture if it means they saw me.", "submissive:2,praise:1,brat:2"),
    ("To see if they meant it. Testing is how I trust.", "submissive:2,brat:2"),
    ("I would rather not smirk. I want to keep the rule and be proud.", "submissive:2,slave:2,service:1"),
    ("Sometimes I want to be the one who catches a smirk.", "submissive:1,switch:2,brat-tamer:1"),
])
add("role", "submissive", "You feel held most when they use…", [
    ("Voice. A few words, meant, and I drop.", "submissive:3,praise:1"),
    ("Hands, rope, a body that cannot leave until they say.", "submissive:2,bondage:2,prey:1"),
    ("Rules that still apply when they are in the other room.", "submissive:2,ownership:2,slave:1,protocol:1"),
    ("Care I did not have to earn.", "submissive:2,little:2,praise:1"),
    ("Pain or intensity they pace on purpose.", "submissive:2,masochist:3,impact:1"),
    ("The collar, the name, the fact of being theirs.", "submissive:2,ownership:2,collaring:2,pet:1"),
])
add("role", "submissive", "At the start of a scene they run, you typically want…", [
    ("To be told the shape, then to drop.", "submissive:3"),
    ("To be put in position. Body first, speech later.", "submissive:2,prey:1,objectification:1"),
    ("The check — the word, the head — then to be taken.", "submissive:2,little:1"),
    ("To offer a menu and have them choose, so I still served.", "submissive:2,service:2"),
    ("A long warm-up until I am liquid, then the peak I do not pick.", "submissive:2,sensory:1,masochist:1"),
    ("Sometimes I want to start them. Not every night am I the offering.", "submissive:1,switch:2"),
])
add("role", "submissive", "When they ask you to choose, you…", [
    ("Want a smaller choice, or for them to take it back.", "submissive:3"),
    ("Can choose if the frame is still theirs. A menu, not a blank page.", "submissive:2,service:1"),
    ("Feel tested. I will try, and I want to be told I did well.", "submissive:2,praise:2,princess:1"),
    ("Want to answer honestly even if the answer is 'I don't want to pick'.", "submissive:2"),
    ("Will pick if it is service — their comfort, their night.", "submissive:2,service:3"),
    ("Sometimes I want that choice because tonight I am not on my knees.", "submissive:1,switch:2"),
])
add("role", "submissive", "Aftercare you need after offering yourself is…", [
    ("To be given it, without earning it. Water, words, skin.", "submissive:3,praise:1"),
    ("Quiet first. Then a check-in. Do not make me perform the landing.", "submissive:2"),
    ("Specific praise. What they saw. What they liked.", "submissive:2,praise:3,princess:1"),
    ("To serve the landing — tea, kit — because usefulness still soothes me.", "submissive:2,service:2"),
    ("To stay in the role a little longer. Do not yank me into roommate voice.", "submissive:2,ownership:1,pet:1"),
    ("I also need to land them sometimes. Both nervous systems.", "submissive:1,switch:2,caregiver:1"),
])
add("role", "submissive", "The submissive you actually want to be, on an ordinary Tuesday, is closer to…", [
    ("Slave / owned. Standards, a life that belongs to them too.", "submissive:2,slave:3,ownership:2"),
    ("Service. Useful, proud, not necessarily kneeling all day.", "submissive:2,service:3"),
    ("Brat. The game is the point, and I want a tamer who likes it.", "submissive:2,brat:3"),
    ("Pet, pup, or kitten. Simple rules, gear, being kept.", "submissive:2,pet:2,pup:2,kitten:2,pet-play:1"),
    ("Masochist, prey, or princess — a costume of heat, not a job title.", "submissive:2,masochist:2,prey:2,princess:2"),
    ("Someone who can stand up and still be wanted.", "submissive:1,switch:2"),
])

add("role", "switch", "You flip seats because…", [
    ("The hunger moves. Neither chair is home forever.", "switch:3"),
    ("I want to know both sides of the same act.", "switch:3,primal:1"),
    ("One of us is tired of holding, and the other can.", "switch:2,caregiver:1"),
    ("Conflict-of-horny. Wrestling until someone wins tonight.", "switch:3,brat:1,brat-tamer:1"),
    ("Context: I top this kink, I bottom that one.", "switch:3"),
    ("I mostly live in one seat. Switching is a holiday, not the country.", "switch:1,dominant:1,submissive:1"),
])
add("role", "switch", "When a scene is going well, you most want to be…", [
    ("Either directing or receiving, depending who started.", "switch:3"),
    ("Wrestling for it until someone wins.", "switch:2,primal:2,brat:1,brat-tamer:1"),
    ("Trading: I run this beat, they run the next.", "switch:3"),
    ("In the seat I do not usually live in. The rare one is the heat.", "switch:2"),
    ("Both of us used. No one only watching.", "switch:2,primal:1"),
    ("Honestly I still have a home seat. Switching is spice.", "switch:1,dominant:1,submissive:1"),
])
add("role", "switch", "Switching mid-scene is…", [
    ("Hot if we already said it was allowed.", "switch:3"),
    ("A mess. Pick a seat for the night.", "switch:1,protocol:1"),
    ("Fine at a negotiated checkpoint — water, word, then flip.", "switch:2,caregiver:1"),
    ("The whole point. I want the floor to move.", "switch:3,primal:1"),
    ("Better as topping-from-below or bottoming-from-above, not a full swap.", "switch:2,brat:1"),
    ("Something I want in fantasy more than I actually enjoy.", "switch:1"),
])
add("role", "switch", "The harder seat for you is usually…", [
    ("Holding. Responsibility is heavier than surrender.", "switch:2,dominant:1"),
    ("Offering. Trust is heavier than control.", "switch:2,submissive:1"),
    ("They are hard in different ways. I need recovery from both.", "switch:3"),
    ("The one I want more and practise less.", "switch:2"),
    ("Neither is hard if the other person is competent.", "switch:2"),
    ("Staying in one seat when I want the other.", "switch:3"),
])
add("role", "switch", "You want a partner who…", [
    ("Can take either seat without a fight about identity.", "switch:3"),
    ("Has a home seat, and lets me visit the other.", "switch:2"),
    ("Will wrestle me for it and mean the win.", "switch:2,primal:1,brat-tamer:1,brat:1"),
    ("Lets me top specific kinks and bottom others, as a map, not a mood.", "switch:3"),
    ("Switches on a calendar: this week I hold, next week they do.", "switch:2,protocol:1"),
    ("Mostly wants me in one chair, and switching is rare on purpose.", "switch:1"),
])
add("role", "switch", "Over the next year of play you hope you are…", [
    ("Able to take either seat without a fight about identity.", "switch:3"),
    ("Still playing — brat and tamer, hunter and prey — not only solemn.", "switch:2,brat:1,brat-tamer:1,primal:1"),
    ("Known for both. Not 'secretly a top' or 'actually a bottom'.", "switch:3"),
    ("Mostly one seat, with a negotiated window for the other.", "switch:2"),
    ("Teaching and being taught. Coach and student, traded.", "switch:2,trainer:1"),
    ("Less confused. I want the year to tell me my home.", "switch:1"),
])

print("role", sum(1 for i in ITEMS if i["section"] == "role"))

# ---------------------------------------------------------------------------
# Archetype — 60 (20 D / 20 s / 20 switch)
# ---------------------------------------------------------------------------

add("archetype", "dominant", "If you had to wear one Dominant costume for a year, it would be…", [
    ("Owner / Master. Claim, standards, they are mine.", "owner:3,master:3,ownership:1,dominant:1"),
    ("Sir. Manners, drills, a clean yes.", "sir:3,trainer:2,dominant:1"),
    ("Daddy / caregiver. Structure with warmth.", "daddy:3,caregiver:3,dominant:1"),
    ("Brat tamer. I want the smirk and the catch.", "brat-tamer:3,dominant:1"),
    ("Handler. Pets, pups, kits — gear and simple rules.", "handler:3,pet-play:1,dominant:1"),
    ("Sadist, rigger, or hunter. The scene is the point.", "sadist:2,rigger:2,primal:2,dominant:1"),
])
add("archetype", "submissive", "If you had to wear one submissive costume for a year, it would be…", [
    ("Slave / owned. Standards, belonging, a life that answers to them.", "slave:3,ownership:1,submissive:1"),
    ("Service. Useful, proud, not always kneeling.", "service:3,submissive:1"),
    ("Brat. I want a tamer, not a roommate.", "brat:3,submissive:1"),
    ("Pet, pup, or kitten. Gear, simple rules, being kept.", "pet:2,pup:2,kitten:2,pet-play:2,submissive:1"),
    ("Little — adult softness, structure, being cared for. Not a costume of age.", "little:3,submissive:1"),
    ("Masochist, prey, or princess. Heat with a shape.", "masochist:2,prey:2,princess:2,submissive:1"),
])
add("archetype", "switch", "If you had to borrow costumes for a year, you would…", [
    ("Wear both. Owner some nights, owned on others.", "switch:2,owner:2,slave:2"),
    ("Tamer and brat, depending who starts the smirk.", "switch:2,brat-tamer:2,brat:2"),
    ("Handler and pet. I want both ends of the lead.", "switch:2,handler:2,pet:2,pup:1"),
    ("Caregiver and the one being structured.", "switch:2,caregiver:2,little:2,daddy:1"),
    ("Hunter and prey. Chase both ways.", "switch:2,primal:2,prey:2"),
    ("Sadist and masochist. I want both sides of the implement.", "switch:2,sadist:2,masochist:2"),
])

add("archetype", "dominant", "What do you actually want to be called when it matters?", [
    ("Sir. Clean, earned, not a joke.", "sir:3,dominant:1"),
    ("Master / Owner. Heavier. I mean it.", "master:3,owner:3,dominant:1"),
    ("Daddy. Warm and in charge.", "daddy:3,caregiver:1,dominant:1"),
    ("My name, said properly, is enough. Titles are optional.", "dominant:2,trainer:1"),
    ("Handler, or whatever matches the gear tonight.", "handler:3,pet-play:1"),
    ("I like a title, and I also like being called theirs on other nights.", "dominant:1,switch:2"),
])
add("archetype", "submissive", "What do you actually want to be called when it matters?", [
    ("By a name they gave me. It lands in my spine.", "slave:2,ownership:2,submissive:1"),
    ("Good — specifically. Praise with evidence.", "praise:3,princess:1,submissive:1"),
    ("Brat, when I have earned the word.", "brat:3,submissive:1"),
    ("Pet, pup, kit — the animal name that is ours.", "pet:2,pup:2,kitten:2,pet-play:2"),
    ("Little, baby, or another softness we wrote down as adults.", "little:3,submissive:1"),
    ("I like being named, and I also like naming them.", "submissive:1,switch:2"),
])
add("archetype", "switch", "Titles, for you, are…", [
    ("Toys we can swap. Sir tonight, theirs tomorrow.", "switch:3"),
    ("I want one title that stays, and one we play with.", "switch:2,ownership:1"),
    ("Better when they match the seat of the night.", "switch:2,protocol:1"),
    ("I like giving a title more than wearing one.", "switch:1,dominant:2,sir:1"),
    ("I like wearing a title more than giving one.", "switch:1,submissive:2"),
    ("Optional. Competence matters more than the word.", "switch:1,trainer:1"),
])

add("archetype", "dominant", "How power sits in your body when you are in charge…", [
    ("Stillness. They move; I don't have to.", "dominant:2,owner:2,sir:1"),
    ("Hands-on. I am in the rope, the strike, the catch.", "dominant:2,rigger:2,sadist:1,primal:1"),
    ("Voice-first. I can run a room from a chair.", "dominant:2,sir:2,trainer:1"),
    ("Warmth. I pull them in and keep them there.", "dominant:2,caregiver:2,daddy:2"),
    ("Play. I grin when they test me.", "dominant:2,brat-tamer:3"),
    ("It moves. Some nights I want to be the one who goes still for someone else.", "dominant:1,switch:2"),
])
add("archetype", "submissive", "How surrender sits in your body when you offer it…", [
    ("Stillness. I wait. I do not fill the silence.", "submissive:2,slave:2"),
    ("Restlessness until they pin it. I need the catch.", "submissive:2,brat:2,prey:1"),
    ("Usefulness. My hands want a job.", "submissive:2,service:3"),
    ("Softness. I want to be smaller in the room without becoming a child.", "submissive:2,little:2,princess:1"),
    ("Animal. Floor, lead, mouth.", "submissive:2,pet:2,pup:2,prey:2,primal:1"),
    ("It moves. Some nights I want to be the stillness other people wait on.", "submissive:1,switch:2"),
])
add("archetype", "switch", "In your body, power and surrender are…", [
    ("Two muscles. I want both trained.", "switch:3"),
    ("A see-saw. If I hold too long I ache to drop, and the reverse.", "switch:3"),
    ("Tied to specific acts, not a personality.", "switch:2"),
    ("I feel more like a Dominant who can kneel.", "switch:2,dominant:1"),
    ("I feel more like a submissive who can take the wheel.", "switch:2,submissive:1"),
    ("I do not know yet. The year should teach me.", "switch:1"),
])

add("archetype", "dominant", "Care versus steel — your honest mix is…", [
    ("Steel with a landing. I am not cruel; I am exact.", "dominant:2,owner:2,sir:1"),
    ("Warm structure. The care is the control.", "dominant:2,caregiver:3,daddy:3"),
    ("I can do care, but the heat is impact, rope, or hunt.", "dominant:2,sadist:2,rigger:1,primal:2"),
    ("I like them bratty. Steel that grins.", "dominant:2,brat-tamer:3"),
    ("Handler energy: simple rules, water, gear, pride.", "dominant:2,handler:3,caregiver:1"),
    ("I want to be cared for sometimes too. Not only the provider.", "dominant:1,switch:2,caregiver:1"),
])
add("archetype", "submissive", "Care versus steel — what you actually want to receive is…", [
    ("Exactness. Tell me the standard. Let me meet it.", "submissive:2,slave:2,service:1"),
    ("Warm structure. Hold me and mean the rules.", "submissive:2,little:3,princess:1"),
    ("The sharp stuff. Care is the landing, not the scene.", "submissive:2,masochist:2,prey:2"),
    ("A tamer. I will poke; I want them pleased about it.", "submissive:2,brat:3"),
    ("Handler energy: simple rules, water, gear, pride.", "submissive:2,pet:2,pup:2,kitten:1"),
    ("I want to give that care too, on other nights.", "submissive:1,switch:2,caregiver:1"),
])
add("archetype", "switch", "Care versus steel when you switch is…", [
    ("I want to give steel and receive care — or the reverse, by night.", "switch:3"),
    ("I am warmer as a Dominant and sharper as a submissive.", "switch:2,caregiver:1,masochist:1"),
    ("I am sharper as a Dominant and softer when I offer.", "switch:2,sadist:1,little:1"),
    ("Both seats get the same mix. I don't change flavour, only direction.", "switch:2"),
    ("Caregiver both ways. I hold and I want to be held.", "switch:2,caregiver:3"),
    ("I have not found the mix yet. I am collecting data.", "switch:1"),
])

add("archetype", "dominant", "Pain, as a language you speak, is…", [
    ("A tool I like giving, with a warm-up and a reason.", "sadist:3,impact:2,dominant:1"),
    ("Optional. I would rather protocol, rope, or voice.", "owner:1,rigger:1,sir:1,dominant:1"),
    ("Playful sting for brats, not a sadist identity.", "brat-tamer:2,impact:1,dominant:1"),
    ("Primal. Bite, slap, pin — not a counted caning unless we said so.", "primal:3,sadist:1,dominant:1"),
    ("Careful maintenance. I will hurt them because they asked to be kept in shape.", "trainer:2,sadist:1,dominant:1"),
    ("Something I also want to take, some nights.", "sadist:1,masochist:1,switch:2"),
])
add("archetype", "submissive", "Pain, as a language you receive, is…", [
    ("A thing I want to take when I trust the person holding it.", "masochist:3,impact:2,submissive:1"),
    ("Optional. Hold me with a look, a rope, or a rule.", "slave:1,pet:1,submissive:1"),
    ("Brat fuel. Sting means they caught me.", "brat:3,impact:1,submissive:1"),
    ("Prey fuel. Bite, slap, pin.", "prey:3,primal:2,submissive:1"),
    ("A standard I want to be trained to take, not a surprise.", "slave:1,masochist:1,submissive:1"),
    ("Something I also want to give, some nights.", "masochist:1,sadist:1,switch:2"),
])
add("archetype", "switch", "Pain, from both sides of the implement, is…", [
    ("Interesting both ways, in different moods.", "switch:2,sadist:2,masochist:2,impact:1"),
    ("I like giving more than taking.", "switch:1,sadist:3,dominant:1"),
    ("I like taking more than giving.", "switch:1,masochist:3,submissive:1"),
    ("I want to trade: I give this, I take that.", "switch:3,impact:1"),
    ("Not our centre. We can skip it.", "switch:1"),
    ("Primal both ways — not formal impact scenes.", "switch:2,primal:3"),
])

add("archetype", "dominant", "Service offered to you lands as…", [
    ("Something I want, and I will notice it.", "owner:2,service:3,dominant:1"),
    ("Hot if it is ritual, not if it is unpaid housework I never asked for.", "sir:1,trainer:1,dominant:1"),
    ("Body service more than domestic — undressing, bathing, presenting.", "owner:1,handler:1,service:2,dominant:1"),
    ("Domestic is the devotion. The unsexy work is the kneel.", "caregiver:1,daddy:1,service:2,dominant:1"),
    ("I like being served and I like serving them on other days.", "switch:2,service:2,caregiver:1"),
    ("I would rather they rest. Service is not my kink.", "caregiver:2,dominant:1"),
])
add("archetype", "submissive", "Service you offer lands as…", [
    ("How I show devotion. Usefulness is the heat.", "service:3,slave:2,submissive:1"),
    ("Ritual more than chores. Positions, presentation, a drink done right.", "service:2,slave:1,protocol:1,submissive:1"),
    ("Body service. Hands, mouth, bath, the physical yes.", "service:2,worship:1,submissive:1"),
    ("Domestic devotion. I want the boring work to belong to someone.", "service:3,submissive:1"),
    ("I will serve, and I want to be served on other days.", "switch:2,service:2"),
    ("I would rather be used than useful. Service is not my centre.", "objectification:2,masochist:1,submissive:1"),
])
add("archetype", "switch", "Service, traded, is…", [
    ("I like serving and being served on different days.", "switch:3,service:2"),
    ("I want to be served more. Switching does not make me the maid.", "switch:1,dominant:1,owner:1"),
    ("I want to serve more. Switching does not retire my devotion.", "switch:1,submissive:1,service:2"),
    ("We coach each other's standards. Mutual service with a power tilt.", "switch:2,service:2,trainer:1"),
    ("Care more than protocol: feeding, blankets, the unsexy work both ways.", "switch:2,caregiver:3,service:1"),
    ("Not our language. We show up another way.", "switch:1"),
])

add("archetype", "dominant", "Brat energy aimed at you is…", [
    ("The point. Catch them. Grin. Mean it.", "brat-tamer:3,dominant:1"),
    ("Fine in small doses. I want a default of obedience.", "owner:2,trainer:2,dominant:1"),
    ("A no. I want a clean yes or a clean negotiation, not a sport.", "owner:2,master:1,sir:1,dominant:1"),
    ("Hot if it ends in a pin. Primal, not verbal tennis.", "primal:2,brat-tamer:1,dominant:1"),
    ("I will tamer them, and I will brat at someone else on other nights.", "switch:2,brat-tamer:2,brat:1"),
    ("I don't mind a spark as long as the rule still stands after.", "trainer:2,brat-tamer:1,dominant:1"),
])
add("archetype", "submissive", "Your own brat energy is…", [
    ("The point. I want to be caught.", "brat:3,submissive:1"),
    ("A spice, not a personality. Default is trying to be good.", "slave:1,service:1,brat:1,submissive:1"),
    ("Not me. I want to keep the rule and be proud.", "slave:2,service:2,submissive:1"),
    ("Prey-brat. I run so they hunt, not so I win an argument.", "prey:2,brat:1,primal:1,submissive:1"),
    ("I brat, and I also like taming someone else's smirk.", "switch:2,brat:2,brat-tamer:1"),
    ("Princess-brat. Standards, spoiling, a strop when they are missed.", "princess:3,brat:1,submissive:1"),
])
add("archetype", "switch", "Brat and tamer, as a pair of seats, is…", [
    ("Our favourite sport. We can play either side.", "switch:2,brat:2,brat-tamer:2"),
    ("I tamer more than I brat.", "switch:1,brat-tamer:3,dominant:1"),
    ("I brat more than I tamer.", "switch:1,brat:3,submissive:1"),
    ("Fun, but I want a solemn dynamic underneath.", "switch:1,owner:1,slave:1"),
    ("Not for us. We like clean rules.", "switch:1"),
    ("I want a partner who will not sulk when I flip from tamer to brat.", "switch:3,brat-tamer:1,brat:1"),
])

add("archetype", "dominant", "Pet, pup, prey — if you hold the lead, you are closest to…", [
    ("Handler. Gear, water, simple rules, pride in them.", "handler:3,pet-play:2,dominant:1"),
    ("Owner. The animal is mine, not a weekend costume only.", "owner:3,handler:1,pet-play:1,dominant:1"),
    ("Hunter. Prey, chase, catch, bite.", "primal:3,dominant:1"),
    ("I can do pet play as a scene. It is not my identity.", "dominant:1,pet-play:1"),
    ("Trainer. I want them better at the posture, the wait, the cue.", "trainer:3,handler:1,dominant:1"),
    ("I want to hold the lead and wear one, on different nights.", "switch:2,handler:1,pet:1"),
])
add("archetype", "submissive", "Pet, pup, prey — if you wear the gear, you are closest to…", [
    ("Pet or pup. Gear, simple rules, being kept.", "pet:3,pup:3,pet-play:3,submissive:1"),
    ("Kitten. Soft, bratty, clawed on purpose.", "kitten:3,brat:1,pet-play:2,submissive:1"),
    ("Prey. Chase, catch, bite. Less gear, more animal.", "prey:3,primal:3,submissive:1"),
    ("I can do it as a scene. It is not my identity.", "submissive:1,pet-play:1"),
    ("Pony or show-pet. Posture, inspection, being displayed to them.", "pet:2,pet-play:2,objectification:1,submissive:1"),
    ("I want to wear the gear and hold a lead, on different nights.", "switch:2,pet:1,handler:1"),
])
add("archetype", "switch", "Animal play, both ends of the lead, is…", [
    ("I want both. Handler and pet, hunter and prey.", "switch:2,handler:2,pet:2,primal:1,prey:1"),
    ("I handle more than I wear.", "switch:1,handler:3,dominant:1"),
    ("I wear more than I handle.", "switch:1,pet:2,pup:1,kitten:1,submissive:1"),
    ("Prey and hunter only. Less cute, more bite.", "switch:2,primal:3,prey:2"),
    ("Not our language.", "switch:1"),
    ("A scene we can swap in an evening if we said so at the start.", "switch:3,pet-play:1"),
])

add("archetype", "dominant", "Ownership language (“mine,” collar, standing rules) from your mouth is…", [
    ("Something I want to mean, and to be responsible for.", "owner:3,master:2,ownership:3,collaring:1,dominant:1"),
    ("Scene-only. Heavy words for a locked room, not the Tesco run.", "dominant:1,ownership:1"),
    ("Daily and ordinary. The collar is not a costume.", "owner:3,ownership:2,collaring:2,dominant:1"),
    ("I like it if they ask to be claimed, not if I have to sell it.", "owner:1,caregiver:1,dominant:1"),
    ("Handler-lite: 'good', 'mine', the lead — not Master with a capital.", "handler:2,ownership:1,dominant:1"),
    ("I want to say mine, and I want to be called mine.", "switch:2,ownership:2"),
])
add("archetype", "submissive", "Ownership language aimed at you is…", [
    ("Something I want to belong to, with a way out that still works.", "slave:2,ownership:3,collaring:2,submissive:1"),
    ("Scene-only. Do not collar me for the shop.", "submissive:1,ownership:1"),
    ("Daily and ordinary. I want to feel kept in the boring hours.", "slave:2,pet:1,ownership:2,collaring:2,submissive:1"),
    ("Princess-owned. Favoured, held to a standard, spoiled on purpose.", "princess:3,ownership:1,submissive:1"),
    ("Pet-owned. Simple, warm, not a contract lawyer's TPE.", "pet:2,pup:1,ownership:1,submissive:1"),
    ("I want to be theirs, and I want someone to be mine.", "switch:2,ownership:2"),
])
add("archetype", "switch", "Collars and claim, swapped, are…", [
    ("A toy we can swap. Theirs in this room, mine in that one.", "switch:2,ownership:2,collaring:2"),
    ("I want to collar more than I want to be collared.", "switch:1,owner:3,dominant:1,collaring:1"),
    ("I want to wear one more than I want to put one on.", "switch:1,slave:2,submissive:1,collaring:2"),
    ("Two collars, different meanings. We can both be claimed.", "switch:3,ownership:2,collaring:2"),
    ("Too heavy. Keep it to a scene without the word forever.", "switch:1"),
    ("The ritual around it matters more than who wears it.", "switch:1,protocol:2,collaring:1"),
])

add("archetype", "dominant", "Training — positions, cues, getting better at a thing — as your job is…", [
    ("My job: clear drills, markers, patience.", "trainer:3,sir:1,dominant:1"),
    ("I will train protocol more than skills. Manners over tricks.", "trainer:2,owner:1,sir:2,dominant:1"),
    ("I will train the body: rope receiving, impact, stillness.", "trainer:2,rigger:1,sadist:1,dominant:1"),
    ("Handler drills. Wait, heel, present, water.", "handler:2,trainer:2,pet-play:1,dominant:1"),
    ("Only if it stays a game, not a report card.", "brat-tamer:2,dominant:1"),
    ("I want to be trained too. Coach me back.", "switch:2,trainer:1"),
])
add("archetype", "submissive", "Training you want to be put through is…", [
    ("Positions, cues, getting better because they asked.", "slave:1,service:1,submissive:1"),
    ("Protocol and manners more than circus tricks.", "slave:2,princess:1,submissive:1"),
    ("The body: taking rope, impact, stillness.", "masochist:1,submissive:1"),
    ("Pet drills. Wait, heel, present.", "pet:2,pup:2,pet-play:2,submissive:1"),
    ("Only if it stays a game, not a report card.", "brat:2,submissive:1"),
    ("I want to be trained, and I want to train someone back.", "switch:2"),
])
add("archetype", "switch", "Training both ways is…", [
    ("We coach each other. Mutual drills with a tilt.", "switch:3,trainer:2"),
    ("I want to train more than I want to be drilled.", "switch:1,trainer:3,dominant:1"),
    ("I want to be drilled more than I want to run the lesson.", "switch:1,submissive:1"),
    ("I train them in this, they train me in that.", "switch:3,trainer:1"),
    ("Not for us. We play; we do not keep a gradebook.", "switch:1,brat:1"),
    ("Yes, including the unsexy repetitions.", "switch:2,trainer:2,service:1"),
])

add("archetype", "dominant", "Soft structure (bedtime-for-adults, meals, check-ins) from you is…", [
    ("The centre. I want to run a kind, firm day.", "caregiver:3,daddy:3,dominant:1"),
    ("A tool, not an identity. I can do it. I am not only that.", "caregiver:1,owner:1,dominant:1"),
    ("Not me. I will hold scenes. I will not parent an adult's calendar.", "sadist:1,primal:1,dominant:1"),
    ("I will do mornings and landings. Not a full-time caregiver identity.", "caregiver:2,dominant:1"),
    ("Handler-soft: water, gear, pride — not bedtime stories.", "handler:2,caregiver:1,dominant:1"),
    ("I want to give it and receive it.", "switch:2,caregiver:2,daddy:1,little:1"),
])
add("archetype", "submissive", "Soft structure aimed at you is…", [
    ("The centre. I want a kind, firm day that is not mine to design.", "little:3,submissive:1"),
    ("A tool. I like a check-in. I am not only that.", "little:1,submissive:1"),
    ("Not me. Hold me in scenes. Do not run my calendar.", "brat:1,slave:1,submissive:1"),
    ("Mornings and landings. Not a full-time little identity.", "little:2,princess:1,submissive:1"),
    ("Pet-soft: water, gear, pride — not being babied.", "pet:2,pup:1,submissive:1"),
    ("I want to receive it and give it.", "switch:2,little:1,caregiver:2"),
])
add("archetype", "switch", "Soft structure, both ways, is…", [
    ("I want to run their day and have mine run, in turns.", "switch:2,caregiver:2,daddy:1,little:2"),
    ("I am the caregiver more often.", "switch:1,caregiver:3,daddy:2,dominant:1"),
    ("I want the structure more often.", "switch:1,little:3,submissive:1"),
    ("We do check-ins as equals who sometimes tilt.", "switch:2,caregiver:1"),
    ("Not our dynamic. Too much like management.", "switch:1"),
    ("Yes, including the unsexy repetitions — food, sleep, the phone parked.", "switch:2,caregiver:2"),
])

add("archetype", "dominant", "Ritual (kneel, present, a drink done the same way) you want to set is…", [
    ("Daily. Small, real, not a museum of protocol.", "owner:2,trainer:1,dominant:1"),
    ("Scene-only. When the door closes.", "dominant:1"),
    ("High when we said high. I can run formality.", "master:2,owner:1,sir:2,dominant:1"),
    ("Pet ritual: bowl, lead, a place on the floor.", "handler:3,pet-play:1,dominant:1"),
    ("I like one or two things that never change. Not twenty.", "trainer:1,caregiver:1,dominant:1"),
    ("I want to set ritual and be put through someone else's.", "switch:2"),
])
add("archetype", "submissive", "Ritual you want to live inside is…", [
    ("Daily. Small, real, a way to drop without a full scene.", "slave:2,service:1,submissive:1"),
    ("Scene-only. When the door closes.", "submissive:1"),
    ("High when we said high. Formality calms me.", "slave:2,princess:1,submissive:1"),
    ("Pet ritual: bowl, lead, a place on the floor.", "pet:2,pup:2,kitten:1,pet-play:2,submissive:1"),
    ("One or two things that never change. Not twenty.", "service:1,little:1,submissive:1"),
    ("I want to live inside ritual and write some for someone else.", "switch:2"),
])
add("archetype", "switch", "Ritual you want, both seats, is…", [
    ("We each have rites. Mine when I hold, theirs when they do.", "switch:3"),
    ("I want to set more ritual than I want to perform.", "switch:1,dominant:1,owner:1"),
    ("I want to perform more ritual than I want to invent.", "switch:1,submissive:1,slave:1"),
    ("Shared rites that do not care who is in charge that day.", "switch:2"),
    ("Keep it light. Too much ritual kills the flip.", "switch:2,primal:1"),
    ("Not our language.", "switch:1"),
])

add("archetype", "dominant", "Your voice when you are in charge is closest to…", [
    ("Low, few words, meant.", "sir:2,owner:1,dominant:1"),
    ("Warm, specific praise, then the next instruction.", "daddy:2,caregiver:2,praise:1,dominant:1"),
    ("Sharp. I will degrade if we wrote the words down.", "sadist:2,humiliation:1,dominant:1"),
    ("Playful. I bait them back.", "brat-tamer:3,dominant:1"),
    ("Mostly non-verbal. Growl, hand, snap.", "primal:3,handler:1,dominant:1"),
    ("I want that voice, and I want one used on me.", "switch:2"),
])
add("archetype", "submissive", "The voice that actually drops you is closest to…", [
    ("Low, few words, meant.", "slave:1,submissive:1"),
    ("Warm, specific praise, then the next instruction.", "praise:2,little:1,princess:1,submissive:1"),
    ("Sharp. Degradation we already listed as in.", "humiliation:2,masochist:1,submissive:1"),
    ("Playful. They bait me and I take it.", "brat:2,submissive:1"),
    ("Mostly non-verbal. Growl, hand, snap.", "prey:2,pet:1,primal:2,submissive:1"),
    ("I want that voice on me, and I want to use one.", "switch:2"),
])
add("archetype", "switch", "Voice, both seats, is…", [
    ("I can talk filthy from either chair.", "switch:3,praise:1,humiliation:1"),
    ("I am more verbal as a Dominant, quieter when I offer.", "switch:2,dominant:1"),
    ("I go quiet when I hold, and I need words when I offer.", "switch:2,submissive:1,praise:1"),
    ("Growl both ways. Almost no words.", "switch:2,primal:3"),
    ("Praise both ways. I do not want a cruel voice in either seat.", "switch:2,praise:3,caregiver:1"),
    ("We have not found our voices yet.", "switch:1"),
])

add("archetype", "dominant", "Eye contact you want when you hold the room…", [
    ("Theirs down, unless I say look.", "owner:2,master:1,sir:1,dominant:1"),
    ("Theirs up. I want to see them.", "caregiver:1,daddy:1,dominant:1"),
    ("A mix I control: look, down, look.", "trainer:2,dominant:1"),
    ("Animal. I do not care about etiquette of the gaze.", "primal:2,handler:1,dominant:1"),
    ("I want them watching my hands, not my face.", "rigger:1,sadist:1,dominant:1"),
    ("I want to drop my own eyes for someone, some nights.", "switch:2"),
])
add("archetype", "submissive", "Eye contact you want when you offer…", [
    ("Down, unless they say look.", "slave:2,submissive:1"),
    ("Up. I want to be seen.", "princess:2,praise:1,submissive:1"),
    ("A mix they control: look, down, look.", "slave:1,pet:1,submissive:1"),
    ("Animal. I will not perform etiquette of the gaze.", "prey:2,primal:2,submissive:1"),
    ("Watching their hands, not their face.", "objectification:1,submissive:1"),
    ("I want my eyes down, and I want someone else's down for me.", "switch:2"),
])
add("archetype", "switch", "Gaze, traded, is…", [
    ("Whoever holds the night owns the rule of the eyes.", "switch:3"),
    ("I want to take eyes down more than I want to drop mine.", "switch:1,dominant:1,owner:1"),
    ("I want my eyes used more than I want to police theirs.", "switch:1,submissive:1"),
    ("Look at each other. The power is elsewhere.", "switch:2"),
    ("Predators don't do etiquette. We stare or we don't.", "switch:2,primal:2"),
    ("Not a lever we use.", "switch:1"),
])

add("archetype", "dominant", "Marks you want to leave (with consent, in places you both chose)…", [
    ("Yes. Evidence they were held.", "sadist:2,ownership:1,dominant:1"),
    ("Only if they asked for the evidence.", "caregiver:1,dominant:1"),
    ("Collar, not bruises. I mark with objects and rules.", "owner:2,collaring:2,dominant:1"),
    ("Bite marks. Primal, not a formal caning pattern.", "primal:3,dominant:1"),
    ("Rope marks, the good kind, for an evening.", "rigger:3,bondage:1,dominant:1"),
    ("I want to leave marks and wear some.", "switch:2,sadist:1,masochist:1"),
])
add("archetype", "submissive", "Marks you want to wear (with consent, in places you both chose)…", [
    ("Yes. Evidence I was held.", "masochist:2,ownership:1,submissive:1"),
    ("Only if I asked for the evidence.", "submissive:1"),
    ("Collar, not bruises. Mark me with objects and rules.", "slave:1,collaring:2,ownership:1,submissive:1"),
    ("Bites. Primal, not a formal pattern.", "prey:2,primal:2,submissive:1"),
    ("Rope marks, the good kind, for an evening.", "submissive:1,bondage:1"),
    ("I want to wear marks and leave some.", "switch:2,masochist:1,sadist:1"),
])
add("archetype", "switch", "Marks, both ways, are…", [
    ("I want to give and wear, depending on the night.", "switch:2,sadist:1,masochist:1"),
    ("I like leaving them more.", "switch:1,sadist:2,dominant:1"),
    ("I like wearing them more.", "switch:1,masochist:2,submissive:1"),
    ("Collars and jewellery more than bruises.", "switch:1,collaring:2,ownership:1"),
    ("Not for us, or only accidental-light.", "switch:1"),
    ("A private diary on skin, not a public show.", "switch:1"),
])

add("archetype", "dominant", "On an ordinary Tuesday, your Dominant is mostly…", [
    ("A few standing rules and a check-in. Not a scene.", "owner:2,caregiver:1,daddy:1,dominant:1"),
    ("Quiet unless I start something. I am not 'on' all day.", "dominant:1"),
    ("Titles and manners in the house. Low-grade protocol.", "sir:2,master:1,owner:1,dominant:1"),
    ("Playful. I will start a hunt or a brat-catch in the kitchen.", "brat-tamer:2,primal:1,dominant:1"),
    ("Practical ownership: food, sleep, the phone, the plan.", "caregiver:2,daddy:2,owner:1,dominant:1"),
    ("I want Tuesdays both ways.", "switch:2"),
])
add("archetype", "submissive", "On an ordinary Tuesday, your submissive is mostly…", [
    ("A few standing rules and a check-in. Not a scene.", "slave:1,little:1,submissive:1"),
    ("Quiet unless they start something. I am not 'on' all day.", "submissive:1"),
    ("Titles and manners in the house. Low-grade protocol.", "slave:2,service:1,submissive:1"),
    ("Playful. I will start a smirk or a hunt-me in the kitchen.", "brat:2,prey:1,submissive:1"),
    ("Practical belonging: I follow the food, sleep, phone, plan.", "little:2,service:1,submissive:1"),
    ("I want Tuesdays both ways.", "switch:2"),
])
add("archetype", "switch", "Ordinary Tuesdays, for a switch, are…", [
    ("Whoever has more capacity holds the tilt that day.", "switch:3,caregiver:1"),
    ("We schedule the tilt. Tuesday is theirs or mine, on purpose.", "switch:2"),
    ("Mostly equals, with a scene later if we want it.", "switch:2"),
    ("I still want a default seat, even if we flip at the weekend.", "switch:1,dominant:1,submissive:1"),
    ("Playful both ways in the kitchen. Serious only when we book it.", "switch:2,brat:1,brat-tamer:1"),
    ("I have not found a Tuesday that works yet.", "switch:1"),
])

add("archetype", "dominant", "A year from now you hope your Dominant looks like…", [
    ("Someone who claimed well, and stayed responsible for it.", "owner:3,master:2,dominant:1"),
    ("Someone who trained, not only played.", "trainer:3,sir:1,dominant:1"),
    ("Someone whose care was as famous as their scenes.", "caregiver:3,daddy:2,dominant:1"),
    ("Someone who still likes the sport — brat, hunt, grin.", "brat-tamer:2,primal:2,dominant:1"),
    ("Someone with skill: rope, impact, a body that knows its tools.", "rigger:2,sadist:2,dominant:1"),
    ("Someone who can still kneel without a crisis of self.", "switch:2,dominant:1"),
])
add("archetype", "submissive", "A year from now you hope your submissive looks like…", [
    ("Someone who belongs well, and kept a way out that works.", "slave:3,ownership:1,submissive:1"),
    ("Someone trained, not only played with.", "service:2,slave:1,submissive:1"),
    ("Someone whose softness was allowed, not mocked.", "little:2,princess:1,submissive:1"),
    ("Someone who still likes the sport — brat, flee, grin.", "brat:2,prey:2,submissive:1"),
    ("Someone with skill: taking rope, impact, stillness, service.", "masochist:1,service:1,pet:1,submissive:1"),
    ("Someone who can still take the wheel without a crisis of self.", "switch:2,submissive:1"),
])
add("archetype", "switch", "A year from now you hope your switch looks like…", [
    ("Fluent. Either seat without a fight about identity.", "switch:3"),
    ("Mostly one home, with a well-built visiting seat.", "switch:2"),
    ("A pair of costumes you both trust — tamer/brat, hunter/prey, owner/owned.", "switch:2,brat-tamer:1,brat:1,primal:1,owner:1,slave:1"),
    ("Better at holding, because that was the weaker muscle.", "switch:2,dominant:1,trainer:1"),
    ("Better at offering, because that was the weaker muscle.", "switch:2,submissive:1"),
    ("Less of a quiz, more of a practice.", "switch:2"),
])


add("archetype", "dominant", "After a scene, the Dominant you want to have been is…", [
    ("The one who closed it: water, words, the kit away.", "caregiver:3,daddy:1,dominant:1"),
    ("The one who kept the standard and then let them down gently.", "owner:2,trainer:1,dominant:1"),
    ("The one who still had a grin. Sport, not a sermon.", "brat-tamer:2,primal:1,dominant:1"),
    ("The one who left a mark they asked for, and checked it.", "sadist:2,rigger:1,dominant:1"),
    ("The one who was still Sir in the landing, not a roommate at once.", "sir:2,master:1,dominant:1"),
    ("Someone who can be held after they have held.", "switch:2,caregiver:1,dominant:1"),
])
add("archetype", "submissive", "After a scene, the submissive you want to have been is…", [
    ("The one who took it and then let themselves be landed.", "submissive:2,slave:1"),
    ("The one who met the standard and got to hear it.", "service:2,praise:1,princess:1,submissive:1"),
    ("The one who still had a grin. Sport, not a sermon.", "brat:2,prey:1,submissive:1"),
    ("The one who asked for a mark, and kept it.", "masochist:2,submissive:1"),
    ("The one who got to stay in the role a little longer.", "pet:1,slave:1,little:1,submissive:1"),
    ("Someone who can land them after being held.", "switch:2,caregiver:1,submissive:1"),
])
add("archetype", "switch", "After a scene, a switch landing you want is…", [
    ("Whoever ran it closes it. The other gets to float.", "switch:2,caregiver:1"),
    ("We land each other. Both nervous systems.", "switch:3,caregiver:2"),
    ("Stay in the costumes a little. Do not roommate-voice yet.", "switch:2,ownership:1"),
    ("I need more landing after I have held than after I have offered.", "switch:2,dominant:1"),
    ("I need more landing after I have offered than after I have held.", "switch:2,submissive:1"),
    ("Quiet first, debrief later, both seats.", "switch:2"),
])

add("archetype", "dominant", "When they are in public with you (a dinner, a shop), your Dominant is…", [
    ("Quiet. A look, a word only we know. No show.", "dominant:2,owner:1"),
    ("Still in manners: the chair, the coat, the bill — care that looks like ordinary love.", "caregiver:2,daddy:1,dominant:1"),
    ("A private protocol under the table. Nothing a stranger could swear to.", "owner:1,sir:1,dominant:1"),
    ("Off. Public is not the dynamic unless we booked it.", "dominant:1"),
    ("Playful. I might start a hunt or a catch in the car home.", "brat-tamer:1,primal:1,dominant:1"),
    ("I want to be held in public sometimes too — a hand on my back.", "switch:2,dominant:1"),
])
add("archetype", "submissive", "When you are in public with them (a dinner, a shop), your submissive is…", [
    ("Quiet. A look, a word only we know. No show.", "submissive:2,slave:1"),
    ("Manners: the chair, the coat — devotion that looks like ordinary love.", "service:1,little:1,submissive:1"),
    ("A private protocol under the table. Nothing a stranger could swear to.", "slave:1,princess:1,submissive:1"),
    ("Off. Public is not the dynamic unless we booked it.", "submissive:1"),
    ("Playful. I might start a smirk in the car home.", "brat:1,prey:1,submissive:1"),
    ("I want to hold them in public sometimes too — a hand on their back.", "switch:2,submissive:1"),
])
add("archetype", "switch", "In public, a switch dynamic is…", [
    ("A look. No show. Power stays home unless we booked it.", "switch:2"),
    ("Whoever has more capacity that hour holds the quiet tilt.", "switch:2,caregiver:1"),
    ("Ordinary care both ways: chairs, coats, the bill.", "switch:2,service:1"),
    ("I still want a default seat in public, even if we flip at home.", "switch:1,dominant:1,submissive:1"),
    ("Playful in the car home, solemn only in the house.", "switch:2,brat:1,brat-tamer:1"),
    ("Off. Public is never the dynamic.", "switch:1"),
])

add("archetype", "dominant", "If they asked you to name the Dominant you are not, you would say…", [
    ("Not a 24/7 Master if I cannot resource it. I will not fake TPE.", "owner:1,master:1,dominant:1"),
    ("Not a sadist if pain is not actually my heat.", "sadist:1,dominant:1"),
    ("Not a Daddy if I do not want that softness.", "daddy:1,caregiver:1,dominant:1"),
    ("Not a tamer if I want a clean yes, not a sport.", "brat-tamer:1,dominant:1"),
    ("Not only a rigger or hunter. I am more than a scene.", "rigger:1,primal:1,dominant:1"),
    ("Not someone who cannot kneel. That is a lie I do not want to live in.", "switch:2,dominant:1"),
])
add("archetype", "submissive", "If they asked you to name the submissive you are not, you would say…", [
    ("Not a 24/7 slave if they cannot resource it. I will not fake TPE.", "slave:1,submissive:1"),
    ("Not a masochist if pain is not actually my heat.", "masochist:1,submissive:1"),
    ("Not a little if I do not want that softness.", "little:1,submissive:1"),
    ("Not a brat if I want a clean yes, not a sport.", "brat:1,submissive:1"),
    ("Not only a pet or prey. I am more than a scene.", "pet:1,prey:1,submissive:1"),
    ("Not someone who cannot take the wheel. That is a lie I do not want to live in.", "switch:2,submissive:1"),
])
add("archetype", "switch", "If they asked you to name the switch you are not, you would say…", [
    ("Not a tourist. I mean both seats, or I will stop using the word.", "switch:3"),
    ("Not someone who flips mid-scene without a checkpoint.", "switch:2"),
    ("Not 'secretly a top' or 'actually a bottom' wearing a costume.", "switch:3"),
    ("Not unwilling to have a home seat. A home is allowed.", "switch:2"),
    ("Not a brat and a tamer in the same five minutes unless we said so.", "switch:1,brat:1,brat-tamer:1"),
    ("I do not know yet. That is an honest answer, not a dodge.", "switch:1"),
])

print("archetype", sum(1 for i in ITEMS if i["section"] == "archetype"))


# ---------------------------------------------------------------------------
# Kinks — 100 (34 D / 33 s / 33 switch)
# ---------------------------------------------------------------------------

def triad(section, d, s, w):
    add(section, "dominant", d[0], d[1])
    add(section, "submissive", s[0], s[1])
    add(section, "switch", w[0], w[1])

triad("kink",
    ("You have one hour and a clear green light for impact. What do you actually want to give?", [
        ("My hand. I want to feel every strike.", "impact:3,spanking:3,sadist:1,dominant:1"),
        ("A paddle. A clear count, a clear end.", "impact:3,cane:2,sadist:1,dominant:1"),
        ("A flogger or whip. Warm-up and build.", "impact:3,flogging:3,sadist:1,dominant:1"),
        ("A cane. Sharp, few, meant.", "impact:3,cane:3,sadist:2,dominant:1"),
        ("Impact only as punctuation — a slap, a spank — not a scene.", "impact:1,spanking:1,dominant:1"),
        ("I do not want to give impact. Skip this hour.", "dominant:1"),
    ]),
    ("You have one hour and a clear green light for impact. What do you actually want to take?", [
        ("A hand. Close, counted or not.", "impact:3,spanking:3,masochist:1,submissive:1"),
        ("A paddle. A clear count, a clear end.", "impact:3,cane:2,masochist:1,submissive:1"),
        ("A flogger or whip. Warm-up and build.", "impact:3,flogging:3,masochist:1,submissive:1"),
        ("A cane. Sharp, few, meant.", "impact:3,cane:3,masochist:2,submissive:1"),
        ("Impact only as punctuation — a slap, a spank — not a scene.", "impact:1,spanking:1,submissive:1"),
        ("I do not want to take impact. Skip this hour.", "submissive:1"),
    ]),
    ("Impact from both sides of the implement is…", [
        ("I want to give and take, on different nights or in the same hour.", "switch:2,impact:2,sadist:1,masochist:1"),
        ("I want to give more than I take.", "switch:1,impact:2,sadist:2,spanking:1,flogging:1"),
        ("I want to take more than I give.", "switch:1,impact:2,masochist:2,spanking:1"),
        ("Hand and sting, not formal implements.", "switch:1,spanking:2,impact:1"),
        ("Formal implements, both seats.", "switch:1,flogging:2,cane:2,impact:2"),
        ("Not our centre.", "switch:1"),
    ]),
)

triad("kink",
    ("Spanking, specifically, as something you give…", [
        ("Over the knee, close, a conversation with a palm.", "spanking:3,impact:2,dominant:1"),
        ("A punishment they both dread and want.", "spanking:3,punish-impact:1,dominant:1"),
        ("A funishment. Grin, sting, no real crime.", "spanking:3,funish-spank:1,brat-tamer:1,dominant:1"),
        ("Maintenance. A scheduled reset, not a scene of inspiration.", "spanking:2,trainer:1,dominant:1"),
        ("I will spank as a beat inside something else, not as the night.", "spanking:1,impact:1,dominant:1"),
        ("Not for me to give.", "dominant:1"),
    ]),
    ("Spanking, specifically, as something you take…", [
        ("Over the knee, close, a conversation with a palm.", "spanking:3,impact:2,submissive:1"),
        ("A punishment I both dread and want.", "spanking:3,punish-impact:1,submissive:1"),
        ("A funishment. Grin, sting, no real crime.", "spanking:3,funish-spank:1,brat:1,submissive:1"),
        ("Maintenance. A scheduled reset.", "spanking:2,submissive:1"),
        ("A beat inside something else, not the night.", "spanking:1,impact:1,submissive:1"),
        ("Not for me to take.", "submissive:1"),
    ]),
    ("Spanking both ways is…", [
        ("I want to put someone over my knee and be put over theirs.", "switch:2,spanking:3,impact:1"),
        ("I like giving OTK more.", "switch:1,spanking:2,sadist:1"),
        ("I like taking OTK more.", "switch:1,spanking:2,masochist:1"),
        ("Funishment both ways. Not a real crime.", "switch:1,spanking:2,funish-spank:1"),
        ("Punishment both ways, with a written reason.", "switch:1,spanking:2,punish-impact:1"),
        ("Skip it.", "switch:1"),
    ]),
)

triad("kink",
    ("A flogger or whip in your Dominant hand is…", [
        ("A favourite. I want the build, the thud, the song of it.", "flogging:3,impact:2,sadist:1,dominant:1"),
        ("A tool I will learn properly, not swing as theatre.", "flogging:2,trainer:1,impact:1,dominant:1"),
        ("Thud over sting. I want heavy and slow.", "flogging:3,impact:2,dominant:1"),
        ("Sting over thud. I want bright and mean.", "flogging:3,sadist:2,impact:1,dominant:1"),
        ("Occasional. Not my identity.", "flogging:1,impact:1,dominant:1"),
        ("Not for me to give.", "dominant:1"),
    ]),
    ("A flogger or whip on your skin is…", [
        ("A favourite. I want the build, the thud, the song of it.", "flogging:3,impact:2,masochist:1,submissive:1"),
        ("Something I want from someone who learned it, not from theatre.", "flogging:2,impact:1,submissive:1"),
        ("Thud over sting. Heavy and slow.", "flogging:3,impact:2,submissive:1"),
        ("Sting over thud. Bright and mean.", "flogging:3,masochist:2,impact:1,submissive:1"),
        ("Occasional. Not my identity.", "flogging:1,impact:1,submissive:1"),
        ("Not for me to take.", "submissive:1"),
    ]),
    ("Flogging both ways is…", [
        ("I want to throw and to take.", "switch:2,flogging:3,impact:1"),
        ("I throw more than I take.", "switch:1,flogging:2,sadist:1"),
        ("I take more than I throw.", "switch:1,flogging:2,masochist:1"),
        ("Thud both ways.", "switch:1,flogging:2,impact:1"),
        ("Sting both ways.", "switch:1,flogging:2,sadist:1,masochist:1"),
        ("Skip it.", "switch:1"),
    ]),
)

triad("kink",
    ("Cane or paddle, as something you give…", [
        ("Counted. They hear the number. I stop when I said I would — or I renegotiate out loud.", "cane:3,impact:2,sadist:1,dominant:1"),
        ("A few, meant, as punctuation after a rule.", "cane:2,punish-impact:1,impact:1,dominant:1"),
        ("A longer set if they asked for the endurance.", "cane:3,sadist:2,impact:2,dominant:1"),
        ("Paddle more than cane. Area, thud, less edge.", "cane:2,spanking:1,impact:2,dominant:1"),
        ("I will hold one. I do not love it.", "cane:1,impact:1,dominant:1"),
        ("Not for me to give.", "dominant:1"),
    ]),
    ("Cane or paddle, as something you take…", [
        ("Counted. I hear the number. I want the promise kept — or renegotiated out loud.", "cane:3,impact:2,masochist:1,submissive:1"),
        ("A few, meant, after a rule.", "cane:2,punish-impact:1,impact:1,submissive:1"),
        ("A longer set if I asked for the endurance.", "cane:3,masochist:2,impact:2,submissive:1"),
        ("Paddle more than cane. Area, thud, less edge.", "cane:2,spanking:1,impact:2,submissive:1"),
        ("I will take a little. I do not love it.", "cane:1,impact:1,submissive:1"),
        ("Not for me to take.", "submissive:1"),
    ]),
    ("Cane and paddle both ways…", [
        ("I want to give and take counted sets.", "switch:2,cane:3,impact:1"),
        ("I like giving the count more.", "switch:1,cane:2,sadist:1"),
        ("I like taking the count more.", "switch:1,cane:2,masochist:1"),
        ("Paddle both ways, cane rarely.", "switch:1,cane:1,spanking:1,impact:1"),
        ("Cane both ways, and I mean it.", "switch:1,cane:3,sadist:1,masochist:1"),
        ("Skip it.", "switch:1"),
    ]),
)

triad("kink",
    ("Rope in your hands is…", [
        ("A conversation. I want to tie, check, and watch them drop.", "rope:3,rigger:3,bondage:2,dominant:1"),
        ("Functional restraint. I tie so I can do the next thing.", "rope:2,bondage:2,rigger:1,dominant:1"),
        ("Decorative. Beauty, photos we keep, not a wrestling hold.", "rope:2,rigger:2,bondage:1,dominant:1"),
        ("I want the skill. I will practise, not only watch tutorials.", "rope:2,rigger:2,trainer:1,dominant:1"),
        ("Occasional. Cuffs are faster and I am honest about that.", "rope:1,cuffs:2,bondage:1,dominant:1"),
        ("Not for me to tie.", "dominant:1"),
    ]),
    ("Rope on your body is…", [
        ("A place I go. I want to be tied, checked, and to drop.", "rope:3,bondage:3,submissive:1"),
        ("Functional. Tie me so you can do the next thing.", "rope:2,bondage:2,objectification:1,submissive:1"),
        ("Decorative. Beauty, being shown, not a wrestling hold.", "rope:2,bondage:1,exhibition:1,submissive:1"),
        ("I want to get better at taking it — stillness, breath, telling the truth in the rope.", "rope:2,bondage:1,submissive:1"),
        ("Occasional. Cuffs are faster and I am honest about that.", "rope:1,cuffs:2,bondage:1,submissive:1"),
        ("Not for me to wear.", "submissive:1"),
    ]),
    ("Rope both ways is…", [
        ("I want to tie and to be tied.", "switch:2,rope:3,rigger:2,bondage:2"),
        ("I rigger more than I wear.", "switch:1,rigger:3,rope:2,dominant:1"),
        ("I wear more than I tie.", "switch:1,rope:2,bondage:2,submissive:1"),
        ("We trade a scene: I tie this, they tie that.", "switch:3,rope:2,rigger:1"),
        ("Floor work and simple ties, not suspension fantasies we will not resource.", "switch:1,rope:1,bondage:1"),
        ("Skip rope. Other restraint.", "switch:1,bondage:1,cuffs:1"),
    ]),
)

triad("kink",
    ("Cuffs, chains, metal — as a Dominant you…", [
        ("Want the click. Fast, obvious, undone with a key I hold.", "cuffs:3,bondage:2,dominant:1"),
        ("Want them on a bed, a ring, a point that does not argue.", "cuffs:2,bondage:3,dominant:1"),
        ("Want spreader bars, a frame, something that makes a shape.", "cuffs:2,bondage:2,objectification:1,dominant:1"),
        ("Prefer leather cuffs to metal. Less bite, more ritual.", "cuffs:2,bondage:1,dominant:1"),
        ("Use them as a shortcut when rope is too much faff.", "cuffs:1,bondage:1,dominant:1"),
        ("Not for me to lock.", "dominant:1"),
    ]),
    ("Cuffs, chains, metal — as a submissive you…", [
        ("Want the click. Fast, obvious, undone with a key they hold.", "cuffs:3,bondage:2,submissive:1"),
        ("Want to be on a bed, a ring, a point that does not argue.", "cuffs:2,bondage:3,submissive:1"),
        ("Want a shape made of me: spreader, frame, displayed.", "cuffs:2,bondage:2,objectification:1,submissive:1"),
        ("Prefer leather cuffs to metal. Less bite, more ritual.", "cuffs:2,bondage:1,submissive:1"),
        ("A shortcut is fine. I do not need a forty-minute tie to drop.", "cuffs:1,bondage:1,submissive:1"),
        ("Not for me to wear.", "submissive:1"),
    ]),
    ("Metal and cuffs both ways…", [
        ("I want to lock and be locked.", "switch:2,cuffs:3,bondage:2"),
        ("I like holding the key more.", "switch:1,cuffs:2,dominant:1"),
        ("I like wearing the lock more.", "switch:1,cuffs:2,submissive:1"),
        ("Leather, not chain.", "switch:1,cuffs:1,bondage:1"),
        ("Furniture and points, not just wrist-to-wrist.", "switch:1,bondage:2,cuffs:1"),
        ("Skip it.", "switch:1"),
    ]),
)

triad("kink",
    ("Predicament bondage you want to build is…", [
        ("A problem with no comfortable answer, checked often.", "predicament:3,bondage:2,sadist:1,dominant:1"),
        ("Light: hold this, stay there, earn the next thing.", "predicament:2,bondage:1,trainer:1,dominant:1"),
        ("Mean: cramp, choice, a clock.", "predicament:3,sadist:2,bondage:1,dominant:1"),
        ("I like the idea more than I actually run it.", "predicament:1,dominant:1"),
        ("Only with a plan for getting them out fast.", "predicament:1,bondage:1,caregiver:1,dominant:1"),
        ("Not for me to build.", "dominant:1"),
    ]),
    ("Predicament bondage you want to be put in is…", [
        ("A problem with no comfortable answer, checked often.", "predicament:3,bondage:2,masochist:1,submissive:1"),
        ("Light: hold this, stay there, earn the next thing.", "predicament:2,bondage:1,submissive:1"),
        ("Mean: cramp, choice, a clock.", "predicament:3,masochist:2,bondage:1,submissive:1"),
        ("I like the idea more than I actually want it.", "predicament:1,submissive:1"),
        ("Only if getting out is fast and obvious.", "predicament:1,bondage:1,submissive:1"),
        ("Not for me to be in.", "submissive:1"),
    ]),
    ("Predicament both ways is…", [
        ("I want to build and to suffer the puzzle.", "switch:2,predicament:3,bondage:1"),
        ("I like building more.", "switch:1,predicament:2,sadist:1"),
        ("I like suffering the puzzle more.", "switch:1,predicament:2,masochist:1"),
        ("Light holds, not mean clocks.", "switch:1,predicament:1,bondage:1"),
        ("Mean, and we resource it.", "switch:1,predicament:2,sadist:1,masochist:1"),
        ("Skip it.", "switch:1"),
    ]),
)

triad("kink",
    ("Wrap, tape, mummification you want to do to them…", [
        ("Full wrap. Helpless, warm, checked.", "mummify:3,bondage:2,deprivation:1,dominant:1"),
        ("Partial. Head free, or hands only, or a cocoon they can still talk through.", "mummify:2,bondage:1,dominant:1"),
        ("I like the look more than the duration.", "mummify:1,bondage:1,dominant:1"),
        ("As a prelude to being used, not as the whole night.", "mummify:2,objectification:1,bondage:1,dominant:1"),
        ("Only with temperature and breath taken seriously.", "mummify:1,bondage:1,caregiver:1,dominant:1"),
        ("Not for me to wrap.", "dominant:1"),
    ]),
    ("Wrap, tape, mummification you want done to you…", [
        ("Full wrap. Helpless, warm, checked.", "mummify:3,bondage:2,deprivation:1,submissive:1"),
        ("Partial. Head free, or hands only.", "mummify:2,bondage:1,submissive:1"),
        ("I like the look more than the duration.", "mummify:1,bondage:1,submissive:1"),
        ("As a prelude to being used, not as the whole night.", "mummify:2,objectification:1,bondage:1,submissive:1"),
        ("Only with temperature and breath taken seriously.", "mummify:1,bondage:1,submissive:1"),
        ("Not for me to wear.", "submissive:1"),
    ]),
    ("Wrap both ways is…", [
        ("I want to wrap and to be wrapped.", "switch:2,mummify:3,bondage:1"),
        ("I like wrapping more.", "switch:1,mummify:2,dominant:1"),
        ("I like being wrapped more.", "switch:1,mummify:2,submissive:1"),
        ("Partial only, both seats.", "switch:1,mummify:1,bondage:1"),
        ("Full, rare, resourced.", "switch:1,mummify:2,deprivation:1"),
        ("Skip it.", "switch:1"),
    ]),
)

print("kink-partial", sum(1 for i in ITEMS if i["section"] == "kink"))

triad("kink",
    ("Blindfold and sensory deprivation you want to put on them…", [
        ("Blindfold as a default. Take their eyes; keep the rest.", "deprivation:3,sensory:1,dominant:1"),
        ("Heavier: ears too, or a hood, checked often.", "deprivation:3,bondage:1,dominant:1"),
        ("Only as a beat, not a long stay.", "deprivation:1,sensory:1,dominant:1"),
        ("I want them to watch. Deprivation is a no.", "voyeurism:1,dominant:1"),
        ("Deprivation so I can use them without their performance of watching me.", "deprivation:2,objectification:1,dominant:1"),
        ("Not for me to apply.", "dominant:1"),
    ]),
    ("Blindfold and sensory deprivation you want on you…", [
        ("Blindfold as a default. Take my eyes; keep the rest.", "deprivation:3,sensory:1,submissive:1"),
        ("Heavier: ears too, or a hood, checked often.", "deprivation:3,bondage:1,submissive:1"),
        ("Only as a beat, not a long stay.", "deprivation:1,sensory:1,submissive:1"),
        ("I want to watch. Deprivation is a no.", "voyeurism:1,submissive:1"),
        ("Deprivation so I can stop performing and just take it.", "deprivation:2,objectification:1,submissive:1"),
        ("Not for me to wear.", "submissive:1"),
    ]),
    ("Deprivation both ways is…", [
        ("I want to take their eyes and give mine.", "switch:2,deprivation:3"),
        ("I like applying it more.", "switch:1,deprivation:2,dominant:1"),
        ("I like wearing it more.", "switch:1,deprivation:2,submissive:1"),
        ("Blindfold only, both seats. No hoods.", "switch:1,deprivation:1,sensory:1"),
        ("Heavy, rare, resourced.", "switch:1,deprivation:2"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("A gag in a scene you run is…", [
        ("Hot. I want the muffled sound and the eyes.", "gags:3,bondage:1,dominant:1"),
        ("A tool so they stop negotiating mid-scene — with a non-verbal safe signal already practised.", "gags:2,protocol:1,dominant:1"),
        ("Cloth or hand over the mouth, not a bit they cannot spit.", "gags:2,primal:1,dominant:1"),
        ("A ring or spider so I can still use their mouth.", "gags:3,objectification:1,dominant:1"),
        ("Occasional. I like hearing them.", "gags:1,dominant:1"),
        ("Not for me to use. I want words.", "dominant:1"),
    ]),
    ("A gag on you is…", [
        ("Hot. I want the muffled sound and nowhere to hide my face.", "gags:3,bondage:1,submissive:1"),
        ("A way to stop me negotiating mid-scene — with a non-verbal safe signal already practised.", "gags:2,protocol:1,submissive:1"),
        ("Cloth or hand, not a bit I cannot spit.", "gags:2,primal:1,submissive:1"),
        ("A ring or spider so I can still be used.", "gags:3,objectification:1,submissive:1"),
        ("Occasional. I like being able to speak.", "gags:1,submissive:1"),
        ("Not for me. I want my words.", "submissive:1"),
    ]),
    ("Gags both ways…", [
        ("I want to gag and be gagged.", "switch:2,gags:3"),
        ("I like using one more.", "switch:1,gags:2,dominant:1"),
        ("I like wearing one more.", "switch:1,gags:2,submissive:1"),
        ("Hand-over-mouth both ways, not hardware.", "switch:1,gags:1,primal:1"),
        ("Hardware, with signals.", "switch:1,gags:2,bondage:1"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("Wax and heat you want to pour or hold…", [
        ("Drip, pattern, the flinch I chose.", "wax:3,sensory:2,sadist:1,dominant:1"),
        ("A long pour, area, a canvas of them.", "wax:3,sensory:2,objectification:1,dominant:1"),
        ("Heat without wax — packs, showers, the edge of too-warm.", "wax:2,sensory:2,dominant:1"),
        ("I like the idea. I rarely actually do it.", "wax:1,sensory:1,dominant:1"),
        ("Only with known melting points and a plan for the mess.", "wax:1,sensory:1,caregiver:1,dominant:1"),
        ("Not for me to give.", "dominant:1"),
    ]),
    ("Wax and heat you want to take…", [
        ("Drip, pattern, the flinch they chose.", "wax:3,sensory:2,masochist:1,submissive:1"),
        ("A long pour, area, being a canvas.", "wax:3,sensory:2,objectification:1,submissive:1"),
        ("Heat without wax — packs, showers, the edge of too-warm.", "wax:2,sensory:2,submissive:1"),
        ("I like the idea more than the drip.", "wax:1,sensory:1,submissive:1"),
        ("Only with known melting points.", "wax:1,sensory:1,submissive:1"),
        ("Not for me to take.", "submissive:1"),
    ]),
    ("Heat both ways is…", [
        ("I want to pour and to be poured on.", "switch:2,wax:3,sensory:1"),
        ("I like giving heat more.", "switch:1,wax:2,sadist:1"),
        ("I like taking heat more.", "switch:1,wax:2,masochist:1"),
        ("Packs and showers, not candles.", "switch:1,wax:1,sensory:2"),
        ("Full wax scenes both seats.", "switch:1,wax:3,sensory:1"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("Ice and cold you want to use on them…", [
        ("Cubes, trails, the shock I pace.", "cold:3,sensory:2,dominant:1"),
        ("Longer cold: packs, a floor, a wait.", "cold:3,sensory:1,sadist:1,dominant:1"),
        ("Contrast: ice then heat, or ice then impact.", "cold:2,wax:1,impact:1,sensory:2,dominant:1"),
        ("A beat, not a climate.", "cold:1,sensory:1,dominant:1"),
        ("I like the idea. I rarely actually do it.", "cold:1,dominant:1"),
        ("Not for me to give.", "dominant:1"),
    ]),
    ("Ice and cold you want used on you…", [
        ("Cubes, trails, the shock they pace.", "cold:3,sensory:2,submissive:1"),
        ("Longer cold: packs, a floor, a wait.", "cold:3,sensory:1,masochist:1,submissive:1"),
        ("Contrast: ice then heat, or ice then impact.", "cold:2,wax:1,impact:1,sensory:2,submissive:1"),
        ("A beat, not a climate.", "cold:1,sensory:1,submissive:1"),
        ("I like the idea more than the shiver.", "cold:1,submissive:1"),
        ("Not for me to take.", "submissive:1"),
    ]),
    ("Cold both ways is…", [
        ("I want to give the shock and take it.", "switch:2,cold:3,sensory:1"),
        ("I like applying it more.", "switch:1,cold:2"),
        ("I like taking it more.", "switch:1,cold:2"),
        ("Cubes only, both seats.", "switch:1,cold:1,sensory:1"),
        ("Longer cold, resourced.", "switch:1,cold:2,sadist:1,masochist:1"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("Electro you want to run…", [
        ("I want the control box. I will learn it, not guess.", "electro:3,sensory:1,sadist:1,dominant:1"),
        ("Tease-level only. Tickle, clench, not a scene of suffering.", "electro:2,sensory:2,dominant:1"),
        ("Meaner, if they asked and we know the unit.", "electro:3,sadist:2,dominant:1"),
        ("On a toy, not directly on them, until we are sure.", "electro:1,sensory:1,dominant:1"),
        ("I like the idea. I have not resourced it.", "electro:1,dominant:1"),
        ("Not for me to run.", "dominant:1"),
    ]),
    ("Electro you want to take…", [
        ("I want them on the box. Learned, not guessed.", "electro:3,sensory:1,masochist:1,submissive:1"),
        ("Tease-level only. Tickle, clench, not suffering as the point.", "electro:2,sensory:2,submissive:1"),
        ("Meaner, if I asked and we know the unit.", "electro:3,masochist:2,submissive:1"),
        ("On a toy, not directly on me, until we are sure.", "electro:1,sensory:1,submissive:1"),
        ("I like the idea more than I have tried.", "electro:1,submissive:1"),
        ("Not for me to take.", "submissive:1"),
    ]),
    ("Electro both ways is…", [
        ("I want to run the box and to be on it.", "switch:2,electro:3"),
        ("I like running it more.", "switch:1,electro:2,sadist:1"),
        ("I like being on it more.", "switch:1,electro:2,masochist:1"),
        ("Tease both ways.", "switch:1,electro:1,sensory:2"),
        ("Mean, resourced, both seats.", "switch:1,electro:2,sadist:1,masochist:1"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("Light sensation (feather, nails, Wartenberg, breath) you want to give…", [
        ("The main event. I can run a slow hour of almost-nothing.", "sensory:3,dominant:1"),
        ("A warm-up, then I go heavier.", "sensory:2,impact:1,dominant:1"),
        ("Tickle as sadism. I want the wriggle.", "sensory:2,funish-tickle:1,sadist:1,dominant:1"),
        ("Nails and bite more than toys.", "sensory:2,primal:2,dominant:1"),
        ("Occasional. I get bored if nothing lands.", "sensory:1,dominant:1"),
        ("Not for me to give. I want clearer verbs.", "dominant:1"),
    ]),
    ("Light sensation you want to take…", [
        ("The main event. A slow hour of almost-nothing.", "sensory:3,submissive:1"),
        ("A warm-up, then heavier.", "sensory:2,impact:1,submissive:1"),
        ("Tickle as sadism. I want to wriggle and not be allowed to leave.", "sensory:2,funish-tickle:1,masochist:1,submissive:1"),
        ("Nails and bite more than toys.", "sensory:2,primal:2,prey:1,submissive:1"),
        ("Occasional. I get bored if nothing lands.", "sensory:1,submissive:1"),
        ("Not for me. I want clearer verbs.", "submissive:1"),
    ]),
    ("Light sensation both ways is…", [
        ("I want to give the almost-nothing and to take it.", "switch:2,sensory:3"),
        ("I like giving it more.", "switch:1,sensory:2"),
        ("I like taking it more.", "switch:1,sensory:2"),
        ("Tickle both ways.", "switch:1,sensory:1,funish-tickle:2"),
        ("Nails and bite both ways.", "switch:1,sensory:1,primal:2"),
        ("Skip it as a scene. Fine as garnish.", "switch:1,sensory:1"),
    ]),
)
triad("kink",
    ("Orgasm denial you want to run…", [
        ("I want to hold theirs. Grant, delay, or close the door.", "orgasm-control:3,denial:3,dominant:1"),
        ("Edging for a scene, not a week.", "orgasm-control:3,denial:1,dominant:1"),
        ("Days, with check-ins, if they asked for that weather.", "orgasm-control:2,denial:3,chastity:1,dominant:1"),
        ("Denial as punishment, not as the default climate.", "denial:2,punish-denial:1,orgasm-control:1,dominant:1"),
        ("I like the idea. I am not consistent enough to run it yet.", "orgasm-control:1,dominant:1"),
        ("Not for me to hold. They can come when their body does.", "dominant:1"),
    ]),
    ("Orgasm denial you want to live under…", [
        ("I want mine held. Grant, delay, or close the door.", "orgasm-control:3,denial:3,submissive:1"),
        ("Edging for a scene, not a week.", "orgasm-control:3,denial:1,submissive:1"),
        ("Days, with check-ins, if I asked for that weather.", "orgasm-control:2,denial:3,chastity:1,submissive:1"),
        ("Denial as punishment, not as the default climate.", "denial:2,punish-denial:1,orgasm-control:1,submissive:1"),
        ("I like the idea more than I like the week of it.", "orgasm-control:1,submissive:1"),
        ("Not for me. I want to come when my body does.", "submissive:1"),
    ]),
    ("Denial both ways is…", [
        ("We can hold each other, on different stretches.", "switch:2,orgasm-control:3,denial:2"),
        ("I want to hold theirs more than I want mine held.", "switch:1,orgasm-control:2,denial:1,dominant:1"),
        ("I want mine held more than I want to be the lock.", "switch:1,orgasm-control:2,denial:2,submissive:1"),
        ("Scene-length only, both seats.", "switch:1,orgasm-control:2"),
        ("Longer weather, with check-ins, both seats.", "switch:1,denial:2,chastity:1"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("Edging you want to do to them…", [
        ("A long, mean edge until they shake, then I choose.", "orgasm-control:3,overstim:1,sadist:1,dominant:1"),
        ("Kind edging. Build, praise, then a granted orgasm.", "orgasm-control:2,praise:1,reward-orgasm:1,dominant:1"),
        ("Edging as training. They learn to wait on a word.", "orgasm-control:2,trainer:1,train-orgasm:1,dominant:1"),
        ("A beat inside sex, not a dedicated scene.", "orgasm-control:1,dominant:1"),
        ("I would rather ruin or deny than edge for ages.", "denial:2,orgasm-control:1,dominant:1"),
        ("Not for me to run.", "dominant:1"),
    ]),
    ("Edging you want done to you…", [
        ("A long, mean edge until I shake, then they choose.", "orgasm-control:3,overstim:1,masochist:1,submissive:1"),
        ("Kind edging. Build, praise, then a granted orgasm.", "orgasm-control:2,praise:1,reward-orgasm:1,submissive:1"),
        ("Edging as training. I want to wait on a word.", "orgasm-control:2,train-orgasm:1,submissive:1"),
        ("A beat inside sex, not a dedicated scene.", "orgasm-control:1,submissive:1"),
        ("I would rather be ruined or denied than edged for ages.", "denial:2,orgasm-control:1,submissive:1"),
        ("Not for me to take.", "submissive:1"),
    ]),
    ("Edging both ways is…", [
        ("I want to edge them and be edged.", "switch:2,orgasm-control:3"),
        ("I like running the edge more.", "switch:1,orgasm-control:2,dominant:1"),
        ("I like being edged more.", "switch:1,orgasm-control:2,submissive:1"),
        ("Kind both ways.", "switch:1,orgasm-control:1,praise:1"),
        ("Mean both ways.", "switch:1,orgasm-control:2,sadist:1,masochist:1"),
        ("Skip dedicated edging.", "switch:1"),
    ]),
)
triad("kink",
    ("Chastity you want to hold the key to…", [
        ("Yes. A device, a key, a check-in, a reason.", "chastity:3,orgasm-control:2,denial:2,ownership:1,dominant:1"),
        ("Short locks. An evening, a weekend — not a personality.", "chastity:2,orgasm-control:1,dominant:1"),
        ("Longer, if they asked, with hygiene and honesty scheduled.", "chastity:3,denial:1,caregiver:1,dominant:1"),
        ("Symbolic. A rule without hardware.", "chastity:1,orgasm-control:2,denial:1,dominant:1"),
        ("I like the idea. I have not resourced the care of it.", "chastity:1,dominant:1"),
        ("Not for me to keyhold.", "dominant:1"),
    ]),
    ("Chastity you want to wear…", [
        ("Yes. A device, a key they hold, a check-in, a reason.", "chastity:3,orgasm-control:2,denial:2,ownership:1,submissive:1"),
        ("Short locks. An evening, a weekend — not a personality.", "chastity:2,orgasm-control:1,submissive:1"),
        ("Longer, if I asked, with hygiene and honesty scheduled.", "chastity:3,denial:1,submissive:1"),
        ("Symbolic. A rule without hardware.", "chastity:1,orgasm-control:2,denial:1,submissive:1"),
        ("I like the idea more than the hardware.", "chastity:1,submissive:1"),
        ("Not for me to wear.", "submissive:1"),
    ]),
    ("Chastity both ways is…", [
        ("We can lock each other on different stretches.", "switch:2,chastity:3,orgasm-control:1"),
        ("I want to hold the key more.", "switch:1,chastity:2,dominant:1"),
        ("I want to wear it more.", "switch:1,chastity:2,submissive:1"),
        ("Short locks both ways.", "switch:1,chastity:1,orgasm-control:1"),
        ("Symbolic rules, no device.", "switch:1,orgasm-control:2,denial:1"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("Overstimulation you want to give…", [
        ("Forced orgasms they asked for, until I say stop.", "overstim:3,orgasm-control:2,sadist:1,dominant:1"),
        ("A little too-much at the end of a scene, then I land them.", "overstim:2,orgasm-control:1,caregiver:1,dominant:1"),
        ("Toy-and-hold. They cannot get away from the sensation.", "overstim:3,bondage:1,sadist:1,dominant:1"),
        ("I prefer denial to overstim.", "denial:2,orgasm-control:1,dominant:1"),
        ("Occasional. Not my identity.", "overstim:1,dominant:1"),
        ("Not for me to give.", "dominant:1"),
    ]),
    ("Overstimulation you want to take…", [
        ("Forced orgasms I asked for, until they say stop.", "overstim:3,orgasm-control:2,masochist:1,submissive:1"),
        ("A little too-much at the end, then a landing.", "overstim:2,orgasm-control:1,submissive:1"),
        ("Toy-and-hold. I cannot get away from the sensation.", "overstim:3,bondage:1,masochist:1,submissive:1"),
        ("I prefer denial to overstim.", "denial:2,orgasm-control:1,submissive:1"),
        ("Occasional. Not my identity.", "overstim:1,submissive:1"),
        ("Not for me to take.", "submissive:1"),
    ]),
    ("Overstim both ways is…", [
        ("I want to give too-much and take it.", "switch:2,overstim:3,orgasm-control:1"),
        ("I like giving it more.", "switch:1,overstim:2,sadist:1"),
        ("I like taking it more.", "switch:1,overstim:2,masochist:1"),
        ("A little too-much, both seats, then landing.", "switch:1,overstim:1,caregiver:1"),
        ("Dedicated forced-orgasm scenes, both seats.", "switch:1,overstim:3,orgasm-control:1"),
        ("Skip it.", "switch:1"),
    ]),
)
print("kink-mid", sum(1 for i in ITEMS if i["section"] == "kink"))

triad("kink",
    ("Verbal humiliation you want to use (only with a written yes)…", [
        ("A tool I can use if we wrote the words down.", "humiliation:3,sadist:1,dominant:1"),
        ("Name-calling they asked for, specific, not a real wound.", "humiliation:3,dominant:1"),
        ("I will humiliate the brat, not the person.", "humiliation:2,brat-tamer:1,dominant:1"),
        ("I prefer praise. Humiliation is a hard no from my mouth.", "praise:3,caregiver:1,dominant:1"),
        ("Light only: teasing, not degradation.", "humiliation:1,funish-embarrass:1,dominant:1"),
        ("I like receiving it more than giving it.", "humiliation:1,switch:2"),
    ]),
    ("Verbal humiliation aimed at you (only with a written yes) is…", [
        ("A door I want opened carefully, never with a real wound.", "humiliation:3,submissive:1"),
        ("Name-calling I asked for, specific.", "humiliation:3,submissive:1"),
        ("Brat-humiliation. Tease the smirk, not the person.", "humiliation:2,brat:1,submissive:1"),
        ("A hard no. Praise and use, not shame.", "praise:3,submissive:1"),
        ("Light only: teasing, not degradation.", "humiliation:1,funish-embarrass:1,submissive:1"),
        ("I like giving it more than taking it.", "humiliation:1,switch:2"),
    ]),
    ("Humiliation both ways is…", [
        ("Sometimes give, sometimes take, with a list.", "switch:2,humiliation:3"),
        ("I like using it more.", "switch:1,humiliation:2,sadist:1"),
        ("I like taking it more.", "switch:1,humiliation:2"),
        ("Light teasing both ways, never degradation.", "switch:1,humiliation:1,funish-embarrass:1"),
        ("A no in both seats.", "switch:1,praise:2"),
        ("We have not written the word-list yet.", "switch:1,humiliation:1"),
    ]),
)
triad("kink",
    ("Degradation and objectification you want to do…", [
        ("Use them as furniture, a toy, a thing — with a landing afterwards.", "objectification:3,degradation:2,dominant:1"),
        ("Body-writing, inspection, being displayed to me.", "objectification:2,degradation:1,exhibition:1,dominant:1"),
        ("I will objectify in a scene. I will not degrade the person.", "objectification:2,dominant:1"),
        ("A no. I want a person I am using, not a thing I pretend isn't there.", "praise:1,dominant:1"),
        ("Only if they asked for the specific script.", "objectification:1,degradation:1,dominant:1"),
        ("I want it done to me more than I want to do it.", "objectification:1,switch:2"),
    ]),
    ("Degradation and objectification done to you…", [
        ("Use me as furniture, a toy, a thing — with a landing afterwards.", "objectification:3,degradation:2,submissive:1"),
        ("Body-writing, inspection, being displayed to them.", "objectification:2,degradation:1,exhibition:1,submissive:1"),
        ("Objectify me in a scene. Do not degrade the person.", "objectification:2,submissive:1"),
        ("A no. I want to be a person being used, not a thing you pretend isn't there.", "praise:1,submissive:1"),
        ("Only if I asked for the specific script.", "objectification:1,degradation:1,submissive:1"),
        ("I want to do it more than I want it done to me.", "objectification:1,switch:2"),
    ]),
    ("Objectification both ways is…", [
        ("We can take turns being the toy.", "switch:2,objectification:3"),
        ("I like using more.", "switch:1,objectification:2,dominant:1"),
        ("I like being used as a thing more.", "switch:1,objectification:2,submissive:1"),
        ("Inspection and display, not furniture.", "switch:1,objectification:1,exhibition:1"),
        ("A no in both seats.", "switch:1"),
        ("Only with a written script and a landing.", "switch:1,objectification:1,degradation:1"),
    ]),
)
triad("kink",
    ("Praise from your mouth, during play, is…", [
        ("The main lever. Specific, earned, not a script.", "praise:3,caregiver:1,dominant:1"),
        ("A reward I grant. Not free.", "praise:2,reward-praise:2,dominant:1"),
        ("Mixed with filth. Good and used in the same breath.", "praise:2,humiliation:1,dominant:1"),
        ("Quiet. I praise after, not during.", "praise:1,dominant:1"),
        ("I am bad at it and I want to get better.", "praise:1,trainer:1,dominant:1"),
        ("I want to hear it more than I want to give it.", "praise:1,switch:2"),
    ]),
    ("Praise aimed at you, during play, is…", [
        ("The main lever. Specific, earned, not a script.", "praise:3,princess:1,submissive:1"),
        ("A reward I want to earn. Not free.", "praise:2,reward-praise:2,submissive:1"),
        ("Mixed with filth. Good and used in the same breath.", "praise:2,humiliation:1,submissive:1"),
        ("Quiet. Praise me after, not during.", "praise:1,submissive:1"),
        ("I need more of it than I admit.", "praise:3,little:1,submissive:1"),
        ("I want to give it more than I want to hear it.", "praise:1,switch:2"),
    ]),
    ("Praise both ways is…", [
        ("We should both be specific. Either seat.", "switch:2,praise:3"),
        ("I praise more than I need to hear it.", "switch:1,praise:2,dominant:1"),
        ("I need to hear it more than I remember to give it.", "switch:1,praise:2,submissive:1"),
        ("During the scene both ways.", "switch:1,praise:2"),
        ("Aftercare both ways, not mid-scene.", "switch:1,praise:1,reward-aftercare:1"),
        ("Not our language. We show it another way.", "switch:1"),
    ]),
)
triad("kink",
    ("Exhibition — them being seen — that you want to run…", [
        ("I want to watch them perform for me. Private audience of one.", "exhibition:3,voyeurism:2,dominant:1"),
        ("I want them naked in the house on purpose, blinds we control.", "exhibition:2,dominant:1"),
        ("Photos or video we keep, for us, not the internet.", "exhibition:2,voyeurism:1,dominant:1"),
        ("Risk-of-being-seen that is actually risk-managed — a window we chose, not a stranger's consent.", "exhibition:2,dominant:1"),
        ("I like the idea. In practice I want the door locked.", "exhibition:1,dominant:1"),
        ("Not for me to ask. Keep it private.", "dominant:1"),
    ]),
    ("Exhibition — you being seen — that you want…", [
        ("I want to be seen by them. Private audience of one.", "exhibition:3,princess:1,submissive:1"),
        ("Naked in the house on purpose, blinds we control.", "exhibition:2,submissive:1"),
        ("Photos or video we keep, for us, not the internet.", "exhibition:2,submissive:1"),
        ("Risk-of-being-seen that is actually risk-managed — a window we chose.", "exhibition:2,submissive:1"),
        ("I like the idea. In practice I want the door locked.", "exhibition:1,submissive:1"),
        ("Not for me. Keep it private.", "submissive:1"),
    ]),
    ("Exhibition both ways is…", [
        ("Both seats of the glass. I watch and I am shown.", "switch:2,exhibition:3,voyeurism:1"),
        ("I like watching more.", "switch:1,voyeurism:3,exhibition:1"),
        ("I like being shown more.", "switch:1,exhibition:3"),
        ("In-house only, both ways.", "switch:1,exhibition:2"),
        ("Photos we keep, both as subject and as shooter.", "switch:2,exhibition:1,voyeurism:1"),
        ("Keep it private. Eyes other than ours kill it.", "switch:1"),
    ]),
)
triad("kink",
    ("Voyeurism — you watching — is…", [
        ("I want to watch them with themselves. A show for me.", "voyeurism:3,exhibition:1,dominant:1"),
        ("I want to watch them with a toy I chose.", "voyeurism:2,orgasm-control:1,dominant:1"),
        ("I want to watch them serve, dress, kneel — not only sex.", "voyeurism:2,service:1,dominant:1"),
        ("Mirror, camera-to-our-phone, the reflection — still us.", "voyeurism:2,exhibition:1,dominant:1"),
        ("I like being watched more than watching.", "exhibition:2,switch:1"),
        ("Not my kink. I want to be in it.", "dominant:1"),
    ]),
    ("Being watched by them is…", [
        ("I want them to watch me with myself. A show for them.", "exhibition:3,voyeurism:1,submissive:1"),
        ("I want them to watch me with a toy they chose.", "exhibition:2,orgasm-control:1,submissive:1"),
        ("I want them to watch me serve, dress, kneel — not only sex.", "exhibition:2,service:1,submissive:1"),
        ("Mirror, camera-to-our-phone — still us.", "exhibition:2,submissive:1"),
        ("I like watching them more than being watched.", "voyeurism:2,switch:1"),
        ("Not my kink. I want them in it with me.", "submissive:1"),
    ]),
    ("Watching and being watched is…", [
        ("Both. We can take turns at the glass.", "switch:2,voyeurism:2,exhibition:2"),
        ("I am more voyeur.", "switch:1,voyeurism:3"),
        ("I am more exhibitionist.", "switch:1,exhibition:3"),
        ("Mirrors and our own camera only.", "switch:1,voyeurism:1,exhibition:1"),
        ("Live in the room, no lens.", "switch:1,voyeurism:1,exhibition:1"),
        ("Skip the watching games.", "switch:1"),
    ]),
)
triad("kink",
    ("Pet play you want to run…", [
        ("Handler. Gear, water, simple rules, pride.", "pet-play:3,handler:2,dominant:1"),
        ("Pup or pet as a scene, not a 24/7 identity.", "pet-play:2,dominant:1"),
        ("Kitten: soft, clawed, bratty.", "pet-play:2,kitten:1,brat-tamer:1,dominant:1"),
        ("Pony or show-pet: posture, inspection, lead.", "pet-play:2,objectification:1,dominant:1"),
        ("I can do a little gear. I am not a handler by identity.", "pet-play:1,dominant:1"),
        ("Not for me to run.", "dominant:1"),
    ]),
    ("Pet play you want to wear…", [
        ("Pet or pup. Gear, simple rules, being kept.", "pet-play:3,pet:2,pup:2,submissive:1"),
        ("A scene, not a 24/7 identity.", "pet-play:2,submissive:1"),
        ("Kitten: soft, clawed, bratty.", "pet-play:2,kitten:3,brat:1,submissive:1"),
        ("Pony or show-pet: posture, inspection, lead.", "pet-play:2,objectification:1,pet:1,submissive:1"),
        ("A little gear. I am not a pet by identity.", "pet-play:1,submissive:1"),
        ("Not for me to wear.", "submissive:1"),
    ]),
    ("Pet play both ways is…", [
        ("Handler and pet, traded.", "switch:2,pet-play:3,handler:1,pet:1"),
        ("I handle more.", "switch:1,pet-play:2,handler:2"),
        ("I wear more.", "switch:1,pet-play:2,pet:2,pup:1"),
        ("Scenes only, both seats.", "switch:1,pet-play:1"),
        ("More animal than cute: less gear, more body.", "switch:1,pet-play:1,primal:2"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("Primal play you want to run…", [
        ("Hunt, catch, pin, bite. Words optional.", "primal:3,dominant:1"),
        ("Wrestling until they lose.", "primal:2,brat-tamer:1,dominant:1"),
        ("Predator energy without a full chase — growl, hold, eat.", "primal:2,dominant:1"),
        ("A scene we book, not a personality I am always in.", "primal:1,dominant:1"),
        ("I like the idea. I actually want more protocol than animal.", "primal:1,protocol:1,dominant:1"),
        ("Not for me to run.", "dominant:1"),
    ]),
    ("Primal play you want to be in as prey…", [
        ("Hunted, caught, pinned, bitten. Words optional.", "primal:3,prey:3,submissive:1"),
        ("Wrestling until I lose.", "primal:2,brat:1,prey:1,submissive:1"),
        ("Prey energy without a full chase — growl, hold, eaten.", "primal:2,prey:2,submissive:1"),
        ("A scene we book, not a personality I am always in.", "primal:1,submissive:1"),
        ("I like the idea. I actually want more protocol than animal.", "primal:1,protocol:1,submissive:1"),
        ("Not for me.", "submissive:1"),
    ]),
    ("Primal both ways is…", [
        ("Hunter and prey, traded.", "switch:2,primal:3,prey:2"),
        ("I hunt more.", "switch:1,primal:3,dominant:1"),
        ("I flee more.", "switch:1,primal:2,prey:3,submissive:1"),
        ("Wrestling both ways, less bite.", "switch:1,primal:2"),
        ("Growl and hold, no chase.", "switch:1,primal:1"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("A collar you put on them is mostly…", [
        ("Something I put on, and take responsibility for.", "collaring:3,ownership:3,owner:2,dominant:1"),
        ("Play collars for scenes. The forever one is a later conversation.", "collaring:2,ownership:1,dominant:1"),
        ("A house collar. On at the door, off when we agreed.", "collaring:2,ownership:2,proto-collar:1,dominant:1"),
        ("Jewellery. The ritual around it matters more than the object.", "collaring:1,protocol:1,dominant:1"),
        ("I like the look. I do not want the ownership speech.", "collaring:1,dominant:1"),
        ("Not for me to put on.", "dominant:1"),
    ]),
    ("A collar on you is mostly…", [
        ("Something I want to wear, even if only in the house.", "collaring:3,ownership:3,slave:1,submissive:1"),
        ("Play collars for scenes. The forever one is a later conversation.", "collaring:2,ownership:1,submissive:1"),
        ("A house collar. On at the door, off when we agreed.", "collaring:2,ownership:2,proto-collar:1,submissive:1"),
        ("Jewellery. The ritual around it matters more than the object.", "collaring:1,protocol:1,submissive:1"),
        ("I like the look. I do not want the ownership speech.", "collaring:1,submissive:1"),
        ("Not for me to wear.", "submissive:1"),
    ]),
    ("Collars both ways are…", [
        ("We can collar each other in different rooms.", "switch:2,collaring:3,ownership:2"),
        ("I want to put one on more.", "switch:1,collaring:2,owner:1,dominant:1"),
        ("I want to wear one more.", "switch:1,collaring:2,submissive:1"),
        ("Play collars, both seats, no forever speech.", "switch:1,collaring:1"),
        ("House rules, both seats, on a schedule.", "switch:1,collaring:2,proto-collar:1"),
        ("Skip the object. Words are enough.", "switch:1,ownership:1"),
    ]),
)
triad("kink",
    ("Service as a kink you want offered to you…", [
        ("Yes. Noticed, used, not treated as unpaid labour I never named.", "service:3,dominant:1"),
        ("Ritual service: drink, kneel, present — not the whole household.", "service:2,protocol:1,dominant:1"),
        ("Domestic devotion. The boring work is the heat.", "service:3,dominant:1"),
        ("Body service more than chores.", "service:2,worship:1,dominant:1"),
        ("Occasional. I do not want a servant identity in the house.", "service:1,dominant:1"),
        ("Not my kink. We share the work as adults.", "dominant:1"),
    ]),
    ("Service as a kink you want to offer…", [
        ("Yes. Noticed, used, not unpaid labour they never named.", "service:3,submissive:1"),
        ("Ritual service: drink, kneel, present — not the whole household.", "service:2,protocol:1,submissive:1"),
        ("Domestic devotion. The boring work is the heat.", "service:3,submissive:1"),
        ("Body service more than chores.", "service:2,worship:1,submissive:1"),
        ("Occasional. I do not want a servant identity.", "service:1,submissive:1"),
        ("Not my kink. We share the work as adults.", "submissive:1"),
    ]),
    ("Service as kink, both ways, is…", [
        ("We serve each other with a tilt, on different days.", "switch:2,service:3"),
        ("I want to be served more.", "switch:1,service:2,dominant:1"),
        ("I want to serve more.", "switch:1,service:3,submissive:1"),
        ("Ritual only, both seats.", "switch:1,service:1,protocol:1"),
        ("Domestic both ways, eroticized on purpose.", "switch:1,service:2"),
        ("Not a kink for us. Just a household.", "switch:1"),
    ]),
)
print("kink-late", sum(1 for i in ITEMS if i["section"] == "kink"))

triad("kink",
    ("CNC / take-down you want to run (adults, written, rehearsed stop)…", [
        ("A planned take-down. They know the window; inside it I do not ask twice.", "cnc:3,primal:1,dominant:1"),
        ("Resistance play they asked for. I want the struggle, then the pin.", "cnc:3,primal:2,dominant:1"),
        ("Verbal CNC — 'no' that means go — only with a different stop word.", "cnc:2,dominant:1"),
        ("I like the fantasy. I want a softer version in the room.", "cnc:1,dominant:1"),
        ("Too much risk for me to run until we have a lot of practice.", "cnc:1,caregiver:1,dominant:1"),
        ("A no from my side. We can play intense without that script.", "dominant:1"),
    ]),
    ("CNC / take-down you want to be in (adults, written, rehearsed stop)…", [
        ("A planned take-down. I know the window; inside it they do not ask twice.", "cnc:3,prey:1,submissive:1"),
        ("Resistance I asked for. I want to struggle, then be pinned.", "cnc:3,primal:2,prey:1,submissive:1"),
        ("Verbal CNC — 'no' that means go — only with a different stop word.", "cnc:2,submissive:1"),
        ("I like the fantasy. I want a softer version in the room.", "cnc:1,submissive:1"),
        ("Too much for me until we have a lot of practice.", "cnc:1,submissive:1"),
        ("A no. We can play intense without that script.", "submissive:1"),
    ]),
    ("CNC both ways is…", [
        ("We can take turns at the take-down if we wrote it.", "switch:2,cnc:3,primal:1"),
        ("I want to run it more.", "switch:1,cnc:2,dominant:1"),
        ("I want to be taken more.", "switch:1,cnc:2,submissive:1,prey:1"),
        ("Resistance play, not a full CNC script.", "switch:1,cnc:1,primal:1"),
        ("Fantasy only, for now.", "switch:1,cnc:1"),
        ("A no in both seats.", "switch:1"),
    ]),
)
triad("kink",
    ("Medical play you want to run…", [
        ("Examination, gloves, being clinical with a body I am allowed to.", "medical:3,objectification:1,dominant:1"),
        ("Temperature, speculum-level curiosity, only with real knowledge.", "medical:2,sensory:1,dominant:1"),
        ("A scene of embarrassment-and-care, not a hospital fetish identity.", "medical:2,humiliation:1,caregiver:1,dominant:1"),
        ("I like the look. I have not learned enough to do it well.", "medical:1,dominant:1"),
        ("Too close to real medical trauma for me to run.", "medical:1,dominant:1"),
        ("Not for me to run.", "dominant:1"),
    ]),
    ("Medical play you want to be in…", [
        ("Examination, gloves, being clinical with my body.", "medical:3,objectification:1,submissive:1"),
        ("Temperature, instruments, only with real knowledge on their side.", "medical:2,sensory:1,submissive:1"),
        ("Embarrassment-and-care, not a hospital identity.", "medical:2,humiliation:1,submissive:1"),
        ("I like the idea more than I have tried.", "medical:1,submissive:1"),
        ("Too close to real medical stuff for me.", "medical:1,submissive:1"),
        ("Not for me.", "submissive:1"),
    ]),
    ("Medical play both ways is…", [
        ("We can take turns as the clinician.", "switch:2,medical:3"),
        ("I like running it more.", "switch:1,medical:2,dominant:1"),
        ("I like being examined more.", "switch:1,medical:2,submissive:1"),
        ("Light only: gloves, look, thermometer energy.", "switch:1,medical:1,sensory:1"),
        ("Fuller scenes, resourced.", "switch:1,medical:2"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("Interrogation / questioning you want to run…", [
        ("A scene with a question they have to answer, and a price for stalling.", "interrogation:3,sadist:1,dominant:1"),
        ("Confession as intimacy. I want the truth more than the theatre.", "interrogation:2,dominant:1"),
        ("Tied to impact or predicament: answer, or the next count.", "interrogation:2,impact:1,predicament:1,dominant:1"),
        ("Playful. I will not actually scare them.", "interrogation:1,brat-tamer:1,dominant:1"),
        ("I like the idea. I do not want to be cruel in that chair.", "interrogation:1,dominant:1"),
        ("Not for me to run.", "dominant:1"),
    ]),
    ("Interrogation you want to be put through…", [
        ("A scene with a question I have to answer, and a price for stalling.", "interrogation:3,masochist:1,submissive:1"),
        ("Confession as intimacy. Take the truth, not only the theatre.", "interrogation:2,submissive:1"),
        ("Tied to impact or predicament: answer, or the next count.", "interrogation:2,impact:1,predicament:1,submissive:1"),
        ("Playful. Do not actually scare me.", "interrogation:1,brat:1,submissive:1"),
        ("I like the idea. I do not want to be actually frightened.", "interrogation:1,submissive:1"),
        ("Not for me.", "submissive:1"),
    ]),
    ("Interrogation both ways is…", [
        ("We can question each other on different nights.", "switch:2,interrogation:3"),
        ("I like asking more.", "switch:1,interrogation:2,dominant:1"),
        ("I like being questioned more.", "switch:1,interrogation:2,submissive:1"),
        ("Playful both ways.", "switch:1,interrogation:1"),
        ("Meaner, with a stop that still works.", "switch:1,interrogation:2,sadist:1,masochist:1"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("Worship you want aimed at you…", [
        ("Body worship. Hands, mouth, time, no rush.", "worship:3,service:1,dominant:1"),
        ("Boot, shoe, or a specific object we chose.", "worship:3,service:1,dominant:1"),
        ("Verbal worship. I want to be addressed as if I matter that much.", "worship:2,praise:1,dominant:1"),
        ("A beat at the start of a scene, not a religion.", "worship:1,dominant:1"),
        ("I get awkward being worshipped. A little is enough.", "worship:1,dominant:1"),
        ("Not for me to receive.", "dominant:1"),
    ]),
    ("Worship you want to offer…", [
        ("Body worship. Hands, mouth, time, no rush.", "worship:3,service:2,submissive:1"),
        ("Boot, shoe, or a specific object we chose.", "worship:3,service:1,submissive:1"),
        ("Verbal worship. I want to address them as if they matter that much.", "worship:2,praise:1,submissive:1"),
        ("A beat at the start of a scene, not a religion.", "worship:1,submissive:1"),
        ("I get awkward offering it. A little is enough.", "worship:1,submissive:1"),
        ("Not for me to offer.", "submissive:1"),
    ]),
    ("Worship both ways is…", [
        ("We can worship each other on different nights.", "switch:2,worship:3"),
        ("I want to receive more.", "switch:1,worship:2,dominant:1"),
        ("I want to offer more.", "switch:1,worship:2,service:1,submissive:1"),
        ("Body only, both seats.", "switch:1,worship:2"),
        ("Verbal only, both seats.", "switch:1,worship:1,praise:1"),
        ("Skip it.", "switch:1"),
    ]),
)
triad("kink",
    ("Breath play you would consider running (informed, no macho)…", [
        ("Hand on the throat as pressure and claim, not as a choke they cannot breathe through.", "breath:2,ownership:1,primal:1,dominant:1"),
        ("I will not restrict breath. Too much risk for the heat.", "dominant:1"),
        ("I want education before I ever try. Curiosity, not a scene this month.", "breath:1,dominant:1"),
        ("A no. We can play intensity without that tool.", "dominant:1"),
        ("Only the lightest hold they can leave at any second, and we have talked about the medicine of it.", "breath:1,caregiver:1,dominant:1"),
        ("I want it done to me more than I want to run it.", "breath:1,switch:2"),
    ]),
    ("Breath play you would consider taking (informed, no macho)…", [
        ("Hand on the throat as pressure and claim, not as a choke I cannot breathe through.", "breath:2,ownership:1,primal:1,submissive:1"),
        ("I will not have my breath restricted. Too much risk for the heat.", "submissive:1"),
        ("I want education before we ever try. Curiosity, not a scene this month.", "breath:1,submissive:1"),
        ("A no. Intensity without that tool.", "submissive:1"),
        ("Only the lightest hold I can leave at any second, after we have talked about the medicine of it.", "breath:1,submissive:1"),
        ("I want to run it more than I want to take it.", "breath:1,switch:2"),
    ]),
    ("Breath play both ways is…", [
        ("Claim-hold only, both seats, leave-at-any-second.", "switch:1,breath:2,ownership:1"),
        ("A no in both seats. We will not.", "switch:1"),
        ("Education first. No scene until we know more.", "switch:1,breath:1"),
        ("I am more willing to receive a claim-hold than to give one.", "switch:1,breath:1,submissive:1"),
        ("I am more willing to give a claim-hold than to take one.", "switch:1,breath:1,dominant:1"),
        ("Not even a claim-hold. Hands live elsewhere.", "switch:1"),
    ]),
)
triad("kink",
    ("Knife or fear-play you want to run (dull / safe tools, no blood machismo)…", [
        ("A cold blunt blade as sensation and fear, never a cut.", "knife:3,sensory:1,sadist:1,dominant:1"),
        ("The idea of the edge as theatre. I will not bring a real knife.", "knife:1,interrogation:1,dominant:1"),
        ("I want education and a specific tool before I ever try.", "knife:1,dominant:1"),
        ("A no. Fear is not a toy I will pick up.", "dominant:1"),
        ("Scratch-lite with something we named, not a kitchen knife.", "knife:2,sensory:1,dominant:1"),
        ("I want it done to me more than I want to run it.", "knife:1,switch:2"),
    ]),
    ("Knife or fear-play you want to take (dull / safe tools, no blood machismo)…", [
        ("A cold blunt blade as sensation and fear, never a cut.", "knife:3,sensory:1,masochist:1,submissive:1"),
        ("The idea of the edge as theatre. Do not bring a real knife.", "knife:1,interrogation:1,submissive:1"),
        ("I want education and a specific tool before we ever try.", "knife:1,submissive:1"),
        ("A no. Fear is not a toy I will take.", "submissive:1"),
        ("Scratch-lite with something we named, not a kitchen knife.", "knife:2,sensory:1,submissive:1"),
        ("I want to run it more than I want to take it.", "knife:1,switch:2"),
    ]),
    ("Knife / fear-play both ways is…", [
        ("Blunt sensation both seats, never a cut.", "switch:1,knife:3,sensory:1"),
        ("A no in both seats.", "switch:1"),
        ("Education first.", "switch:1,knife:1"),
        ("I am more willing to receive it.", "switch:1,knife:1,submissive:1"),
        ("I am more willing to run it.", "switch:1,knife:1,dominant:1"),
        ("Theatre only. No object that looks like a weapon.", "switch:1,interrogation:1"),
    ]),
)

add("kink", "dominant", "If you had to drop three kinks from your real rotation — not the Pinterest one — you would still keep…", [
    ("Impact and the implements I actually own.", "impact:2,spanking:1,flogging:1,cane:1,dominant:1"),
    ("Bondage: rope or cuffs, the helpless shape.", "bondage:2,rope:1,cuffs:1,dominant:1"),
    ("Control of orgasm, denial, or chastity.", "orgasm-control:2,denial:1,chastity:1,dominant:1"),
    ("Protocol, ownership, the collar, the name.", "ownership:2,collaring:1,protocol:1,dominant:1"),
    ("The animal: primal, pet, hunt.", "primal:2,pet-play:1,dominant:1"),
    ("Voice: praise, humiliation, or worship — words as the scene.", "praise:1,humiliation:1,worship:1,dominant:1"),
])

print("kink", sum(1 for i in ITEMS if i["section"] == "kink"))
print("counts", __import__("collections").Counter((i["section"], i["role"]) for i in ITEMS))


# ---------------------------------------------------------------------------
# Practice sections — 20 each, 7 D / 7 s / 6 switch
# Six triads (18) + one extra D + one extra s = 20
# ---------------------------------------------------------------------------

def practice(section, triads, extra_d, extra_s):
    for d, s, w in triads:
        triad(section, d, s, w)
    add(section, "dominant", extra_d[0], extra_d[1])
    add(section, "submissive", extra_s[0], extra_s[1])

practice(
    "rewards",
    [
        (
            ("When they have done well, the reward you actually like to give is…", [
                ("Specific praise. I tell them what I saw.", "reward-praise:3,praise:1,dominant:1"),
                ("Orgasm, granted, as a prize — not as a default.", "reward-orgasm:3,orgasm-control:1,dominant:1"),
                ("A privilege: furniture, clothes, a rule lifted for a day.", "reward-privilege:3,reward-freedom:1,dominant:1"),
                ("A token, a note, a small gift that says I noticed.", "reward-gift:3,dominant:1"),
                ("Time. Undivided, no phone, I stay.", "reward-time:3,dominant:1"),
                ("They pick the next scene. Choice as the prize.", "reward-choice:3,dominant:1"),
            ]),
            ("When you have done well, the reward you actually want is…", [
                ("Specific praise. Tell me what you saw.", "reward-praise:3,praise:1,submissive:1"),
                ("Orgasm, granted, as a prize — not as a default.", "reward-orgasm:3,orgasm-control:1,submissive:1"),
                ("A privilege: furniture, clothes, a rule lifted for a day.", "reward-privilege:3,reward-freedom:1,submissive:1"),
                ("A token, a note, a small gift that says you noticed.", "reward-gift:3,submissive:1"),
                ("Time. Undivided, no phone, you stay.", "reward-time:3,submissive:1"),
                ("I pick the next scene. Choice as the prize.", "reward-choice:3,submissive:1"),
            ]),
            ("Rewards, both seats, are…", [
                ("We should know each other's prize language and use it.", "switch:2,reward-praise:1,reward-time:1"),
                ("I like giving rewards more than receiving them.", "switch:1,reward-praise:1,dominant:1"),
                ("I like receiving them more than inventing them.", "switch:1,reward-praise:1,submissive:1"),
                ("Orgasm-as-prize both ways.", "switch:1,reward-orgasm:2"),
                ("Tokens and notes both ways.", "switch:1,reward-gift:2"),
                ("We are bad at rewards. I want to get better.", "switch:1"),
            ]),
        ),
        (
            ("A mark of favour you like to give is…", [
                ("A collar, ribbon, or wear-this-today.", "reward-mark:3,collaring:1,dominant:1"),
                ("A bruise or bite they asked to keep.", "reward-mark:2,ownership:1,dominant:1"),
                ("Public-lite: a look, a word only we know, in a room of people.", "reward-mark:2,exhibition:1,dominant:1"),
                ("Aftercare extras: bath, food I made, the good blanket.", "reward-aftercare:3,caregiver:1,dominant:1"),
                ("Extra play they have been asking for.", "reward-play:3,dominant:1"),
                ("I forget to mark favour. I will try.", "dominant:1"),
            ]),
            ("A mark of favour you want to receive is…", [
                ("A collar, ribbon, or wear-this-today.", "reward-mark:3,collaring:1,submissive:1"),
                ("A bruise or bite I asked to keep.", "reward-mark:2,ownership:1,submissive:1"),
                ("Public-lite: a look, a word only we know.", "reward-mark:2,exhibition:1,submissive:1"),
                ("Aftercare extras: bath, food, the good blanket.", "reward-aftercare:3,submissive:1"),
                ("Extra play I have been asking for.", "reward-play:3,submissive:1"),
                ("I do not need a mark. The night was enough.", "submissive:1"),
            ]),
            ("Marks of favour, traded, are…", [
                ("We can pin, ribbon, or note each other.", "switch:2,reward-mark:2"),
                ("I like giving the mark more.", "switch:1,reward-mark:2,dominant:1"),
                ("I like wearing the mark more.", "switch:1,reward-mark:2,submissive:1"),
                ("Aftercare extras both ways.", "switch:1,reward-aftercare:2"),
                ("Extra play as the prize, both ways.", "switch:1,reward-play:2"),
                ("Skip the tokens. Words are enough.", "switch:1,reward-praise:1"),
            ]),
        ),
        (
            ("Privileges you like to grant…", [
                ("The bed, the sofa, clothes they like, a phone hour.", "reward-privilege:3,dominant:1"),
                ("Orgasm permission for a day.", "reward-privilege:2,reward-orgasm:2,dominant:1"),
                ("A rule parked on purpose. Freedom as a gift, not a leak.", "reward-freedom:3,dominant:1"),
                ("They may ask for something usually off-menu.", "reward-choice:2,reward-play:1,dominant:1"),
                ("I do not do privilege-economies. Too much accounting.", "dominant:1"),
                ("I will grant, and I want privileges when I have been good in the other seat.", "switch:2,reward-privilege:1"),
            ]),
            ("Privileges you want granted…", [
                ("The bed, the sofa, clothes I like, a phone hour.", "reward-privilege:3,submissive:1"),
                ("Orgasm permission for a day.", "reward-privilege:2,reward-orgasm:2,submissive:1"),
                ("A rule parked on purpose. Freedom as a gift, not a leak.", "reward-freedom:3,submissive:1"),
                ("I may ask for something usually off-menu.", "reward-choice:2,reward-play:1,submissive:1"),
                ("I do not want a privilege-economy. Too much accounting.", "submissive:1"),
                ("I want privileges, and I want to grant them in the other seat.", "switch:2,reward-privilege:1"),
            ]),
            ("Privilege-economies both ways are…", [
                ("Fine if the list is short and real.", "switch:2,reward-privilege:2,reward-freedom:1"),
                ("I like holding the keys more.", "switch:1,reward-privilege:2,dominant:1"),
                ("I like earning them more.", "switch:1,reward-privilege:2,submissive:1"),
                ("Freedom-days more than object-privileges.", "switch:1,reward-freedom:3"),
                ("Orgasm-permission as the main privilege.", "switch:1,reward-orgasm:2,reward-privilege:1"),
                ("Too much accounting for us.", "switch:1"),
            ]),
        ),
        (
            ("Time and attention as a reward you give…", [
                ("I stay. The hour after is the prize.", "reward-time:3,reward-aftercare:1,dominant:1"),
                ("A planned date they did not have to earn by being useful.", "reward-time:3,dominant:1"),
                ("I put the phone away on purpose.", "reward-time:2,dominant:1"),
                ("I watch them do the thing they wanted me to see.", "reward-time:2,voyeurism:1,dominant:1"),
                ("I am bad at this and it is the one they actually want.", "reward-time:1,dominant:1"),
                ("I want that time given to me too.", "switch:1,reward-time:2"),
            ]),
            ("Time and attention as a reward you want…", [
                ("They stay. The hour after is the prize.", "reward-time:3,reward-aftercare:1,submissive:1"),
                ("A planned date I did not have to earn by being useful.", "reward-time:3,submissive:1"),
                ("The phone away on purpose.", "reward-time:2,submissive:1"),
                ("They watch me do the thing I wanted them to see.", "reward-time:2,exhibition:1,submissive:1"),
                ("This is the one I actually want, and I will say so.", "reward-time:2,submissive:1"),
                ("I want to give that time too.", "switch:1,reward-time:2"),
            ]),
            ("Time as prize, both ways, is…", [
                ("We should treat undivided hours as a real reward.", "switch:2,reward-time:3"),
                ("I am better at giving time than asking for it.", "switch:1,reward-time:2,dominant:1"),
                ("I am better at wanting time than granting it.", "switch:1,reward-time:2,submissive:1"),
                ("Aftercare hours, specifically.", "switch:1,reward-time:1,reward-aftercare:2"),
                ("Dates, specifically.", "switch:1,reward-time:2"),
                ("We already live together; time is not a prize.", "switch:1"),
            ]),
        ),
        (
            ("Aftercare extras you like to give as a reward…", [
                ("Bath, food, the good blanket, a longer hold.", "reward-aftercare:3,caregiver:1,dominant:1"),
                ("A debrief that is actually kind, not a performance review.", "reward-aftercare:2,reward-praise:1,dominant:1"),
                ("Sleeping wrapped, or permission to stay in the bed.", "reward-aftercare:2,reward-privilege:1,dominant:1"),
                ("The next morning still in the tone, not roommate-voice at once.", "reward-aftercare:2,ownership:1,dominant:1"),
                ("I do aftercare as a duty, not as a prize. Everyone gets the landing.", "reward-aftercare:1,caregiver:2,dominant:1"),
                ("I want extras given to me when I have held the night.", "switch:2,reward-aftercare:1"),
            ]),
            ("Aftercare extras you want as a reward…", [
                ("Bath, food, the good blanket, a longer hold.", "reward-aftercare:3,submissive:1"),
                ("A debrief that is actually kind, not a performance review.", "reward-aftercare:2,reward-praise:1,submissive:1"),
                ("Sleeping wrapped, or permission to stay in the bed.", "reward-aftercare:2,reward-privilege:1,submissive:1"),
                ("The next morning still in the tone, not roommate-voice at once.", "reward-aftercare:2,ownership:1,submissive:1"),
                ("I want the landing as a right, not a prize I earn.", "reward-aftercare:2,submissive:1"),
                ("I want to give extras when I have held the night.", "switch:2,reward-aftercare:1"),
            ]),
            ("Aftercare as prize versus as duty…", [
                ("Landing is a duty. Extras can be a prize.", "switch:2,reward-aftercare:2,caregiver:1"),
                ("I like running the extras more.", "switch:1,reward-aftercare:2,dominant:1"),
                ("I like receiving the extras more.", "switch:1,reward-aftercare:2,submissive:1"),
                ("The next morning in-tone, both ways.", "switch:1,reward-aftercare:1,ownership:1"),
                ("We under-do aftercare. I want more, prize or not.", "switch:1,reward-aftercare:2"),
                ("We already land well. This is not a lever.", "switch:1"),
            ]),
        ),
        (
            ("Choice as a reward you grant…", [
                ("They pick the next scene from a menu I wrote.", "reward-choice:3,dominant:1"),
                ("They pick dinner, the film, the hour we start.", "reward-choice:2,reward-privilege:1,dominant:1"),
                ("They may say no to a usual ask, once, without a mark against them.", "reward-freedom:2,reward-choice:2,dominant:1"),
                ("I do not like giving the wheel as a prize. I will give something else.", "dominant:1"),
                ("A yes they have been waiting for — a kink we parked.", "reward-choice:2,reward-play:2,dominant:1"),
                ("I want choice granted to me sometimes too.", "switch:2,reward-choice:1"),
            ]),
            ("Choice as a reward you want…", [
                ("I pick the next scene from a menu they wrote.", "reward-choice:3,submissive:1"),
                ("I pick dinner, the film, the hour we start.", "reward-choice:2,reward-privilege:1,submissive:1"),
                ("I may say no to a usual ask, once, without a mark against me.", "reward-freedom:2,reward-choice:2,submissive:1"),
                ("I do not want the wheel as a prize. Give me something else.", "submissive:1"),
                ("A yes I have been waiting for — a kink we parked.", "reward-choice:2,reward-play:2,submissive:1"),
                ("I want to grant choice when I hold the night.", "switch:2,reward-choice:1"),
            ]),
            ("Choice as prize, both ways…", [
                ("Menus we write for each other.", "switch:2,reward-choice:3"),
                ("I like granting choice more.", "switch:1,reward-choice:2,dominant:1"),
                ("I like being given choice more.", "switch:1,reward-choice:2,submissive:1"),
                ("A parked kink, released as a prize.", "switch:1,reward-play:2,reward-choice:1"),
                ("Ordinary-life choices, eroticized.", "switch:1,reward-choice:1,reward-privilege:1"),
                ("Choice should not be a prize. It should already exist.", "switch:1,reward-freedom:1"),
            ]),
        ),
    ],
    ("The reward you forget to give, and should not…", [
        ("Praise with evidence.", "reward-praise:3,praise:1,dominant:1"),
        ("Time I actually stay.", "reward-time:3,dominant:1"),
        ("The orgasm I promised.", "reward-orgasm:3,dominant:1"),
        ("The token or note.", "reward-gift:3,dominant:1"),
        ("The extra play I said yes to and then buried.", "reward-play:3,dominant:1"),
        ("The landing extras.", "reward-aftercare:3,dominant:1"),
    ]),
    ("The reward you have a hard time asking for is…", [
        ("Praise with evidence.", "reward-praise:3,praise:1,submissive:1"),
        ("Time they actually stay.", "reward-time:3,submissive:1"),
        ("The orgasm they promised.", "reward-orgasm:3,submissive:1"),
        ("The token or note.", "reward-gift:3,submissive:1"),
        ("The extra play they said yes to and then buried.", "reward-play:3,submissive:1"),
        ("The landing extras.", "reward-aftercare:3,submissive:1"),
    ]),
)

print("rewards", sum(1 for i in ITEMS if i["section"] == "rewards"))

practice(
    "punishments",
    [
        (
            ("A real punishment (not a scene they enjoy) you are willing to give…", [
                ("Impact that was written as consequence, counted, then done.", "punish-impact:3,impact:1,dominant:1"),
                ("Denial. The thing they wanted is closed for a set time.", "punish-denial:3,denial:1,dominant:1"),
                ("Corner, wall, stillness. Boring on purpose.", "punish-corner:3,dominant:1"),
                ("Writing, lines, a written apology that is specific.", "punish-writing:3,dominant:1"),
                ("Extra work. The unsexy chore, done well, checked.", "punish-chore:3,service:1,dominant:1"),
                ("I do not punish. I renegotiate or I end the scene.", "dominant:1"),
            ]),
            ("A real punishment (not a scene you enjoy) you can actually take…", [
                ("Impact that was written as consequence, counted, then done.", "punish-impact:3,impact:1,submissive:1"),
                ("Denial. The thing I wanted is closed for a set time.", "punish-denial:3,denial:1,submissive:1"),
                ("Corner, wall, stillness. Boring on purpose.", "punish-corner:3,submissive:1"),
                ("Writing, lines, a written apology that is specific.", "punish-writing:3,submissive:1"),
                ("Extra work. The unsexy chore, done well, checked.", "punish-chore:3,service:1,submissive:1"),
                ("I do not want punishment. Renegotiate or end the scene.", "submissive:1"),
            ]),
            ("Real punishment both ways is…", [
                ("We can hold each other to written consequences.", "switch:2,punish-impact:1,punish-denial:1"),
                ("I am more willing to give than to take.", "switch:1,dominant:1,punish-impact:1"),
                ("I am more willing to take than to give.", "switch:1,submissive:1,punish-impact:1"),
                ("Boring punishments (corner, writing, chores) not heat.", "switch:1,punish-corner:1,punish-writing:1,punish-chore:1"),
                ("Heat-as-punishment, knowing it might still be hot.", "switch:1,punish-impact:2"),
                ("We do not punish. We repair.", "switch:1"),
            ]),
        ),
        (
            ("Heavier protocol as punishment, from you, is…", [
                ("Yes. More formality until the slate is clean.", "punish-protocol:3,protocol:1,dominant:1"),
                ("Lost privileges: furniture, clothes, orgasm, the bed.", "punish-privilege:3,dominant:1"),
                ("A lecture that is exact, not a rant.", "punish-lecture:3,dominant:1"),
                ("Inspection or display I would not usually ask for.", "punish-inspection:3,objectification:1,dominant:1"),
                ("Unpleasant sensation: soap, ice, a hold they do not like.", "punish-sensation:3,cold:1,dominant:1"),
                ("I will not use protocol as a stick. Protocol is for when we are well.", "punish-protocol:1,dominant:1"),
            ]),
            ("Heavier protocol as punishment on you is…", [
                ("Yes. More formality until the slate is clean.", "punish-protocol:3,protocol:1,submissive:1"),
                ("Lost privileges: furniture, clothes, orgasm, the bed.", "punish-privilege:3,submissive:1"),
                ("A lecture that is exact, not a rant.", "punish-lecture:3,submissive:1"),
                ("Inspection or display they would not usually ask for.", "punish-inspection:3,objectification:1,submissive:1"),
                ("Unpleasant sensation: soap, ice, a hold I do not like.", "punish-sensation:3,cold:1,submissive:1"),
                ("Do not use protocol as a stick. Protocol is for when we are well.", "punish-protocol:1,submissive:1"),
            ]),
            ("Protocol-as-stick both ways…", [
                ("Sometimes. Short, written, then we return to normal.", "switch:2,punish-protocol:2"),
                ("I like using it more than wearing it.", "switch:1,punish-protocol:2,dominant:1"),
                ("I can take it more than I can dish it.", "switch:1,punish-protocol:2,submissive:1"),
                ("Privileges off, not more kneeling.", "switch:1,punish-privilege:3"),
                ("Lecture and repair, not extra formality.", "switch:1,punish-lecture:3"),
                ("A no. Do not poison the ritual.", "switch:1"),
            ]),
        ),
        (
            ("Corner time you would give…", [
                ("Nose to wall, timed, then a short debrief.", "punish-corner:3,dominant:1"),
                ("Kneeling in a place I can see, silent.", "punish-corner:2,punish-protocol:1,dominant:1"),
                ("Only as a cool-down, not as shame.", "punish-corner:2,caregiver:1,dominant:1"),
                ("I would rather a chore than a corner.", "punish-chore:2,dominant:1"),
                ("I would rather impact than boredom.", "punish-impact:2,dominant:1"),
                ("Not a tool I will use.", "dominant:1"),
            ]),
            ("Corner time you can take…", [
                ("Nose to wall, timed, then a short debrief.", "punish-corner:3,submissive:1"),
                ("Kneeling in a place they can see, silent.", "punish-corner:2,punish-protocol:1,submissive:1"),
                ("Only as a cool-down, not as shame.", "punish-corner:2,submissive:1"),
                ("I would rather a chore than a corner.", "punish-chore:2,submissive:1"),
                ("I would rather impact than boredom.", "punish-impact:2,submissive:1"),
                ("Not a tool I can take.", "submissive:1"),
            ]),
            ("Stillness-as-punishment both ways…", [
                ("We can put each other in the quiet.", "switch:2,punish-corner:3"),
                ("I like giving the quiet more.", "switch:1,punish-corner:2,dominant:1"),
                ("I can take the quiet more.", "switch:1,punish-corner:2,submissive:1"),
                ("Cool-down only, both seats.", "switch:1,punish-corner:1,caregiver:1"),
                ("Chores instead of corners.", "switch:1,punish-chore:2"),
                ("Skip it.", "switch:1"),
            ]),
        ),
        (
            ("Writing and lines you would assign…", [
                ("A specific apology, in ink, read aloud.", "punish-writing:3,dominant:1"),
                ("Lines, counted, then shown.", "punish-writing:3,trainer:1,dominant:1"),
                ("A page on what they will do differently.", "punish-writing:2,punish-lecture:1,dominant:1"),
                ("A journal entry I will actually read.", "punish-writing:2,task-journal:1,dominant:1"),
                ("I would rather talk than make them write.", "punish-lecture:2,dominant:1"),
                ("Not a tool I will use.", "dominant:1"),
            ]),
            ("Writing and lines you can do…", [
                ("A specific apology, in ink, read aloud.", "punish-writing:3,submissive:1"),
                ("Lines, counted, then shown.", "punish-writing:3,submissive:1"),
                ("A page on what I will do differently.", "punish-writing:2,punish-lecture:1,submissive:1"),
                ("A journal entry they will actually read.", "punish-writing:2,task-journal:1,submissive:1"),
                ("I would rather talk than write.", "punish-lecture:2,submissive:1"),
                ("Not a tool I can take.", "submissive:1"),
            ]),
            ("Writing-as-punishment both ways…", [
                ("We can assign pages to each other.", "switch:2,punish-writing:3"),
                ("I like assigning more.", "switch:1,punish-writing:2,dominant:1"),
                ("I can write more than I can assign.", "switch:1,punish-writing:2,submissive:1"),
                ("Apologies, not lines.", "switch:1,punish-writing:1,punish-lecture:1"),
                ("Talk instead of ink.", "switch:1,punish-lecture:2"),
                ("Skip it.", "switch:1"),
            ]),
        ),
        (
            ("Inspection or display as punishment you would use…", [
                ("Present, be looked at, be told what I see.", "punish-inspection:3,objectification:1,dominant:1"),
                ("A position they find exposing, timed.", "punish-inspection:2,funish-position:1,dominant:1"),
                ("Only if it is not a secret heat of theirs — otherwise it is a funishment.", "punish-inspection:1,dominant:1"),
                ("I would rather a private lecture.", "punish-lecture:2,dominant:1"),
                ("I will not use display as shame.", "dominant:1"),
                ("I want to be inspected that way more than I want to run it.", "switch:2,punish-inspection:1"),
            ]),
            ("Inspection or display as punishment on you…", [
                ("Present, be looked at, be told what they see.", "punish-inspection:3,objectification:1,submissive:1"),
                ("A position I find exposing, timed.", "punish-inspection:2,funish-position:1,submissive:1"),
                ("Only if it is not secretly hot for me — otherwise call it a funishment.", "punish-inspection:1,submissive:1"),
                ("I would rather a private lecture.", "punish-lecture:2,submissive:1"),
                ("Do not use display as shame.", "submissive:1"),
                ("I want to run that more than I want to take it.", "switch:2,punish-inspection:1"),
            ]),
            ("Inspection-as-punishment both ways…", [
                ("We can look hard at each other when a rule broke.", "switch:2,punish-inspection:2"),
                ("I like inspecting more.", "switch:1,punish-inspection:2,dominant:1"),
                ("I can take being looked at more.", "switch:1,punish-inspection:2,submissive:1"),
                ("Call it a funishment if it is hot.", "switch:1,funish-show:1,punish-inspection:1"),
                ("Lecture instead of display.", "switch:1,punish-lecture:2"),
                ("A no.", "switch:1"),
            ]),
        ),
        (
            ("The line you will not cross as punishment…", [
                ("I will not take the collar away as a stunt.", "punish-privilege:1,collaring:1,dominant:1"),
                ("I will not use a real wound, a real secret, or a real fear.", "punish-lecture:1,dominant:1"),
                ("I will not withhold aftercare.", "reward-aftercare:1,caregiver:2,dominant:1"),
                ("I will not use sex they do not want as a consequence.", "dominant:1"),
                ("I will not pile punishments. One, then done.", "trainer:1,dominant:1"),
                ("I need a written list before I punish at all.", "dominant:1"),
            ]),
            ("The line you need them not to cross as punishment…", [
                ("Do not take the collar away as a stunt.", "punish-privilege:1,collaring:1,submissive:1"),
                ("Do not use a real wound, a real secret, or a real fear.", "punish-lecture:1,submissive:1"),
                ("Do not withhold aftercare.", "reward-aftercare:1,submissive:1"),
                ("Do not use sex I do not want as a consequence.", "submissive:1"),
                ("Do not pile. One, then done.", "submissive:1"),
                ("I need a written list before I will take punishment at all.", "submissive:1"),
            ]),
            ("Punishment ethics both ways…", [
                ("Written list, one consequence, aftercare anyway.", "switch:2,caregiver:1"),
                ("I need those rules more when I am taking it.", "switch:1,submissive:1"),
                ("I need those rules more when I am giving it, so I do not go mean.", "switch:1,dominant:1,caregiver:1"),
                ("We do not punish. Repair only.", "switch:1"),
                ("We punish rarely, and we debrief it like a scene.", "switch:2"),
                ("We have not agreed this yet. We should.", "switch:1"),
            ]),
        ),
    ],
    ("You would rather punish with boredom than with heat when…", [
        ("The rule was real and the smirk was the point. Boredom kills the sport.", "punish-corner:2,punish-chore:2,brat-tamer:1,dominant:1"),
        ("They enjoy impact too much for it to count.", "punish-denial:2,punish-privilege:1,dominant:1"),
        ("I am too angry for heat. Boredom is safer.", "punish-corner:1,punish-writing:1,caregiver:1,dominant:1"),
        ("I never would. If I cannot be clean, I wait.", "dominant:1"),
        ("Always. Heat is for scenes we want.", "punish-chore:1,punish-writing:1,dominant:1"),
        ("I would rather not punish in that mood at all.", "dominant:1"),
    ]),
    ("You would rather take boredom than heat as punishment when…", [
        ("The rule was real and my smirk was the point. Boredom kills the sport.", "punish-corner:2,punish-chore:2,brat:1,submissive:1"),
        ("I enjoy impact too much for it to count.", "punish-denial:2,punish-privilege:1,submissive:1"),
        ("They are too angry for heat. Boredom is safer.", "punish-corner:1,punish-writing:1,submissive:1"),
        ("I never would. If they cannot be clean, they wait.", "submissive:1"),
        ("Always. Heat is for scenes I want.", "punish-chore:1,punish-writing:1,submissive:1"),
        ("I would rather not be punished in that mood at all.", "submissive:1"),
    ]),
)

print("punishments", sum(1 for i in ITEMS if i["section"] == "punishments"))

practice(
    "funishments",
    [
        (
            ("A funishment you actually like to give (hot, not a real crime)…", [
                ("Playful spanking. Grin, sting, no ledger.", "funish-spank:3,spanking:1,brat-tamer:1,dominant:1"),
                ("Tease and a little denial, then a granted end.", "funish-tease:3,orgasm-control:1,dominant:1"),
                ("A brat game with a silly stake.", "funish-brat:3,brat-tamer:2,dominant:1"),
                ("Forced-fun / overstim they asked for and will laugh about.", "funish-overstim:3,overstim:1,dominant:1"),
                ("An embarrassing-but-hot task in the house.", "funish-embarrass:3,exhibition:1,dominant:1"),
                ("I do not funish. I either play or I punish cleanly.", "dominant:1"),
            ]),
            ("A funishment you actually want to take…", [
                ("Playful spanking. Grin, sting, no ledger.", "funish-spank:3,spanking:1,brat:1,submissive:1"),
                ("Tease and a little denial, then a granted end.", "funish-tease:3,orgasm-control:1,submissive:1"),
                ("A brat game with a silly stake.", "funish-brat:3,brat:2,submissive:1"),
                ("Forced-fun / overstim I asked for and will laugh about.", "funish-overstim:3,overstim:1,submissive:1"),
                ("An embarrassing-but-hot task in the house.", "funish-embarrass:3,exhibition:1,submissive:1"),
                ("I do not want funishments. Play or punish cleanly.", "submissive:1"),
            ]),
            ("Funishments both ways are…", [
                ("Our favourite grey zone. We can dish and take.", "switch:2,funish-spank:1,funish-brat:1"),
                ("I like giving them more.", "switch:1,funish-spank:1,dominant:1"),
                ("I like taking them more.", "switch:1,funish-spank:1,submissive:1"),
                ("Brat games both ways.", "switch:1,funish-brat:3"),
                ("Tease both ways.", "switch:1,funish-tease:3"),
                ("Skip the grey. Play or punish.", "switch:1"),
            ]),
        ),
        (
            ("Tickle, wriggle, silly positions you would use as funishment…", [
                ("Tickle until they swear, then I stop.", "funish-tickle:3,sensory:1,dominant:1"),
                ("A hard or silly position, timed, with a grin.", "funish-position:3,predicament:1,dominant:1"),
                ("Playful service: the drink done on knees because they sassed.", "funish-service:3,service:1,dominant:1"),
                ("Orgasm as a 'punishment' — too many, on purpose.", "funish-orgasm:3,overstim:1,dominant:1"),
                ("Being shown off to me in the house, blinds we control.", "funish-show:3,exhibition:1,dominant:1"),
                ("None of those. Too much giggle for me.", "dominant:1"),
            ]),
            ("Tickle, wriggle, silly positions you want as funishment…", [
                ("Tickle until I swear, then they stop.", "funish-tickle:3,sensory:1,submissive:1"),
                ("A hard or silly position, timed, with a grin.", "funish-position:3,predicament:1,submissive:1"),
                ("Playful service: the drink on knees because I sassed.", "funish-service:3,service:1,submissive:1"),
                ("Orgasm as a 'punishment' — too many, on purpose.", "funish-orgasm:3,overstim:1,submissive:1"),
                ("Being shown off to them in the house, blinds we control.", "funish-show:3,exhibition:1,submissive:1"),
                ("None of those. Too much giggle for me.", "submissive:1"),
            ]),
            ("Giggle-tools both ways…", [
                ("Tickle and positions we can swap.", "switch:2,funish-tickle:2,funish-position:2"),
                ("I like applying them more.", "switch:1,funish-tickle:1,dominant:1"),
                ("I like suffering them more.", "switch:1,funish-tickle:1,submissive:1"),
                ("Show-off in-house both ways.", "switch:1,funish-show:3"),
                ("Orgasm-as-joke both ways.", "switch:1,funish-orgasm:3"),
                ("No giggle-tools.", "switch:1"),
            ]),
        ),
        (
            ("Brat games you like to run as funishment…", [
                ("They name three, I pick the price.", "funish-brat:3,brat-tamer:2,dominant:1"),
                ("A dare they will hate-love.", "funish-embarrass:2,funish-brat:2,dominant:1"),
                ("Count, hold, or wait — with a smirk if they fail.", "funish-position:2,funish-brat:1,dominant:1"),
                ("I will not game a real broken rule. Games are for sass, not harm.", "funish-brat:1,brat-tamer:1,dominant:1"),
                ("I prefer a simple spank to a clever game.", "funish-spank:2,dominant:1"),
                ("Not my style.", "dominant:1"),
            ]),
            ("Brat games you want to be put through…", [
                ("I name three, they pick the price.", "funish-brat:3,brat:2,submissive:1"),
                ("A dare I will hate-love.", "funish-embarrass:2,funish-brat:2,submissive:1"),
                ("Count, hold, or wait — with a smirk if I fail.", "funish-position:2,funish-brat:1,submissive:1"),
                ("Do not game a real broken rule. Games are for sass, not harm.", "funish-brat:1,submissive:1"),
                ("I prefer a simple spank to a clever game.", "funish-spank:2,submissive:1"),
                ("Not my style.", "submissive:1"),
            ]),
            ("Brat games both ways…", [
                ("We can set dares for each other.", "switch:2,funish-brat:3"),
                ("I like setting them more.", "switch:1,funish-brat:2,brat-tamer:1"),
                ("I like being dared more.", "switch:1,funish-brat:2,brat:1"),
                ("Simple spank instead of clever.", "switch:1,funish-spank:2"),
                ("Dares that embarrass-but-hot.", "switch:1,funish-embarrass:2"),
                ("Skip games.", "switch:1"),
            ]),
        ),
        (
            ("Tease-and-denial-lite as funishment you give…", [
                ("Edge, pause, laugh, maybe grant.", "funish-tease:3,orgasm-control:1,dominant:1"),
                ("Clothes on, almost, then not.", "funish-tease:2,dominant:1"),
                ("I will not use real denial as a joke. Too mean for a grin.", "funish-tease:1,dominant:1"),
                ("Tease with praise, not with cruelty.", "funish-tease:2,praise:1,dominant:1"),
                ("I would rather overstim as the joke.", "funish-overstim:2,funish-orgasm:1,dominant:1"),
                ("Not my tool.", "dominant:1"),
            ]),
            ("Tease-and-denial-lite as funishment you take…", [
                ("Edge, pause, laugh, maybe grant.", "funish-tease:3,orgasm-control:1,submissive:1"),
                ("Clothes on, almost, then not.", "funish-tease:2,submissive:1"),
                ("Do not use real denial as a joke. Too mean for a grin.", "funish-tease:1,submissive:1"),
                ("Tease with praise, not with cruelty.", "funish-tease:2,praise:1,submissive:1"),
                ("I would rather overstim as the joke.", "funish-overstim:2,funish-orgasm:1,submissive:1"),
                ("Not my tool.", "submissive:1"),
            ]),
            ("Tease-lite both ways…", [
                ("We can edge-and-laugh at each other.", "switch:2,funish-tease:3"),
                ("I like running the tease more.", "switch:1,funish-tease:2,dominant:1"),
                ("I like being teased more.", "switch:1,funish-tease:2,submissive:1"),
                ("Praise-tease, not mean-tease.", "switch:1,funish-tease:1,praise:1"),
                ("Overstim as the joke both ways.", "switch:1,funish-overstim:2"),
                ("Skip it.", "switch:1"),
            ]),
        ),
        (
            ("Showing them off in-house as funishment…", [
                ("Naked in the kitchen for me, blinds we control.", "funish-show:3,exhibition:2,dominant:1"),
                ("A pose in the doorway until I say come here.", "funish-show:2,funish-position:1,dominant:1"),
                ("Photos for us, then we laugh and delete or keep.", "funish-show:2,exhibition:1,dominant:1"),
                ("Only if they asked for that flavour of embarrassed.", "funish-show:1,funish-embarrass:1,dominant:1"),
                ("I will not show them to anyone else. In-house means me.", "funish-show:1,dominant:1"),
                ("Not my tool.", "dominant:1"),
            ]),
            ("Being shown off in-house as funishment…", [
                ("Naked in the kitchen for them, blinds we control.", "funish-show:3,exhibition:2,submissive:1"),
                ("A pose in the doorway until they say come here.", "funish-show:2,funish-position:1,submissive:1"),
                ("Photos for us, then we laugh and delete or keep.", "funish-show:2,exhibition:1,submissive:1"),
                ("Only if I asked for that flavour of embarrassed.", "funish-show:1,funish-embarrass:1,submissive:1"),
                ("Not to anyone else. In-house means them.", "funish-show:1,submissive:1"),
                ("Not my tool.", "submissive:1"),
            ]),
            ("In-house show both ways…", [
                ("We can put each other on display for the other one.", "switch:2,funish-show:3,exhibition:1"),
                ("I like watching more.", "switch:1,funish-show:2,voyeurism:1"),
                ("I like being the show more.", "switch:1,funish-show:2,exhibition:1"),
                ("Poses, not naked-in-the-kitchen.", "switch:1,funish-position:2,funish-show:1"),
                ("Photos we keep or delete together.", "switch:1,funish-show:1,exhibition:1"),
                ("Skip it.", "switch:1"),
            ]),
        ),
        (
            ("The difference, for you, between funishment and punishment is…", [
                ("Grin versus ledger. If I am actually angry, it is not a funishment.", "funish-brat:1,brat-tamer:1,dominant:1"),
                ("They should still want it, a bit. If they dread it, it is punishment.", "funish-spank:1,dominant:1"),
                ("Funishment can be hot. Punishment should not be the prize.", "dominant:1"),
                ("I barely use either. I prefer repair and a new scene.", "dominant:1"),
                ("I mix them too often. I want to get cleaner.", "trainer:1,dominant:1"),
                ("I want to be funished more than I want to run the distinction.", "switch:2"),
            ]),
            ("The difference, for you, between funishment and punishment is…", [
                ("Grin versus ledger. If they are actually angry, it is not a funishment.", "funish-brat:1,brat:1,submissive:1"),
                ("I should still want it, a bit. If I dread it, it is punishment.", "funish-spank:1,submissive:1"),
                ("Funishment can be hot. Punishment should not be the prize.", "submissive:1"),
                ("I barely want either. Repair and a new scene.", "submissive:1"),
                ("We mix them too often. I want it cleaner.", "submissive:1"),
                ("I want to funish more than I want to take the distinction.", "switch:2"),
            ]),
            ("Keeping funishment and punishment distinct, both ways…", [
                ("We name it out loud: this is a grin, or this is a ledger.", "switch:3"),
                ("I need that name more when I take it.", "switch:1,submissive:1"),
                ("I need that name more when I give it.", "switch:1,dominant:1"),
                ("We can keep it messy. Grey is the point.", "switch:1,funish-brat:1"),
                ("We should write two lists: hot consequences vs real ones.", "switch:2"),
                ("We have not talked about this enough.", "switch:1"),
            ]),
        ),
    ],
    ("A funishment you would invent this week if they sassed you…", [
        ("OTK, counted, then tea.", "funish-spank:3,brat-tamer:1,dominant:1"),
        ("A wait in a doorway, then a kiss.", "funish-position:2,funish-show:1,dominant:1"),
        ("No orgasm until they have said the thing properly.", "funish-tease:3,dominant:1"),
        ("The drink, on knees, with a look.", "funish-service:3,dominant:1"),
        ("A dare from a list we already wrote.", "funish-brat:3,funish-embarrass:1,dominant:1"),
        ("I would laugh and let it go. Not every smirk needs a price.", "dominant:1"),
    ]),
    ("A funishment you would hope for this week if you sassed…", [
        ("OTK, counted, then tea.", "funish-spank:3,brat:1,submissive:1"),
        ("A wait in a doorway, then a kiss.", "funish-position:2,funish-show:1,submissive:1"),
        ("No orgasm until I have said the thing properly.", "funish-tease:3,submissive:1"),
        ("The drink, on knees, with a look.", "funish-service:3,submissive:1"),
        ("A dare from a list we already wrote.", "funish-brat:3,funish-embarrass:1,submissive:1"),
        ("I would hope they laughed and let it go.", "submissive:1"),
    ]),
)
print("funishments", sum(1 for i in ITEMS if i["section"] == "funishments"))

practice(
    "tasks",
    [
        (
            ("Daily tasks you actually like to set…", [
                ("Domestic: dishes, bed, the unsexy work done to a standard.", "task-domestic:3,service:1,dominant:1"),
                ("Body service: bath, cream, undressing, a drink.", "task-body:3,service:1,worship:1,dominant:1"),
                ("Erotic: photos for us, a toy on a schedule, a check-in of want.", "task-erotic:3,orgasm-control:1,dominant:1"),
                ("Ritual: morning kneel, night report, a phrase.", "task-ritual:3,protocol:1,dominant:1"),
                ("Journal or report I will actually read.", "task-journal:3,dominant:1"),
                ("I do not want a task economy. Too much homework.", "dominant:1"),
            ]),
            ("Daily tasks you actually want to be given…", [
                ("Domestic: dishes, bed, the unsexy work done to a standard.", "task-domestic:3,service:1,submissive:1"),
                ("Body service: bath, cream, undressing, a drink.", "task-body:3,service:1,worship:1,submissive:1"),
                ("Erotic: photos for us, a toy on a schedule, a check-in of want.", "task-erotic:3,orgasm-control:1,submissive:1"),
                ("Ritual: morning kneel, night report, a phrase.", "task-ritual:3,protocol:1,submissive:1"),
                ("Journal or report they will actually read.", "task-journal:3,submissive:1"),
                ("I do not want a task economy. Too much homework.", "submissive:1"),
            ]),
            ("Daily tasks both ways…", [
                ("We can assign each other a small real thing.", "switch:2,task-domestic:1,task-ritual:1"),
                ("I like setting more.", "switch:1,task-domestic:1,dominant:1"),
                ("I like being given more.", "switch:1,task-domestic:1,submissive:1"),
                ("Ritual more than chores.", "switch:1,task-ritual:3"),
                ("Erotic more than domestic.", "switch:1,task-erotic:3"),
                ("No task economy.", "switch:1"),
            ]),
        ),
        (
            ("Posture, outfit, and presentation tasks you set…", [
                ("Positions to practise: wait, present, kneel.", "task-posture:3,train-positions:1,dominant:1"),
                ("Dress code for the evening, or for the house.", "task-outfit:3,proto-dress:1,dominant:1"),
                ("Grooming to a standard we wrote.", "task-outfit:2,task-body:1,dominant:1"),
                ("I will notice. A task I will not inspect is theatre.", "task-posture:1,trainer:1,dominant:1"),
                ("Occasional, for a scene, not every Tuesday.", "task-outfit:1,task-posture:1,dominant:1"),
                ("Not my flavour.", "dominant:1"),
            ]),
            ("Posture, outfit, and presentation tasks you want…", [
                ("Positions to practise: wait, present, kneel.", "task-posture:3,train-positions:1,submissive:1"),
                ("Dress code for the evening, or for the house.", "task-outfit:3,proto-dress:1,submissive:1"),
                ("Grooming to a standard we wrote.", "task-outfit:2,task-body:1,submissive:1"),
                ("Inspect me. A task no one checks is theatre.", "task-posture:1,submissive:1"),
                ("Occasional, for a scene, not every Tuesday.", "task-outfit:1,task-posture:1,submissive:1"),
                ("Not my flavour.", "submissive:1"),
            ]),
            ("Presentation tasks both ways…", [
                ("We can dress and pose for each other.", "switch:2,task-outfit:2,task-posture:2"),
                ("I like setting the look more.", "switch:1,task-outfit:2,dominant:1"),
                ("I like being dressed more.", "switch:1,task-outfit:2,submissive:1"),
                ("Positions more than clothes.", "switch:1,task-posture:3"),
                ("Scene-only.", "switch:1,task-outfit:1"),
                ("Skip it.", "switch:1"),
            ]),
        ),
        (
            ("Skill and body tasks you would set…", [
                ("Practise a skill: rope receiving, a position, a drink done right.", "task-skill:3,train-service:1,dominant:1"),
                ("Fitness or stillness as devotion, not as a gym membership I police.", "task-fitness:3,dominant:1"),
                ("Mental: a rule to remember, a phrase, a check-in time.", "task-mental:3,dominant:1"),
                ("I will not set a task that is actually their unpaid self-improvement.", "task-skill:1,caregiver:1,dominant:1"),
                ("One skill at a time. Not a syllabus.", "task-skill:2,trainer:1,dominant:1"),
                ("Not my flavour.", "dominant:1"),
            ]),
            ("Skill and body tasks you want…", [
                ("Practise a skill: rope, a position, a drink done right.", "task-skill:3,train-service:1,submissive:1"),
                ("Fitness or stillness as devotion, not a gym membership they police.", "task-fitness:3,submissive:1"),
                ("Mental: a rule to remember, a phrase, a check-in time.", "task-mental:3,submissive:1"),
                ("Do not disguise my self-improvement as a kink task.", "task-skill:1,submissive:1"),
                ("One skill at a time. Not a syllabus.", "task-skill:2,submissive:1"),
                ("Not my flavour.", "submissive:1"),
            ]),
            ("Skill tasks both ways…", [
                ("We coach each other in one skill each.", "switch:2,task-skill:3"),
                ("I like assigning drills more.", "switch:1,task-skill:2,dominant:1"),
                ("I like being drilled more.", "switch:1,task-skill:2,submissive:1"),
                ("Mental rules more than physical drills.", "switch:1,task-mental:3"),
                ("Fitness as devotion, mutual and optional.", "switch:1,task-fitness:2"),
                ("Skip homework.", "switch:1"),
            ]),
        ),
        (
            ("Erotic tasks you would actually assign this month…", [
                ("A photo for us, on a prompt I send.", "task-erotic:3,exhibition:1,dominant:1"),
                ("Edge on a schedule, then wait.", "task-erotic:2,orgasm-control:2,dominant:1"),
                ("Wear a plug or a toy I named, for a commute of the house.", "task-erotic:3,dominant:1"),
                ("Write what they want, specifically, and send it.", "task-erotic:1,task-journal:2,dominant:1"),
                ("I will not assign erotic homework they have to fake.", "task-erotic:1,dominant:1"),
                ("Not this month.", "dominant:1"),
            ]),
            ("Erotic tasks you would actually want this month…", [
                ("A photo for us, on a prompt they send.", "task-erotic:3,exhibition:1,submissive:1"),
                ("Edge on a schedule, then wait.", "task-erotic:2,orgasm-control:2,submissive:1"),
                ("Wear a plug or a toy they named, for a commute of the house.", "task-erotic:3,submissive:1"),
                ("Write what I want, specifically, and send it.", "task-erotic:1,task-journal:2,submissive:1"),
                ("Do not assign erotic homework I have to fake.", "task-erotic:1,submissive:1"),
                ("Not this month.", "submissive:1"),
            ]),
            ("Erotic homework both ways…", [
                ("We can send each other a prompt.", "switch:2,task-erotic:3"),
                ("I like sending prompts more.", "switch:1,task-erotic:2,dominant:1"),
                ("I like receiving prompts more.", "switch:1,task-erotic:2,submissive:1"),
                ("Photos only.", "switch:1,task-erotic:1,exhibition:1"),
                ("Orgasm-control homework only.", "switch:1,task-erotic:1,orgasm-control:2"),
                ("No erotic homework.", "switch:1"),
            ]),
        ),
        (
            ("How you want a task reported back…", [
                ("A photo of the done thing. Evidence.", "task-journal:2,task-domestic:1,dominant:1"),
                ("A sentence at a set time. Do not write me an essay.", "task-mental:2,task-journal:1,dominant:1"),
                ("I will inspect in person. No digital theatre.", "task-posture:1,trainer:1,dominant:1"),
                ("Only if they failed. Silence means done.", "task-mental:1,dominant:1"),
                ("A journal at the end of the week, not ping-by-ping.", "task-journal:3,dominant:1"),
                ("I will not set a task I will not check.", "trainer:1,dominant:1"),
            ]),
            ("How you want to report a task…", [
                ("A photo of the done thing. Evidence.", "task-journal:2,task-domestic:1,submissive:1"),
                ("A sentence at a set time. Do not make me write an essay.", "task-mental:2,task-journal:1,submissive:1"),
                ("Inspect me in person. No digital theatre.", "task-posture:1,submissive:1"),
                ("Only if I failed. Silence means done.", "task-mental:1,submissive:1"),
                ("A journal at the end of the week, not ping-by-ping.", "task-journal:3,submissive:1"),
                ("Do not set a task you will not check.", "submissive:1"),
            ]),
            ("Reporting both ways…", [
                ("Evidence when we asked for it, not a surveillance state.", "switch:2,task-journal:2"),
                ("I like receiving reports more.", "switch:1,task-journal:2,dominant:1"),
                ("I like sending them more than inventing the system.", "switch:1,task-journal:2,submissive:1"),
                ("Weekly journal, not daily pings.", "switch:1,task-journal:2"),
                ("In person only.", "switch:1,task-posture:1"),
                ("No reporting. If it matters we will see it.", "switch:1"),
            ]),
        ),
        (
            ("A task you should not set, even if it is hot on paper…", [
                ("Anything that wrecks their actual job, sleep, or health.", "caregiver:2,dominant:1"),
                ("A fake-erotic task they will resent.", "task-erotic:1,dominant:1"),
                ("A pile. One is a task. Five is a panic.", "trainer:1,dominant:1"),
                ("A public task that involves people who did not consent.", "task-erotic:1,exhibition:1,dominant:1"),
                ("A task I will forget to close.", "task-mental:1,dominant:1"),
                ("I need them to tell me when a task was too much.", "caregiver:1,dominant:1"),
            ]),
            ("A task you should not be given, even if it is hot on paper…", [
                ("Anything that wrecks my actual job, sleep, or health.", "submissive:1"),
                ("A fake-erotic task I will resent.", "task-erotic:1,submissive:1"),
                ("A pile. One is a task. Five is a panic.", "submissive:1"),
                ("A public task that involves people who did not consent.", "task-erotic:1,exhibition:1,submissive:1"),
                ("A task they will forget to close.", "task-mental:1,submissive:1"),
                ("I will tell them when a task was too much.", "submissive:1"),
            ]),
            ("Task ethics both ways…", [
                ("Sleep, job, health, and other people's consent are the fence.", "switch:2,caregiver:1"),
                ("I need that fence more when I am assigning.", "switch:1,dominant:1,caregiver:1"),
                ("I need that fence more when I am receiving.", "switch:1,submissive:1"),
                ("One at a time, closed when done.", "switch:2,trainer:1"),
                ("We should write a 'never assign' list.", "switch:2"),
                ("We have not talked about this enough.", "switch:1"),
            ]),
        ),
    ],
    ("If you could keep only one kind of task in the rotation…", [
        ("Domestic devotion.", "task-domestic:3,service:1,dominant:1"),
        ("Body service.", "task-body:3,worship:1,dominant:1"),
        ("Erotic homework.", "task-erotic:3,dominant:1"),
        ("Ritual / daily drop.", "task-ritual:3,dominant:1"),
        ("Journal / report.", "task-journal:3,dominant:1"),
        ("Posture and presentation.", "task-posture:2,task-outfit:2,dominant:1"),
    ]),
    ("If you could keep only one kind of task being given to you…", [
        ("Domestic devotion.", "task-domestic:3,service:1,submissive:1"),
        ("Body service.", "task-body:3,worship:1,submissive:1"),
        ("Erotic homework.", "task-erotic:3,submissive:1"),
        ("Ritual / daily drop.", "task-ritual:3,submissive:1"),
        ("Journal / report.", "task-journal:3,submissive:1"),
        ("Posture and presentation.", "task-posture:2,task-outfit:2,submissive:1"),
    ]),
)
print("tasks", sum(1 for i in ITEMS if i["section"] == "tasks"))

practice(
    "training",
    [
        (
            ("Positions you want to train them in…", [
                ("Wait, present, kneel — a small set, drilled until it is in the body.", "train-positions:3,trainer:1,dominant:1"),
                ("One position that means 'I am here'. Not a catalogue.", "train-positions:2,dominant:1"),
                ("I care more about stillness than about named poses.", "train-endurance:3,train-positions:1,dominant:1"),
                ("Pet positions: heel, floor, present.", "train-positions:2,pet-play:1,handler:1,dominant:1"),
                ("I will train it for a scene, not as a lifestyle exam.", "train-positions:1,dominant:1"),
                ("Not my project.", "dominant:1"),
            ]),
            ("Positions you want to be trained in…", [
                ("Wait, present, kneel — a small set, drilled until it is in the body.", "train-positions:3,submissive:1"),
                ("One position that means 'I am here'. Not a catalogue.", "train-positions:2,submissive:1"),
                ("I care more about stillness than about named poses.", "train-endurance:3,train-positions:1,submissive:1"),
                ("Pet positions: heel, floor, present.", "train-positions:2,pet-play:1,pet:1,submissive:1"),
                ("Train me for a scene, not as a lifestyle exam.", "train-positions:1,submissive:1"),
                ("Not my project.", "submissive:1"),
            ]),
            ("Position training both ways…", [
                ("We can drill each other in a small set.", "switch:2,train-positions:3"),
                ("I like running the drill more.", "switch:1,train-positions:2,trainer:1"),
                ("I like being drilled more.", "switch:1,train-positions:2,submissive:1"),
                ("Stillness more than named poses.", "switch:1,train-endurance:3"),
                ("Pet drills both ways.", "switch:1,train-positions:1,pet-play:1"),
                ("Skip it.", "switch:1"),
            ]),
        ),
        (
            ("Speech and honorifics you want to train…", [
                ("A title, used when it is meant, not as wallpaper.", "train-speech:3,proto-honorifics:1,sir:1,dominant:1"),
                ("Ask to speak, or wait for the gap.", "train-speech:2,proto-speech:1,dominant:1"),
                ("Specific phrases: how to ask, how to thank, how to stop.", "train-speech:3,trainer:1,dominant:1"),
                ("I want less speech, not prettier speech.", "train-speech:1,primal:1,dominant:1"),
                ("Scene-only. I will not police their mouth in the shop.", "train-speech:1,proto-bedroom:1,dominant:1"),
                ("Not my project.", "dominant:1"),
            ]),
            ("Speech and honorifics you want trained into you…", [
                ("A title, used when it is meant, not as wallpaper.", "train-speech:3,proto-honorifics:1,submissive:1"),
                ("Ask to speak, or wait for the gap.", "train-speech:2,proto-speech:1,submissive:1"),
                ("Specific phrases: how to ask, how to thank, how to stop.", "train-speech:3,submissive:1"),
                ("I want less speech, not prettier speech.", "train-speech:1,primal:1,submissive:1"),
                ("Scene-only. Do not police my mouth in the shop.", "train-speech:1,proto-bedroom:1,submissive:1"),
                ("Not my project.", "submissive:1"),
            ]),
            ("Speech training both ways…", [
                ("Titles that match the seat of the night.", "switch:2,train-speech:3,proto-honorifics:1"),
                ("I like requiring speech more.", "switch:1,train-speech:2,dominant:1"),
                ("I like being held to speech more.", "switch:1,train-speech:2,submissive:1"),
                ("Phrases for ask / thank / stop, both seats.", "switch:2,train-speech:2"),
                ("Scene-only both ways.", "switch:1,train-speech:1,proto-bedroom:1"),
                ("Skip honorifics.", "switch:1"),
            ]),
        ),
        (
            ("Endurance and stillness you want to train…", [
                ("Hold, wait, do not fill the silence.", "train-endurance:3,train-focus:1,dominant:1"),
                ("Impact endurance only if they asked to get better at taking it, with a stop that still works.", "train-impact:3,train-endurance:1,sadist:1,dominant:1"),
                ("Rope endurance: breathing, telling the truth in the tie.", "train-rope:3,train-endurance:1,rigger:1,dominant:1"),
                ("I will not train anyone into ignoring a stop.", "train-endurance:1,caregiver:2,dominant:1"),
                ("Short drills. I get bored of long holds.", "train-endurance:1,dominant:1"),
                ("Not my project.", "dominant:1"),
            ]),
            ("Endurance and stillness you want trained into you…", [
                ("Hold, wait, do not fill the silence.", "train-endurance:3,train-focus:1,submissive:1"),
                ("Impact endurance only if I asked to get better at taking it, with a stop that still works.", "train-impact:3,train-endurance:1,masochist:1,submissive:1"),
                ("Rope endurance: breathing, telling the truth in the tie.", "train-rope:3,train-endurance:1,submissive:1"),
                ("Do not train me into ignoring a stop.", "train-endurance:1,submissive:1"),
                ("Short drills. I get bored of long holds.", "train-endurance:1,submissive:1"),
                ("Not my project.", "submissive:1"),
            ]),
            ("Endurance both ways…", [
                ("We can hold and be held to stillness.", "switch:2,train-endurance:3"),
                ("I like running the wait more.", "switch:1,train-endurance:2,dominant:1"),
                ("I like being waited more.", "switch:1,train-endurance:2,submissive:1"),
                ("Impact endurance, asked-for, both seats.", "switch:1,train-impact:2"),
                ("Rope endurance both seats.", "switch:1,train-rope:2"),
                ("Skip endurance as a virtue.", "switch:1"),
            ]),
        ),
        (
            ("Service standards you want to train…", [
                ("How the drink is done. How the room is left. How they present.", "train-service:3,service:1,trainer:1,dominant:1"),
                ("I want the standard written, then I stop nitpicking surprises.", "train-service:2,dominant:1"),
                ("Body service more than housework standards.", "train-service:2,worship:1,dominant:1"),
                ("I will praise the improvement, not only the miss.", "train-service:1,praise:1,dominant:1"),
                ("Too much like a job. I will not run a training programme.", "dominant:1"),
                ("Not my project.", "dominant:1"),
            ]),
            ("Service standards you want trained into you…", [
                ("How the drink is done. How the room is left. How I present.", "train-service:3,service:1,submissive:1"),
                ("Write the standard, then stop surprising me with new nitpicks.", "train-service:2,submissive:1"),
                ("Body service more than housework standards.", "train-service:2,worship:1,submissive:1"),
                ("Praise the improvement, not only the miss.", "train-service:1,praise:1,submissive:1"),
                ("Too much like a job. Do not run a training programme on me.", "submissive:1"),
                ("Not my project.", "submissive:1"),
            ]),
            ("Service training both ways…", [
                ("We can write standards for each other.", "switch:2,train-service:3"),
                ("I like setting standards more.", "switch:1,train-service:2,trainer:1"),
                ("I like being held to them more.", "switch:1,train-service:2,service:1"),
                ("Praise the improvement both ways.", "switch:1,train-service:1,praise:2"),
                ("Body service standards, not housework.", "switch:1,train-service:2,worship:1"),
                ("No training programme.", "switch:1"),
            ]),
        ),
        (
            ("Orgasm-control training you would run…", [
                ("Wait on a word. That is the drill.", "train-orgasm:3,orgasm-control:2,dominant:1"),
                ("Edging as practice, then a granted end so it stays training, not cruelty.", "train-orgasm:2,orgasm-control:1,dominant:1"),
                ("A chastity stretch with hygiene and honesty scheduled.", "train-orgasm:2,chastity:2,dominant:1"),
                ("I will not train this if I cannot be consistent.", "train-orgasm:1,dominant:1"),
                ("Scene-only. I will not run their orgasms on a workday.", "train-orgasm:1,dominant:1"),
                ("Not my project.", "dominant:1"),
            ]),
            ("Orgasm-control training you want…", [
                ("Wait on a word. That is the drill.", "train-orgasm:3,orgasm-control:2,submissive:1"),
                ("Edging as practice, then a granted end so it stays training, not cruelty.", "train-orgasm:2,orgasm-control:1,submissive:1"),
                ("A chastity stretch with hygiene and honesty scheduled.", "train-orgasm:2,chastity:2,submissive:1"),
                ("Do not train this if you cannot be consistent.", "train-orgasm:1,submissive:1"),
                ("Scene-only. Do not run my orgasms on a workday.", "train-orgasm:1,submissive:1"),
                ("Not my project.", "submissive:1"),
            ]),
            ("Orgasm training both ways…", [
                ("We can hold each other to a word, on different stretches.", "switch:2,train-orgasm:3,orgasm-control:1"),
                ("I like running it more.", "switch:1,train-orgasm:2,dominant:1"),
                ("I like being held to it more.", "switch:1,train-orgasm:2,submissive:1"),
                ("Scene-only both seats.", "switch:1,train-orgasm:1"),
                ("Consistency or not at all.", "switch:2,train-orgasm:1"),
                ("Skip it.", "switch:1"),
            ]),
        ),
        (
            ("Focus, posture, protocol drills you would actually keep doing…", [
                ("Five minutes of wait when I enter.", "train-focus:3,train-protocol:1,dominant:1"),
                ("A posture check once a day, not a boot camp.", "train-posture:3,train-positions:1,dominant:1"),
                ("Protocol drills on a named evening, not sprinkled as traps.", "train-protocol:3,trainer:1,dominant:1"),
                ("Rope or impact skill-building with a plan, not a mood.", "train-rope:2,train-impact:2,dominant:1"),
                ("I start drills and abandon them. I want fewer, kept.", "train-focus:1,dominant:1"),
                ("I will not keep a training calendar. Play is enough.", "dominant:1"),
            ]),
            ("Focus, posture, protocol drills you would actually keep doing…", [
                ("Five minutes of wait when they enter.", "train-focus:3,train-protocol:1,submissive:1"),
                ("A posture check once a day, not a boot camp.", "train-posture:3,train-positions:1,submissive:1"),
                ("Protocol drills on a named evening, not sprinkled as traps.", "train-protocol:3,submissive:1"),
                ("Rope or impact skill-building with a plan, not a mood.", "train-rope:2,train-impact:2,submissive:1"),
                ("We start drills and abandon them. I want fewer, kept.", "train-focus:1,submissive:1"),
                ("I do not want a training calendar. Play is enough.", "submissive:1"),
            ]),
            ("Keeping drills both ways…", [
                ("Fewer, kept, on a named evening.", "switch:2,train-protocol:2,train-focus:1"),
                ("I like running the calendar more.", "switch:1,train-protocol:2,trainer:1"),
                ("I like being on the calendar more.", "switch:1,train-protocol:2,submissive:1"),
                ("Skill-building (rope, impact) more than protocol.", "switch:1,train-rope:1,train-impact:1"),
                ("Posture only.", "switch:1,train-posture:3"),
                ("No calendar. Play is enough.", "switch:1"),
            ]),
        ),
    ],
    ("The training you are actually willing to be patient with…", [
        ("Positions and wait.", "train-positions:3,train-endurance:1,dominant:1"),
        ("Speech and honorifics.", "train-speech:3,dominant:1"),
        ("Service standards.", "train-service:3,dominant:1"),
        ("Orgasm control.", "train-orgasm:3,dominant:1"),
        ("Rope or impact skill.", "train-rope:2,train-impact:2,dominant:1"),
        ("I am not a patient trainer. I should not fake it.", "dominant:1"),
    ]),
    ("The training you are actually willing to repeat without sulking…", [
        ("Positions and wait.", "train-positions:3,train-endurance:1,submissive:1"),
        ("Speech and honorifics.", "train-speech:3,submissive:1"),
        ("Service standards.", "train-service:3,submissive:1"),
        ("Orgasm control.", "train-orgasm:3,submissive:1"),
        ("Rope or impact skill.", "train-rope:2,train-impact:2,submissive:1"),
        ("I will sulk at drills. Be honest about that with me.", "brat:1,submissive:1"),
    ]),
)
print("training", sum(1 for i in ITEMS if i["section"] == "training"))

practice(
    "protocol",
    [
        (
            ("The height of protocol you actually want to run…", [
                ("High, when we said high. Formality, positions, speech.", "proto-high:3,master:1,dominant:1"),
                ("Bedroom and scene only. The shop is adult-to-adult.", "proto-bedroom:3,dominant:1"),
                ("Low-grade daily: a title, a check-in, not a museum.", "proto-daily:3,proto-honorifics:1,dominant:1"),
                ("I can do an evening of high. I cannot do a life of it.", "proto-high:1,proto-bedroom:2,dominant:1"),
                ("I want almost none. Power without the etiquette.", "primal:1,dominant:1"),
                ("I want to run it and to live inside someone else's.", "switch:2,proto-high:1"),
            ]),
            ("The height of protocol you actually want to live inside…", [
                ("High, when we said high. Formality, positions, speech.", "proto-high:3,slave:1,submissive:1"),
                ("Bedroom and scene only. The shop is adult-to-adult.", "proto-bedroom:3,submissive:1"),
                ("Low-grade daily: a title, a check-in, not a museum.", "proto-daily:3,proto-honorifics:1,submissive:1"),
                ("I can do an evening of high. I cannot do a life of it.", "proto-high:1,proto-bedroom:2,submissive:1"),
                ("I want almost none. Power without the etiquette.", "primal:1,submissive:1"),
                ("I want to live inside it and to write some.", "switch:2,proto-high:1"),
            ]),
            ("Height of protocol both ways…", [
                ("Whoever holds the night sets the height, inside a written range.", "switch:3,proto-high:1,proto-bedroom:1"),
                ("I like running high more than wearing it.", "switch:1,proto-high:2,dominant:1"),
                ("I like wearing high more than inventing it.", "switch:1,proto-high:2,submissive:1"),
                ("Bedroom only, both seats.", "switch:1,proto-bedroom:3"),
                ("Low-grade daily, both seats.", "switch:1,proto-daily:3"),
                ("Almost none. Power without etiquette.", "switch:1,primal:1"),
            ]),
        ),
        (
            ("Honorifics you want to require…", [
                ("Sir / Ma'am / Master — earned, not a joke.", "proto-honorifics:3,sir:1,master:1,dominant:1"),
                ("A name we chose, used in the house.", "proto-honorifics:2,ownership:1,dominant:1"),
                ("Only when protocol is on. Off-switch is real.", "proto-honorifics:1,proto-bedroom:1,dominant:1"),
                ("I do not need a title. Competence is enough.", "dominant:1"),
                ("I want them, and I want to use one.", "switch:2,proto-honorifics:1"),
                ("Pet names more than titles.", "proto-honorifics:1,handler:1,pet-play:1,dominant:1"),
            ]),
            ("Honorifics you want to use…", [
                ("Sir / Ma'am / Master — earned, not a joke.", "proto-honorifics:3,submissive:1"),
                ("A name they chose, used in the house.", "proto-honorifics:2,ownership:1,submissive:1"),
                ("Only when protocol is on. Off-switch is real.", "proto-honorifics:1,proto-bedroom:1,submissive:1"),
                ("I do not need to title them. Competence is enough.", "submissive:1"),
                ("I want to use one, and I want to be titled.", "switch:2,proto-honorifics:1"),
                ("Pet names more than titles.", "proto-honorifics:1,pet-play:1,submissive:1"),
            ]),
            ("Honorifics both ways…", [
                ("Titles match the seat of the night.", "switch:3,proto-honorifics:2"),
                ("I like receiving a title more.", "switch:1,proto-honorifics:2,dominant:1"),
                ("I like using a title more.", "switch:1,proto-honorifics:2,submissive:1"),
                ("House-only.", "switch:1,proto-honorifics:1,proto-daily:1"),
                ("Scene-only.", "switch:1,proto-honorifics:1,proto-bedroom:1"),
                ("Skip titles.", "switch:1"),
            ]),
        ),
        (
            ("Kneeling and positions as protocol you want…", [
                ("At the door, or when I sit, a kneel that means I am here.", "proto-kneel:3,train-positions:1,dominant:1"),
                ("Present for inspection when asked, not as furniture all evening.", "proto-kneel:2,punish-inspection:1,dominant:1"),
                ("A wait position while I finish a thing.", "proto-kneel:2,train-focus:1,dominant:1"),
                ("Floor time as pet protocol more than court protocol.", "proto-kneel:1,pet-play:2,dominant:1"),
                ("Scene-only kneeling.", "proto-kneel:1,proto-bedroom:1,dominant:1"),
                ("I do not want kneeling as etiquette.", "dominant:1"),
            ]),
            ("Kneeling and positions as protocol you want to offer…", [
                ("At the door, or when they sit, a kneel that means I am here.", "proto-kneel:3,train-positions:1,submissive:1"),
                ("Present for inspection when asked, not as furniture all evening.", "proto-kneel:2,submissive:1"),
                ("A wait position while they finish a thing.", "proto-kneel:2,train-focus:1,submissive:1"),
                ("Floor time as pet protocol more than court protocol.", "proto-kneel:1,pet-play:2,submissive:1"),
                ("Scene-only kneeling.", "proto-kneel:1,proto-bedroom:1,submissive:1"),
                ("I do not want kneeling as etiquette.", "submissive:1"),
            ]),
            ("Kneeling protocol both ways…", [
                ("Whoever holds the night can ask for the kneel.", "switch:2,proto-kneel:3"),
                ("I like receiving the kneel more.", "switch:1,proto-kneel:2,dominant:1"),
                ("I like giving the kneel more.", "switch:1,proto-kneel:2,submissive:1"),
                ("Scene-only.", "switch:1,proto-kneel:1,proto-bedroom:1"),
                ("Pet floor more than court kneel.", "switch:1,proto-kneel:1,pet-play:2"),
                ("No kneeling etiquette.", "switch:1"),
            ]),
        ),
        (
            ("Speech rules you want in force…", [
                ("Permission to speak when protocol is on.", "proto-speech:3,train-speech:1,dominant:1"),
                ("No swearing, or only swearing, depending what we wrote.", "proto-speech:2,dominant:1"),
                ("Ask, thank, stop — three phrases that always work.", "proto-speech:2,train-speech:1,dominant:1"),
                ("I want quiet more than rules about words.", "proto-speech:1,dominant:1"),
                ("Scene-only speech rules.", "proto-speech:1,proto-bedroom:1,dominant:1"),
                ("I will not police speech.", "dominant:1"),
            ]),
            ("Speech rules you want to live under…", [
                ("Permission to speak when protocol is on.", "proto-speech:3,train-speech:1,submissive:1"),
                ("No swearing, or only swearing, depending what we wrote.", "proto-speech:2,submissive:1"),
                ("Ask, thank, stop — three phrases that always work.", "proto-speech:2,train-speech:1,submissive:1"),
                ("I want quiet more than rules about words.", "proto-speech:1,submissive:1"),
                ("Scene-only speech rules.", "proto-speech:1,proto-bedroom:1,submissive:1"),
                ("Do not police my speech.", "submissive:1"),
            ]),
            ("Speech rules both ways…", [
                ("On when protocol is on, for whoever is offering.", "switch:2,proto-speech:3"),
                ("I like requiring them more.", "switch:1,proto-speech:2,dominant:1"),
                ("I like being held to them more.", "switch:1,proto-speech:2,submissive:1"),
                ("Three phrases only: ask, thank, stop.", "switch:2,proto-speech:1"),
                ("Scene-only.", "switch:1,proto-speech:1,proto-bedroom:1"),
                ("No speech police.", "switch:1"),
            ]),
        ),
        (
            ("Dress, collar, meals — standing protocol you want…", [
                ("A dress code in the house, or for evenings.", "proto-dress:3,task-outfit:1,dominant:1"),
                ("Collar on at the door, off when we agreed.", "proto-collar:3,collaring:2,dominant:1"),
                ("Meals: wait, serve, manners we wrote.", "proto-meals:3,service:1,dominant:1"),
                ("Permission culture: ask to come, sit, leave the room — only if we meant it.", "proto-permission:3,dominant:1"),
                ("One of those, not all of them.", "proto-daily:1,dominant:1"),
                ("None of those as standing rules.", "dominant:1"),
            ]),
            ("Dress, collar, meals — standing protocol you want to live…", [
                ("A dress code in the house, or for evenings.", "proto-dress:3,task-outfit:1,submissive:1"),
                ("Collar on at the door, off when we agreed.", "proto-collar:3,collaring:2,submissive:1"),
                ("Meals: wait, serve, manners we wrote.", "proto-meals:3,service:1,submissive:1"),
                ("Permission culture: ask to come, sit, leave the room — only if we meant it.", "proto-permission:3,submissive:1"),
                ("One of those, not all of them.", "proto-daily:1,submissive:1"),
                ("None of those as standing rules.", "submissive:1"),
            ]),
            ("Standing protocol both ways…", [
                ("We pick one standing thing, not a handbook.", "switch:2,proto-daily:2"),
                ("I like requiring dress/collar/meals more.", "switch:1,proto-dress:1,proto-collar:1,proto-meals:1,dominant:1"),
                ("I like living inside them more.", "switch:1,proto-dress:1,proto-collar:1,proto-meals:1,submissive:1"),
                ("Collar rules more than the rest.", "switch:1,proto-collar:3"),
                ("Permission culture, carefully, both seats.", "switch:1,proto-permission:2"),
                ("No standing protocol.", "switch:1"),
            ]),
        ),
        (
            ("Daily structure you want to run…", [
                ("A morning or night check-in that actually happens.", "proto-daily:3,caregiver:1,dominant:1"),
                ("A few standing rules, written, revisable.", "proto-daily:2,ownership:1,dominant:1"),
                ("Protocol evenings on the calendar, ordinary days off.", "proto-bedroom:2,proto-daily:1,dominant:1"),
                ("I will not run a protocol I will flake on.", "proto-daily:1,dominant:1"),
                ("I want less structure than I pretend in fantasy.", "dominant:1"),
                ("I want to run days and have mine run.", "switch:2,proto-daily:1"),
            ]),
            ("Daily structure you want to live inside…", [
                ("A morning or night check-in that actually happens.", "proto-daily:3,little:1,submissive:1"),
                ("A few standing rules, written, revisable.", "proto-daily:2,ownership:1,submissive:1"),
                ("Protocol evenings on the calendar, ordinary days off.", "proto-bedroom:2,proto-daily:1,submissive:1"),
                ("Do not run a protocol you will flake on.", "proto-daily:1,submissive:1"),
                ("I want less structure than I pretend in fantasy.", "submissive:1"),
                ("I want my days run and to run someone else's.", "switch:2,proto-daily:1"),
            ]),
            ("Daily structure both ways…", [
                ("Check-ins that actually happen, whoever is holding.", "switch:2,proto-daily:3"),
                ("I like running the structure more.", "switch:1,proto-daily:2,dominant:1"),
                ("I like living inside it more.", "switch:1,proto-daily:2,submissive:1"),
                ("Calendar evenings, ordinary days off.", "switch:1,proto-bedroom:2,proto-daily:1"),
                ("Written, few, revisable.", "switch:2,proto-daily:1"),
                ("No daily protocol.", "switch:1"),
            ]),
        ),
    ],
    ("If protocol had to be one object, you would keep…", [
        ("The collar rule.", "proto-collar:3,collaring:1,dominant:1"),
        ("The honorific.", "proto-honorifics:3,dominant:1"),
        ("The kneel / wait.", "proto-kneel:3,dominant:1"),
        ("Permission for the big things (orgasm, leaving, sitting).", "proto-permission:3,dominant:1"),
        ("The evening of high protocol, rare and meant.", "proto-high:3,dominant:1"),
        ("The off-switch. Protocol that cannot turn off is not for me.", "proto-bedroom:2,dominant:1"),
    ]),
    ("If protocol had to be one object, you would want to keep…", [
        ("The collar rule.", "proto-collar:3,collaring:1,submissive:1"),
        ("The honorific.", "proto-honorifics:3,submissive:1"),
        ("The kneel / wait.", "proto-kneel:3,submissive:1"),
        ("Permission for the big things (orgasm, leaving, sitting).", "proto-permission:3,submissive:1"),
        ("The evening of high protocol, rare and meant.", "proto-high:3,submissive:1"),
        ("The off-switch. Protocol that cannot turn off is not for me.", "proto-bedroom:2,submissive:1"),
    ]),
)
print("protocol", sum(1 for i in ITEMS if i["section"] == "protocol"))

# ---------------------------------------------------------------------------
# Emit
# ---------------------------------------------------------------------------

EXPECTED = {
    "role": 20,
    "archetype": 60,
    "kink": 100,
    "rewards": 20,
    "punishments": 20,
    "funishments": 20,
    "tasks": 20,
    "training": 20,
    "protocol": 20,
}
ORDER = ["role", "archetype", "kink", "rewards", "punishments", "funishments", "tasks", "training", "protocol"]

by_sec = Counter(i["section"] for i in ITEMS)
print("TOTAL", len(ITEMS))
print(dict(by_sec))
print("roles", dict(Counter(i["role"] for i in ITEMS)))

errors = []
for sec, n in EXPECTED.items():
    got = by_sec.get(sec, 0)
    if got != n:
        errors.append(f"{sec}: want {n} got {got}")
for item in ITEMS:
    if len(item["options"]) != 6:
        errors.append(f"options {len(item['options'])}: {item['prompt'][:60]}")
if len(ITEMS) != 300:
    errors.append(f"total {len(ITEMS)}")
if errors:
    raise SystemExit("COUNT ERRORS:\n" + "\n".join(errors))

# stable order: section order, then original insertion (already in order)
sorted_items = ITEMS  # insertion order follows sections

lines = [
    "import type { QuizItem } from \"./discovery-quizzes\";",
    "",
    "export const BDSM_QUESTIONS: QuizItem[] = [",
]
for item in sorted_items:
    lines.append("  {")
    lines.append(f"    section: {ts_str(item['section'])},")
    lines.append(f"    role: {ts_str(item['role'])},")
    lines.append(f"    prompt: {ts_str(item['prompt'])},")
    lines.append("    options: [")
    for opt in item["options"]:
        lines.append(f"      {{ label: {ts_str(opt['label'])}, weights: {ts_weights(opt['weights'])} }},")
    lines.append("    ],")
    lines.append("  },")
lines.append("];")
lines.append("")

OUT.write_text("\n".join(lines) + "\n")
print("wrote", OUT, "questions", len(sorted_items), "bytes", OUT.stat().st_size)
