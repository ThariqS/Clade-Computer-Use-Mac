import * as React from "react";
import { createRoot } from "react-dom/client";
import ScreenChat from "./ScreenChat";
const root = createRoot(document.body);
root.render(
	<div style={{ backgroundColor: "#f1f0e8" }}>
		<ScreenChat />
	</div>
);
