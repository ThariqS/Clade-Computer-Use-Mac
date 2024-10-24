import React from "react";
import { BetaMessage } from "@anthropic-ai/sdk/resources/beta/messages/messages";

interface APIResponseViewProps {
	response: BetaMessage;
	id: string;
}

const APIResponseView: React.FC<APIResponseViewProps> = ({ response, id }) => {
	return (
		<details className="mb-2">
			<summary>Request/Response ({id})</summary>
			<pre className="bg-gray-100 p-2 rounded">
				{JSON.stringify(response, null, 2)}
			</pre>
		</details>
	);
};

export default APIResponseView;
