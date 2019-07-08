export default function path(obj: { [k: string]: any }, pth: string) {
	const segments = pth.split('.');
	let partial: any = obj;

	for (const segment of segments) {
		const type = typeof partial;
		if (type === 'function' || (type === 'object' && !!obj)) {
			partial = partial[segment];
		} else {
			partial = undefined;
			break;
		}
	}

	return partial;
}
