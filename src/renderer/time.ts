import { formatDistanceStrict } from "date-fns";

export const timeAgoString = (timestamp: number) => {
	const timeAgo = formatDistanceStrict(new Date(timestamp), new Date(), {
		addSuffix: true,
	});
	return timeAgo;
};
