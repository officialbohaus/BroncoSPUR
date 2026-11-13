That confirms the plan: build it as a frontend-only TypeScript app this semester and add a backend later, once it’s being used for teaching. No server also means you can host it for free on GitHub Pages, Netlify or Vercel, so your instructor and classmates can try it from a link.

A few things to do now so the later teaching version is easier:

Keep the circuit as plain JSON. If the whole design (components, positions, connections, settings) serializes cleanly, then saving, sharing by link, and loading instructor-made starter circuits are each a small feature later instead of a rewrite. Version the format ("version": 1) from the start.
Ship a prebuilt MIPS single-cycle datapath. Students learn most from stepping through an existing datapath before building their own. A working preset is also an impressive demo for your class.
Make what’s happening visible. This is what makes it a teaching tool rather than a simulator:
show values on wires as you hover or step
highlight active paths and control signals for the current instruction (for example, dim the paths an lw doesn’t use)
step forward and back one cycle at a time
Keep the instruction set pluggable. Put instruction decoding and control-unit logic in its own module. Then adding a multi-cycle or pipelined version, or RISC-V (which many courses are moving to), later is a contained change.

For a one-semester scope, a realistic order is: (1) a simulator core with tests, (2) the editor with a handful of components (register, ALU, mux, memory, adder, sign-extend, control), (3) the MIPS single-cycle preset, (4) the visualization features. Building your own datapaths from scratch, a pipelined datapath, and saving can all come after this semester.