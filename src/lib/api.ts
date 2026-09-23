// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql as getSqlTyped } from "@/lib/db";
async function getSql(): Promise<any> {
  return getSqlTyped();
}
import { builtinSlugs, isLeadRole, KINDS, slugify, type Kind, type Role } from "@/lib/kinds";
import type {
  Category,
  CompanionMessage,
  CompanionProfile,
  Dashboard,
  Entry,
  HouseHistory,
  HouseSettings,
  JournalComment,
  LocationBoard,
  LocationFix,
  Me,
  Message,
  Partner,
  PointEvent,
  PointsBoard,
  PrivatePhoto,
  Profile,
  SpotifyLink,
  TalkAnswer,
  ToyPattern,
  ToyPatternStep,
  UserOptions,
} from "@/lib/types";
import { clampCompanionAge, companionBondId, companionImagePrompt, companionNeedinessSpec, companionNextNudgeAt, companionReachOutPrompt, companionSystemPrompt, companionWritePrompt, DEFAULT_COMPANION, dedupeCompanionBubbles, isCompanionLive, parseCompanionBurst, trailingAssistantBodies } from "@/lib/companion";
import { canEditKind, completeNoteKind, DEFAULT_HOUSE, DEFAULT_OPTIONS, fillCompleteNote, isDutyKind, parseHouse, parsePlay, parseOptions } from "@/lib/house";
import { OPEN_GAP_MS } from "@/lib/history";
import { formatNominatimAddress, haversineMeters, PLACE_MOVE_METERS } from "@/lib/location";
import { parsePdfs, PDF_META_KEY } from "@/lib/pdf";
import { countWord, earnedCountOf, isCountedKind, parseIdList, parsePoints, isShopKind, shopCost } from "@/lib/stakes";
import { reminderOf } from "@/lib/reminders";
import { encodeKinks, matchKnownKink, parseKinks } from "@/lib/kinks";
import {
	dueCompanionCue,
	formatCompanionWorld,
	normalizeAssignKind,
	normalizeCadence,
	normalizeMemoryKind,
	normalizeReminderTime,
	parseDueAt,
	titlesOverlap,
} from "@/lib/companion-world";
import { isDueToday, sortNamed, urgencyOf } from "@/lib/sort";
import { parseVideos, VIDEO_META_KEY } from "@/lib/video";
import { NOTES_LIBRARY } from "@/lib/notes-library";
import { PLAYBOOK_LIBRARY } from "@/lib/playbook-library";
import { parseExperience } from "@/lib/experience";

var ROLE = z.enum([
	"dominant",
	"submissive",
	"switch"
]);
var KIND = z.enum([
	"task",
	"rabbit",
	"punishment",
	"reward",
	"game",
	"scene",
	"journal",
	"note",
	"catalog",
	"talk",
	"roleplay",
	"challenge",
	"playbook",
	"calendar"
]);
var CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var EMPTY_COUNTS = {
	task: 0,
	rabbit: 0,
	punishment: 0,
	reward: 0,
	game: 0,
	scene: 0,
	journal: 0,
	note: 0,
	catalog: 0,
	talk: 0,
	roleplay: 0,
	challenge: 0,
	playbook: 0,
	calendar: 0
};
function makeCode() {
	let s = "";
	for (let i = 0; i < 6; i += 1) s += CODE_ALPHABET[Math.floor(Math.random() * 32)];
	return s;
}
function asString(value) {
	if (value == null) return "";
	if (value instanceof Date) return value.toISOString();
	return String(value);
}
function asNullableString(value) {
	if (value == null || value === "") return null;
	return asString(value);
}
function asNullableInt(value) {
	if (value == null || value === "") return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}
function parseMeta(raw) {
	if (!raw) return {};
	try {
		const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
		if (!parsed || typeof parsed !== "object") return {};
		const out = {};
		for (const [k, v] of Object.entries(parsed)) {
			if (v == null) continue;
			out[k] = String(v);
		}
		return out;
	} catch {
		return {};
	}
}
function parsePhotos(raw) {
	if (!raw) return [];
	if (typeof raw !== "string") return [];
	const trimmed = raw.trim();
	if (!trimmed) return [];
	if (trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.startsWith("http")) return [trimmed];
	try {
		const parsed = JSON.parse(trimmed);
		if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === "string" && item.length > 0);
	} catch {
		return [trimmed];
	}
	return [];
}
function encodePhotos(photos, fallback) {
	const list = (photos ?? []).filter(Boolean);
	if (list.length === 0) return fallback;
	if (list.length === 1) return list[0] ?? null;
	return JSON.stringify(list);
}
function mapProfile(row) {
	return {
		userId: row.user_id,
		role: row.role,
		displayName: row.display_name,
		username: row.username ?? "",
		pairingCode: row.pairing_code,
		partnerUserId: row.partner_user_id,
		bondId: row.bond_id,
		avatarData: row.avatar_data,
		age: asNullableInt(row.age),
		sex: row.sex ?? "",
		roleStyle: row.role_style ?? "",
		experience: parseExperience(row.experience ?? "curious"),
		playMode: row.play_mode ?? "solo",
		setupDone: row.setup_done !== false && row.setup_done !== 0,
		lastSeen: row.last_seen ? asString(row.last_seen) : null,
		lastPartnerUserId: row.last_partner_user_id ?? null,
		lastBondId: row.last_bond_id ?? null,
		kinks: parseKinks(row.kinks)
	};
}
function mapPartner(row, extra) {
	const username = (row.username ?? "").trim();
	return {
		userId: row.user_id,
		role: row.role,
		displayName: username || "Partner",
		username,
		avatarData: row.avatar_data,
		age: asNullableInt(row.age),
		sex: row.sex ?? "",
		roleStyle: row.role_style ?? "",
		experience: parseExperience(row.experience ?? "curious"),
		lastSeen: row.last_seen ? asString(row.last_seen) : null,
		bondId: extra?.bondId,
		active: extra?.active ?? false,
		available: extra?.available,
		kinks: parseKinks(row.kinks)
	};
}
function startOfTodayUtc() {
	return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function isoWeekKey(isoDate) {
	const d = /* @__PURE__ */ new Date(`${isoDate}T00:00:00Z`);
	const day = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - day);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
	return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
function effectiveStatus(row) {
	if (row.status === "archived") return "archived";
	if (!(row.kind === "task" || row.kind === "rabbit" || row.kind === "challenge")) return row.status;
	const cadence = row.cadence;
	if (!cadence) return row.status;
	const completedOn = asNullableString(row.completed_on);
	if (cadence === "daily" || cadence === "habit" || cadence === "custom") {
		if (row.status === "done" || row.status === "skipped") return completedOn === startOfTodayUtc() ? row.status : "open";
		return row.status;
	}
	if (row.status !== "done") return row.status;
	if (!completedOn) return "open";
	if (cadence === "weekly") return isoWeekKey(completedOn) === isoWeekKey(startOfTodayUtc()) ? "done" : "open";
	return "done";
}
function mapEntry(row): Entry {
	const photos = parsePhotos(row.photo_data);
	const meta = parseMeta(row.meta);
	return {
		id: Number(row.id),
		bondId: row.bond_id,
		createdBy: row.created_by,
		kind: row.kind,
		title: row.title,
		body: row.body ?? "",
		cadence: row.cadence,
		weekday: row.weekday == null ? null : Number(row.weekday),
		status: row.status,
		category: row.category,
		subcategory: row.subcategory ?? null,
		assignedTo: row.assigned_to ?? null,
		intensity: row.intensity == null ? null : Number(row.intensity),
		photoData: photos[0] ?? null,
		photos,
		pdfs: parsePdfs(meta[PDF_META_KEY]),
		videos: parseVideos(meta[VIDEO_META_KEY]),
		meta,
		createdAt: asString(row.created_at),
		updatedAt: asString(row.updated_at),
		completedAt: asNullableString(row.completed_at),
		completedOn: asNullableString(row.completed_on),
		effectiveStatus: effectiveStatus(row),
		sortOrder: row.sort_order == null ? 0 : Number(row.sort_order)
	};
}
function mapMessage(row) {
	return {
		id: Number(row.id),
		bondId: row.bond_id,
		senderId: row.sender_id,
		body: row.body ?? "",
		photoData: row.photo_data,
		audioData: row.audio_data ?? null,
		createdAt: asString(row.created_at)
	};
}
function mapPrivatePhoto(row) {
	return {
		id: Number(row.id),
		bondId: row.bond_id,
		uploadedBy: row.uploaded_by,
		photoData: row.photo_data,
		caption: row.caption ?? "",
		createdAt: asString(row.created_at)
	};
}
function mapLedger(row) {
	return {
		id: Number(row.id),
		userId: row.user_id,
		delta: Number(row.delta),
		reason: row.reason ?? "",
		source: row.source,
		entryId: row.entry_id == null ? null : Number(row.entry_id),
		createdBy: row.created_by,
		createdAt: asString(row.created_at)
	};
}
async function loadPoints(bondId, userId, partnerUserId): Promise<PointsBoard> {
	const sql = await getSql();
	const sums = await sql`
    select user_id, coalesce(sum(delta), 0)::int as n
    from points_ledger
    where bond_id = ${bondId}
    group by user_id
  `;
	const byUser = new Map(sums.map((row) => [row.user_id, Number(row.n)]));
	const ledgerRows = await sql`
    select id, user_id, delta, reason, source, entry_id, created_by, created_at
    from points_ledger
    where bond_id = ${bondId}
    order by created_at desc
    limit 24
  `;
	return {
		mine: byUser.get(userId) ?? 0,
		partner: partnerUserId ? byUser.get(partnerUserId) ?? 0 : null,
		ledger: ledgerRows.map(mapLedger)
	};
}
function pointTargets(assignedTo, profile) {
	if (assignedTo === "both") return profile.partner_user_id ? [profile.user_id, profile.partner_user_id] : [profile.user_id];
	if (assignedTo) return [assignedTo];
	return [profile.user_id];
}
async function insertLedger(bondId, userId, delta, reason, source, entryId, createdBy) {
	if (!delta) return;
	await (await getSql())`
    insert into points_ledger (bond_id, user_id, delta, reason, source, entry_id, created_by)
    values (${bondId}, ${userId}, ${delta}, ${reason}, ${source}, ${entryId}, ${createdBy})
  `;
	await touchBond(bondId);
}
async function bumpPunishmentEarned(sql, bondId, id, assignedTo) {
	const row = (await sql`
    select meta from entries
    where id = ${id} and bond_id = ${bondId} and kind = 'punishment'
  `)[0];
	if (!row) return;
	const meta = parseMeta(row.meta);
	meta.earnedCount = String(earnedCountOf(meta) + 1);
	await sql`
    update entries
    set status = 'open',
        assigned_to = ${assignedTo},
        meta = ${JSON.stringify(meta)},
        updated_at = now()
    where id = ${id} and bond_id = ${bondId} and kind = 'punishment'
  `;
}
async function applyTaskConsequences(profile, row, nextStatus, actorId) {
	if (row.kind !== "task" && row.kind !== "rabbit") return;
	const prevEffective = effectiveStatus(row);
	const goingDone = nextStatus === "done" && prevEffective !== "done";
	const leavingDone = nextStatus !== "done" && prevEffective === "done";
	const goingSkipped = nextStatus === "skipped" && row.status !== "skipped";
	const leavingSkipped = nextStatus !== "skipped" && row.status === "skipped";
	if (!goingDone && !leavingDone && !goingSkipped && !leavingSkipped) return;
	const meta = parseMeta(row.meta);
	const targets = pointTargets(row.assigned_to, profile);
	const points = parsePoints(meta.points);
	const skipPoints = parsePoints(meta.skipPoints);
	const sql = await getSql();
	if (goingDone && points != null && points !== 0) {
		for (const uid of targets) await insertLedger(profile.bond_id, uid, points, `Completed: ${row.title}`, "task_complete", Number(row.id), actorId);
		const rewardIds = parseIdList(meta.rewardIds);
		for (const id of rewardIds) await sql`
        update entries
        set assigned_to = ${row.assigned_to ?? actorId},
            status = 'open',
            updated_at = now()
        where id = ${id} and bond_id = ${profile.bond_id} and kind = 'reward'
      `;
	}
	if (leavingDone && points != null && points !== 0) for (const uid of targets) await insertLedger(profile.bond_id, uid, -points, `Reopened: ${row.title}`, "task_undo", Number(row.id), actorId);
	if (goingSkipped && skipPoints != null && skipPoints !== 0) for (const uid of targets) await insertLedger(profile.bond_id, uid, skipPoints, `Skipped: ${row.title}`, "task_skip", Number(row.id), actorId);
	if (goingSkipped) {
		const punishmentIds = parseIdList(meta.punishmentIds);
		for (const id of punishmentIds) await bumpPunishmentEarned(sql, profile.bond_id, id, row.assigned_to ?? actorId);
	}
	if (leavingSkipped && skipPoints != null && skipPoints !== 0) for (const uid of targets) await insertLedger(profile.bond_id, uid, -skipPoints, `Unskipped: ${row.title}`, "task_unskip", Number(row.id), actorId);
	if (goingDone) await maybeAutoCompleteNote(profile, row);
}
function freezeShopMeta(profile, house, kind, prevMeta, nextMeta) {
	if (!isShopKind(kind)) return nextMeta;
	if (isLeadRole(profile.role)) return nextMeta;
	if (house?.subEdit?.costs) return nextMeta;
	const out = { ...nextMeta };
	if (prevMeta.cost) out.cost = prevMeta.cost;
	else delete out.cost;
	if (prevMeta.boughtBy) {
		out.boughtBy = prevMeta.boughtBy;
		if (prevMeta.boughtAt) out.boughtAt = prevMeta.boughtAt;
		if (prevMeta.boughtCost) out.boughtCost = prevMeta.boughtCost;
	} else {
		delete out.boughtBy;
		delete out.boughtAt;
		delete out.boughtCost;
	}
	return out;
}
function freezeEarnedCount(profile, house, kind, prevMeta, nextMeta) {
	if (!isCountedKind(kind)) return nextMeta;
	if (isLeadRole(profile.role)) return nextMeta;
	if (house?.subEdit?.earnedCounts) return nextMeta;
	const out = { ...nextMeta };
	if (prevMeta.earnedCount != null && prevMeta.earnedCount !== "") out.earnedCount = prevMeta.earnedCount;
	else delete out.earnedCount;
	return out;
}
function freezeCountdown(profile, house, kind, cadence, prevMeta, nextMeta) {
	if (!(!(kind === "task" && cadence === "habit") && [
		"task",
		"challenge",
		"punishment",
		"reward",
		"roleplay",
		"game",
		"scene"
	].includes(kind))) return nextMeta;
	if (isLeadRole(profile.role)) return nextMeta;
	if (house?.subEdit?.countdowns) return nextMeta;
	const out = { ...nextMeta };
	for (const key of [
		"countdownDays",
		"countdownHours",
		"countdownMinutes",
		"countdownAnchor"
	]) if (prevMeta[key]) out[key] = prevMeta[key];
	else delete out[key];
	return out;
}
async function refundPurchase(sql, profile, row, meta) {
	if (!meta.boughtBy) return meta;
	const cost = parsePoints(meta.boughtCost) ?? shopCost(meta);
	if (cost) await insertLedger(profile.bond_id, meta.boughtBy, cost, `Refund: ${row.title}`, "shop_refund", Number(row.id), profile.user_id);
	const next = { ...meta };
	delete next.boughtBy;
	delete next.boughtAt;
	delete next.boughtCost;
	return next;
}
async function settleOverdue(profile) {
	try {
		if ((await loadHouseSettings(profile.bond_id)).vacation) return;
		const sql = await getSql();
		const rows = await sql`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where bond_id = ${profile.bond_id} and (kind = 'task' or kind = 'rabbit')
        and status <> 'archived'
    `;
		const today = startOfTodayUtc();
		const now = /* @__PURE__ */ new Date();
		for (const row of rows) {
			const mapped = mapEntry(row);
			if (mapped.effectiveStatus === "done" || mapped.status === "skipped") continue;
			if (!isDueToday(mapped, now)) continue;
			if (!reminderOf(mapped, now)?.overdue) continue;
			const meta = parseMeta(row.meta);
			if (meta.overdueOn === today) continue;
			const punishmentIds = parseIdList(meta.punishmentIds);
			let skipPoints = parsePoints(meta.skipPoints);
			if ((skipPoints == null || skipPoints === 0) && !punishmentIds.length) {
				const urgency = urgencyOf(meta);
				if (urgency === "urgent") skipPoints = -10;
				else if (urgency === "high") skipPoints = -5;
			}
			if (!punishmentIds.length && (skipPoints == null || skipPoints === 0)) continue;
			meta.overdueOn = today;
			await sql`update entries set meta = ${JSON.stringify(meta)}, updated_at = now() where id = ${row.id} and bond_id = ${profile.bond_id}`;
			const targets = pointTargets(row.assigned_to, profile);
			if (skipPoints != null && skipPoints !== 0) for (const uid of targets) await insertLedger(profile.bond_id, uid, skipPoints, `Missed due time: ${row.title}`, "task_overdue", Number(row.id), profile.user_id);
			for (const id of punishmentIds) {
				await bumpPunishmentEarned(sql, profile.bond_id, id, row.assigned_to ?? profile.user_id);
				const punishment = (await sql`
          select title, meta from entries
          where id = ${id} and bond_id = ${profile.bond_id} and kind = 'punishment'
        `)[0];
				if (!punishment) continue;
				const pts = parsePoints(parseMeta(punishment.meta).points);
				if (pts == null || pts === 0) continue;
				for (const uid of targets) await insertLedger(profile.bond_id, uid, pts, `Punishment for missed due time: ${row.title} · ${punishment.title}`, "punishment_overdue", Number(id), profile.user_id);
			}
			await logHouseEvent(profile.bond_id, profile.user_id, "overdue", entityOf(row.kind, row.cadence), row.title, punishmentIds.length ? "punishment assigned" : "points applied");
		}
	} catch {}
}
async function maybeAutoCompleteNote(profile, row) {
	const partnerId = profile.partner_user_id;
	if (!partnerId) return;
	const kind = completeNoteKind(row.kind, row.cadence);
	if (!kind) return;
	try {
		const opts = await loadUserOptions(partnerId);
		if (!opts.autoCompleteNote) return;
		const template = kind === "habit" ? opts.noteHabit : kind === "training" ? opts.noteTraining : opts.noteTask;
		const body = fillCompleteNote(template, {
			name: profile.display_name || "you",
			title: row.title || "",
			you: opts.addressAs || profile.display_name || "you"
		});
		if (!body) return;
		await (await getSql())`
      insert into messages (bond_id, sender_id, body, photo_data)
      values (${profile.bond_id}, ${partnerId}, ${body}, null)
    `;
	} catch {}
}
async function loadProfile(userId) {
	return (await (await getSql())`
    select user_id, role, display_name, username, pairing_code, partner_user_id, bond_id, avatar_data, age, sex, role_style, experience, play_mode, setup_done, last_seen, last_partner_user_id, last_bond_id, kinks
    from profiles
    where user_id = ${userId}
  `)[0] ?? null;
}
async function requireProfile(userId) {
	const profile = await loadProfile(userId);
	if (!profile) throw new Error("Choose a role to begin.");
	return profile;
}
async function uniqueCode() {
	const sql = await getSql();
	for (let i = 0; i < 12; i += 1) {
		const code = makeCode();
		if (!(await sql`
      select 1 as n from profiles where pairing_code = ${code} limit 1
    `)[0]) return code;
	}
	return makeCode() + makeCode();
}
async function loadMe(userId) {
	const profile = await loadProfile(userId);
	if (!profile) return {
		profile: null,
		partner: null,
		lastPartner: null,
		partners: [],
		house: DEFAULT_HOUSE,
		options: DEFAULT_OPTIONS
	};
	const partners = await loadRoster(profile);
	const partner = partners.find((item) => item.active) ?? null;
	const lastPartner = partners.find((item) => !item.active && item.userId === profile.last_partner_user_id) ?? partners.find((item) => !item.active) ?? null;
	const [house, options] = await Promise.all([loadHouseSettings(profile.bond_id), loadUserOptions(profile.user_id)]);
	await settleWeeklyReset(profile, house);
	return {
		profile: mapProfile(profile),
		partner,
		lastPartner,
		partners,
		house: await loadHouseSettings(profile.bond_id),
		options
	};
}
function pairKey(a, b) {
	return a < b ? [a, b] : [b, a];
}
async function findPartnership(sql, a, b) {
	const [userA, userB] = pairKey(a, b);
	try {
		return (await sql`
      select bond_id, archived from partnerships
      where user_a = ${userA} and user_b = ${userB}
    `)[0] ?? null;
	} catch {
		return null;
	}
}
async function ensurePartnership(sql, a, b, bondId) {
	const [userA, userB] = pairKey(a, b);
	const existing = await findPartnership(sql, a, b);
	if (existing) {
		if (existing.archived) await sql`
        update partnerships set archived = false
        where user_a = ${userA} and user_b = ${userB}
      `;
		return existing.bond_id;
	}
	try {
		await sql`
      insert into partnerships (bond_id, user_a, user_b, archived)
      values (${bondId}, ${userA}, ${userB}, false)
    `;
		return bondId;
	} catch {
		return (await findPartnership(sql, a, b))?.bond_id || bondId;
	}
}
async function loadRoster(profile) {
	const sql = await getSql();
	let rows = [];
	try {
		rows = await sql`
      select bond_id, user_a, user_b
      from partnerships
      where archived = false
        and (user_a = ${profile.user_id} or user_b = ${profile.user_id})
    `;
	} catch {
		rows = [];
	}
	if (!rows.length && profile.partner_user_id) {
		const row = await loadProfile(profile.partner_user_id);
		return row ? [mapPartner(row, {
			bondId: profile.bond_id,
			active: true,
			available: true
		})] : [];
	}
	const partners = [];
	for (const link of rows) {
		const otherId = link.user_a === profile.user_id ? link.user_b : link.user_a;
		const row = await loadProfile(otherId);
		if (!row) continue;
		partners.push(mapPartner(row, {
			bondId: link.bond_id,
			active: profile.partner_user_id === otherId,
			available: !row.partner_user_id || row.partner_user_id === profile.user_id
		}));
	}
	return partners;
}
async function loadHouseSettings(bondId) {
	const rows = await (await getSql())`
    select settings from house_settings where bond_id = ${bondId}
  `;
	return parseHouse(rows[0]?.settings);
}
async function persistHouse(bondId, userId, house) {
	const settings = JSON.stringify(parseHouse(house));
	await (await getSql())`
    insert into house_settings (bond_id, settings, updated_by, updated_at)
    values (${bondId}, ${settings}, ${userId}, now())
    on conflict (bond_id)
    do update set settings = excluded.settings, updated_by = excluded.updated_by, updated_at = now()
  `;
	await touchBond(bondId);
}
function mondayResetAt(now = /* @__PURE__ */ new Date()) {
	const daysFromMonday = (now.getUTCDay() + 6) % 7;
	return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - daysFromMonday, 0, 1, 0, 0));
}
async function settleWeeklyReset(profile, house) {
	try {
		const due = mondayResetAt();
		if (Date.now() < due.getTime()) return;
		if (house?.lastWeeklyReset && new Date(house.lastWeeklyReset).getTime() >= due.getTime()) return;
		const sql = await getSql();
		const cutoff = due.toISOString();
		const rows = await sql`
      select id, kind, title, cadence, status, completed_at, completed_on
      from entries
      where bond_id = ${profile.bond_id}
        and status = 'done'
        and kind in ('punishment','reward','task','rabbit','challenge','roleplay','scene')
        and completed_at is not null
        and completed_at < ${cutoff}
    `;
		for (const row of rows) {
			await sql`
        update entries
        set status = 'open', completed_at = null, completed_on = null, updated_at = now()
        where id = ${row.id} and bond_id = ${profile.bond_id}
      `;
			await logHouseEvent(profile.bond_id, profile.user_id, "weekly_reset", entityOf(row.kind, row.cadence), row.title, "Reopened for the new week");
		}
		await persistHouse(profile.bond_id, profile.user_id, {
			...house,
			lastWeeklyReset: (/* @__PURE__ */ new Date()).toISOString()
		});
	} catch {}
}
async function loadUserOptions(userId) {
	const rows = await (await getSql())`
    select options from user_options where user_id = ${userId}
  `;
	return parseOptions(rows[0]?.options);
}
function entityOf(kind, cadence) {
	if (kind === "rabbit") return "training";
	if (kind === "task" && cadence === "habit") return "habit";
	return kind ?? "";
}
async function logHouseEvent(bondId, actorId, action, entity, title, detail = "") {
	try {
		await (await getSql())`
      insert into house_events (bond_id, actor_id, action, entity, title, detail)
      values (${bondId}, ${actorId}, ${action}, ${entity ?? ""}, ${title ?? ""}, ${detail ?? ""})
    `;
	} catch {}
	await touchBond(bondId);
}
async function touchBond(bondId) {
	if (!bondId) return;
	try {
		await (await getSql())`
      insert into bond_sync (bond_id, revision, updated_at)
      values (${bondId}, 1, now())
      on conflict (bond_id)
      do update set revision = bond_sync.revision + 1, updated_at = now()
    `;
	} catch {}
}
async function closeOpenVisit(userId) {
	try {
		await (await getSql())`
      update location_visits
      set departed_at = now()
      where user_id = ${userId} and departed_at is null
    `;
	} catch {}
}
async function recordLocationVisit(profile, lat, lng, place, moved) {
	try {
		const sql = await getSql();
		const open = (await sql`
      select id, place_name from location_visits
      where user_id = ${profile.user_id} and departed_at is null
      order by arrived_at desc
      limit 1
    `)[0];
		if (!open) {
			await sql`
        insert into location_visits (user_id, bond_id, place_name, lat, lng, arrived_at)
        values (${profile.user_id}, ${profile.bond_id}, ${place || ""}, ${lat}, ${lng}, now())
      `;
			return;
		}
		if (moved) {
			await sql`update location_visits set departed_at = now() where id = ${open.id}`;
			await sql`
        insert into location_visits (user_id, bond_id, place_name, lat, lng, arrived_at)
        values (${profile.user_id}, ${profile.bond_id}, ${place || ""}, ${lat}, ${lng}, now())
      `;
			return;
		}
		if (place && place !== open.place_name) await sql`
        update location_visits
        set place_name = ${place}, lat = ${lat}, lng = ${lng}
        where id = ${open.id}
      `;
	} catch {}
}
async function assertCanMutate(profile, kind, cadence) {
	if (isLeadRole(profile.role)) return;
	const house = await loadHouseSettings(profile.bond_id);
	if (!canEditKind(house, kind, cadence ?? null)) throw new Error("Your Dominant has locked editing on this category.");
}
function assignmentLockedRow(profile, row) {
	if (row.kind !== "task" && row.kind !== "challenge") return false;
	if (row.created_by === profile.user_id) return false;
	const assigned = row.assigned_to;
	if (!assigned) return false;
	return assigned === profile.user_id || assigned === "both";
}
async function assertCanEditRow(profile, row, cadence) {
	if (assignmentLockedRow(profile, row)) throw new Error("Only the person who assigned this can edit it.");
	await assertCanMutate(profile, row.kind, cadence ?? row.cadence);
}
async function assertNotVacation(profile, kind) {
	if (!isDutyKind(kind)) return;
	if ((await loadHouseSettings(profile.bond_id)).vacation) throw new Error("Vacation is on. Resume it to complete tasks and training.");
}
async function insertEntry(userId, bondId, data, opts) {
	const sql = await getSql();
	const meta = JSON.stringify(data.meta ?? {});
	const body = data.body ?? "";
	const status = data.status ?? "open";
	const cadence = data.cadence ?? null;
	const weekday = data.weekday ?? null;
	const category = data.category ?? null;
	const subcategory = data.subcategory ?? null;
	const assignedTo = data.assignedTo ?? null;
	const intensity = data.intensity ?? null;
	const photo = encodePhotos(data.photos, data.photoData ?? null);
	const sortOrder = Number.isFinite(Number(data.sortOrder)) ? Number(data.sortOrder) : 0;
	const mapped = mapEntry((await sql`
    insert into entries (
      bond_id, created_by, kind, title, body, cadence, weekday, status, category,
      subcategory, assigned_to, intensity, photo_data, meta, sort_order
    ) values (
      ${bondId}, ${userId}, ${data.kind}, ${data.title.trim()}, ${body},
      ${cadence}, ${weekday}, ${status}, ${category}, ${subcategory}, ${assignedTo},
      ${intensity}, ${photo}, ${meta}, ${sortOrder}
    )
    returning id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
              subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
  `)[0]);
	if (!opts?.silent) await logHouseEvent(bondId, userId, "created", entityOf(data.kind, data.cadence), data.title.trim());
	return mapped;
}
async function ensureNotesLibrary(userId, bondId) {
	const rows = await (await getSql())`
    select meta from entries where bond_id = ${bondId} and kind = 'note'
  `;
	const have = new Set(rows.map((row) => parseMeta(row.meta).libraryKey).filter(Boolean));
	let created = 0;
	for (const doc of NOTES_LIBRARY) {
		if (have.has(doc.key)) continue;
		await insertEntry(userId, bondId, {
			kind: "note",
			title: doc.title,
			body: doc.body,
			category: doc.category,
			subcategory: doc.subcategory,
			status: "open",
			sortOrder: doc.sort,
			meta: { libraryKey: doc.key }
		}, { silent: true });
		created += 1;
	}
	if (created) await touchBond(bondId);
}
async function ensurePlaybookLibrary(userId, bondId) {
	const rows = await (await getSql())`
    select meta from entries where bond_id = ${bondId} and kind = 'playbook'
  `;
	const have = new Set(rows.map((row) => parseMeta(row.meta).libraryKey).filter(Boolean));
	let created = 0;
	for (const doc of PLAYBOOK_LIBRARY) {
		if (have.has(doc.key)) continue;
		await insertEntry(userId, bondId, {
			kind: "playbook",
			title: doc.title,
			body: doc.body,
			category: doc.category,
			status: "open",
			sortOrder: doc.sort,
			meta: { libraryKey: doc.key }
		}, { silent: true });
		created += 1;
	}
	if (created) await touchBond(bondId);
}
export const getMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => loadMe(context.userId));
export const getBondSync = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	try {
		await sql`update profiles set last_seen = now() where user_id = ${profile.user_id}`;
	} catch {}
	const bondId = profile.bond_id;
	const row = (await sql`
    select
      coalesce((select revision from bond_sync where bond_id = ${bondId}), 0) as bump,
      coalesce((select count(*) from entries where bond_id = ${bondId}), 0) as entries,
      coalesce((select max(updated_at)::text from entries where bond_id = ${bondId}), '0') as entries_at,
      coalesce((select count(*) from messages where bond_id = ${bondId}), 0) as messages,
      coalesce((select max(created_at)::text from messages where bond_id = ${bondId}), '0') as messages_at,
      coalesce((select count(*) from private_photos where bond_id = ${bondId}), 0) as photos,
      coalesce((select max(created_at)::text from private_photos where bond_id = ${bondId}), '0') as photos_at,
      coalesce((select count(*) from journal_comments where bond_id = ${bondId}), 0) as comments,
      coalesce((select max(created_at)::text from journal_comments where bond_id = ${bondId}), '0') as comments_at,
      coalesce((select count(*) from points_ledger where bond_id = ${bondId}), 0) as ledger,
      coalesce((select max(created_at)::text from points_ledger where bond_id = ${bondId}), '0') as ledger_at,
      coalesce((select count(*) from categories where bond_id = ${bondId}), 0) as cats,
      coalesce((select string_agg(name || ':' || slug, ',' order by id) from categories where bond_id = ${bondId}), '') as cat_names,
      coalesce((select count(*) from talk_answers where bond_id = ${bondId}), 0) as talk,
      coalesce((select max(updated_at)::text from talk_answers where bond_id = ${bondId}), '0') as talk_at,
      coalesce((select count(*) from toy_patterns where bond_id = ${bondId}), 0) as toys,
      coalesce((select updated_at::text from house_settings where bond_id = ${bondId}), '0') as house_at,
      coalesce((select count(*) from companion_messages where user_id = ${context.userId}), 0) as companion_n,
      coalesce((select max(id) from companion_messages where user_id = ${context.userId}), 0) as companion_id
  `)[0];
	return { revision: [
		row?.bump,
		row?.entries,
		row?.entries_at,
		row?.messages,
		row?.messages_at,
		row?.photos,
		row?.photos_at,
		row?.comments,
		row?.comments_at,
		row?.ledger,
		row?.ledger_at,
		row?.cats,
		row?.cat_names,
		row?.talk,
		row?.talk_at,
		row?.toys,
		row?.house_at,
		row?.companion_n,
		row?.companion_id
	].map((item) => String(item ?? "")).join("|") };
});
export const listRecentEvents = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	return (await (await getSql())`
      select id, actor_id, action, entity, title, detail, created_at
      from house_events
      where bond_id = ${profile.bond_id}
        and actor_id <> ${context.userId}
      order by id desc
      limit 40
    `).map((row) => ({
		id: Number(row.id),
		actorId: row.actor_id,
		action: row.action,
		entity: row.entity ?? "",
		title: row.title ?? "",
		detail: row.detail ?? "",
		createdAt: asString(row.created_at)
	}));
});
var saveProfileInput = z.object({
	role: ROLE.optional(),
	displayName: z.string().max(80).optional(),
	username: z.string().max(32).optional(),
	avatarData: z.string().nullable().optional(),
	age: z.number().int().min(18).max(99).nullable().optional(),
	sex: z.string().max(24).optional(),
	roleStyle: z.string().max(80).optional(),
	experience: z.string().max(24).optional(),
	playMode: z.string().max(24).optional(),
	setupDone: z.boolean().optional(),
	kinks: z.array(z.string().max(48)).max(40).optional()
});
export const saveProfile = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => saveProfileInput.parse(input)).handler(async ({ context, data }) => {
	const sql = await getSql();
	const existing = await loadProfile(context.userId);
	const username = (data.username ?? "").trim().replace(/[^A-Za-z0-9._-]/g, "").slice(0, 32);
	if (!existing) {
		if (!data.role) throw new Error("Choose Dominant, Submissive, or Switch.");
		if (data.age != null && data.age < 18) throw new Error("Sanctum is for adults 18 and over.");
		const code = await uniqueCode();
		const name = (data.displayName ?? "").trim();
		const avatar = data.avatarData ?? null;
		const age = data.age ?? null;
		const sex = data.sex ?? "";
		const handle = username || name.replace(/\s+/g, "").slice(0, 32);
		const play = data.playMode ?? "";
		const startBond = play === "companion" ? companionBondId(context.userId) : context.userId;
		await sql`
        insert into profiles (user_id, role, display_name, username, pairing_code, bond_id, avatar_data, age, sex, role_style, experience, play_mode, setup_done, kinks)
        values (${context.userId}, ${data.role}, ${name}, ${handle}, ${code}, ${startBond}, ${avatar}, ${age}, ${sex}, ${data.roleStyle ?? ""}, ${parseExperience(data.experience ?? "curious")}, ${play}, ${data.setupDone === true}, ${encodeKinks(data.kinks ?? [])})
      `;
		return mapProfile(await requireProfile(context.userId));
	}
	const nextName = data.displayName !== void 0 ? data.displayName.trim() : existing.display_name;
	const nextUser = data.username !== void 0 ? username || existing.username : existing.username;
	const nextRole = data.role ?? existing.role;
	const nextAvatar = data.avatarData !== void 0 ? data.avatarData : existing.avatar_data;
	const nextAge = data.age !== void 0 ? data.age : existing.age;
	const nextSex = data.sex !== void 0 ? data.sex : existing.sex;
	const nextStyle = data.roleStyle !== void 0 ? data.roleStyle : existing.role_style;
	const nextExperience = data.experience !== void 0 ? parseExperience(data.experience) : parseExperience(existing.experience ?? "curious");
	const nextPlay = data.playMode !== void 0 ? data.playMode : existing.play_mode ?? "solo";
	const nextSetup = data.setupDone !== void 0 ? data.setupDone : existing.setup_done !== false && existing.setup_done !== 0;
	const nextKinks = data.kinks !== void 0 ? encodeKinks(data.kinks) : existing.kinks ?? "[]";
	if (nextAge != null && Number(nextAge) < 18) throw new Error("Sanctum is for adults 18 and over.");
	await sql`
      update profiles
      set role = ${nextRole},
          display_name = ${nextName},
          username = ${nextUser},
          avatar_data = ${nextAvatar},
          age = ${nextAge},
          sex = ${nextSex},
          role_style = ${nextStyle},
          experience = ${nextExperience},
          setup_done = ${nextSetup},
          kinks = ${nextKinks},
          updated_at = now()
      where user_id = ${context.userId}
    `;
	if (data.playMode !== void 0 && (nextPlay === "solo" || nextPlay === "companion")) {
		await setLivePlay(sql, await requireProfile(context.userId), nextPlay);
	} else if (data.playMode !== void 0 && nextPlay === "pair" && !existing.partner_user_id) {
		await sql`update profiles set play_mode = 'pair', updated_at = now() where user_id = ${context.userId}`;
	} else if (data.playMode !== void 0) {
		await sql`update profiles set play_mode = ${nextPlay}, updated_at = now() where user_id = ${context.userId}`;
	}
	await touchBond((await loadProfile(context.userId))?.bond_id);
	return mapProfile(await requireProfile(context.userId));
});
function priorBondId(me, other) {
	if (me.last_partner_user_id === other.user_id && me.last_bond_id) return me.last_bond_id;
	if (other.last_partner_user_id === me.user_id && other.last_bond_id) return other.last_bond_id;
	return null;
}
async function applyPair(sql, a, b, bondId) {
	await sql`
    update profiles
    set partner_user_id = ${b},
        bond_id = ${bondId},
        play_mode = 'pair',
        last_partner_user_id = ${b},
        last_bond_id = ${bondId},
        updated_at = now()
    where user_id = ${a}
  `;
	await sql`
    update profiles
    set partner_user_id = ${a},
        bond_id = ${bondId},
        play_mode = 'pair',
        last_partner_user_id = ${a},
        last_bond_id = ${bondId},
        updated_at = now()
    where user_id = ${b}
  `;
	await touchBond(bondId);
}
async function applySolo(sql, userId, lastPartnerId, lastBondId, playMode = "solo") {
	await sql`
    update profiles
    set partner_user_id = null,
        bond_id = ${userId},
        play_mode = ${playMode},
        last_partner_user_id = ${lastPartnerId},
        last_bond_id = ${lastBondId},
        updated_at = now()
    where user_id = ${userId}
  `;
}
async function setLivePlay(sql, me, mode) {
	if (mode === "companion") {
		const bond = companionBondId(me.user_id);
		if ((me.play_mode ?? "") === "companion" && me.bond_id === bond && !me.partner_user_id) return;
		const partnerId = me.partner_user_id;
		const leaveBond = me.bond_id;
		if (partnerId) {
			await logHouseEvent(leaveBond, me.user_id, "unpaired", "house", "");
			const other = await loadProfile(partnerId);
			if (other?.partner_user_id === me.user_id) {
				await applySolo(sql, partnerId, me.user_id, leaveBond);
				await touchBond(partnerId);
			}
			await sql`
        update profiles
        set partner_user_id = null,
            bond_id = ${bond},
            play_mode = 'companion',
            last_partner_user_id = ${partnerId},
            last_bond_id = ${leaveBond},
            updated_at = now()
        where user_id = ${me.user_id}
      `;
			await touchBond(leaveBond);
		} else {
			await sql`
        update profiles
        set partner_user_id = null,
            bond_id = ${bond},
            play_mode = 'companion',
            updated_at = now()
        where user_id = ${me.user_id}
      `;
		}
		await touchBond(bond);
		await touchBond(me.user_id);
		return;
	}
	if ((me.play_mode ?? "solo") === "solo" && me.bond_id === me.user_id && !me.partner_user_id) return;
	const partnerId = me.partner_user_id;
	const leaveBond = me.bond_id;
	if (partnerId) {
		await logHouseEvent(leaveBond, me.user_id, "unpaired", "house", "");
		const other = await loadProfile(partnerId);
		await applySolo(sql, me.user_id, partnerId, leaveBond);
		if (other?.partner_user_id === me.user_id) {
			await applySolo(sql, partnerId, me.user_id, leaveBond);
			await touchBond(partnerId);
		}
		await touchBond(leaveBond);
	} else {
		await sql`
      update profiles
      set partner_user_id = null,
          bond_id = ${me.user_id},
          play_mode = 'solo',
          updated_at = now()
      where user_id = ${me.user_id}
    `;
	}
	await touchBond(me.user_id);
}
async function parkOther(sql, userId, keepId) {
	const row = await loadProfile(userId);
	if (!row?.partner_user_id || row.partner_user_id === keepId) return;
	const third = await loadProfile(row.partner_user_id);
	if (third?.partner_user_id === userId) {
		await applySolo(sql, third.user_id, userId, third.bond_id);
		await touchBond(third.user_id);
	}
}
async function activatePair(sql, me, other, bondId) {
	const prevMe = me.bond_id;
	const prevOther = other.bond_id;
	await parkOther(sql, me.user_id, other.user_id);
	await parkOther(sql, other.user_id, me.user_id);
	const liveBond = await ensurePartnership(sql, me.user_id, other.user_id, bondId);
	await applyPair(sql, me.user_id, other.user_id, liveBond);
	if (prevMe && prevMe !== liveBond) await touchBond(prevMe);
	if (prevOther && prevOther !== liveBond && prevOther !== prevMe) await touchBond(prevOther);
	return liveBond;
}
async function mergePersonalBonds(sql, me, other, bondId) {
	const sources = [];
	if (me.bond_id === me.user_id) sources.push(me.bond_id);
	if (other.bond_id === other.user_id && other.bond_id !== me.bond_id) sources.push(other.bond_id);
	for (const fromId of sources) {
		await sql`update entries set bond_id = ${bondId} where bond_id = ${fromId}`;
		await sql`update messages set bond_id = ${bondId} where bond_id = ${fromId}`;
		await sql`update private_photos set bond_id = ${bondId} where bond_id = ${fromId}`;
		await sql`
      delete from categories
      where bond_id = ${fromId}
        and exists (
          select 1 from categories o
          where o.bond_id = ${bondId}
            and o.kind = categories.kind
            and o.slug = categories.slug
        )
    `;
		await sql`update categories set bond_id = ${bondId} where bond_id = ${fromId}`;
		await sql`update talk_answers set bond_id = ${bondId} where bond_id = ${fromId}`;
		await sql`update points_ledger set bond_id = ${bondId} where bond_id = ${fromId}`;
		await sql`update journal_comments set bond_id = ${bondId} where bond_id = ${fromId}`;
		await sql`update toy_patterns set bond_id = ${bondId} where bond_id = ${fromId}`;
		await sql`update app_opens set bond_id = ${bondId} where bond_id = ${fromId}`;
		await sql`update location_visits set bond_id = ${bondId} where bond_id = ${fromId}`;
		await sql`update house_events set bond_id = ${bondId} where bond_id = ${fromId}`;
	}
}
var connectInput = z.object({ code: z.string().min(4).max(16) });
export const connectPartner = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => connectInput.parse(input)).handler(async ({ context, data }) => {
	const sql = await getSql();
	const me = await requireProfile(context.userId);
	const other = (await sql`
      select user_id, role, display_name, username, pairing_code, partner_user_id, bond_id, avatar_data, age, sex, role_style, experience, play_mode, setup_done, last_partner_user_id, last_bond_id, kinks
      from profiles
      where pairing_code = ${data.code.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}
    `)[0];
	if (!other) throw new Error("That pairing code was not found.");
	if (other.user_id === me.user_id) throw new Error("That is your own code.");
	if (me.partner_user_id === other.user_id) return loadMe(context.userId);
	const existing = await findPartnership(sql, me.user_id, other.user_id);
	let bondId = existing?.bond_id || priorBondId(me, other);
	if (!bondId) {
		bondId = `bond_${me.user_id.slice(0, 8)}_${other.user_id.slice(0, 8)}_${Date.now()}`;
	}
	bondId = await activatePair(sql, me, other, bondId);
	await logHouseEvent(bondId, context.userId, "paired", "house", other.username || other.display_name, existing ? "switched" : "paired");
	return loadMe(context.userId);
});
export const disconnectPartner = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	const me = await requireProfile(context.userId);
	await setLivePlay(sql, me, "solo");
	return loadMe(context.userId);
});
export const playWithCompanion = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	const me = await requireProfile(context.userId);
	await setLivePlay(sql, me, "companion");
	return loadMe(context.userId);
});
var switchInput = z.object({ userId: z.string().min(1).max(80) });
export const switchPartner = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => switchInput.parse(input)).handler(async ({ context, data }) => {
	const sql = await getSql();
	const me = await requireProfile(context.userId);
	if (data.userId === me.user_id) throw new Error("That is you.");
	if (me.partner_user_id === data.userId) return loadMe(context.userId);
	const other = await loadProfile(data.userId);
	if (!other) throw new Error("That profile is gone.");
	const existing = await findPartnership(sql, me.user_id, other.user_id);
	if (!existing) throw new Error("They are not on your roster. Pair their code first.");
	await logHouseEvent(await activatePair(sql, me, other, existing.bond_id), context.userId, "paired", "house", other.username || other.display_name, "switched");
	return loadMe(context.userId);
});
export const reconnectPartner = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const me = await requireProfile(context.userId);
	const roster = await loadRoster(me);
	const target = roster.find((item) => !item.active && item.userId === me.last_partner_user_id) ?? roster.find((item) => !item.active) ?? roster.find((item) => item.active);
	if (!target) throw new Error("There is no previous partner to reconnect.");
	if (target.active) return loadMe(context.userId);
	const sql = await getSql();
	const other = await loadProfile(target.userId);
	if (!other) throw new Error("That profile is gone.");
	await logHouseEvent(await activatePair(sql, me, other, (await findPartnership(sql, me.user_id, other.user_id))?.bond_id || target.bondId || priorBondId(me, other) || `bond_${me.user_id.slice(0, 8)}_${other.user_id.slice(0, 8)}_${Date.now()}`), context.userId, "paired", "house", other.username || other.display_name, "switched");
	return loadMe(context.userId);
});
export const removePartner = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => switchInput.parse(input)).handler(async ({ context, data }) => {
	const sql = await getSql();
	const me = await requireProfile(context.userId);
	if (data.userId === me.user_id) throw new Error("That is you.");
	const [userA, userB] = pairKey(me.user_id, data.userId);
	if (me.partner_user_id === data.userId) {
		const bondId = me.bond_id;
		const other = await loadProfile(data.userId);
		await applySolo(sql, me.user_id, data.userId, bondId);
		if (other?.partner_user_id === me.user_id) await applySolo(sql, data.userId, me.user_id, bondId);
	}
	await trySql(() => sql`
    update partnerships
    set archived = true
    where user_a = ${userA} and user_b = ${userB}
  `);
	return loadMe(context.userId);
});
var listInput = z.object({ kind: KIND });
export const listEntries = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => listInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	await settleWeeklyReset(profile, await loadHouseSettings(profile.bond_id));
	if (data.kind === "note") try {
		await ensureNotesLibrary(context.userId, profile.bond_id);
	} catch {}
	if (data.kind === "playbook") try {
		await ensurePlaybookLibrary(context.userId, profile.bond_id);
	} catch {}
	return (await (await getSql())`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where bond_id = ${profile.bond_id} and kind = ${data.kind}
      order by created_at desc
    `).map(mapEntry).filter((item) => {
		if (data.kind !== "journal") return true;
		if (item.meta.visibility !== "private") return true;
		return item.createdBy === context.userId;
	}).sort((a, b) => {
		const ao = a.sortOrder || 0;
		const bo = b.sortOrder || 0;
		if (ao !== bo) return ao - bo;
		return (a.title ?? "").localeCompare(b.title ?? "", void 0, { sensitivity: "base" });
	});
});
export const listArchived = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	return (await (await getSql())`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where bond_id = ${profile.bond_id} and status = 'archived'
      order by updated_at desc
    `).map(mapEntry);
});
export const getDashboard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	await settleWeeklyReset(profile, await loadHouseSettings(profile.bond_id));
	await settleOverdue(profile);
	const sql = await getSql();
	const mapped = (await sql`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where bond_id = ${profile.bond_id} and kind = 'task'
      order by created_at desc
    `).map(mapEntry);
	const trainingRows = await sql`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where bond_id = ${profile.bond_id} and kind = 'rabbit'
      order by created_at desc
    `;
	const countsRows = await sql`
      select kind, count(*)::int as n from entries
      where bond_id = ${profile.bond_id}
      group by kind
    `;
	const counts = { ...EMPTY_COUNTS };
	for (const row of countsRows) counts[row.kind] = Number(row.n);
	const points = await loadPoints(profile.bond_id, profile.user_id, profile.partner_user_id);
	const timedRows = await sql`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where bond_id = ${profile.bond_id}
        and kind in ('task','rabbit','challenge','punishment','reward','roleplay','game','scene','calendar')
        and status <> 'archived'
      order by created_at desc
    `;
	const live = mapped.filter((item) => item.status !== "archived" && item.effectiveStatus !== "archived");
	return {
		daily: sortNamed(live.filter((item) => item.cadence === "daily")),
		weekly: sortNamed(live.filter((item) => item.cadence === "weekly")),
		once: sortNamed(live.filter((item) => item.cadence !== "daily" && item.cadence !== "weekly" && item.cadence !== "habit" && item.cadence !== "custom")),
		habits: sortNamed(live.filter((item) => item.cadence === "habit")),
		custom: sortNamed(live.filter((item) => item.cadence === "custom")),
		training: sortNamed(trainingRows.map(mapEntry).filter((item) => item.status !== "archived" && item.effectiveStatus !== "archived")),
		archived: sortNamed(mapped.filter((item) => item.status === "archived" || item.effectiveStatus === "archived")),
		timed: timedRows.map(mapEntry).filter((item) => item.status !== "archived" && item.effectiveStatus !== "archived"),
		calendar: timedRows.map(mapEntry).filter((item) => item.kind === "calendar" && item.status !== "archived" && item.effectiveStatus !== "archived"),
		counts,
		points
	};
});
var entryFields = z.object({
	kind: KIND,
	title: z.string().min(1).max(160),
	body: z.string().max(4e4).optional(),
	cadence: z.string().max(20).nullable().optional(),
	weekday: z.number().int().min(0).max(6).nullable().optional(),
	status: z.string().max(24).optional(),
	category: z.string().max(40).nullable().optional(),
	subcategory: z.string().max(40).nullable().optional(),
	assignedTo: z.string().max(80).nullable().optional(),
	intensity: z.number().int().min(1).max(5).nullable().optional(),
	photoData: z.string().max(2e6).nullable().optional(),
	photos: z.array(z.string().max(2e6)).max(6).optional(),
	meta: z.record(z.string(), z.string()).optional()
});
export const createEntry = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => entryFields.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	await assertCanMutate(profile, data.kind, data.cadence ?? null);
	if (data.meta) {
		const house = await loadHouseSettings(profile.bond_id);
		data.meta = freezeShopMeta(profile, house, data.kind, {}, data.meta);
		data.meta = freezeEarnedCount(profile, house, data.kind, {}, data.meta);
		data.meta = freezeCountdown(profile, house, data.kind, data.cadence ?? null, {}, data.meta);
	}
	if (isCountedKind(data.kind)) {
		const house = await loadHouseSettings(profile.bond_id);
		const meta = { ...data.meta ?? {} };
		if (!(isLeadRole(profile.role) || house.subEdit.earnedCounts) || meta.earnedCount == null || meta.earnedCount === "") meta.earnedCount = data.kind === "punishment" && data.assignedTo ? "1" : "0";
		else {
			const n = Number(meta.earnedCount);
			meta.earnedCount = String(Number.isFinite(n) && n >= 0 ? Math.min(999, Math.trunc(n)) : 0);
		}
		data.meta = meta;
	}
	return insertEntry(context.userId, profile.bond_id, data);
});
var updateFields = entryFields.partial().extend({
	id: z.number().int(),
	kind: KIND.optional()
});
export const updateEntry = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => updateFields.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const row = (await sql`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where id = ${data.id} and bond_id = ${profile.bond_id}
    `)[0];
	if (!row) throw new Error("Entry not found.");
	const fieldsIdle = data.title === void 0 && data.body === void 0 && data.cadence === void 0 && data.weekday === void 0 && data.category === void 0 && data.subcategory === void 0 && data.assignedTo === void 0 && data.intensity === void 0 && data.photoData === void 0 && data.photos === void 0 && data.meta === void 0 && data.status !== void 0;
	const statusOnlyLive = fieldsIdle && data.status !== "archived" && row.status !== "archived";
	const restoreArchived = fieldsIdle && data.status === "open" && row.status === "archived";
	if (!(statusOnlyLive || restoreArchived)) await assertCanEditRow(profile, row, data.cadence ?? row.cadence);
	const title = data.title !== void 0 ? data.title.trim() : row.title;
	const body = data.body !== void 0 ? data.body : row.body;
	const cadence = data.cadence !== void 0 ? data.cadence : row.cadence;
	const weekday = data.weekday !== void 0 ? data.weekday : row.weekday;
	const status = data.status !== void 0 ? data.status : row.status;
	if (status === "done" && row.status !== "done" && isShopKind(row.kind) && profile.role === "submissive" && shopCost(parseMeta(row.meta)) && !parseMeta(row.meta).boughtBy) throw new Error("This has a points cost. Buy it with your points.");
	const category = data.category !== void 0 ? data.category : row.category;
	const subcategory = data.subcategory !== void 0 ? data.subcategory : row.subcategory;
	const assignedTo = data.assignedTo !== void 0 ? data.assignedTo : row.assigned_to;
	const intensity = data.intensity !== void 0 ? data.intensity : row.intensity;
	const currentPhotos = parsePhotos(row.photo_data);
	const photo = encodePhotos(data.photos !== void 0 ? data.photos : data.photoData !== void 0 ? data.photoData ? [data.photoData] : [] : currentPhotos, null);
	let metaObj = data.meta !== void 0 ? { ...data.meta } : parseMeta(row.meta);
	if (data.meta !== void 0 || isCountedKind(row.kind)) {
		const house = await loadHouseSettings(profile.bond_id);
		if (data.meta !== void 0) metaObj = freezeShopMeta(profile, house, row.kind, parseMeta(row.meta), metaObj);
		metaObj = freezeEarnedCount(profile, house, row.kind, parseMeta(row.meta), metaObj);
		metaObj = freezeCountdown(profile, house, row.kind, cadence, parseMeta(row.meta), metaObj);
		if (isCountedKind(row.kind)) {
			const prev = parseMeta(row.meta);
			const locked = profile.role !== "dominant" && !house.subEdit.earnedCounts;
			const prevN = earnedCountOf(prev);
			const nextN = earnedCountOf(metaObj);
			if (row.kind === "punishment" && status === "open" && row.status === "done") {
				if (locked || nextN === prevN) metaObj.earnedCount = String(prevN + 1);
			} else if (isShopKind(row.kind) && status === "done" && row.status !== "done") {
				if (locked || nextN === prevN) metaObj.earnedCount = String(prevN + 1);
			} else if (locked && prev.earnedCount) metaObj.earnedCount = prev.earnedCount;
		}
	}
	if (status === "open" && row.status === "done" && row.kind === "reward") metaObj = await refundPurchase(sql, profile, row, metaObj);
	const meta = JSON.stringify(metaObj);
	const terminal = status === "done" || status === "skipped";
	const completedAt = terminal ? asNullableString(row.completed_at) ?? (/* @__PURE__ */ new Date()).toISOString() : status === "open" ? null : asNullableString(row.completed_at);
	const completedOn = terminal ? startOfTodayUtc() : status === "open" ? null : asNullableString(row.completed_on);
	if ((status === "done" || status === "skipped") && status !== row.status) await assertNotVacation(profile, row.kind);
	await applyTaskConsequences(profile, row, status, context.userId);
	const mapped = mapEntry((await sql`
      update entries set
        title = ${title},
        body = ${body},
        cadence = ${cadence},
        weekday = ${weekday},
        status = ${status},
        category = ${category},
        subcategory = ${subcategory},
        assigned_to = ${assignedTo},
        intensity = ${intensity},
        photo_data = ${photo},
        meta = ${meta},
        completed_at = ${completedAt},
        completed_on = ${completedOn},
        updated_at = now()
      where id = ${data.id} and bond_id = ${profile.bond_id}
      returning id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
                subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
    `)[0]);
	if (status !== row.status) {
		const action = status === "done" ? "completed" : status === "skipped" ? "skipped" : status === "archived" ? "archived" : status === "open" && row.status === "archived" ? "restored" : status === "open" ? "reopened" : "updated";
		await logHouseEvent(profile.bond_id, context.userId, action, entityOf(row.kind, cadence), title);
	} else {
		const prevMeta = parseMeta(row.meta);
		if (row.kind === "journal" && prevMeta.visibility !== "shared" && metaObj.visibility === "shared") await logHouseEvent(profile.bond_id, context.userId, "journal", "journal", title);
		else if (title !== row.title || body !== row.body || category !== row.category || assignedTo !== row.assigned_to || JSON.stringify(prevMeta) !== JSON.stringify(metaObj)) await logHouseEvent(profile.bond_id, context.userId, "updated", entityOf(row.kind, cadence), title);
	}
	return mapped;
});
var idInput = z.object({ id: z.number().int() });
export const deleteEntry = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => idInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const row = (await sql`
      select kind, cadence, title, created_by, assigned_to, status from entries where id = ${data.id} and bond_id = ${profile.bond_id}
    `)[0];
	if (!row) throw new Error("Entry not found.");
	if (row.status !== "archived") await assertCanEditRow(profile, row, row.cadence);
	await sql`delete from entries where id = ${data.id} and bond_id = ${profile.bond_id}`;
	await logHouseEvent(profile.bond_id, context.userId, "deleted", entityOf(row.kind, row.cadence), row.title);
	return { ok: true };
});
var toggleInput = z.object({
	id: z.number().int(),
	done: z.boolean()
});
export const toggleEntry = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => toggleInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const row = (await sql`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where id = ${data.id} and bond_id = ${profile.bond_id}
    `)[0];
	if (!row) throw new Error("Entry not found.");
	if (data.done) await assertNotVacation(profile, row.kind);
	const status = data.done ? "done" : "open";
	if (data.done && isShopKind(row.kind) && profile.role === "submissive" && shopCost(parseMeta(row.meta)) && !parseMeta(row.meta).boughtBy) throw new Error("This has a points cost. Buy it with your points.");
	const completedAt = data.done ? asNullableString(row.completed_at) ?? (/* @__PURE__ */ new Date()).toISOString() : null;
	const completedOn = data.done ? startOfTodayUtc() : null;
	await applyTaskConsequences(profile, row, status, context.userId);
	let metaObj = parseMeta(row.meta);
	if (!data.done && row.kind === "reward") metaObj = await refundPurchase(sql, profile, row, metaObj);
	if (!data.done && row.kind === "punishment" && row.status === "done") metaObj.earnedCount = String(earnedCountOf(metaObj) + 1);
	if (data.done && isShopKind(row.kind) && row.status !== "done") metaObj.earnedCount = String(earnedCountOf(metaObj) + 1);
	const mapped = mapEntry((await sql`
      update entries set
        status = ${status},
        meta = ${JSON.stringify(metaObj)},
        completed_at = ${completedAt},
        completed_on = ${completedOn},
        updated_at = now()
      where id = ${data.id} and bond_id = ${profile.bond_id}
      returning id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
                subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
    `)[0]);
	await logHouseEvent(profile.bond_id, context.userId, data.done ? "completed" : "reopened", entityOf(row.kind, row.cadence), row.title);
	return mapped;
});
export const buyEntry = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => idInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	if (profile.role !== "submissive") throw new Error("Only the Submissive spends points here.");
	const sql = await getSql();
	const row = (await sql`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where id = ${data.id} and bond_id = ${profile.bond_id}
    `)[0];
	if (!row) throw new Error("Entry not found.");
	if (!isShopKind(row.kind)) throw new Error("That cannot be bought with points.");
	if (row.status === "archived") throw new Error("That has been archived.");
	const meta = parseMeta(row.meta);
	const cost = shopCost(meta);
	if (cost == null) throw new Error("No points cost is set on this.");
	if (meta.boughtBy) throw new Error("Already bought.");
	if (row.kind === "reward" && effectiveStatus(row) === "done") throw new Error("Already claimed.");
	const board = await loadPoints(profile.bond_id, profile.user_id, profile.partner_user_id);
	if (board.mine < cost) throw new Error(`You need ${cost} points. You have ${board.mine}.`);
	await insertLedger(profile.bond_id, profile.user_id, -cost, `Bought: ${row.title}`, "shop_buy", Number(row.id), profile.user_id);
	meta.boughtBy = profile.user_id;
	meta.boughtAt = (/* @__PURE__ */ new Date()).toISOString();
	meta.boughtCost = String(cost);
	if (row.kind === "reward") meta.earnedCount = String(earnedCountOf(meta) + 1);
	const nextStatus = row.kind === "reward" ? "done" : row.status;
	const completedAt = nextStatus === "done" ? asNullableString(row.completed_at) ?? (/* @__PURE__ */ new Date()).toISOString() : asNullableString(row.completed_at);
	const completedOn = nextStatus === "done" ? startOfTodayUtc() : asNullableString(row.completed_on);
	const mapped = mapEntry((await sql`
      update entries set
        status = ${nextStatus},
        assigned_to = ${profile.user_id},
        meta = ${JSON.stringify(meta)},
        completed_at = ${completedAt},
        completed_on = ${completedOn},
        updated_at = now()
      where id = ${data.id} and bond_id = ${profile.bond_id}
      returning id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
                subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
    `)[0]);
	await logHouseEvent(profile.bond_id, context.userId, "bought", entityOf(row.kind, row.cadence), row.title, `${cost} points`);
	return {
		entry: mapped,
		points: await loadPoints(profile.bond_id, profile.user_id, profile.partner_user_id)
	};
});
export const listMessages = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	return (await (await getSql())`
      select id, bond_id, sender_id, body, photo_data, audio_data, created_at
      from messages
      where bond_id = ${profile.bond_id}
      order by created_at asc
      limit 200
    `).map(mapMessage);
});
var sendMessageInput = z.object({
	body: z.string().max(4e3).optional(),
	photoData: z.string().max(2e6).nullable().optional(),
	audioData: z.string().max(2e6).nullable().optional()
});
export const sendMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => sendMessageInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const body = (data.body ?? "").trim();
	const photo = data.photoData ?? null;
	const audio = data.audioData ?? null;
	if (!body && !photo && !audio) throw new Error("Write a message, attach a photo or video, or send a voice note.");
	const row = (await (await getSql())`
      insert into messages (bond_id, sender_id, body, photo_data, audio_data)
      values (${profile.bond_id}, ${context.userId}, ${body}, ${photo}, ${audio})
      returning id, bond_id, sender_id, body, photo_data, audio_data, created_at
    `)[0];
	const action = audio ? "voice" : photo && /video|webm|mp4/i.test(photo.slice(0, 40)) ? "video" : photo ? "photo" : "message";
	await logHouseEvent(profile.bond_id, context.userId, action, "message", body.slice(0, 80));
	await touchBond(profile.bond_id);
	return mapMessage(row);
});
export const listPrivatePhotos = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	return (await (await getSql())`
      select id, bond_id, uploaded_by, photo_data, caption, created_at
      from private_photos
      where bond_id = ${profile.bond_id}
      order by created_at desc
    `).map(mapPrivatePhoto);
});
var addPhotoInput = z.object({
	photoData: z.string().min(20).max(2e6),
	caption: z.string().max(200).optional()
});
export const addPrivatePhoto = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => addPhotoInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const caption = (data.caption ?? "").trim();
	const row = (await sql`
      insert into private_photos (bond_id, uploaded_by, photo_data, caption)
      values (${profile.bond_id}, ${context.userId}, ${data.photoData}, ${caption})
      returning id, bond_id, uploaded_by, photo_data, caption, created_at
    `)[0];
	await logHouseEvent(profile.bond_id, context.userId, "photo", "album", caption || "A still");
	await touchBond(profile.bond_id);
	return mapPrivatePhoto(row);
});
export const deletePrivatePhoto = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => idInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	await (await getSql())`
      delete from private_photos
      where id = ${data.id} and bond_id = ${profile.bond_id}
    `;
	await touchBond(profile.bond_id);
	return { ok: true };
});
function mapCategoryRow(row, builtin) {
	return {
		id: row.id == null ? null : Number(row.id),
		kind: row.kind,
		name: row.name,
		slug: row.slug,
		parentSlug: row.parentSlug ?? row.parent_slug ?? null,
		builtin,
		archived: Boolean(row.archived),
		sortOrder: row.sort_order == null ? 0 : Number(row.sort_order)
	};
}
function mergeCategories(kind, custom) {
	const bySlug = new Map(custom.map((item) => [item.slug, item]));
	const builtins = [];
	for (const item of KINDS[kind].categories ?? []) {
		const row = bySlug.get(item.value);
		if (row?.suppressed) continue;
		builtins.push({
			id: row?.id ?? null,
			kind,
			name: row?.name ?? item.label,
			slug: item.value,
			parentSlug: row?.parentSlug ?? item.parent ?? null,
			builtin: true,
			archived: Boolean(row?.archived),
			sortOrder: row?.sortOrder ?? 0
		});
	}
	const seen = new Set((KINDS[kind].categories ?? []).map((item) => item.value));
	const extras = custom.filter((item) => {
		if (seen.has(item.slug) || item.suppressed) return false;
		if (kind === "rabbit" && (item.slug === "outfit" || item.slug === "habit")) return false;
		return true;
	}).map((item) => ({
		id: item.id,
		kind: item.kind,
		name: item.name,
		slug: item.slug,
		parentSlug: item.parentSlug,
		builtin: false,
		archived: Boolean(item.archived),
		sortOrder: item.sortOrder ?? 0
	}));
	return sortNamed([...builtins, ...extras]);
}
var kindOnly = z.object({ kind: KIND });
export const listCategories = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => kindOnly.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const custom = (await (await getSql())`
      select id, kind, name, slug, parent_slug, archived, suppressed, sort_order from categories
      where bond_id = ${profile.bond_id} and kind = ${data.kind}
      order by name
    `).map((row) => ({
		id: Number(row.id),
		kind: row.kind,
		name: row.name,
		slug: row.slug,
		parentSlug: row.parent_slug,
		builtin: false,
		archived: Boolean(row.archived),
		suppressed: Boolean(row.suppressed),
		sortOrder: row.sort_order == null ? 0 : Number(row.sort_order)
	}));
	return mergeCategories(data.kind, custom);
});
var addCategoryInput = z.object({
	kind: KIND,
	name: z.string().min(1).max(40),
	parentSlug: z.string().max(40).nullable().optional()
});
export const addCategory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => addCategoryInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	await assertCanMutate(profile, data.kind);
	const sql = await getSql();
	const name = data.name.trim();
	let slug = slugify(name);
	const parent = data.parentSlug || null;
	if (parent && parent === slug) throw new Error("A category cannot sit under itself.");
	const existing = (await sql`
      select id, suppressed from categories
      where bond_id = ${profile.bond_id} and kind = ${data.kind} and slug = ${slug}
      limit 1
    `)[0];
	if (existing?.suppressed) {
		const row = (await sql`
      update categories
      set name = ${name}, parent_slug = ${parent}, archived = false, suppressed = false
      where id = ${existing.id} and bond_id = ${profile.bond_id}
      returning id, kind, name, slug, parent_slug, archived
    `)[0];
		return mapCategoryRow(row, builtinSlugs(data.kind).has(row.slug));
	}
	if (existing) slug = `${slug}-${Date.now().toString().slice(-4)}`;
	const row = (await sql`
      insert into categories (bond_id, kind, name, slug, parent_slug, archived, suppressed)
      values (${profile.bond_id}, ${data.kind}, ${name}, ${slug}, ${parent}, false, false)
      returning id, kind, name, slug, parent_slug, archived
    `)[0];
	return mapCategoryRow(row, false);
});
var categoryKey = z.object({
	id: z.number().int().optional(),
	kind: KIND.optional(),
	slug: z.string().max(40).optional(),
	name: z.string().min(1).max(40).optional(),
	parentSlug: z.string().max(40).nullable().optional(),
	archived: z.boolean().optional()
});
async function loadCategoryRow(sql, bondId, data) {
	if (data.id) return (await sql`
      select id, kind, name, slug, parent_slug, archived, suppressed from categories
      where id = ${data.id} and bond_id = ${bondId}
    `)[0] ?? null;
	if (data.kind && data.slug) return (await sql`
      select id, kind, name, slug, parent_slug, archived, suppressed from categories
      where bond_id = ${bondId} and kind = ${data.kind} and slug = ${data.slug}
    `)[0] ?? null;
	return null;
}
async function upsertCategory(sql, bondId, kind, slug, name, parentSlug, archived, suppressed) {
	const existing = (await sql`
    select id from categories where bond_id = ${bondId} and kind = ${kind} and slug = ${slug}
  `)[0];
	if (existing) return (await sql`
      update categories set
        name = ${name},
        parent_slug = ${parentSlug},
        archived = ${archived},
        suppressed = ${suppressed}
      where id = ${existing.id}
      returning id, kind, name, slug, parent_slug, archived, suppressed
    `)[0];
	return (await sql`
    insert into categories (bond_id, kind, name, slug, parent_slug, archived, suppressed)
    values (${bondId}, ${kind}, ${name}, ${slug}, ${parentSlug}, ${archived}, ${suppressed})
    returning id, kind, name, slug, parent_slug, archived, suppressed
  `)[0];
}
export const updateCategory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => categoryKey.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const kind = data.kind;
	const slug = data.slug;
	if (!kind || !slug) throw new Error("Choose a category.");
	await assertCanMutate(profile, kind);
	const sql = await getSql();
	const builtin = (KINDS[kind].categories ?? []).find((item) => item.value === slug);
	const current = await loadCategoryRow(sql, profile.bond_id, data);
	const name = (data.name ?? current?.name ?? builtin?.label ?? slug).trim();
	const parent = data.parentSlug !== void 0 ? data.parentSlug : current?.parent_slug ?? null;
	const archived = data.archived ?? Boolean(current?.archived);
	const row = await upsertCategory(sql, profile.bond_id, kind, slug, name, parent, archived, false);
	await touchBond(profile.bond_id);
	return mapCategoryRow(row, Boolean(builtin));
});
export const deleteCategory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => categoryKey.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const current = await loadCategoryRow(sql, profile.bond_id, data);
	const kind = current?.kind ?? data.kind;
	const slug = current?.slug ?? data.slug;
	if (!kind || !slug) throw new Error("Category not found.");
	await assertCanMutate(profile, kind);
	if (builtinSlugs(kind).has(slug)) {
		const name = current?.name ?? (KINDS[kind].categories ?? []).find((item) => item.value === slug)?.label ?? slug;
		await upsertCategory(sql, profile.bond_id, kind, slug, name, current?.parent_slug ?? null, true, true);
		return { ok: true };
	}
	if (current?.id) {
		await sql`delete from categories where id = ${current.id} and bond_id = ${profile.bond_id}`;
		await sql`
      delete from categories
      where bond_id = ${profile.bond_id} and kind = ${kind} and parent_slug = ${slug}
    `;
	}
	return { ok: true };
});
var reorderEntriesInput = z.object({ ids: z.array(z.number().int()).min(1).max(200) });
export const reorderEntries = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => reorderEntriesInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	for (let i = 0; i < data.ids.length; i += 1) {
		const row = (await sql`
      select kind, created_by, assigned_to from entries
      where id = ${data.ids[i]} and bond_id = ${profile.bond_id}
    `)[0];
		if (!row || assignmentLockedRow(profile, row)) continue;
		await sql`
      update entries
      set sort_order = ${i + 1}, updated_at = now()
      where id = ${data.ids[i]} and bond_id = ${profile.bond_id}
    `;
	}
	await touchBond(profile.bond_id);
	return { ok: true };
});
var reorderCategoriesInput = z.object({
	kind: KIND,
	slugs: z.array(z.string().max(40)).min(1).max(80)
});
export const reorderCategories = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => reorderCategoriesInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	await assertCanMutate(profile, data.kind);
	const sql = await getSql();
	for (let i = 0; i < data.slugs.length; i += 1) {
		const slug = data.slugs[i];
		const existing = (await sql`
      select id from categories
      where bond_id = ${profile.bond_id} and kind = ${data.kind} and slug = ${slug}
    `)[0];
		if (existing) {
			await sql`update categories set sort_order = ${i + 1} where id = ${existing.id}`;
			continue;
		}
		const name = (KINDS[data.kind].categories ?? []).find((item) => item.value === slug)?.label ?? slug;
		await sql`
      insert into categories (bond_id, kind, name, slug, parent_slug, archived, suppressed, sort_order)
      values (${profile.bond_id}, ${data.kind}, ${name}, ${slug}, null, false, false, ${i + 1})
    `;
	}
	await touchBond(profile.bond_id);
	return { ok: true };
});
var setUrgencyInput = z.object({
	id: z.number().int(),
	urgency: z.enum([
		"low",
		"normal",
		"high",
		"urgent"
	])
});
export const setUrgency = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => setUrgencyInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const row = (await sql`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where id = ${data.id} and bond_id = ${profile.bond_id}
    `)[0];
	if (!row) throw new Error("Entry not found.");
	await assertCanEditRow(profile, row, row.cadence);
	const meta = parseMeta(row.meta);
	meta.urgency = data.urgency;
	return mapEntry((await sql`
      update entries
      set meta = ${JSON.stringify(meta)}, updated_at = now()
      where id = ${data.id} and bond_id = ${profile.bond_id}
      returning id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
                subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
    `)[0]);
});
var setEarnedCountInput = z.object({
	id: z.number().int(),
	count: z.number().int().min(0).max(999)
});
export const setEarnedCount = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => setEarnedCountInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const house = await loadHouseSettings(profile.bond_id);
	if (profile.role !== "dominant" && !house.subEdit.earnedCounts) throw new Error("Your Dominant has locked these counts.");
	const sql = await getSql();
	const row = (await sql`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where id = ${data.id} and bond_id = ${profile.bond_id}
    `)[0];
	if (!row) throw new Error("Entry not found.");
	if (!isCountedKind(row.kind)) throw new Error("This does not keep a count.");
	const meta = parseMeta(row.meta);
	meta.earnedCount = String(data.count);
	const mapped = mapEntry((await sql`
      update entries
      set meta = ${JSON.stringify(meta)}, updated_at = now()
      where id = ${data.id} and bond_id = ${profile.bond_id}
      returning id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
                subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
    `)[0]);
	await logHouseEvent(profile.bond_id, context.userId, "updated", entityOf(row.kind, row.cadence), row.title, `${data.count} ${countWord(row.kind)}`);
	return mapped;
});
export const listTalkAnswers = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	return (await (await getSql())`
      select topic, user_id, body, rating, visibility, updated_at
      from talk_answers
      where bond_id = ${profile.bond_id}
        and (user_id = ${context.userId} or coalesce(visibility, 'shared') = 'shared')
      order by updated_at desc
    `).map((row) => ({
		topic: row.topic,
		userId: row.user_id,
		body: row.body ?? "",
		rating: row.rating,
		visibility: row.visibility ?? "shared",
		updatedAt: asString(row.updated_at)
	}));
});
var talkInput = z.object({
	topic: z.string().min(1).max(160),
	body: z.string().max(8e3).optional(),
	rating: z.string().max(24).nullable().optional(),
	visibility: z.enum(["shared", "private"]).optional()
});
export const saveTalkAnswer = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => talkInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const body = (data.body ?? "").trim();
	const rating = data.rating ?? null;
	const visibility = data.topic.startsWith("weektry:") ? "shared" : data.visibility ?? "shared";
	const row = (await sql`
      insert into talk_answers (bond_id, topic, user_id, body, rating, visibility)
      values (${profile.bond_id}, ${data.topic}, ${context.userId}, ${body}, ${rating}, ${visibility})
      on conflict (bond_id, topic, user_id)
      do update set body = excluded.body, rating = excluded.rating, visibility = excluded.visibility, updated_at = now()
      returning topic, user_id, body, rating, visibility, updated_at
    `)[0];
	await logHouseEvent(profile.bond_id, context.userId, "talk", "talk", talkEventTitle(data.topic));
	await touchBond(profile.bond_id);
	return {
		topic: row.topic,
		userId: row.user_id,
		body: row.body ?? "",
		rating: row.rating,
		visibility: row.visibility ?? "shared",
		updatedAt: asString(row.updated_at)
	};
});
var STARTER = [
	{
		kind: "task",
		title: "Morning check-in",
		body: "Send a short morning message and today's intention.",
		cadence: "daily",
		meta: {
			points: "5",
			reminderTime: "08:00",
			reminderEnabled: "1",
			stakesMode: "points"
		}
	},
	{
		kind: "task",
		title: "Evening recap",
		body: "Write three lines: what was asked, what was done, how it felt.",
		cadence: "daily",
		meta: {
			points: "5",
			reminderTime: "21:00",
			reminderEnabled: "1",
			stakesMode: "points"
		}
	},
	{
		kind: "task",
		title: "Collar at dusk",
		body: "Put the day collar on and send a photograph.",
		cadence: "habit",
		meta: {
			points: "8",
			skipPoints: "-4",
			reminderTime: "18:00",
			reminderEnabled: "1",
			stakesMode: "points"
		}
	},
	{
		kind: "task",
		title: "Wardrobe photograph",
		body: "Choose one catalogue piece and photograph it worn or laid out.",
		cadence: "weekly"
	},
	{
		kind: "rabbit",
		title: "Present",
		body: "Kneel, spine long, hands on thighs, eyes down until acknowledged.",
		category: "position",
		intensity: 2,
		meta: {
			command: "Present.",
			treat: "A quiet good rabbit."
		}
	},
	{
		kind: "rabbit",
		title: "Evening kneel",
		body: "Five minutes in present before bed. Photograph if asked.",
		category: "ritual",
		intensity: 2,
		meta: {
			command: "Kneel.",
			treat: "A quiet good.",
			reminderEnabled: "1",
			reminderTime: "21:30",
			points: "6",
			stakesMode: "points"
		}
	},
	{
		kind: "punishment",
		title: "Lines",
		body: "Write the broken rule twenty times, photograph the page, and file it here.",
		intensity: 2,
		meta: {
			reason: "Missed a daily task without notice",
			earnedCount: "1"
		}
	},
	{
		kind: "reward",
		title: "Chosen film",
		body: "The submissive picks tonight's film. No commentary from the other chair.",
		intensity: 1,
		meta: {
			earn: "Seven days of completed morning check-ins",
			cost: "15"
		}
	},
	{
		kind: "game",
		title: "Two truths, one task",
		body: "Each names two truths and one task. The other must pick the task — or all three. Draw a card, a prompt, or a catalogue piece as the forfeit.",
		category: "card",
		intensity: 3,
		meta: {
			cards: JSON.stringify([
				"Two truths — Name two true things about tonight. The other picks which is the task.",
				"Forfeit prop — Fetch whatever the last draw named and present it.",
				"Hold — Stay in position until the other has asked three questions."
			]),
			prompts: JSON.stringify([
				"What would you do if I asked you to wait here?",
				"Name a limit you want restated before we continue.",
				"Which catalogue piece would you choose as a forfeit, and why?"
			])
		}
	},
	{
		kind: "scene",
		title: "Friday chamber",
		body: "Slow protocol, bunny positions, then a negotiated scene. Safeword in play.",
		intensity: 3,
		meta: {
			when: "Friday evening",
			duration: "90 minutes",
			aftercare: "Water, blanket, debrief.",
			cost: "40"
		}
	},
	{
		kind: "journal",
		title: "Opening page",
		body: "This journal belongs to the dynamic. Write what the day asked of you.",
		intensity: 1,
		meta: {
			mood: "Expectant",
			visibility: "shared"
		}
	},
	{
		kind: "journal",
		title: "Private notes",
		body: "Kept only for you. Switch visibility to shared if you want comments.",
		intensity: 1,
		meta: {
			mood: "Quiet",
			visibility: "private"
		}
	},
	{
		kind: "note",
		title: "Limits",
		body: "Keep hard limits, safeword, and aftercare needs here so they are never buried.",
		category: "limits"
	},
	{
		kind: "note",
		title: "Aftercare",
		body: "What happens when a scene ends: water, food, touch or space, words that help, and the next-morning check-in. Keep this current.",
		category: "aftercare"
	},
	{
		kind: "note",
		title: "Draft contract",
		body: "Names, duration, standing rules, negotiated scenes, and how the bond may be paused.",
		category: "contract"
	},
	{
		kind: "catalog",
		title: "Day collar",
		body: "Worn in public as a quiet reminder. Photograph both sides.",
		category: "accessory",
		intensity: 1,
		meta: { brand: "" }
	},
	{
		kind: "catalog",
		title: "Leather cuffs",
		body: "Wrists. Quick-release. Photograph the buckle side.",
		category: "restraint",
		intensity: 2
	},
	{
		kind: "catalog",
		title: "Kneeling bench",
		body: "Padded. Used for present and wait.",
		category: "furniture",
		intensity: 2
	},
	{
		kind: "catalog",
		title: "The chamber",
		body: "The space used for protocol and scenes. Lights, floor, and aftercare corner.",
		category: "room",
		intensity: 1
	}
];
export const seedStarter = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	if (((await sql`
      select count(*)::int as n from entries where bond_id = ${profile.bond_id}
    `)[0]?.n ?? 0) > 0) return { created: 0 };
	let created = 0;
	for (const item of STARTER) {
		await insertEntry(context.userId, profile.bond_id, {
			kind: item.kind,
			title: item.title,
			body: item.body,
			cadence: item.cadence ?? null,
			category: item.category ?? null,
			intensity: item.intensity ?? null,
			status: item.status ?? "open",
			meta: item.meta ?? {}
		});
		created += 1;
	}
	const gameRows = await sql`
      select id, meta from entries where bond_id = ${profile.bond_id} and kind = 'game' limit 1
    `;
	const catalogRows = await sql`
      select id, title from entries where bond_id = ${profile.bond_id} and kind = 'catalog'
    `;
	if (gameRows[0] && catalogRows.length) {
		const meta = parseMeta(gameRows[0].meta);
		meta.catalogIds = catalogRows.map((row) => String(row.id)).join(",");
		meta.catalogTitles = catalogRows.map((row) => row.title).join(" · ");
		const roles = {};
		catalogRows.forEach((row, index) => {
			roles[String(row.id)] = index === 0 ? "prompt" : index === 1 ? "card" : "prop";
		});
		meta.catalogRoles = JSON.stringify(roles);
		await sql`update entries set meta = ${JSON.stringify(meta)} where id = ${gameRows[0].id}`;
	}
	const habitRows = await sql`
      select id, meta from entries where bond_id = ${profile.bond_id} and kind = 'task' and cadence = 'habit' limit 1
    `;
	const rewardRows = await sql`
      select id, title from entries where bond_id = ${profile.bond_id} and kind = 'reward' limit 1
    `;
	const punishmentRows = await sql`
      select id, title from entries where bond_id = ${profile.bond_id} and kind = 'punishment' limit 1
    `;
	if (habitRows[0] && (rewardRows[0] || punishmentRows[0])) {
		const meta = parseMeta(habitRows[0].meta);
		if (rewardRows[0] && punishmentRows[0]) meta.stakesMode = "both";
		else if (punishmentRows[0]) meta.stakesMode = "punishments";
		else meta.stakesMode = "items";
		if (rewardRows[0]) {
			meta.rewardIds = String(rewardRows[0].id);
			meta.rewardTitles = rewardRows[0].title;
		}
		if (punishmentRows[0]) {
			meta.punishmentIds = String(punishmentRows[0].id);
			meta.punishmentTitles = punishmentRows[0].title;
		}
		await sql`update entries set meta = ${JSON.stringify(meta)} where id = ${habitRows[0].id}`;
	}
	return { created };
});
export const getPoints = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	return loadPoints(profile.bond_id, profile.user_id, profile.partner_user_id);
});
var adjustPointsInput = z.object({
	userId: z.string().min(1).max(80),
	delta: z.number().int().min(-1e4).max(1e4),
	reason: z.string().max(160).optional()
});
export const adjustPoints = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => adjustPointsInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	if (!data.delta) return loadPoints(profile.bond_id, profile.user_id, profile.partner_user_id);
	const allowed = /* @__PURE__ */ new Set([profile.user_id]);
	if (profile.partner_user_id) allowed.add(profile.partner_user_id);
	if (!allowed.has(data.userId)) throw new Error("You can only move points inside this bond.");
	await insertLedger(profile.bond_id, data.userId, data.delta, (data.reason ?? "").trim() || "Manual adjustment", "manual", null, context.userId);
	await logHouseEvent(profile.bond_id, context.userId, "points", "points", `${data.delta > 0 ? "+" : ""}${data.delta}`, (data.reason ?? "").trim());
	return loadPoints(profile.bond_id, profile.user_id, profile.partner_user_id);
});
export const listJournalComments = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	return (await (await getSql())`
      select jc.id, jc.entry_id, jc.author_id, jc.body, jc.photo_data, jc.created_at,
             e.created_by, e.meta
      from journal_comments jc
      join entries e on e.id = jc.entry_id
      where jc.bond_id = ${profile.bond_id}
      order by jc.created_at asc
    `).filter((row) => {
		if (parseMeta(row.meta).visibility !== "private") return true;
		return row.created_by === context.userId;
	}).map((row) => ({
		id: Number(row.id),
		entryId: Number(row.entry_id),
		authorId: row.author_id,
		body: row.body ?? "",
		photoData: row.photo_data,
		createdAt: asString(row.created_at)
	}));
});
var commentInput = z.object({
	entryId: z.number().int(),
	body: z.string().max(4e3).optional(),
	photoData: z.string().max(2e6).nullable().optional()
});
export const addJournalComment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => commentInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const body = (data.body ?? "").trim();
	const photo = data.photoData ?? null;
	if (!body && !photo) throw new Error("Write a comment or attach a photo.");
	const sql = await getSql();
	const entry = (await sql`
      select id, bond_id, created_by, kind, title, body, cadence, weekday, status, category,
             subcategory, assigned_to, intensity, photo_data, meta, created_at, updated_at, completed_at, completed_on, sort_order
      from entries
      where id = ${data.entryId} and bond_id = ${profile.bond_id} and kind = 'journal'
    `)[0];
	if (!entry) throw new Error("Journal entry not found.");
	const mapped = mapEntry(entry);
	if (mapped.meta.visibility === "private" && mapped.createdBy !== context.userId) throw new Error("That page is private.");
	if (mapped.meta.visibility === "private") throw new Error("Private pages do not take comments.");
	const row = (await sql`
      insert into journal_comments (bond_id, entry_id, author_id, body, photo_data)
      values (${profile.bond_id}, ${data.entryId}, ${context.userId}, ${body}, ${photo})
      returning id, entry_id, author_id, body, photo_data, created_at
    `)[0];
	await touchBond(profile.bond_id);
	return {
		id: Number(row.id),
		entryId: Number(row.entry_id),
		authorId: row.author_id,
		body: row.body ?? "",
		photoData: row.photo_data,
		createdAt: asString(row.created_at)
	};
});
export const deleteJournalComment = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => idInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	await (await getSql())`
      delete from journal_comments
      where id = ${data.id} and bond_id = ${profile.bond_id} and author_id = ${context.userId}
    `;
	await touchBond(profile.bond_id);
	return { ok: true };
});
export const listToyPatterns = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	return (await (await getSql())`
      select id, title, steps, created_by, created_at
      from toy_patterns
      where bond_id = ${profile.bond_id}
      order by created_at desc
    `).map((row) => ({
		id: Number(row.id),
		title: row.title,
		steps: parsePatternSteps(row.steps),
		createdBy: row.created_by,
		createdAt: asString(row.created_at)
	}));
});
function parsePatternSteps(raw) {
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.map((item) => {
			if (!item || typeof item !== "object") return null;
			const rec = item;
			const intensity = Number(rec.intensity);
			const ms = Number(rec.ms);
			if (!Number.isFinite(intensity) || !Number.isFinite(ms)) return null;
			const intensity2 = rec.intensity2 == null ? void 0 : Number(rec.intensity2);
			return {
				intensity: Math.max(0, Math.min(100, Math.round(intensity))),
				...Number.isFinite(intensity2) ? { intensity2: Math.max(0, Math.min(100, Math.round(intensity2))) } : {},
				ms: Math.max(100, Math.min(12e4, Math.round(ms)))
			};
		}).filter((item) => item != null);
	} catch {
		return [];
	}
}
var patternInput = z.object({
	title: z.string().min(1).max(80),
	steps: z.array(z.object({
		intensity: z.number().int().min(0).max(100),
		intensity2: z.number().int().min(0).max(100).optional(),
		ms: z.number().int().min(100).max(12e4)
	})).min(1).max(80)
});
export const saveToyPattern = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => patternInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const steps = JSON.stringify(data.steps);
	const row = (await sql`
      insert into toy_patterns (bond_id, created_by, title, steps)
      values (${profile.bond_id}, ${context.userId}, ${data.title.trim()}, ${steps})
      returning id, title, steps, created_by, created_at
    `)[0];
	await touchBond(profile.bond_id);
	return {
		id: Number(row.id),
		title: row.title,
		steps: parsePatternSteps(row.steps),
		createdBy: row.created_by,
		createdAt: asString(row.created_at)
	};
});
export const deleteToyPattern = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => idInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	await (await getSql())`
      delete from toy_patterns where id = ${data.id} and bond_id = ${profile.bond_id}
    `;
	await touchBond(profile.bond_id);
	return { ok: true };
});
var spotifyInput = z.object({ url: z.string().min(8).max(400) });
export const lookupSpotify = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator((input) => spotifyInput.parse(input)).handler(async ({ data }) => {
	const match = data.url.trim().match(/open\.spotify\.com\/(playlist|track|album|episode)\/([A-Za-z0-9]+)/);
	if (!match) throw new Error("Paste a Spotify playlist, album, or track link.");
	const kind = match[1];
	const id = match[2];
	const canonical = `https://open.spotify.com/${kind}/${id}`;
	let title = kind === "playlist" ? "Spotify playlist" : `Spotify ${kind}`;
	let thumbnail = null;
	try {
		const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(canonical)}`, { headers: { Accept: "application/json" } });
		if (res.ok) {
			const json = await res.json();
			if (json.title) title = json.title;
			if (json.thumbnail_url) thumbnail = json.thumbnail_url;
		}
	} catch {}
	return {
		title,
		thumbnail,
		kind,
		id,
		embed: `https://open.spotify.com/embed/${kind}/${id}?utm_source=generator&theme=0`,
		url: canonical
	};
});
function mapCompanion(row) {
	return {
		name: row.name,
		gender: row.gender,
		pronouns: row.pronouns ?? "",
		age: clampCompanionAge(row.age),
		role: row.role,
		dynamic: row.dynamic ?? "",
		addressAs: row.address_as,
		voice: row.voice,
		persona: row.persona,
		appearance: row.appearance,
		kinks: row.kinks,
		limits: row.limits,
		heat: Math.min(5, Math.max(1, Number(row.heat) || 4)),
		extra: row.extra ?? "",
		avatarData: row.avatar_data,
		neediness: Math.min(5, Math.max(1, Number(row.neediness) || 3))
	};
}
export const getCompanion = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	await requireProfile(context.userId);
	const rows = await (await getSql())`
      select name, gender, role, address_as, voice, persona, appearance, kinks, limits, avatar_data,
             pronouns, age, dynamic, heat, extra, neediness
      from companion_profiles
      where user_id = ${context.userId}
    `;
	return rows[0] ? mapCompanion(rows[0]) : { ...DEFAULT_COMPANION };
});
var companionFields = z.object({
	name: z.string().max(80),
	gender: z.string().max(40),
	pronouns: z.string().max(40).optional(),
	age: z.preprocess((value) => {
		if (value == null || value === "") return void 0;
		const n = typeof value === "number" ? value : Number(value);
		if (!Number.isFinite(n)) return void 0;
		return clampCompanionAge(n);
	}, z.number().int().min(21).max(99).optional()),
	role: z.string().max(40),
	dynamic: z.string().max(80).optional(),
	addressAs: z.string().max(80),
	voice: z.string().max(400),
	persona: z.string().max(2e3),
	appearance: z.string().max(4e3),
	kinks: z.string().max(2e3),
	limits: z.string().max(2e3),
	heat: z.number().int().min(1).max(5).optional(),
	neediness: z.number().int().min(1).max(5).optional(),
	extra: z.string().max(2e3).optional(),
	avatarData: z.string().nullable().optional()
});
export const saveCompanion = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => companionFields.parse(input)).handler(async ({ context, data }) => {
	await requireProfile(context.userId);
	const sql = await getSql();
	const avatar = data.avatarData ?? null;
	const pronouns = (data.pronouns ?? "").trim();
	const age = clampCompanionAge(data.age);
	const dynamic = (data.dynamic ?? "").trim();
	const heat = data.heat ?? 4;
	const extra = (data.extra ?? "").trim();
	const neediness = Math.min(5, Math.max(1, data.neediness ?? 3));
	const saved = mapCompanion((await sql`
      insert into companion_profiles (
        user_id, name, gender, role, address_as, voice, persona, appearance, kinks, limits, avatar_data,
        pronouns, age, dynamic, heat, extra, neediness
      ) values (
        ${context.userId}, ${data.name.trim()}, ${data.gender.trim()}, ${data.role.trim()},
        ${data.addressAs.trim()}, ${data.voice.trim()}, ${data.persona.trim()},
        ${data.appearance.trim()}, ${data.kinks.trim()}, ${data.limits.trim()}, ${avatar},
        ${pronouns}, ${age}, ${dynamic}, ${heat}, ${extra}, ${neediness}
      )
      on conflict (user_id) do update set
        name = excluded.name,
        gender = excluded.gender,
        role = excluded.role,
        address_as = excluded.address_as,
        voice = excluded.voice,
        persona = excluded.persona,
        appearance = excluded.appearance,
        kinks = excluded.kinks,
        limits = excluded.limits,
        avatar_data = excluded.avatar_data,
        pronouns = excluded.pronouns,
        age = excluded.age,
        dynamic = excluded.dynamic,
        heat = excluded.heat,
        extra = excluded.extra,
        neediness = excluded.neediness,
        updated_at = now()
      returning name, gender, role, address_as, voice, persona, appearance, kinks, limits, avatar_data,
                pronouns, age, dynamic, heat, extra, neediness
    `)[0]);
	const pause = companionNeedinessSpec(saved.neediness).afterUserPauseSec;
	try {
		await sql`
      update companion_profiles
      set next_nudge_at = now() + (${pause}::int * interval '1 second')
      where user_id = ${context.userId}
    `;
	} catch {
		/* nudge columns apply on migrate */
	}
	return saved;
});
var portraitInput = z.object({
	appearance: z.string().min(8).max(4e3),
	name: z.string().max(80).optional(),
	gender: z.string().max(40).optional(),
	pronouns: z.string().max(40).optional(),
	age: z.preprocess((value) => {
		if (value == null || value === "") return void 0;
		const n = typeof value === "number" ? value : Number(value);
		if (!Number.isFinite(n)) return void 0;
		return clampCompanionAge(n);
	}, z.number().int().min(21).max(99).optional())
});
async function imaginePortraitDataUrl(apiKey, prompt) {
	const attempts = [{
		model: "grok-imagine-image-2.0",
		prompt,
		n: 1,
		aspect_ratio: "1:1",
		resolution: "1k"
	}, {
		model: "grok-imagine-image-2.0",
		prompt,
		n: 1
	}];
	let lastError = "Could not make that portrait.";
	for (const body of attempts) {
		const res = await fetch("https://api.x.ai/v1/images/generations", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify(body)
		});
		const raw = await res.text().catch(() => "");
		if (!res.ok) {
			let detail = raw.slice(0, 180);
			try {
				const parsed = JSON.parse(raw);
				detail = parsed?.error?.message || parsed?.message || detail;
			} catch {}
			lastError = detail || `Portrait failed (${res.status}).`;
			const retryable = res.status === 400 || res.status === 422;
			const mentionsParam = /aspect|resolution|unknown field|invalid request/i.test(lastError);
			if (retryable && mentionsParam) continue;
			if (res.status === 400 && body.aspect_ratio) continue;
			throw new Error(lastError);
		}
		let json;
		try {
			json = JSON.parse(raw);
		} catch {
			throw new Error("Portrait came back unreadable.");
		}
		const first = json?.data?.[0] ?? json;
		const b64 = first?.b64_json || first?.b64 || json?.b64_json;
		if (typeof b64 === "string" && b64.length > 80) return `data:${b64.startsWith("iVBOR") ? "image/png" : "image/jpeg"};base64,${b64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "")}`;
		const url = first?.url || json?.url;
		if (typeof url === "string" && url.startsWith("http")) {
			const img = await fetch(url);
			if (!img.ok) throw new Error("The portrait link could not be read.");
			const buf = Buffer.from(await img.arrayBuffer());
			return `data:${img.headers.get("content-type")?.split(";")[0] || "image/jpeg"};base64,${buf.toString("base64")}`;
		}
		lastError = "Portrait had no image in it.";
	}
	throw new Error(lastError);
}
export const generateCompanionPortrait = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => portraitInput.parse(input)).handler(async ({ context, data }) => {
	await requireProfile(context.userId);
	const appearance = data.appearance.trim();
	if (appearance.length < 8) throw new Error("Write how they look first.");
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) throw new Error("Portrait generation is not available right now.");
	const age = clampCompanionAge(data.age);
	const name = (data.name ?? "").trim() || DEFAULT_COMPANION.name;
	const gender = (data.gender ?? "").trim();
	const pronouns = (data.pronouns ?? "").trim();
	const avatar = await imaginePortraitDataUrl(apiKey, companionImagePrompt({
		name,
		age,
		gender,
		pronouns,
		appearance
	}));
	if (avatar.length > 12e5) throw new Error("That portrait was too large to keep. Try a simpler description.");
	const sql = await getSql();
	const existing = (await sql`
      select name, gender, role, address_as, voice, persona, appearance, kinks, limits, avatar_data,
             pronouns, age, dynamic, heat, extra, neediness
      from companion_profiles
      where user_id = ${context.userId}
    `)[0];
	const seed = existing ? mapCompanion(existing) : { ...DEFAULT_COMPANION };
	return mapCompanion((await sql`
      insert into companion_profiles (
        user_id, name, gender, role, address_as, voice, persona, appearance, kinks, limits, avatar_data,
        pronouns, age, dynamic, heat, extra, neediness
      ) values (
        ${context.userId}, ${name}, ${gender || seed.gender}, ${seed.role},
        ${seed.addressAs}, ${seed.voice}, ${seed.persona},
        ${appearance}, ${seed.kinks}, ${seed.limits}, ${avatar},
        ${pronouns || seed.pronouns}, ${age}, ${seed.dynamic}, ${seed.heat}, ${seed.extra}, ${seed.neediness}
      )
      on conflict (user_id) do update set
        appearance = excluded.appearance,
        avatar_data = excluded.avatar_data,
        name = excluded.name,
        gender = excluded.gender,
        pronouns = excluded.pronouns,
        age = excluded.age,
        updated_at = now()
      returning name, gender, role, address_as, voice, persona, appearance, kinks, limits, avatar_data,
                pronouns, age, dynamic, heat, extra, neediness
    `)[0]);
});
export const listCompanionMessages = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	await requireProfile(context.userId);
	return (await (await getSql())`
      select id, role, body, photo_data, created_at
      from companion_messages
      where user_id = ${context.userId}
      order by created_at asc
      limit 200
    `).map(mapCompanionMessage);
});
export const clearCompanionMessages = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	await requireProfile(context.userId);
	const sql = await getSql();
	await sql`delete from companion_messages where user_id = ${context.userId}`;
	try {
		await sql`
      update companion_profiles
      set nudge_streak = 0, next_nudge_at = now()
      where user_id = ${context.userId}
    `;
	} catch {
		/* nudge columns apply on migrate */
	}
	return { ok: true };
});
var chatInput = z.object({
	body: z.string().max(4e3).optional(),
	photoData: z.string().max(2e6).nullable().optional()
});
function mapCompanionMessage(row) {
	return {
		id: Number(row.id),
		role: row.role === "assistant" ? "assistant" : "user",
		body: row.body ?? "",
		photoData: row.photo_data ?? null,
		createdAt: asString(row.created_at)
	};
}
async function ensureCompanionProfile(sql, userId) {
	await sql`
    insert into companion_profiles (
      user_id, name, gender, role, address_as, voice, persona, appearance, kinks, limits,
      pronouns, age, dynamic, heat, extra, neediness
    ) values (
      ${userId}, ${DEFAULT_COMPANION.name}, ${DEFAULT_COMPANION.gender}, ${DEFAULT_COMPANION.role},
      ${DEFAULT_COMPANION.addressAs}, ${DEFAULT_COMPANION.voice}, ${DEFAULT_COMPANION.persona},
      ${DEFAULT_COMPANION.appearance}, ${DEFAULT_COMPANION.kinks}, ${DEFAULT_COMPANION.limits},
      ${DEFAULT_COMPANION.pronouns}, ${DEFAULT_COMPANION.age}, ${DEFAULT_COMPANION.dynamic},
      ${DEFAULT_COMPANION.heat}, ${DEFAULT_COMPANION.extra}, ${DEFAULT_COMPANION.neediness}
    )
    on conflict (user_id) do nothing
  `;
}
async function loadCompanionPersona(sql, userId) {
	const rows = await sql`
    select name, gender, role, address_as, voice, persona, appearance, kinks, limits, avatar_data,
           pronouns, age, dynamic, heat, extra, neediness
    from companion_profiles
    where user_id = ${userId}
  `;
	return rows[0] ? mapCompanion(rows[0]) : { ...DEFAULT_COMPANION };
}
async function setCompanionNudge(sql, userId, followUpSeconds, streak, afterUser, neediness) {
	const when = companionNextNudgeAt(followUpSeconds, streak, afterUser, neediness).toISOString();
	try {
		await sql`
      update companion_profiles
      set next_nudge_at = ${when},
          nudge_streak = ${streak}
      where user_id = ${userId}
    `;
	} catch {
		/* nudge columns apply on migrate */
	}
}
function mapCompanionMemory(row) {
	return {
		id: Number(row.id),
		kind: row.kind ?? "fact",
		body: row.body ?? "",
		dueAt: row.due_at ? asString(row.due_at) : null,
		salience: Number(row.salience) || 1,
		updatedAt: asString(row.updated_at ?? row.created_at)
	};
}
async function loadCompanionWorld(sql, profile) {
	const now = new Date();
	const nowLabel = new Intl.DateTimeFormat("en-AU", {
		weekday: "long",
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short"
	}).format(now);
	let partner = null;
	if (profile.partner_user_id) {
		const row = await loadProfile(profile.partner_user_id);
		if (row) partner = { username: (row.username || "").trim() || "Partner", role: row.role };
	}
	const writable = isCompanionLive(profile);
	const companionBond = companionBondId(profile.user_id);
	let entryRows = [];
	if (writable) {
		try {
			entryRows = await sql`
      select kind, title, status, cadence
      from entries
      where bond_id = ${companionBond}
        and status <> 'archived'
      order by updated_at desc
      limit 48
    `;
		} catch {
			entryRows = [];
		}
	}
	let memoryRows = [];
	if (writable) {
		try {
			memoryRows = await sql`
      select id, kind, body, due_at, salience, updated_at, created_at
      from companion_memories
      where user_id = ${profile.user_id}
      order by
        case when due_at is not null then 0 else 1 end,
        due_at asc,
        salience desc,
        updated_at desc
      limit 50
    `;
		} catch {
			memoryRows = [];
		}
	}
	return {
		nowLabel,
		writable,
		profile: {
			displayName: profile.display_name ?? "",
			username: profile.username ?? "",
			age: asNullableInt(profile.age),
			sex: profile.sex ?? "",
			role: profile.role,
			roleStyle: profile.role_style ?? "",
			experience: parseExperience(profile.experience ?? "curious"),
			playMode: profile.play_mode ?? "solo",
			kinks: parseKinks(profile.kinks)
		},
		partner,
		entries: entryRows.map((row) => ({
			kind: row.kind,
			title: row.title ?? "",
			status: row.status ?? "open",
			cadence: row.cadence ?? null
		})),
		memories: memoryRows.map(mapCompanionMemory)
	};
}
async function pruneCompanionMemories(sql, userId) {
	const extra = await sql`
    select id from companion_memories
    where user_id = ${userId}
      and (due_at is null or due_at < now())
    order by salience asc, updated_at asc
  `;
	if (extra.length <= 80) return;
	const ids = extra.slice(0, extra.length - 80).map((row) => Number(row.id));
	for (const id of ids) {
		await sql`delete from companion_memories where id = ${id} and user_id = ${userId}`;
	}
}
async function rememberCompanionFact(sql, userId, item) {
	const kind = normalizeMemoryKind(item.kind);
	const body = String(item.body || "").replace(/\s+/g, " ").trim().slice(0, 240);
	if (!body) return;
	const dueAt = kind === "appointment" ? parseDueAt(item.dueAt) : parseDueAt(item.dueAt);
	const key = body.toLowerCase().slice(0, 80);
	const existing = await sql`
    select id, body from companion_memories
    where user_id = ${userId}
    order by updated_at desc
    limit 80
  `;
	const match = existing.find((row) => {
		const other = String(row.body || "").toLowerCase();
		return other === body.toLowerCase() || other.includes(key) || body.toLowerCase().includes(other.slice(0, 80));
	});
	const salience = kind === "appointment" || kind === "need" || kind === "kink" ? 4 : 2;
	if (match) {
		await sql`
      update companion_memories
      set kind = ${kind},
          body = ${body},
          due_at = ${dueAt},
          salience = ${salience},
          updated_at = now()
      where id = ${match.id} and user_id = ${userId}
    `;
		return;
	}
	await sql`
    insert into companion_memories (user_id, kind, body, due_at, salience)
    values (${userId}, ${kind}, ${body}, ${dueAt}, ${salience})
  `;
}
async function forgetCompanionFacts(sql, userId, queries) {
	for (const query of queries) {
		const needle = String(query || "").replace(/\s+/g, " ").trim().slice(0, 120);
		if (needle.length < 2) continue;
		await sql`
      delete from companion_memories
      where user_id = ${userId}
        and (body ilike ${"%" + needle + "%"} or kind ilike ${needle})
    `;
	}
}
async function mergeLearnedKinks(sql, profile, remembers) {
	const learned = [];
	for (const item of remembers) {
		if (normalizeMemoryKind(item.kind) !== "kink") continue;
		const matched = matchKnownKink(item.body);
		if (matched) learned.push(matched);
		else {
			const short = item.body.split(/[.,;:(]/)[0]?.trim() ?? "";
			if (short && short.length <= 48) learned.push(short);
		}
	}
	if (!learned.length) return;
	const current = parseKinks(profile.kinks);
	const next = parseKinks([...current, ...learned]);
	if (next.length === current.length && next.every((item, i) => item === current[i])) return;
	await sql`
    update profiles
    set kinks = ${encodeKinks(next)},
        updated_at = now()
    where user_id = ${profile.user_id}
  `;
	await touchBond(profile.bond_id);
}
async function applyCompanionAssigns(sql, profile, companionName, assigns) {
	const bond = companionBondId(profile.user_id);
	let existing = [];
	try {
		existing = await sql`
      select kind, title from entries
      where bond_id = ${bond}
        and status <> 'archived'
    `;
	} catch {
		existing = [];
	}
	const seen = existing.map((row) => ({
		kind: String(row.kind || ""),
		title: String(row.title || "")
	}));
	for (const item of assigns) {
		const hint = String(item.rawKind || item.kind || "").toLowerCase();
		const kind = normalizeAssignKind(item.kind) || normalizeAssignKind(hint);
		if (!kind) continue;
		const title = String(item.title || "").trim().slice(0, 160);
		if (!title) continue;
		if (seen.some((row) => row.kind === kind && titlesOverlap(row.title, title))) continue;
		const cadence = normalizeCadence(kind, item.cadence, hint);
		const reminderTime = kind === "task" ? normalizeReminderTime(item.reminderTime) : null;
		const meta = { companion: companionName || "Companion" };
		if (reminderTime) {
			meta.reminderEnabled = "1";
			meta.reminderTime = reminderTime;
		}
		const assignedTo = profile.user_id;
		seen.push({ kind, title });
		await insertEntry(profile.user_id, bond, {
			kind,
			title,
			body: String(item.body || "").trim().slice(0, 2000),
			cadence,
			status: "open",
			assignedTo,
			meta
		});
	}
}
async function applyCompanionPlan(sql, profile, companion, burst) {
	if (!isCompanionLive(profile)) return;
	try {
		if (burst.forget?.length) await forgetCompanionFacts(sql, profile.user_id, burst.forget);
		for (const item of burst.remember ?? []) await rememberCompanionFact(sql, profile.user_id, item);
		if (burst.remember?.length) {
			await mergeLearnedKinks(sql, profile, burst.remember);
			await pruneCompanionMemories(sql, profile.user_id);
		}
		if (burst.assign?.length) await applyCompanionAssigns(sql, profile, companion?.name, burst.assign);
		if (burst.forget?.length || burst.remember?.length || burst.assign?.length) await touchBond(profile.bond_id);
	} catch (err) {
		console.error("[companion plan]", err instanceof Error ? err.message : err);
	}
}
async function generateCompanionBurst(sql, { userId, profile, companion, reachOut }) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) {
		if (reachOut) return { messages: [], followUpSeconds: null };
		const row = (await sql`
      insert into companion_messages (user_id, role, body)
      values (
        ${userId},
        'assistant',
        'The companion is asleep — AI is not available in Sanctum right now. Shape them anyway; they will wake when the key is present.'
      )
      returning id, role, body, photo_data, created_at
    `)[0];
		return { messages: [mapCompanionMessage(row)], followUpSeconds: null };
	}
	const chronological = [...await sql`
    select role, body, photo_data from companion_messages
    where user_id = ${userId}
    order by created_at desc
    limit 28
  `].reverse();
	let worldText = "";
	let dueCue = "";
	try {
		const world = await loadCompanionWorld(sql, profile);
		worldText = formatCompanionWorld(world);
		dueCue = dueCompanionCue(world);
	} catch (err) {
		console.error("[companion world]", err instanceof Error ? err.message : err);
	}
	let lastStill = -1;
	if (!reachOut) {
		chronological.forEach((item, index) => {
			if (item.role !== "assistant" && typeof item.photo_data === "string" && item.photo_data.startsWith("data:image")) lastStill = index;
		});
	}
	const messages = [{
		role: "system",
		content: [
			companionSystemPrompt(companion, profile.display_name, profile.role),
			companionWritePrompt(isCompanionLive(profile)),
			worldText,
			dueCue,
			reachOut ? companionReachOutPrompt() : ""
		].filter(Boolean).join("\n\n")
	}];
	for (const [index, item] of chronological.entries()) {
		const role = item.role === "assistant" ? "assistant" : "user";
		const text = item.body || "";
		const still = typeof item.photo_data === "string" && item.photo_data.startsWith("data:image") ? item.photo_data : null;
		const clip = typeof item.photo_data === "string" && item.photo_data.startsWith("data:video");
		if (role === "user" && still && index === lastStill) {
			messages.push({
				role,
				content: [
					{ type: "text", text: text || "I sent you a photo." },
					{ type: "image_url", image_url: { url: still } }
				]
			});
			continue;
		}
		if (role === "user" && (still || clip)) {
			messages.push({
				role,
				content: text || (clip ? "I sent you a video." : "I sent you a photo.")
			});
			continue;
		}
		const lastTurn = messages[messages.length - 1];
		if (lastTurn && lastTurn.role === role && typeof lastTurn.content === "string") {
			lastTurn.content = lastTurn.content ? `${lastTurn.content}\n\n${text}` : text;
			continue;
		}
		messages.push({ role, content: text });
	}
	const lastTurn = messages[messages.length - 1];
	if (reachOut && lastTurn?.role !== "user") {
		messages.push({ role: "user", content: companionReachOutPrompt() });
	}
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		signal: AbortSignal.timeout(45_000),
		body: JSON.stringify({
			model: "grok-4.5",
			messages,
			temperature: .95,
			max_tokens: 1100
		})
	});
	if (!res.ok) {
		const errText = await res.text().catch(() => "");
		throw new Error(errText.slice(0, 180) || `Companion could not answer (${res.status}).`);
	}
	const raw = (await res.json()).choices?.[0]?.message?.content?.trim() || "";
	if (!raw) return { messages: [], followUpSeconds: 40 };
	const burst = parseCompanionBurst(raw);
	if (isCompanionLive(profile) && !burst.remember.length) {
		const lastUser = [...chronological].reverse().find((item) => item.role !== "assistant");
		const text = String(lastUser?.body || "").replace(/\s+/g, " ").trim();
		if (/\b(remember|remind me|don't forget|dont forget)\b/i.test(text)) {
			burst.remember.push({ kind: "fact", body: text.slice(0, 240), dueAt: null });
		}
	}
	if (!isCompanionLive(profile)) {
		burst.remember = [];
		burst.forget = [];
		burst.assign = [];
	}
	burst.bodies = dedupeCompanionBubbles(
		burst.bodies,
		trailingAssistantBodies(chronological)
	);
	await applyCompanionPlan(sql, profile, companion, burst);
	if (!burst.bodies.length) {
		return { messages: [], followUpSeconds: reachOut ? 180 : burst.followUpSeconds };
	}
	const inserted = [];
	for (const body of burst.bodies) {
		const row = (await sql`
      insert into companion_messages (user_id, role, body)
      values (${userId}, 'assistant', ${body})
      returning id, role, body, photo_data, created_at
    `)[0];
		inserted.push(mapCompanionMessage(row));
	}
	return { messages: inserted, followUpSeconds: burst.followUpSeconds };
}
export const sendCompanionMessage = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => chatInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const body = (data.body ?? "").trim();
	const photo = data.photoData ?? null;
	if (!body && !photo) throw new Error("Write something or send a photo.");
	const sql = await getSql();
	await ensureCompanionProfile(sql, context.userId);
	const companion = await loadCompanionPersona(sql, context.userId);
	const spec = companionNeedinessSpec(companion.neediness);
	try {
		await sql`
      update companion_profiles
      set next_nudge_at = now() + (${spec.afterUserPauseSec}::int * interval '1 second'), nudge_streak = 0
      where user_id = ${context.userId}
    `;
	} catch {
		/* nudge columns apply on migrate */
	}
	const userRow = (await sql`
    insert into companion_messages (user_id, role, body, photo_data)
    values (${context.userId}, 'user', ${body}, ${photo})
    returning id, role, body, photo_data, created_at
  `)[0];
	try {
		const burst = await generateCompanionBurst(sql, {
			userId: context.userId,
			profile,
			companion,
			reachOut: false
		});
		await setCompanionNudge(sql, context.userId, burst.followUpSeconds, 1, true, companion.neediness);
		return {
			user: mapCompanionMessage(userRow),
			messages: burst.messages,
			name: companion.name || DEFAULT_COMPANION.name
		};
	} catch (err) {
		console.error("[companion send]", err instanceof Error ? err.message : err);
		await setCompanionNudge(sql, context.userId, spec.afterUser, 0, true, companion.neediness);
		return {
			user: mapCompanionMessage(userRow),
			messages: [],
			name: companion.name || DEFAULT_COMPANION.name
		};
	}
});
export const tickCompanion = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	if (!process.env.XAI_API_KEY) return { messages: [], name: DEFAULT_COMPANION.name };
	const sql = await getSql();
	await ensureCompanionProfile(sql, context.userId);
	const last = (await sql`
    select role, created_at from companion_messages
    where user_id = ${context.userId}
    order by created_at desc
    limit 1
  `)[0];
	if (last?.role === "user") {
		const ageMs = Date.now() - new Date(last.created_at).getTime();
		if (Number.isFinite(ageMs) && ageMs < 12_000) return { messages: [], name: DEFAULT_COMPANION.name };
	}
	let claimed;
	try {
		claimed = (await sql`
      update companion_profiles
      set next_nudge_at = now() + interval '90 seconds'
      where user_id = ${context.userId}
        and (next_nudge_at is null or next_nudge_at <= now())
      returning name, nudge_streak, neediness
    `)[0];
	} catch {
		claimed = null;
	}
	if (!claimed) {
		const companion = await loadCompanionPersona(sql, context.userId);
		return { messages: [], name: companion.name || DEFAULT_COMPANION.name };
	}
	const companion = await loadCompanionPersona(sql, context.userId);
	const spec = companionNeedinessSpec(claimed.neediness ?? companion.neediness);
	try {
		await sql`
      update companion_profiles
      set next_nudge_at = now() + (${spec.claimLockSec}::int * interval '1 second')
      where user_id = ${context.userId}
    `;
	} catch {
		/* keep the 90s claim */
	}
	const streak = Math.max(0, Number(claimed.nudge_streak) || 0);
	const reachOut = last?.role !== "user";
	try {
		const burst = await generateCompanionBurst(sql, {
			userId: context.userId,
			profile,
			companion,
			reachOut
		});
		const nextStreak = last?.role === "user" ? 1 : streak + 1;
		await setCompanionNudge(sql, context.userId, burst.followUpSeconds, nextStreak, false, companion.neediness);
		return { messages: burst.messages, name: companion.name || DEFAULT_COMPANION.name };
	} catch {
		try {
			await sql`
        update companion_profiles
        set next_nudge_at = now() + (${spec.errorRetryMin}::int * interval '1 minute')
        where user_id = ${context.userId}
      `;
		} catch {
			/* nudge columns apply on migrate */
		}
		return { messages: [], name: companion.name || DEFAULT_COMPANION.name };
	}
});
export const listCompanionMemories = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	await requireProfile(context.userId);
	try {
		const rows = await (await getSql())`
      select id, kind, body, due_at, salience, updated_at, created_at
      from companion_memories
      where user_id = ${context.userId}
      order by
        case when due_at is not null then 0 else 1 end,
        due_at asc,
        updated_at desc
      limit 80
    `;
		return rows.map(mapCompanionMemory);
	} catch {
		return [];
	}
});
var dropMemoryInput = z.object({ id: z.number().int() });
export const dropCompanionMemory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => dropMemoryInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	try {
		await (await getSql())`
      delete from companion_memories
      where id = ${data.id} and user_id = ${context.userId}
    `;
		await touchBond(profile.bond_id);
	} catch {
		/* table applies on migrate */
	}
	return { ok: true };
});
var houseInput = z.object({ subEdit: z.object({
	tasks: z.boolean(),
	habits: z.boolean(),
	rewards: z.boolean(),
	punishments: z.boolean(),
	training: z.boolean(),
	games: z.boolean(),
	costs: z.boolean().optional(),
	earnedCounts: z.boolean().optional(),
	countdowns: z.boolean().optional()
}) });
export const saveHouseSettings = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => houseInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	if (profile.role !== "dominant") throw new Error("Only the Dominant can change these permissions.");
	const current = await loadHouseSettings(profile.bond_id);
	await persistHouse(profile.bond_id, context.userId, {
		...current,
		subEdit: {
			...current.subEdit,
			...data.subEdit
		},
		vacation: current.vacation,
		vacationSince: current.vacationSince
	});
	await logHouseEvent(profile.bond_id, context.userId, "permissions", "house", "Edit permissions");
	return loadMe(context.userId);
});
export const saveVacation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => z.object({ on: z.boolean() }).parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const current = await loadHouseSettings(profile.bond_id);
	const next = parseHouse({
		...current,
		vacation: data.on,
		vacationSince: data.on ? current.vacation && current.vacationSince ? current.vacationSince : (/* @__PURE__ */ new Date()).toISOString() : null
	});
	await (await getSql())`
      insert into house_settings (bond_id, settings, updated_by, updated_at)
      values (${profile.bond_id}, ${JSON.stringify(next)}, ${context.userId}, now())
      on conflict (bond_id)
      do update set settings = excluded.settings, updated_by = excluded.updated_by, updated_at = now()
    `;
	await logHouseEvent(profile.bond_id, context.userId, data.on ? "vacation_on" : "vacation_off", "house", "");
	return loadMe(context.userId);
});
var playInput = z.object({
	play: z.object({
		wheelTitle: z.string().max(80).optional(),
		wheelSlices: z.array(z.string().max(80)).max(24).optional(),
		wheelBody: z.string().max(4e3).optional(),
		wheelPrompts: z.array(z.string().max(200)).max(40).optional(),
		wheelCatalogIds: z.array(z.string().max(24)).max(24).optional(),
		drawTitle: z.string().max(80).optional(),
		drawCards: z.array(z.object({
			title: z.string().max(80),
			body: z.string().max(800)
		})).max(40).optional(),
		drawBody: z.string().max(4e3).optional(),
		drawPrompts: z.array(z.string().max(200)).max(40).optional(),
		drawCatalogIds: z.array(z.string().max(24)).max(24).optional(),
		diceTitle: z.string().max(80).optional(),
		diceActs: z.array(z.string().max(160)).max(6).optional(),
		diceBody: z.string().max(4e3).optional(),
		dicePrompts: z.array(z.string().max(200)).max(40).optional(),
		diceCatalogIds: z.array(z.string().max(24)).max(24).optional(),
		timerTitle: z.string().max(80).optional(),
		timerBody: z.string().max(4e3).optional()
	}).optional(),
	wheels: z.record(z.string(), z.array(z.string().max(80)).max(40)).optional()
});
export const savePlay = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => playInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const current = await loadHouseSettings(profile.bond_id);
	if (profile.role !== "dominant" && !current.subEdit.games) throw new Error("You may not edit games.");
	const next = {
		...current,
		play: data.play ? parsePlay({
			...current.play,
			...data.play
		}) : current.play,
		wheels: data.wheels ? {
			...current.wheels,
			...data.wheels
		} : current.wheels
	};
	await persistHouse(profile.bond_id, context.userId, next);
	await logHouseEvent(profile.bond_id, context.userId, "updated", "game", "Built-in games");
	return loadMe(context.userId);
});
var optionsInput = z.object({
	honorific: z.string().max(40).optional(),
	addressAs: z.string().max(40).optional(),
	safeword: z.string().max(40).optional(),
	checkIn: z.string().max(8).optional(),
	hideCompleted: z.boolean().optional(),
	showReminders: z.boolean().optional(),
	autoCompleteNote: z.boolean().optional(),
	noteTask: z.string().max(800).optional(),
	noteHabit: z.string().max(800).optional(),
	noteTraining: z.string().max(800).optional(),
	quickNav: z.array(z.string().max(40)).max(4).optional()
});
export const saveUserOptions = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => optionsInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const current = await loadUserOptions(profile.user_id);
	const next = parseOptions({
		...current,
		...data
	});
	await (await getSql())`
      insert into user_options (user_id, options, updated_at)
      values (${profile.user_id}, ${JSON.stringify(next)}, now())
      on conflict (user_id)
      do update set options = excluded.options, updated_at = now()
    `;
	await touchBond(profile.bond_id);
	return loadMe(context.userId);
});
function emptyFix() {
	return {
		sharing: false,
		lat: null,
		lng: null,
		accuracy: null,
		placeName: "",
		updatedAt: null,
		arrivedAt: null
	};
}
function mapFix(row) {
	if (!row) return emptyFix();
	return {
		sharing: Boolean(row.sharing),
		lat: row.lat == null ? null : Number(row.lat),
		lng: row.lng == null ? null : Number(row.lng),
		accuracy: row.accuracy == null ? null : Number(row.accuracy),
		placeName: row.place_name ?? "",
		updatedAt: row.updated_at ? asString(row.updated_at) : null,
		arrivedAt: row.arrived_at ? asString(row.arrived_at) : null
	};
}
async function loadLocationBoard(profile) {
	const sql = await getSql();
	const mineRows = await sql`
    select user_id, bond_id, sharing, lat, lng, accuracy, place_name, updated_at, arrived_at
    from location_shares
    where user_id = ${profile.user_id}
  `;
	let partner = null;
	if (profile.partner_user_id) {
		const row = (await sql`
      select user_id, bond_id, sharing, lat, lng, accuracy, place_name, updated_at, arrived_at
      from location_shares
      where user_id = ${profile.partner_user_id}
    `)[0];
		if (row?.sharing && row.bond_id === profile.bond_id) partner = mapFix(row);
		else partner = emptyFix();
	}
	return {
		mine: mapFix(mineRows[0]),
		partner
	};
}
export const getLocationBoard = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(async ({ context }) => {
	return loadLocationBoard(await requireProfile(context.userId));
});
export const setLocationSharing = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => z.object({ sharing: z.boolean() }).parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	if (data.sharing) await sql`
        insert into location_shares (user_id, bond_id, sharing, updated_at)
        values (${profile.user_id}, ${profile.bond_id}, true, now())
        on conflict (user_id)
        do update set bond_id = excluded.bond_id, sharing = true, updated_at = now()
      `;
	else await sql`
        insert into location_shares (user_id, bond_id, sharing, lat, lng, accuracy, place_name, updated_at, arrived_at)
        values (${profile.user_id}, ${profile.bond_id}, false, null, null, null, '', now(), null)
        on conflict (user_id)
        do update set
          bond_id = excluded.bond_id,
          sharing = false,
          lat = null,
          lng = null,
          accuracy = null,
          place_name = '',
          updated_at = now(),
          arrived_at = null
      `;
	if (!data.sharing) await closeOpenVisit(profile.user_id);
	await logHouseEvent(profile.bond_id, context.userId, data.sharing ? "sharing_on" : "sharing_off", "location", "");
	return loadLocationBoard(profile);
});
var pingInput = z.object({
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	accuracy: z.number().nullable().optional()
});
async function reversePlace(lat, lng) {
	try {
		const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1`;
		const res = await fetch(url, { headers: {
			Accept: "application/json",
			"User-Agent": "SanctumHouse/1.0"
		} });
		if (!res.ok) return "";
		return formatNominatimAddress(await res.json());
	} catch {
		return "";
	}
}
export const pingLocation = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => pingInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const row = (await sql`
      select user_id, bond_id, sharing, lat, lng, accuracy, place_name, updated_at, arrived_at
      from location_shares
      where user_id = ${profile.user_id}
    `)[0];
	if (!row?.sharing) throw new Error("Location sharing is off.");
	const prevLat = row.lat == null ? null : Number(row.lat);
	const prevLng = row.lng == null ? null : Number(row.lng);
	const moved = prevLat == null || prevLng == null || haversineMeters({
		lat: prevLat,
		lng: prevLng
	}, {
		lat: data.lat,
		lng: data.lng
	}) > 150;
	const place = moved || !row.place_name ? await reversePlace(data.lat, data.lng) || row.place_name : row.place_name;
	const accuracy = data.accuracy ?? null;
	const arrivedAt = moved || !row.arrived_at ? (/* @__PURE__ */ new Date()).toISOString() : asString(row.arrived_at);
	const mapped = mapFix((await sql`
      update location_shares
      set bond_id = ${profile.bond_id},
          lat = ${data.lat},
          lng = ${data.lng},
          accuracy = ${accuracy},
          place_name = ${place},
          updated_at = now(),
          arrived_at = ${arrivedAt}
      where user_id = ${profile.user_id} and sharing = true
      returning user_id, bond_id, sharing, lat, lng, accuracy, place_name, updated_at, arrived_at
    `)[0]);
	await recordLocationVisit(profile, data.lat, data.lng, place, moved);
	return mapped;
});
export const recordAppOpen = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	try {
		await sql`update profiles set last_seen = now() where user_id = ${profile.user_id}`;
	} catch {}
	const last = (await sql`
    select opened_at from app_opens
    where user_id = ${profile.user_id}
    order by opened_at desc
    limit 1
  `)[0];
	if (last?.opened_at) {
		const then = new Date(last.opened_at).getTime();
		if (Number.isFinite(then) && Date.now() - then < 12e5) return { counted: false };
	}
	await sql`
    insert into app_opens (user_id, bond_id, opened_at)
    values (${profile.user_id}, ${profile.bond_id}, now())
  `;
	return { counted: true };
});
export const pingPresence = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const profile = await requireProfile(context.userId);
	try {
		await (await getSql())`update profiles set last_seen = now() where user_id = ${profile.user_id}`;
	} catch {}
	return { ok: true };
});
var historyInput = z.object({
	from: z.string().min(10),
	to: z.string().min(10)
});
export const getHouseHistory = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => historyInput.parse(input)).handler(async ({ context, data }) => {
	const profile = await requireProfile(context.userId);
	const sql = await getSql();
	const people = [{
		userId: profile.user_id,
		displayName: profile.display_name,
		role: profile.role,
		avatarData: profile.avatar_data ?? null
	}];
	if (profile.partner_user_id) {
		const partner = (await sql`
      select user_id, role, display_name, avatar_data
      from profiles
      where user_id = ${profile.partner_user_id}
    `)[0];
		if (partner) people.push({
			userId: partner.user_id,
			displayName: partner.display_name,
			role: partner.role,
			avatarData: partner.avatar_data ?? null
		});
	}
	const opens = await sql`
    select user_id, opened_at
    from app_opens
    where bond_id = ${profile.bond_id}
      and opened_at >= ${data.from}
      and opened_at < ${data.to}
    order by opened_at asc
  `;
	const visits = await sql`
    select id, user_id, place_name, lat, lng, arrived_at, departed_at
    from location_visits
    where bond_id = ${profile.bond_id}
      and arrived_at < ${data.to}
      and (departed_at is null or departed_at >= ${data.from})
    order by arrived_at asc
  `;
	const changes = await sql`
    select id, actor_id, action, entity, title, detail, created_at
    from house_events
    where bond_id = ${profile.bond_id}
      and created_at >= ${data.from}
      and created_at < ${data.to}
    order by created_at desc
  `;
	return {
		people,
		opens: opens.map((row) => ({
			userId: row.user_id,
			openedAt: asString(row.opened_at)
		})),
		visits: visits.map((row) => ({
			id: Number(row.id),
			userId: row.user_id,
			placeName: row.place_name ?? "",
			lat: row.lat == null ? null : Number(row.lat),
			lng: row.lng == null ? null : Number(row.lng),
			arrivedAt: asString(row.arrived_at),
			departedAt: row.departed_at ? asString(row.departed_at) : null
		})),
		changes: changes.map((row) => ({
			id: Number(row.id),
			actorId: row.actor_id,
			action: row.action,
			entity: row.entity ?? "",
			title: row.title ?? "",
			detail: row.detail ?? "",
			createdAt: asString(row.created_at)
		}))
	};
});
async function trySql(run) {
	try {
		await run();
	} catch {}
}
export const deleteAccount = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(async ({ context }) => {
	const sql = await getSql();
	const userId = context.userId;
	const profile = await loadProfile(userId);
	if (profile?.partner_user_id) await sql`
      update profiles
      set partner_user_id = null, play_mode = 'solo', updated_at = now()
      where user_id = ${profile.partner_user_id}
    `;
	await trySql(() => sql`
    update profiles
    set last_partner_user_id = null, last_bond_id = null, updated_at = now()
    where last_partner_user_id = ${userId}
  `);
	await trySql(() => sql`
    update profiles
    set partner_user_id = null, play_mode = 'solo', updated_at = now()
    where partner_user_id = ${userId}
  `);
	await trySql(() => sql`
    delete from partnerships
    where user_a = ${userId} or user_b = ${userId}
  `);
	const bondId = profile?.bond_id ?? userId;
	const wipeBond = (profile ? await sql`select user_id from profiles where bond_id = ${bondId} and user_id <> ${userId}` : []).length === 0;
	await trySql(() => sql`delete from companion_messages where user_id = ${userId}`);
	await trySql(() => sql`delete from companion_memories where user_id = ${userId}`);
	await trySql(() => sql`delete from companion_profiles where user_id = ${userId}`);
	await trySql(() => sql`delete from user_options where user_id = ${userId}`);
	await trySql(() => sql`delete from location_shares where user_id = ${userId}`);
	await trySql(() => sql`delete from talk_answers where user_id = ${userId}`);
	await trySql(() => sql`delete from journal_comments where author_id = ${userId}`);
	await trySql(() => sql`delete from points_ledger where user_id = ${userId}`);
	await trySql(() => sql`delete from messages where sender_id = ${userId}`);
	await trySql(() => sql`delete from private_photos where uploaded_by = ${userId}`);
	await trySql(() => sql`delete from toy_patterns where created_by = ${userId}`);
	await trySql(() => sql`delete from app_opens where user_id = ${userId}`);
	await trySql(() => sql`delete from location_visits where user_id = ${userId}`);
	await trySql(() => sql`delete from house_events where actor_id = ${userId}`);
	if (wipeBond) {
		await trySql(() => sql`delete from journal_comments where bond_id = ${bondId}`);
		await trySql(() => sql`delete from messages where bond_id = ${bondId}`);
		await trySql(() => sql`delete from private_photos where bond_id = ${bondId}`);
		await trySql(() => sql`delete from points_ledger where bond_id = ${bondId}`);
		await trySql(() => sql`delete from toy_patterns where bond_id = ${bondId}`);
		await trySql(() => sql`delete from categories where bond_id = ${bondId}`);
		await trySql(() => sql`delete from entries where bond_id = ${bondId}`);
		await trySql(() => sql`delete from house_settings where bond_id = ${bondId}`);
		await trySql(() => sql`delete from house_events where bond_id = ${bondId}`);
		await trySql(() => sql`delete from bond_sync where bond_id = ${bondId}`);
		await trySql(() => sql`delete from app_opens where bond_id = ${bondId}`);
		await trySql(() => sql`delete from location_visits where bond_id = ${bondId}`);
		await trySql(() => sql`delete from talk_answers where bond_id = ${bondId}`);
	}
	await trySql(() => sql`delete from profiles where user_id = ${userId}`);
	await trySql(() => sql.query("delete from \"session\" where \"userId\" = $1", [userId]));
	await trySql(() => sql.query("delete from \"account\" where \"userId\" = $1", [userId]));
	await trySql(() => sql.query("delete from \"user\" where id = $1", [userId]));
	return { ok: true };
});