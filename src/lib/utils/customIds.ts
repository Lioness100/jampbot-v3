import { createBuilder } from '#utils/common';
import { Maybe, none, some } from '@sapphire/framework';

export const enum CustomId {
	CodeInput = 'C_PI',
	CodeForm = 'C_F',
	ReplyInput = 'R_PI',
	ReplyForm = 'R_F',
	ReviseCode = 'RC_B',
	LevelIdea = 'LI_B',
	Like = 'L_B',
	Dislike = 'D_B',
	Retweet = 'R_B',
	UnRetweet = 'UR_B',
	Reply = 'RE_B',
	Mute = 'M_B',
	Unmute = 'UM_B'
}

interface Resolver {
	create: (param: any, ...other: any) => string;
	parse: (param: string, ...other: any) => any;
}

const createCustomIdParams = createBuilder<readonly ResolverKey[]>();
const createResolver = createBuilder<Resolver>();

const customIdParams = {
	[CustomId.LevelIdea]: createCustomIdParams([/* style */ 'number?'] as const),
	[CustomId.ReviseCode]: createCustomIdParams([/* async */ 'boolean?', /* ephemeral */ 'boolean?', /* depth */ 'number?'] as const)
} as const;

const baseResolvers = {
	string: createResolver({ create: (param: string) => param, parse: (param) => param }),
	// Booleans are abbreviated to 1 | 0 to save space.
	boolean: createResolver({ create: (param: boolean) => (param ? '1' : '0'), parse: (param) => param === '1' }),
	number: createResolver({ create: (param: number) => param.toString(), parse: Number })
} as const;

const resolvers = baseResolvers;

const customIdSeparator = '.' as const;

// Resolver for custom IDs (see in action at the bottom of the code).
const customIdResolver = createResolver({
	create: <T extends keyof typeof customIdParams>(param: T, ...args: CustomIdParams<typeof customIdParams[T], 'params'>) => {
		const paramResolvers = customIdParams[param as keyof typeof customIdParams].map<Resolver>((id) => {
			const resolver = (id.endsWith('?') ? id.slice(0, -1) : id) as keyof typeof resolvers;
			return resolvers[resolver];
		});

		const createdArgs = args.map((arg, idx) => {
			if (arg === undefined) {
				return '';
			}

			const resolver = paramResolvers[idx];
			if (!resolver) {
				return '';
			}

			if (Array.isArray(arg)) {
				const [param, ...other] = arg;
				return resolver.create(param, ...other);
			}

			return resolver.create(arg);
		});

		return [param, ...createdArgs].join(customIdSeparator);
	},
	parse: <T extends CustomId>(
		param: string,
		// This function will double as a check that this interaction has the custom ID(s) you're looking for.
		wanted: T[],
		extras?: T extends keyof typeof customIdParams
			? { [K in typeof customIdParams[T][number]]?: CustomIdParam<K, 'parse-args'> | undefined }
			: never
	): Maybe<[T, T extends keyof typeof customIdParams ? CustomIdParams<typeof customIdParams[T], 'return'> : []]> => {
		const [name, ...args] = param.split('.') as [T, ...string[]];

		if (!wanted.includes(name)) {
			return none();
		}

		if (!args.length) {
			return some([name, []] as any);
		}

		const paramResolvers = customIdParams[name as keyof typeof customIdParams].map((id) => {
			const resolver = resolvers[(id.endsWith('?') ? id.slice(0, -1) : id) as keyof typeof resolvers];
			const extra = ((extras?.[id as keyof typeof extras] as any) ?? [])[0];

			if (Array.isArray(extra)) {
				return [resolver, ...extra] as const;
			}

			return [resolver as Resolver, extra] as const;
		});

		const parsedArgs = args.map((arg, idx) => {
			const [resolver, ...args] = paramResolvers[idx];
			return resolver.parse(arg, ...args);
		});

		return some([name, parsedArgs] as any);
	}
});

export const createCustomId = customIdResolver.create;
export const parseCustomId = customIdResolver.parse;

// `Resolver`s will be used with different data types to serialize parameters into the string. This setup assumes the
// custom ID will be under 100 characters and doesn't do any massive compression because I haven't found a need for
// that.
interface Resolver {
	// `create` will serialize and return a string.
	create: (param: any, ...other: any) => string;
	// `parse` will deserialize the string.
	parse: (param: string, ...other: any) => any;
}

// Types to resolve the types from resolver names.
type MethodType = 'params' | 'return' | 'parse-args';
type GetParameters<A extends any[]> = A['length'] extends 1 ? A[0] : A[0] | A;
type ResolverParam<R extends Resolver, Method extends MethodType> = Method extends 'params'
	? GetParameters<Parameters<R['create']>>
	: Method extends 'parse-args'
	? Parameters<R['parse']> extends [any, ...infer U]
		? GetParameters<U>
		: never
	: ReturnType<R['parse']>;

type CustomIdParam<T extends ResolverKey, Method extends MethodType> = T extends `${infer T2}?`
	? [param?: ResolverParam<typeof resolvers[T2 & keyof typeof resolvers], Method>]
	: [param: ResolverParam<typeof resolvers[T & keyof typeof resolvers], Method>];

type ResolverKey = `${keyof typeof resolvers}${'?' | ''}`;
type CustomIdParams<T extends readonly ResolverKey[], Method extends MethodType> = T extends readonly [infer First, ...infer Tail]
	? Tail extends ResolverKey[]
		? [...CustomIdParam<First & ResolverKey, Method>, ...CustomIdParams<Tail, Method>]
		: never
	: [];
