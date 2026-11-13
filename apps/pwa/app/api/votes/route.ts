/**
 * Community votes on the vocabulary (SPEC.md, FR-14).
 *
 *   GET  /api/votes  -> { tallies: { [label]: { yes, no } } }
 *   POST /api/votes  <- { voter, votes: [{ label, vote: "yes" | "no" }] }
 *
 * The only data stored is, per sign, the set of anonymous device ids that
 * voted yes and the set that voted no. A device has one vote per sign and
 * can change it. No image, landmark or sentence ever reaches this route.
 *
 * Storage is an Upstash Redis database (Vercel: Storage -> Upstash for
 * Redis), reached with Upstash's own client. Without its environment
 * variables the route answers 503 and the app hides the vote buttons.
 */
import { createHash } from "node:crypto";
import { Redis } from "@upstash/redis";
import { SIGNS, WORD_BY_LABEL } from "@souty/vocabulary";
import { isVote, isVoterId, type Tally, type Vote } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Vercel's Upstash integration sets the KV_ names; a database made on upstash.com, the UPSTASH_ ones. */
const REDIS_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const WRITE_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
const READ_TOKEN = process.env.KV_REST_API_READ_ONLY_TOKEN ?? WRITE_TOKEN;

const client = (token: string | undefined) => (REDIS_URL && token ? new Redis({ url: REDIS_URL, token }) : null);
/** Counting votes only needs to read, so it uses the read-only token when there is one. */
const reader = client(READ_TOKEN);
const writer = client(WRITE_TOKEN);

/** Posts allowed per address per minute; a full offline backlog is one post. */
const RATE_LIMIT = 30;
const MAX_VOTES_PER_POST = SIGNS.length;

/**
 * The word is part of the key: votes approve a sign's word, so a changed
 * word starts again from zero.
 */
function key(label: string, vote: Vote): string {
  return `souty:votes:${vote}:${label}:${WORD_BY_LABEL[label]}`;
}

function hasSign(label: unknown): label is string {
  return typeof label === "string" && Object.prototype.hasOwnProperty.call(WORD_BY_LABEL, label);
}

const unavailable = () => Response.json({ error: "votes are not configured" }, { status: 503 });

export async function GET() {
  if (!reader) return unavailable();
  try {
    const pipeline = reader.pipeline();
    for (const sign of SIGNS) {
      pipeline.scard(key(sign.label, "yes"));
      pipeline.scard(key(sign.label, "no"));
    }
    const counts = await pipeline.exec<number[]>();
    const tallies: Record<string, Tally> = {};
    SIGNS.forEach((sign, i) => {
      const yes = Number(counts[i * 2]) || 0;
      const no = Number(counts[i * 2 + 1]) || 0;
      if (yes || no) tallies[sign.label] = { yes, no };
    });
    return Response.json({ tallies }, { headers: { "Cache-Control": "public, s-maxage=15, stale-while-revalidate=300" } });
  } catch (error) {
    console.error("vote tallies failed", error);
    return Response.json({ error: "vote store unreachable" }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!writer) return unavailable();

  let body: { voter?: unknown; votes?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid JSON" }, { status: 400 });
  }
  const { voter, votes } = body;
  if (!isVoterId(voter) || !Array.isArray(votes) || votes.length === 0 || votes.length > MAX_VOTES_PER_POST) {
    return Response.json({ error: "invalid vote" }, { status: 400 });
  }
  const valid = votes.filter(
    (entry): entry is { label: string; vote: Vote } => hasSign(entry?.label) && isVote(entry?.vote)
  );
  if (valid.length !== votes.length) return Response.json({ error: "unknown sign or vote" }, { status: 400 });

  try {
    // The address is only kept hashed, for one minute, to slow down ballot stuffing.
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rateKey = `souty:rate:${createHash("sha256").update(address).digest("hex").slice(0, 16)}`;
    const [posts] = await writer.pipeline().incr(rateKey).expire(rateKey, 60, "NX").exec<[number, number]>();
    if (posts > RATE_LIMIT) return Response.json({ error: "too many votes" }, { status: 429 });

    // One round trip, applied in order: a device's vote moves, it never counts twice.
    const pipeline = writer.pipeline();
    for (const { label, vote } of valid) {
      pipeline.sadd(key(label, vote), voter);
      pipeline.srem(key(label, vote === "yes" ? "no" : "yes"), voter);
    }
    await pipeline.exec();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("vote failed", error);
    return Response.json({ error: "vote store unreachable" }, { status: 502 });
  }
}
