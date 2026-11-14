

// produces num w/ lowest 'width' bits as '1'
//      mask works like so:                   |--| <--- lowest 4 bits are 1
//      mask(4) --> 1 << 4 --> 10000 - 1 --> 01111
export const mask = (width: number) => 2 ** width - 1

// truncates 'value' to lowest 'width' bits. 
// the '>>>' operator (unsigned right shift operator) is used here to coerce
// JS to force the return value to be an unsigned 32-bit integer.
//      'x >>> n' will shift right by 'n' bits and force the sign bit to 0. 
//      since we don't actually want to change the value, we let 'n' be 0.
//      this way, only the sign bit is flipped.
export const trunc = (value: number, width: number) => (value & mask(width)) >>> 0;

// turns a number 'v' into its 2's complement, if it isn't already.
// requires the width of 'v' to be specified, as leading zeroes aren't kept in normal JS numbers.
export const toSigned = (v: number, w: number) => v & (1 << (w-1)) ? v - 2 ** w : v;

// returns bits [hi, lo] from 'v'
//      e.g. bits(instr, 31, 26) --> opcode
export const bits = (v: number, hi: number, lo: number) => trunc(v >>> lo, hi-lo + 1);

export const FUNC: Record<funcType, (a: number, b: number) => number > = {
    "add": ((a, b) => a + b),
    "sub": ((a, b) => a - b),
    "mod": ((a, b) => a % b)
}

export const BITS_FUNC: Record<funcBits, funcType> = {
    0b000: 'add',
    0b001: 'sub',
    0b010: 'mod'
}

export const FUNC_BITS: Record<funcType, funcBits> = {
    add: 0b000,
    sub: 0b001,
    mod: 0b010
}

export type funcType = "add" | "sub" | "mod"
export type funcBits =  0b000 | 0b001 | 0b010