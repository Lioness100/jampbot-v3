export const countryCodeToFlag = (countryCode: string) => {
	const regionalIndicatorOffset = 127_397 as const;
	return String.fromCodePoint(...[...countryCode].map((char) => regionalIndicatorOffset + char.codePointAt(0)!));
};
