/**
 * Often times, properties of interactions will be either a class, such as `GuildMember`, or their raw API data
 * counterpart, such as `APIGuildMember`. This will happen if there is no `GuildMember` cached. Luckily, these types of
 * structures always the the raw API data as a parameter into their constructor. The function will consistently return
 * the class counterpart no matter the input. The complicated and vague typings & the use of `Reflect.construct()`
 * insteof just `new Structure(obj)` is due to the fact that many of the structures this function is used on are private.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export const resolveAPIStructure = <T extends Function>(
	obj: T extends new (data: infer P) => unknown ? P : unknown,
	Structure: T
): T['prototype'] => {
	return obj instanceof Structure ? obj : Reflect.construct(Structure, [obj]);
};
