import { trunc } from "#src/sim/bits.ts"
import type { ComponentDef } from "#src/sim/types.ts"

// { width = 32 } = {} is for when an options object isn't provided.
// adders are constructed from library by library[type](params).
// components are stored in JSON, for example:
//  { id: 'add', type: 'Adder', params: { width: 16 } }
// however, params is optional. As such, constructing an adder
// from JSON without a params property would crash-- adder expects
// an object to be passed. This params prop would be destructured 
// to pull out the width-- if no params object is provided, we can't
// destructure it even with a default value. That is, we'd have to call:
//  adder({})
// passing in an empty object, just to be able to use the default value.
// So to make it simpler, we by default provide an empty default object! allowing:
//  adder()
export const adder = ({ width = 32} = {}): ComponentDef => ({
    inputs: [{ name: 'a', width}, {name: 'b', width }],
    outputs: [{ name: 'sum', width }],
    combInputs: ['a', 'b'],
    evaluate: ({ a, b }) => ({ sum: trunc(a + b, width)})
})

export const constant = ({ value = 0, width = 32 } = {}): ComponentDef => ({
    inputs: [],
    outputs: [{ name: 'out', width }],
    combInputs: [],
    evaluate: () => ({ out: trunc(value, width) })
})

export const register = ({width = 32, initial = 0} = {}): ComponentDef<number> => ({
    inputs: [{ name: 'd', width}],
    outputs: [{ name: 'q', width}],
    combInputs: [],
    initState: () => initial,
    evaluate: (_in, state) => ({ q: state }),
    clock: ({ d }) => d,
})

export const mux2 = ({ width = 32 } = {}): ComponentDef => ({
    inputs: [{ name: 'a', width}, {name: 'b', width}, {name: 'sel', width: 1}],
    outputs: [{ name: 'out', width}],
    combInputs: ['a', 'b', 'sel'],
    evaluate: ({a, b, sel}) => ({out: sel ? b : a })
})