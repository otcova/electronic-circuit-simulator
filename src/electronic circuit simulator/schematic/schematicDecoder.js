import { Ic } from "../IcCircuit"

export function decodeSchematicSrc(schematicSrc) {
	const schematicData = schematicSrc.toString().replace(/(?:\r\n|\r|\n)+/g, '\n')
	const schematicLines = schematicData.split("\n")

	const componentsList = []
	const netsList = []

	let current = ""
	let data = []

	for (const lineIndex in schematicLines) {
		const line = schematicLines[lineIndex].trim()
		const error = () => { throw "Error parsing schematic on line " + lineIndex }

		if (line == "[") {
			if (current == "") current = "component"
			else error()
		}
		else if (line == "(") {
			if (current == "") current = "net"
			else error()
		}
		else if (line == "]") {
			if (current == "component") {
				current = ""
				componentsList.push(data)
				data = []
			}
			else error()
		}
		else if (line == ")") {
			if (current == "net") {
				current = ""
				netsList.push(data)
				data = []
			}
			else error()
		}
		else {
			data.push(line)
		}
	}

	// console.log(`Components(${componentsList.length})`)
	// console.log(`Nets(${netsList.length})`)

	const ics = new Map()
	const nets = new Map()


	for (const component of componentsList) {
		ics.set(component[0], {
			name: component[0],
			type: component[2],
			pins: new Map()
		})
	}

	for (const net of netsList) {
		const connections = []

		for (let i = 1; i < net.length; ++i) {
			const array = net[i].split("-")
			const pinNumber = Number(array.pop())
			const componentName = array.join("-")
			const comp = ics.get(componentName)
			if (!comp || Number.isNaN(pinNumber)) throw "Error parsing schematic"
			else {
				comp.pins.set(pinNumber, net[0])
				connections.push({
					pinNumber,
					componentName
				})
			}
		}
		nets.set(net[0], { connections })
	}

	for (const [name,ic] of ics) {
		const pins = new Array(ic.pins.size)
		for (const [pinIndex, pinName] of ic.pins) {
			pins[pinIndex-1] = pinName
		}
		ic.pins = pins
	}
	
	
	const schematic = { nets: Array.from(nets.keys()), ics:[] }
	schematic.ics = Array.from(ics.values()).map(ic => new Ic(ic.type, ic.name, ic.pins, schematic.nets)).filter(e=>e.type)
	
	return schematic
}