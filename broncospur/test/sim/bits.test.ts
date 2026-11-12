
import { describe, expect, test } from 'vitest'
import { mask, trunc, toSigned, bits } from '#src/sim/bits.ts'

describe('mask(w)', () => {
    test('correct masks from 0..32 to be 2^w - 1', () => {
        for (let w = 1; w <= 32; w++) {
            expect(mask(w)).toBe(2 ** w - 1)
        }
    } )

    test('choice mask tests', () => {
        expect(mask(2)).toBe(0b11)
        expect(mask(5)).toBe(0b11111)
        expect(mask(22)).toBe((0x3FFFFF))
        expect(mask(32)).toBe(0xFFFFFFFF)
        expect(mask(33)).toBe(0x1FFFFFFFF)
        expect(mask(34)).toBe(0x3FFFFFFFF)
        expect(mask(35)).toBe(0x7FFFFFFFF)
    })

    test('correct masks in edge cases', () => {
        expect(mask(0)).toBe(0b0)
    })

})

describe('trunc(v, w)', () => {
    test('values that already fit are unchanged', () => {
    expect(trunc(0, 8)).toBe(0);
    expect(trunc(13, 5)).toBe(13);
    expect(trunc(255, 8)).toBe(255);
    });
    
    test('drops bits above the width', () => {
        expect(trunc(0b1101101, 5)).toBe(0b01101); // 109 -> 13
        expect(trunc(0x1ff, 8)).toBe(0xff);
        expect(trunc(0x12345678, 16)).toBe(0x5678);
    });
    
    test('a 1-bit wire only carries the lowest bit', () => {
        expect(trunc(2, 1)).toBe(0);
        expect(trunc(3, 1)).toBe(1);
    });
    
    test('32-bit addition overflow wraps around', () => {
        expect(trunc(0xffffffff + 1, 32)).toBe(0);
        expect(trunc(0xffffffff + 5, 32)).toBe(4);
    });
    
    test('negative inputs become their unsigned bit pattern', () => {
        expect(trunc(-1, 8)).toBe(0xff);
        expect(trunc(-1, 32)).toBe(0xffffffff);
        expect(trunc(-4, 32)).toBe(0xfffffffc);
    });
    
    test('result is never negative, even with bit 31 set', () => {
        expect(trunc(0x80000000, 32)).toBe(2147483648);
        expect(trunc(0xffffffff, 32)).toBeGreaterThan(0);
    });
    
    test('width 31 keeps bits 0..30', () => {
        expect(trunc(0xffffffff, 31)).toBe(0x7fffffff);
    });
})

describe('toSigned(v, w)', () => {
    test('sign bit clear: value unchanged', () => {
        expect(toSigned(0, 4)).toBe(0);
        expect(toSigned(5, 4)).toBe(5);
        expect(toSigned(7, 4)).toBe(7); // largest positive 4-bit value
    });
 
    test('sign bit set: value is negative', () => {
        expect(toSigned(0b1111, 4)).toBe(-1);
        expect(toSigned(0b1000, 4)).toBe(-8); // most negative 4-bit value
        expect(toSigned(0b1110, 4)).toBe(-2);
    });
    
    test('the same bits mean different things at different widths', () => {
        expect(toSigned(15, 4)).toBe(-1);
        expect(toSigned(15, 8)).toBe(15);
    });
    
    test('16-bit MIPS immediates', () => {
        expect(toSigned(0xfffc, 16)).toBe(-4);
        expect(toSigned(0x7fff, 16)).toBe(32767);
        expect(toSigned(0x8000, 16)).toBe(-32768);
    });
    
    test('32-bit edge cases', () => {
        expect(toSigned(0xffffffff, 32)).toBe(-1);
        expect(toSigned(0x7fffffff, 32)).toBe(2147483647);
        expect(toSigned(0x80000000, 32)).toBe(-2147483648);
    });
    
    test('round-trips with trunc for every 8-bit pattern', () => {
        for (let v = 0; v < 256; v++) expect(trunc(toSigned(v, 8), 8)).toBe(v);
    });
    
    test('sign extension: 16-bit -4 becomes 32-bit -4', () => {
        expect(trunc(toSigned(0xfffc, 16), 32)).toBe(0xfffffffc);
        expect(trunc(toSigned(0x0004, 16), 32)).toBe(0x00000004);
    });
})

describe("bits(v, hi, lo)", () => {
    // Example instructions for decoding in MIPS style:
    // add $t2, $t0, $t1  ->  op=0 rs=8 rt=9 rd=10 shamt=0 funct=0x20
    const addInstr = 0x01095020;
    // lw $t0, 4($sp)     ->  op=0x23 rs=29 rt=8 imm=4
    const lwInstr = 0x8fa80004;
    // addi $t0, $t0, -4  ->  op=0x08 rs=8 rt=8 imm=0xfffc
    const addiInstr = 0x2108fffc;

    test('decodes R-type fields', () => {
        expect(bits(addInstr, 31, 26)).toBe(0); // opcode
        expect(bits(addInstr, 25, 21)).toBe(8); // rs = $t0
        expect(bits(addInstr, 20, 16)).toBe(9); // rt = $t1
        expect(bits(addInstr, 15, 11)).toBe(10); // rd = $t2
        expect(bits(addInstr, 10, 6)).toBe(0); // shamt
        expect(bits(addInstr, 5, 0)).toBe(0x20); // funct = add
  });

    test('decodes I-type fields, including opcode with bit 31 set', () => {
        expect(bits(lwInstr, 31, 26)).toBe(0x23);
        expect(bits(lwInstr, 25, 21)).toBe(29); // $sp
        expect(bits(lwInstr, 20, 16)).toBe(8); // $t0
        expect(bits(lwInstr, 15, 0)).toBe(4);
    });
    
    test('immediate field comes out unsigned; toSigned gives the real value', () => {
        expect(bits(addiInstr, 15, 0)).toBe(0xfffc);
        expect(toSigned(bits(addiInstr, 15, 0), 16)).toBe(-4);
    });
    
    test('single-bit and full-width extraction', () => {
        expect(bits(0x80000000, 31, 31)).toBe(1);
        expect(bits(0x80000000, 30, 30)).toBe(0);
        expect(bits(0xdeadbeef, 31, 0)).toBe(0xdeadbeef);
    });
    
    test('J-type 26-bit target', () => {
        // j 0x0040000c -> op=2 target=0x0100003
        expect(bits(0x08100003, 25, 0)).toBe(0x0100003);
    });
})