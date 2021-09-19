import { mat } from "../logic/vec"
import { ElectronicEquation } from "./electronicEquation"
import { icLib, icRanges } from "./ics"
import { decodeSchematicSrc } from "./schematic/schematicDecoder"


class IcPinFree {
	constructor(ic, pinIndex) {
		this.node = ic.pinsNode[pinIndex]
	}
}

class IcPinIn {

	static I = icRanges.characteristics.max.Il

	constructor(ic, pinIndex) {
		const node = ic.pinsNode[pinIndex]
		this.disablePin = node == ic.gndNode || node == undefined || ic.gndNode == undefined || ic.vccNode == undefined
		if (ic.gndNode == undefined || ic.vccNode == undefined) console.warn("IC '" + ic.name + "' is unplugged", ic)
		if (!this.disablePin)
			this.resistor = ic.icc.eEq.newResistor(node, ic.gndNode, { I: IcPinIn.I }, ic.name + ":" + pinIndex)
	}
	read() {
		if (this.disablePin) return 0
		return icRanges.toDigital(this.resistor.readV())
	}
}

class IcPinOut {

	static RBlock = 1e19
	static RGndL = 1
	static RGndH = 1e9
	static RVccL = 1e9
	static RVccH = 1

	constructor(ic, pinIndex) {
		const node = ic.pinsNode[pinIndex]
		this.disablePin = node == ic.gndNode || node == undefined || ic.gndNode == undefined || ic.vccNode == undefined
		if (ic.gndNode == undefined || ic.vccNode == undefined) console.warn("IC '" + ic.name + "' is unplugged")
		if (!this.disablePin) {
			this.gndResistor = ic.icc.eEq.newResistor(node, ic.gndNode, { R: IcPinOut.RGndL }, ic.name + ":" + pinIndex + "GND")
			this.vccResistor = ic.icc.eEq.newResistor(ic.vccNode, node, { R: IcPinOut.RVccL }, ic.name + ":" + pinIndex + "VCC")
		}
	}
	write(value, block) {
		if (this.disablePin) return
		this.gndResistor.defineR(block ? IcPinOut.RBlock : (value ? IcPinOut.RGndH : IcPinOut.RGndL))
		this.vccResistor.defineR(block ? IcPinOut.RBlock : (value ? IcPinOut.RVccH : IcPinOut.RVccL))
	}
}

class IcPins {
	constructor(ic) {
		this.ic = ic
		this.pins = new Array(ic.pinsNode.length)

		this.#loadPins(ic.type.pins.inputs, IcPinIn)
		this.#loadPins(ic.type.pins.outputs, IcPinOut)
		this.#loadPins(ic.type.pins.free, IcPinFree)
	}
	#loadPins(pinList, PinConstructor) {
		if (pinList) {
			for (let [name, pins] of pinList) {
				if (typeof pins == "number") pins = [pins]
				for (const pinIndex of pins)
					this.pins[pinIndex] = new PinConstructor(this.ic, pinIndex)
			}
		}
	}
	write(pinName, value, block) {
		const pinsIndex = this.ic.type.pins.outputs.get(pinName)
		if (typeof pinsIndex == "number") return this.pins[pinsIndex].write(value, block)
		if (!Array.isArray(pinsIndex)) throw Error("pin '" + pinName + "' is not valid on '" + this.ic.type.type + "'")
		for (let i = 0; i < pinsIndex.length; ++i)
			this.pins[pinsIndex[i]].write(value & (1 << i), block)
	}
	read(pinName) {
		const pinsIndex = this.ic.type.pins.inputs.get(pinName)
		if (typeof pinsIndex == "number") return this.pins[pinsIndex].read()
		if (!Array.isArray(pinsIndex)) throw Error("pin '" + pinName + "' is not valid on '" + this.ic.type.type + "'")
		let value = 0
		for (let i = 0; i < pinsIndex.length; ++i)
			value += this.pins[pinsIndex[i]].read() & (1 << i)
		return value
	}
	node(pinName) {
		const pinsIndex = this.ic.type.pins.free.get(pinName)
		if (typeof pinsIndex == "number") return this.pins[pinsIndex].node
		if (!Array.isArray(pinsIndex)) throw Error("pin '" + pinName + "' is not valid on '" + this.ic.type.type + "'")
		return pinsIndex.map(pinIndex => this.pins[pinIndex].node)
	}
}

export class Ic {
	constructor(typeName, name, pinsNet, nets) {
		this.typeName = typeName
		this.name = name

		this.type = icLib.get(typeName)
		if (!this.type) return console.warn(`> Unknown IC type: '${this.typeName}'`)

		this.pinsNode = pinsNet.map(net => nets.indexOf(net))

		if (this.type.pins.inputs) {
			this.gndNode = this.pinsNode[this.type.pins.inputs.get("GND")]
			this.vccNode = this.pinsNode[this.type.pins.inputs.get("VCC")]
		}
	}
	init(icCircuit) {
		this.icc = icCircuit
		this.pins = new IcPins(this)
		if (this.type.setup)
			this.memory = this.type.setup(this.icc.eEq, this.pins, this.name)
	}
	step() {
		if (this.type.step)
			this.type.step(this.pins, this.memory)
	}
}

class IcSwitch {
	constructor(icc, nodeName, name = "") {
		if (name) name = "Switch-" + name
		else name = "Switch"
		this.resistorVcc = icc.eEq.newResistor(icc.vccNode, icc.nets.indexOf(nodeName), { R: 1e9 }, name + ":Resistor-Vcc")
		this.resistorGnd = icc.eEq.newResistor(icc.gndNode, icc.nets.indexOf(nodeName), { R: 1 }, name + ":Resistor-Gnd")
	}
	high() {
		this.resistorVcc.defineR(1)
		this.resistorGnd.defineR(1e9)
		return this
	}
	low() {
		this.resistorVcc.defineR(1e9)
		this.resistorGnd.defineR(1)
		return this
	}
}

export class IcCircuit {
	constructor(vccName = "VCC", gndName = "GND") {
		this.vccNodeName = vccName
		this.gndNodeName = gndName
		this.eEq = new ElectronicEquation()
	}
	loadSchematic(schematic) {
		this.nets = schematic.nets
		this.ics = schematic.ics
		this.vccNode = this.nets.indexOf(this.vccNodeName)
		this.gndNode = this.nets.indexOf(this.gndNodeName)

		icc.eEq.newSource(this.gndNode, this.vccNode, { V: 3.33 }, "Source")

		for (const ic of this.ics) ic.init(this)
	}
	step(repeat = 1) {
		for (let i = 0; i < repeat; ++i) {

			this.eEq.solve(this.gndNode)
			// mat.log(this.eEq.mesh.sysEqs.mat)

			for (const ic of this.ics)
				ic.step()
		}
	}
	log() {
		this.eEq.logResults(this.nets)
	}
}

import schematicSrc from "./schematic/schematic.net"
import { Stopwatch } from "../logic/Stopwatch"

const schematic = decodeSchematicSrc(schematicSrc)

// const schematic = { nets: ["GND", "VCC", "A", "B"] }
// schematic.ics = [
// 	new Ic("not", "Inv", ["GND", "VCC", "A", "B"], schematic.nets)
// ]

const icc = new IcCircuit("+3V")
window.icc = icc
icc.loadSchematic(schematic)
// const btnA = new IcSwitch(icc, "A").high()

const timer = new Stopwatch(true)
icc.step()
timer.log()

// icc.log()

// btnA.low()
// icc.step(2)
// icc.log()
