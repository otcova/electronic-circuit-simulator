import { CircuitEquation } from "./circuitEquation"
import { icRanges } from "./components"

const Vcc = icRanges.conditions.Vcc

const outV0 = icRanges.characteristics.max.Vol
const outV1 = icRanges.characteristics.min.Voh
const outMaxI = icRanges.conditions.max.I
const outTriI = icRanges.characteristics.max.Ioz

const inI = icRanges.characteristics.max.Il

class PinIn {
	constructor(cEq, nodeIndex) {
		this.resistor = cEq.pushI(nodeIndex, 0, inI)
	}
	read() {
		const value = this.resistor.readV()
		if (value < outV0) return 0
		if (value > outV1) return 1
		console.error("!")
		return -1
	}
	step() {
		if (this.comp.readI() > outMaxI)
			console.error("!!")
	}
}
class PinOut {
	constructor(cEq, nodeIndex) {
		this.source = cEq.pushSourceByV(0, nodeIndex, outV0)
	}
	write(value) {
		if (value) this.source.modifyV(outV1)
		else this.source.modifyV(outV0)
	}
	step() {
		if (this.source.readI() > outMaxI)
			console.error("nodeIndex")
	}
}
class PinOutTriState {
	constructor(cEq, nodeIndex) {
		this.source = cEq.pushSourceByV(0, nodeIndex, Vcc)
		this.resistor = cEq.pushResistorByR(0, cEq.newNode(), (Vcc-outV1)/outMaxI)
	}
	write(value, block) {
		if (block) this.resistor.modifyR(Vcc/outTriI)
		else this.resistor.modifyR((Vcc-outV1)/outMaxI)
		if (value) this.source.modifyV(Vcc)
		else this.source.modifyV(outV0 + (Vcc-outV1))
	}
	step() {
		if (this.source.readI() > outMaxI)
			console.error("!!!")
	}
}

class ICPins {
	constructor(ic, cEq) {
		this.pins = new Map()
		this.cEq = cEq
		for (const [name, pin] of ic.type.shell.pins)
			this.pins.set(name, this.#createPins(name, pin, ic))
	}
	#createPins(name, pin, ic) {
		if (ic.type.shell.triStateOutputs.includes(name)) return this.#createPinsFromClass(ic, pin, PinOutTriState)
		else if (ic.type.shell.outputs.includes(name)) return this.#createPinsFromClass(ic, pin, PinOut)
		else return this.#createPinsFromClass(pin, PinIn)
	}
	#createPinsFromClass(ic, pin, PinConstructor) {
		if (typeof pin == "number") return new PinConstructor(this.cEq, ic.pinsNode[pin])
		else {
			const pins = []
			for (const pinIndex of pin)
				pins.push(new PinConstructor(this.cEq, ic.pinsNode[pinIndex]))
			return pins
		}
	}
	read(pinName) {
		const pin = this.pins.get(pinName)
		if (typeof pin == "number") return pin.read()
		let n = 0
		for (let i = 0; i < pin.length; ++i)
			n |= (pin[i].read() & (1 << i))
		return n
	}
	write(pinName, value, block) {
		const pin = this.pins.get(pinName)
		if (typeof pin == "number") pin.write(value, block)
		else {
			for (let i = 0; i < pin.length; ++i)
				pin.write(pin[i], value & (1 << i), block)
		}
	}
	step() {
		for (const pin of this.pins)
			pin.step()
	}
}

export class ICCircuit {
	constructor(ics, pinNodesLen) {
		this.ics = ics
		this.pinNodesLen = pinNodesLen
		this.#initICs()
	}
	#initICs() {
		this.cEq = new CircuitEquation()
		this.cEq.reserveNodes(this.pinNodesLen-1)
		
		for (const ic of this.ics) {
			ic.type = icLib.get(ic.typeId)
			ic.memory = ic.type.setup()
			ic.pins = new ICPins(ic, this.cEq)
		}
		
		this.cEq.solveEquations()
	}
	step() {
		for (const ic of this.ics)
			ic.type.step(ic.pins, ic.memory)
			
		this.cEq.solveEquations()
			
		for (const ic of this.ics)
			ic.pins.step()
	}
}