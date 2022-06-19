import { fetch } from '@sapphire/fetch';
import type { APIApplicationCommandOptionChoice } from 'discord-api-types/v9';
import { URL } from 'node:url';
import { retryable } from '#utils/common';

export enum QuestionDifficulty {
	Easy = 'easy',
	Medium = 'medium',
	Hard = 'hard'
}

export const enum TriviaLimits {
	MaximumAmountOfQuestions = 50
}

export const enum TriviaResponseCode {
	TokenNotFound = 3,
	TokenEmpty
}

export interface CategoriesResult {
	trivia_categories: { id: number; name: string }[];
}

export interface TokenRequestResult {
	token: string;
}

export interface TriviaResult {
	response_code: TriviaResponseCode;
	results: QuestionData[];
}

export interface QuestionData {
	category: string;
	difficulty: QuestionDifficulty;
	question: string;
	correct_answer: string;
	incorrect_answers: string[];
}

export class OpenTDBService {
	private readonly baseURL = new URL('https://opentdb.com/');
	private readonly categoryURL = new URL('/api_category.php', this.baseURL);
	private readonly tokenURL = new URL('/api_token.php', this.baseURL);
	private readonly apiURL = new URL('/api.php', this.baseURL);

	private token?: string;

	public constructor() {
		this.apiURL.searchParams.append('encode', 'url3986');
		this.apiURL.searchParams.append('amount', '1');
		this.apiURL.searchParams.append('type', 'multiple');
		this.tokenURL.searchParams.append('command', 'request');
	}

	public async getQuestion(options: { category?: string; difficulty?: QuestionDifficulty } = {}): Promise<QuestionData | null> {
		if (!this.token) {
			await this.startNewSession();
		}

		this.apiURL.searchParams.set('token', this.token!);
		this.apiURL.searchParams.set('difficulty', options.difficulty ?? QuestionDifficulty.Easy);

		if (options.category) {
			this.apiURL.searchParams.set('category', options.category);
		}

		const res = await retryable(() => fetch<TriviaResult>(this.apiURL));
		if (res.response_code === TriviaResponseCode.TokenEmpty || res.response_code === TriviaResponseCode.TokenNotFound) {
			await this.startNewSession();
			return this.getQuestion(options);
		}

		return res.results[0];
	}

	public async getCategories() {
		const res = await retryable(() => fetch<CategoriesResult>(this.categoryURL));
		return res.trivia_categories.map<APIApplicationCommandOptionChoice<string>>(({ id, name }) => ({ name, value: id.toString() }));
	}

	private async startNewSession() {
		const res = await retryable(() => fetch<TokenRequestResult>(this.tokenURL));
		this.token = res.token;
	}
}
