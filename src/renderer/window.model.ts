
// add the bridge interface to the window object in typescript

import { Bridge } from "src/controller/bridge.model";

export const bridge: Bridge = (window as any).bridge;