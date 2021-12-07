import { compile } from "./compiler"

export const programs = [
	["Fibonacci", compile([
		"r0 = 0",
		"r1 = 1",
		"r3 = 16",

		":loop",
		"r3 = r3 + 1",
		"M[r3] = r0",
		"r2 = r1",
		"r1 = r1 + r0",
		"r0 = r2",

		"jmp :loop",
	])],
	["Snake Game", compile([
		"0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "0", "255",
		":inputPtr", "0",

		":loop",

		"r0 = :snakeEndPtr", "r1 = 0", "r2 = :ret1", "jmp :drawPoint", ":ret1",

		"r0 = :snakeStartPtr", "r3 = M[r0]", "r3 = M[r3]",
		"r1 = :snakeEndPtr", "r2 = M[r1]", "r2 = r2 + 1", "jc :sei", "jmp :sen", ":sei", "r2 = 190", ":sen", "M[r1] = r2",
		"r1 = M[r0]", "r1 = r1 + 1", "jc :ssi", "jmp :ssn", ":ssi", "r1 = 190", ":ssn", "M[r0] = r1",
		"r2 = :inputPtr", "r2 = M[r2]", "r3 = r3 + r2", "M[r1] = r3",

		"r0 = :snakeStartPtr", "r1 = 1", "r2 = :loop", "jmp :drawPoint",
		"jmp :loop",


		":drawPoint",
		"r3 = :returnPtr", "M[r3] = r2",

		"r0 = M[r0]", "r0 = M[r0]",
		"r3 = 0b11111000", "r2 = r0", "r2 = r2 & r3", "r2 = r2 >> 1", "r2 = r2 >> 1", "r2 = r2 >> 1",
		"r3 = 0b111", "r0 = r0 & r3",

		"r3 = 1",
		"r0 = r0", ":while", "jz :while exit", "r3 = r3 + r3", "r0 = r0 - 1", "jmp :while", ":while exit",
		"r0 = M[r2]", "r0 = r0 | r3",
		"r1 = r1", "jz :clear", "jmp :skip clear", ":clear", "r3 = ~r3", "r0 = r0 & r3", "jmp :continue clear if", ":skip clear",
		"r1 = M[r2]", "r1 = r1 & r3", "jz :continue clear if", "jmp :death", ":continue clear if",

		"M[r2] = r0",
		"r3 = :returnPtr", "r0 = M[r3]", "jmp r0 (r1)",
		"jmp :loop",

		":death",
		"jmp :death",

		":returnPtr", "0",
		":snakeStartPtr", "220",
		":snakeEndPtr", "190",
		"19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19",
		"19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19",
		"19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19",
		"19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19", "19",
	])]
]
let activeProgramIndex = 0
export function setActiveProgramIndex(index) {
	activeProgramIndex = index
}

class CompI {
	constructor(board) {
		this.board = board
		this.I = 0
	}
	step() {
		if (this.board.get("ri-write") && this.board.get("write"))
			this.I = this.board.get("busD")
		this.board.set("I", this.I)
	}
}

class CompRc {
	constructor(board) {
		this.board = board
		this.rc = 0
		this.latch = 0
	}
	step() {
		if (this.board.get("rc-inc") && this.board.get("write")) {
			this.rc = this.board.get("alu-incremented")
		}
		if (this.board.get("rc-write") && this.board.get("write"))
			this.rc = this.board.get("busD")
		if (this.board.get("rc-read")) {
			if (this.board.get("setup")) this.latch = this.rc
			this.board.set("busB", this.latch)
		}

		this.board.set("rc", this.rc)
	}
}

class CompR {
	constructor(board) {
		this.board = board
		this.r = [0, 0, 0, 0]
		this.ra = 0
		this.rb = 0
	}
	step() {
		const a = this.board.get("I") & 0b11
		const b = (this.board.get("I") & 0b1100) >> 2

		if (this.board.get("ra-write") && this.board.get("write"))
			this.r[a] = this.board.get("busD")
		if (this.board.get("ra-read")) {
			if (this.board.get("setup")) this.ra = this.r[a]
			this.board.set("busA", this.ra)
		}

		if (this.board.get("rb-write") && this.board.get("write"))
			this.r[b] = this.board.get("busD")
		if (this.board.get("rb-read")) {
			if (this.board.get("setup")) this.rb = this.r[b]
			this.board.set("busB", this.rb)
		}

		this.board.set("r0", this.r[0])
		this.board.set("r1", this.r[1])
		this.board.set("r2", this.r[2])
		this.board.set("r3", this.r[3])
	}
}

class CompALU {
	constructor(board) {
		this.board = board
		this.flags = new Map([["zero", 0], ["carry", 0], ["negative", 0]])
	}
	step() {
		const b = this.board.get("busB")
		if (this.board.get("alu-read")) {
			const a = this.board.get("busA")

			const opCode = (this.board.get("I") & 0b1110000) >> 4
			let opName = ["rb", "&", "|", "+", "~", ">>1", "+1", "-1"][opCode]
			let result = 0

			if (opName == "rb") result = b
			if (opName == "&") result = a & b
			if (opName == "|") result = a | b
			if (opName == "+") result = a + b
			if (opName == "~") result = ~b
			if (opName == ">>1") result = b >> 1
			if (opName == "+1") result = b + 1
			if (opName == "-1") result = b - 1

			result = this.#setFlagsAndCut(result)

			this.board.set("busD", result)
		}
		this.board.set("alu-incremented", b + 1)
		this.board.write(this.flags)
	}
	#setFlagsAndCut(number) {
		this.flags.set("zero", number == 0)
		this.flags.set("carry", (number & 0x100) >> 8)
		this.flags.set("negative", (number & 0x80) >> 7)
		return number & 0xFF
	}
}

let memory = null
document.onkeydown = e => {
	if (memory) {
		if (e.key.toLowerCase() == "a" || e.key == "ArrowLeft") memory[33] = 0b11111000
		if (e.key.toLowerCase() == "d" || e.key == "ArrowRight") memory[33] = 0b00001000
		if (e.key.toLowerCase() == "w" || e.key == "ArrowUp") memory[33] = 0b11111111
		if (e.key.toLowerCase() == "s" || e.key == "ArrowDown") memory[33] = 0b00000001
	}
}

class CompM {
	constructor(board) {
		this.board = board
		this.memory = new Int16Array(256)
		this.memory.set(programs[activeProgramIndex][1])
		memory = this.memory
	}
	step() {
		const address = this.board.get("busB")
		if (this.board.get("M-read"))
			this.board.set("busD", this.memory[address])
		if (this.board.get("M-write") && this.board.get("write")) {
			this.memory[address] = this.board.get("busA")
		}
	}
}

class CompMng {
	constructor(board) {
		this.board = board
		this.microInst = new Map()
	}
	step() {
		if (this.board.get("setup")) {
			let I = -1
			if (this.board.get("stage"))
				I = this.board.get("I")

			let iName = "undefined"
			let branch = "no"
			if (I == -1) iName = "loadI"
			else if (!(I & 0b10000000)) iName = "alu"
			else if (!(I & 0b01110000)) iName = "read"
			else if (!(I & 0b01100000)) iName = "write"
			else if (!(I & 0b01010000)) iName = "load"
			else if (!(I & 0b01010000)) iName = "load"
			else if (I & 0b11000000) {
				iName = "branch"
				const branchType = ["jmp", "jz", "jc", "jn"][(I & 0b110000) >> 4]
				if (branchType == "jmp") branch = "true"
				if (branchType == "jz") branch = this.board.get("zero") ? "true" : "false"
				if (branchType == "jc") branch = this.board.get("carry") ? "true" : "false"
				if (branchType == "jn") branch = this.board.get("negative") ? "true" : "false"
			}

			this.microInst.set("ri-write", !this.board.get("stage")) //Indirect
			this.microInst.set("rc-inc", ["loadI", "load"].includes(iName) || branch == "false")
			this.microInst.set("rc-write", branch == "true")
			this.microInst.set("rc-read", ["loadI", "load", "branch"].includes(iName))
			this.microInst.set("ra-write", ["alu", "load", "read"].includes(iName))
			this.microInst.set("ra-read", 1) // Indirect
			this.microInst.set("rb-read", !this.board.get("rc-read")) //Indirect
			this.microInst.set("ALU-read", ["alu"].includes(iName))
			this.microInst.set("M-write", ["write"].includes(iName))
			this.microInst.set("M-read", ["loadI", "load", "read", "branch"].includes(iName))
		}
		this.board.write(this.microInst)
	}
}

class CompCounter {
	constructor(board) {
		this.board = board
		this.counter = 0
	}
	step() {
		if (this.board.down("clk")) ++this.counter
		this.board.set("setup", this.board.get("clk") && !(this.counter & 1))
		this.board.set("write", this.board.get("clk") && (this.counter & 1))
		this.board.set("stage", (this.counter & 2) >> 1)
	}
}

class CompClock {
	constructor(board) {
		this.board = board
		this.stepCounter = 0
	}
	step() {
		const period = 10
		const clk = ++this.stepCounter % period < period / 2
		this.board.set("clk", clk)
	}
}

class State {
	constructor() {
		this.wires = new Map()
	}
	set(name, value) {
		if (value === false) value = 0
		else if (value === true) value = 1
		this.wires.set(name.toUpperCase(), value)
	}
	get(name) {
		return this.wires.get(name.toUpperCase())
	}
}

class Board {
	constructor() {
		this.prePastState = new State()
		this.pastState = new State()
		this.newState = new State()
	}
	set(name, value) {
		this.newState.set(name, value)
	}

	get(name) {
		const value = this.pastState.get(name)
		return value || 0
	}
	down(name) {
		const pastValue = this.prePastState.get(name)
		const value = this.pastState.get(name)
		return pastValue && !value
	}
	up(name) {
		const pastValue = this.prePastState.get(name)
		const value = this.pastState.get(name)
		return !pastValue && value
	}
	write(map) {
		for (const [name, value] of map)
			this.set(name, value)
	}
	step() {
		this.prePastState = this.pastState
		this.pastState = this.newState
		this.newState = new State()
	}
}

export class Processor {
	constructor() {
		this.board = new Board()
		this.comps = [
			new CompI(this.board),
			new CompRc(this.board),
			new CompR(this.board),
			new CompALU(this.board),
			new CompM(this.board),
			new CompMng(this.board),
			new CompCounter(this.board),
			new CompClock(this.board),
		]
	}

	step() {
		for (const comp of this.comps)
			comp.step()
		this.board.step()
		return this.board.pastState
	}
}