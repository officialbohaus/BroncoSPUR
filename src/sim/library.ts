import * as c from "./components/basic";
import type { ComponentDef } from "./types";

export const library: Record<string, (params?: any) => ComponentDef> = {
    Adder: c.adder,
    Constant: c.constant,
    Register: c.register,
    Mux2: c.mux2
}