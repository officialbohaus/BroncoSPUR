import { trunc } from "./bits";
import { library } from "./library";
import type { Circuit, ComponentDef, Port, PortType, Wire } from "./types";

export class Simulator {
    cycle = 0
    private defs = new Map<string, ComponentDef>();
    private state = new Map<string, any>();
    private ports = new Map<string, {port: Port, type: PortType}>()
    // private outPorts = new Map<string, Port>()
    private values = new Map<string, number>();
    private driver = new Map<string, string>();
    private order: string[]

    constructor(circuit: Circuit) {
        this.instantiate(circuit)
        this.connect(circuit)
        this.order = this.topoSort()
        this.settle()

    }

    private instantiate(circuit: Circuit) {
        const { version, components, wires } = circuit
            for (const {id, type, params} of components) {
                if (this.validateID(id)) {
                    const factory = library[type]
                    if (!factory) { throw new Error(`Unknown component type: ${type}`) }
                    const def = library[type](params)
                    this.defs.set(id, def)
                    this.state.set(id, def.initState?.())

                    for (const inPort of def.inputs) {
                        const portName = `${id}.${inPort.name}`
                        this.ports.set(portName, {port: inPort, type: "input"})
                    }

                    for (const outPort of def.outputs) {
                        const portName = `${id}.${outPort.name}`
                        this.ports.set(portName, {port: outPort, type: "output"})
                    }

                    // confirm all combInputs are valid input ports
                    for (const combIn of def.combInputs) {
                        if (!def.inputs.some((port) => port.name === combIn )) {
                            throw new Error(`${type} "${id}" combInputs lists "${combIn}", which isn't an input`)
                        }
                    }
                }    
            }
        }

    connect(circuit: Circuit) {
        for (const wire of circuit.wires) {
            const {path, from, to} = this.parseWire(wire)
            if (this.driver.has(to))
                throw new Error(`${path}: "${to}" is already driven to by "${this.driver.get(to)}"`)
            this.driver.set(to, from)
        }
    }

    private validateID(id: string): boolean {
        if (id.includes(".")) {
            throw new Error(`Component id "${id}" can't contain "."`)
        }
        if (this.defs.has(id)) {
            throw new Error(`Duplicate component id "${id}"`)
        }
        return true
    }

    private parseWire({from, to}: Wire): {path: string, from: string, to: string} {
        const path = `wire[${from} -> ${to}]`
            
        // call split to confirm both valid parts
        parseRef(from)
        parseRef(to)

        const src = this.ports.get(from)
        const dest = this.ports.get(to)
        if (!src) throw new Error(`${path}: port ${from} doesn't exist`)
        if (!dest) throw new Error(`${path}: port ${to} doesn't exist`)
        if (src.type !== 'output') throw new Error(`${path}: "${from}" is an input, not an output`);
        if (dest.type !== 'input') throw new Error(`${path}: "${to}" is an output, not an input`);
        if (src.port.width !== dest.port.width) throw new Error(`${path}: width mismatch (${src.port.width} bits -> ${dest.port.width} bits)`);
    
        return {path: path, from: from, to: to}
    }

    // use toposort to ensure all component dependencies are in compatible order
    private topoSort(): string[] {
        const edges = new Map<string, Set<string>>()
        const inputCount = new Map<string, number>()
        // init
        for (const id of this.defs.keys()) {
            edges.set(id, new Set())
            inputCount.set(id, 0)
        }

        // calculate the inputCount for each component
        for (const [to, from] of this.driver) {
            const [toComp, toPort] = parseRef(to)
            const [fromComp, _] = parseRef(from)
            
            // check for cycles-- only possible from combInputs
            if (!this.defs.get(toComp)!.combInputs.includes(toPort)) continue

            // many outputs to one input counts only as one edge
            if (edges.get(fromComp)!.has(toComp)) continue

            edges.get(fromComp)!.add(toComp)
            inputCount.set(toComp, inputCount.get(toComp)! + 1)
        }

        // Kahn's algo: repeatedly take the next component with no unadded inputs
        const queue = [...inputCount]
            .filter(([_, count]) => count === 0)
            .map(([id, _]) => id)

        const order: string[] = [];
        while (queue.length > 0) {
            const id = queue.shift()!
            order.push(id)
            for (const next of edges.get(id)!) {
                inputCount.set(next, inputCount.get(next)! -1)
                if (inputCount.get(next) === 0)
                    queue.push(next)
            }
        }

        if (order.length < this.defs.size) {
            const remaining = [...this.defs.keys()].filter((id) => !order.includes(id))
            throw new Error(`Combinational loop: these components are in a loop, or depend on one in a loop: ${remaining.join(", ")}`)
        }
        return order
    }

    // TODO: run and construct
    private readInputs(id: string): Values {
        const vals: Values = {}
        for (const p of this.defs.get(id)!.inputs) {
            const src = this.driver.get(refStr(id, p))
            vals[p.name] = src ? this.get(src) : 0
        }
    }

    settle() {
        for (const id of this.order) {
            const def = this.defs.get(id)!
            const out = def.evaluate(this.readInputs(id), this.state.get(id))
            for (const p of def.outputs)
                this.values.set(refStr(id, p), trunc(out[p.name] ?? 0, p.width))
        }
    }

    step() {
        const next = new Map<string, any>()
        for (const [id, def] of this.defs) {
            if (def.clock)
                next.set(id, def.clock(this.readInputs(id), this.state.get(id)))
        for (const [id, s] of next)
            this.state.set(id, s)
        this.cycle++
        this.settle()
        }
    }

    get(port: string) {
        return this.values.get(port) ?? 0
    }

    
}

function parseRef(ref: string): [string, string] {
    const parts = ref.split(".")
    if (parts.length !== 2 || !parts[0] || !parts[1])
        throw new Error(`Bad port reference "${ref}" (expected "component.port")`);
    return [parts[0], parts[1]];
    }

function refStr(id: string, port: Port) {
    return `${id}.${port.name}`
}

