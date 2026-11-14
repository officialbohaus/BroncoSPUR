import { describe, expect, test } from "vitest"
import { Simulator } from "#src/sim/simulator.ts"
import type { Circuit } from '#src/sim/types.ts'
import { FUNC_BITS } from '#src/sim/bits.ts'

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

const pcCounterALU = (): Circuit => ({
    version: 1,
    components: [
        { id: 'pc', type: 'Register' },
        { id: 'four', type: 'Constant', params: { value: 4} },
        { id: 'func_add', type: 'Constant', params: { value: FUNC_BITS.add, width: 3}},
        { id: 'alu', type: 'Alu' },
    ],
    wires: [
        { from: 'pc.q', to: 'alu.a'},
        { from: 'four.out', to: 'alu.b'},
        { from: 'alu.out', to: 'pc.d'},
        { from: 'func_add.out', to: 'alu.func'},
    ],
})

describe('running', () => {
    test('PC implementation with adder', () => {
        const sim = new Simulator(pcCounter())
        for (let i = 0; i < 25; i++) {
            expect(sim.get('pc.q')).toBe(i * 4)
            expect(sim.get('add.sum')).toBe((i + 1) * 4)
            expect(sim.cycle).toBe(i)
            sim.step()
        }
    })

    test('PC implementation with ALU', () => {
        const sim = new Simulator(pcCounterALU())
        for (let i = 0; i < 25; i++) {
            expect(sim.get('pc.q')).toBe(i * 4)
            expect(sim.get('alu.out')).toBe((i + 1) * 4)
            expect(sim.cycle).toBe(i)
            sim.step()
        }
    })

    
})
