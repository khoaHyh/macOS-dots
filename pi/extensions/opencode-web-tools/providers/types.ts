import type { NormalizedSearchResult, SearchDepth, SearchProviderName } from "../types.ts";

export type SearchLivecrawl = "fallback" | "preferred";

export interface SearchRequest {
	query: string;
	maxResults: number;
	depth: SearchDepth;
	livecrawl?: SearchLivecrawl;
	contextMaxCharacters?: number;
}

export interface SearchProvider {
	readonly name: SearchProviderName;
	search(input: SearchRequest, signal?: AbortSignal): Promise<NormalizedSearchResult[]>;
}
