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
        for (let i = 0; i < 25; i++) {
            expect(sim.get('pc.q')).toBe(i * 4)
            expect(sim.get('add.sum')).toBe((i + 1) * 4)
            expect(sim.cycle).toBe(i)
            sim.step()
        }
    })

    
})
