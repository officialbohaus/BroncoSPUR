
// holds type definitions for variables used in sim

export type Port = { name: string, width: number };
export type PortType = "input" | "output"
export type Values = Record<string, number>;

export interface ComponentDef<S = any> {
    inputs: Port[];
    outputs: Port[];

    // for inputs that affect outputs on same cycle
    combInputs: string[];
    initState?: () => S

    evaluate(inputs: Values, state: S): Values;

    // return on next edge
    clock?(inputs: Values, state: S): S;
}

export type ComponentInstance = { id: string; type: string; params?: Record<string, any> };
export type Wire = { from: string; to: string };
export type Circuit = { version: 1; components: ComponentInstance[]; wires: Wire[] };


