export interface LightboxImage {
	alt: string;
	url: string;
}

export type LightboxTarget =
	| { index: number; kind: "screenshot" }
	| { kind: "cover" };

export class LightboxUtils {
	static getNextIndex(index: number, direction: -1 | 1, total: number): number {
		return (index + direction + total) % total;
	}

	static getImage(
		target: LightboxTarget | null,
		cover: LightboxImage | null,
		screenshots: LightboxImage[]
	): LightboxImage | undefined {
		if (target?.kind === "cover") {
			return cover ?? undefined;
		}
		if (target?.kind === "screenshot") {
			return screenshots[target.index];
		}
		return undefined;
	}
}
