import { describe, expect, test } from "vitest"
import { Simulator } from "#src/sim/simulator.ts"
import type { Circuit } from '#src/sim/types.ts'

const pcCounter = (): Circuit => ({
    version: 1,
    components: [
        { id: 'pc', type: 'Register' },
        { id: 'four', type: 'Constant', params: { value: 4} },
        { id: 'add', type: 'Adder' },
    ],
    wires: [
        { from: 'pc.q', to: 'add.a'},
        { from: 'four.out', to: 'add.b'},
        { from: 'add.sum', to: 'pc.d'},
    ],
})

describe('running', () => {
    test('PC implementation', () => {
        const sim = new Simulator(pcCounter())
        expect(sim.get('pc.q')).toBe(0)
        expect(sim.get('add.sum')).toBe(4)
        expect(sim.cycle).toBe(0)
        sim.step()
        expect(sim.get('pc.q')).toBe(4)
        expect(sim.get('add.sum')).toBe(8)
        expect(sim.cycle).toBe(1)
        sim.step()
        expect(sim.get('pc.q')).toBe(8)
        expect(sim.get('add.sum')).toBe(12)
        expect(sim.cycle).toBe(2)
    })
})
