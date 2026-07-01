import db from "@GameXL/db";
import { env } from "@GameXL/env/server";

const TWITCH_TOKEN_KEY = "twitch";

interface TwitchTokenResponse {
	access_token: string;
	expires_in: number;
}

export interface IGDBGame {
	cover?: { url: string };
	first_release_date?: number;
	id: number;
	name: string;
	rating?: number;
	videos?: { name?: string; video_id: string }[];
}

export function resolveCoverUrl(game: IGDBGame): string | null {
	return game.cover?.url
		? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
		: null;
}

export function resolveTrailerVideoId(game: IGDBGame): string | null {
	const gameplayVideo = game.videos?.find((v) =>
		v.name?.toLowerCase().includes("gameplay")
	)?.video_id;
	const firstVideo = game.videos?.[0]?.video_id;
	return gameplayVideo ?? firstVideo ?? null;
}

async function getToken(): Promise<string> {
	const stored = await db.oAuthToken.findUnique({
		where: { key: TWITCH_TOKEN_KEY },
	});

	if (stored && stored.expiresAt > new Date()) {
		return stored.value;
	}

	const res = await fetch("https://id.twitch.tv/oauth2/token", {
		method: "POST",
		body: new URLSearchParams({
			client_id: env.IGDB_CLIENT_ID,
			client_secret: env.IGDB_CLIENT_SECRET,
			grant_type: "client_credentials",
		}),
	});

	if (!res.ok) {
		throw new Error(`Twitch token error: ${res.status}`);
	}

	const data = (await res.json()) as TwitchTokenResponse;

	// Subtract 60s buffer to avoid using an almost-expired token
	const expiresAt = new Date(Date.now() + data.expires_in * 1000 - 60_000);

	await db.oAuthToken.upsert({
		where: { key: TWITCH_TOKEN_KEY },
		create: { key: TWITCH_TOKEN_KEY, value: data.access_token, expiresAt },
		update: { value: data.access_token, expiresAt },
	});

	return data.access_token;
}

export async function queryIGDB<T>(endpoint: string, body: string): Promise<T> {
	const token = await getToken();

	const res = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
		method: "POST",
		headers: {
			"Client-ID": env.IGDB_CLIENT_ID,
			Authorization: `Bearer ${token}`,
			"Content-Type": "text/plain",
		},
		body,
	});

	if (!res.ok) {
		throw new Error(`IGDB error: ${res.status} ${res.statusText}`);
	}

	return res.json() as Promise<T>;
}
