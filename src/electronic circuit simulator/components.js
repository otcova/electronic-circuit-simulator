import { vec } from "../logic/vec"

// compRanges.[conditions.[min.[...], max.[...]], characteristics.[min.[...], max.[...]]]
const Vcc = 3.3
export const icRanges = {
	conditions: {
		Vcc,
		max: {
			I: 18e-3,
		}
	},
	characteristics: {
		min: {
			Vih: 2, // HIGH Level Input Voltage
			Voh: 2.4, // HIGH Level Output Voltage
		},
		max: {
			Vil: 0.8, // LOW Level Input Voltage
			Vol: 0.5, // LOW Level Output Voltage
			Il: 5e-6, // Input leakage current
			Ioz: 5e-6, // 3-state output current
			Icc: 10e-6, // Current consume
			IccIncrease: 500e-6, // Icc increase per input
		}
	}
}



export const icLib = new Map()

icLib.set("MC74LCX573DTR2G", {
	type: "latch",
	shell: {
		pins: new Map([["!OE", 1],["D", vec.random(2,9)],["GND", 10],["LE", 11],["O", vec.random(19,12)],["Vcc", 20]]),
		triStateOutputs: ["O"]
	},
	setup: () => ({ n: 0 }),
	step: (pins, mem) => {
		if (pins.read("LE")) mem.n = pins.read("D")
		if (!pins.read("!OE")) pins.write("O", mem.n)
	}
})