import { adder } from "./components/basic";
import type { ComponentDef } from "./types";

export const library: Record<string, (params?: any) => ComponentDef> = {
    Adder: adder
}