

// produces num w/ lowest 'width' bits as '1', up to 32 bits (limit for bitshift operand)
//      mask works like so:                   |--| <--- lowest 4 bits are 1
//      mask(4) --> 1 << 4 --> 10000 - 1 --> 01111
// implicitly, JS modulos 'width' by 32 to ensure a positive number [0-31].
// so if we want a 32 bit wide mask, requesting 1 << 32 is that same as 1 << 0, 
// which then resolves to 1 - 1 = 0. To get around this, we check if the requested
// width is 32-- if it is, we just return the hex value of 32 '1' bits.
export const mask = (width: number) => (width === 32 ? 0xffffffff : (1 << width) - 1);

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