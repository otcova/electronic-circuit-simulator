import { vec } from "../logic/vec"

// compRanges.[conditions.[min.[...], max.[...]], characteristics.[min.[...], max.[...]]]
const Vcc = 3.333
export const icRanges = {
	conditions: {
		Vcc,
		max: {
			I: 18e-3, // max output current
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
	},
	toDigital: (voltageValue) => {
		if (voltageValue < icRanges.characteristics.max.Vil) return 0
		if (voltageValue > icRanges.characteristics.min.Vih) return 1
		return -1
	}
	
}


export const icLib = new Map()

icLib.set("not", {
	type: "inverter",
	pins: {
		inputs: new Map([["GND", 0],["VCC", 1],["I", 2]]),
		outputs: new Map([["O", 3]]),
	},
	setup: () => ({}),
	step: pins => {
		pins.write("O", !pins.read("I"))
	}
})

icLib.set("SN74LVC574APWR", {
	type: "register 8bit",
	pins: {
		inputs: new Map([["#OE", 0],["D", vec.range(1,8)],["GND", 9],["CLK", 10],["VCC", 19]]),
		outputs: new Map([["O", vec.range(18,11)]]),
	},
	setup: () => ({ n: 0, pastClk: 0 }),
	step: (pins, mem) => {
		if (pins.read("CLK") != mem.pastClk && !mem.pastClk) mem.n = pins.read("D")
		pins.write("O", mem.n, pins.read("#OE"))
		mem.pastClk = pins.read("CLK")
	}
})

icLib.set("MC74LCX573DTR2G", {
	type: "latch 8bit",
	pins: {
		inputs: new Map([["#OE", 0],["D", vec.range(1,8)],["GND", 9],["LE", 10],["VCC", 19]]),
		outputs: new Map([["O", vec.range(18,11)]]),
	},
	setup: () => ({ n: 0 }),
	step: (pins, mem) => {
		if (pins.read("LE")) mem.n = pins.read("D")
		pins.write("O", mem.n, pins.read("#OE"))
	}
})

icLib.set("74LVC1G14SE-7", {
	type: "inverter",
	pins: {
		inputs: new Map([["GND", 2],["VCC", 4],["I", 1]]),
		outputs: new Map([["O", 3]]),
	},
	step: pins => {
		pins.write("O", !pins.read("I"))
	}
})

icLib.set("SN74LVC06APWR", {
	type: "inverter x6",
	pins: {
		inputs: new Map([["GND", 6],["VCC", 13],["I", [0,2,4,8,10,12]]]),
		outputs: new Map([["O", [1,3,5,7,9,11]]]),
	},
	step: pins => {
		pins.write("O", ~pins.read("I"))
	}
})

icLib.set("74LCX08MTCX", {
	type: "and x4",
	pins: {
		inputs: new Map([["GND", 6],["VCC", 13],["Ia", [0,3,12,9]],["Ib", [1,4,11,8]]]),
		outputs: new Map([["O", [2,5,10,7]]]),
	},
	step: pins => {
		pins.write("O", pins.read("Ia") & pins.read("Ib"))
	}
})

icLib.set("74LVC32APW,118", {
	type: "or x4",
	pins: {
		inputs: new Map([["GND", 6],["VCC", 13],["Ia", [0,3,12,9]],["Ib", [1,4,11,8]]]),
		outputs: new Map([["O", [2,5,10,7]]]),
	},
	step: pins => {
		pins.write("O", pins.read("Ia") | pins.read("Ib"))
	}
})

icLib.set("SN74LVC86APWR", {
	type: "xor x4",
	pins: {
		inputs: new Map([["GND", 6],["VCC", 13],["Ia", [0,3,12,9]],["Ib", [1,4,11,8]]]),
		outputs: new Map([["O", [2,5,10,7]]]),
	},
	step: pins => {
		pins.write("O", pins.read("Ia") ^ pins.read("Ib"))
	}
})

icLib.set("SN74LVC138ADRG4", {
	type: "decoder 3bit",
	pins: {
		inputs: new Map([["GND", 7],["VCC", 15],["I", [0,1,2]],["#G2A", 3],["#G2B", 4],["G1", 5]]),
		outputs: new Map([["O", [14,13,12,11,10,9,8,6]]]),
	},
	step: pins => {
		if (pins.read("G1") && !pins.read("#G2A") && !pins.read("#G2B")) pins.write("O", 1 << pins.read("I"))
		else pins.write("O", 0)
	}
})

icLib.set("74LVC138AD", {
	type: "#decoder 3bit",
	pins: {
		inputs: new Map([["GND", 7],["VCC", 15],["I", [0,1,2]],["#G2A", 3],["#G2B", 4],["G1", 5]]),
		outputs: new Map([["#O", [14,13,12,11,10,9,8,6]]]),
	},
	step: pins => {
		if (pins.read("G1") && !pins.read("#G2A") && !pins.read("#G2B")) pins.write("#O", ~(1 << pins.read("I")))
		else pins.write("#O", 1)
	}
})

icLib.set("SN74LV4040APWR", {
	type: "counter 12bit",
	pins: {
		inputs: new Map([["GND", 7],["VCC", 15],["CLK", 9],["CLR", 10]]),
		outputs: new Map([["O", [8,6,5,4,2,1,3,12,11,13,14,0]]]),
	},
	setup: () => ({n:0,pastClk:0}),
	step: (pins,mem) => {
		if (pins.read("CLK") != mem.pastClk && !mem.pastClk) mem.n += 1
		if (pins.read("CLR")) mem.n = 0
		pins.write("O", mem.n)
		mem.pastClk = pins.read("CLK")
	}
})

icLib.set("SN74LVC74ADR", {
	type: "SR D flip flop x2",
	pins: {
		inputs: new Map([["GND", 6],["VCC", 13],["1#PRE", 3],["1CLK", 2],["1D", 1],["1#CLR", 0],["2#PRE", 9],["2CLK", 10],["2D", 11],["2#CLR", 12]]),
		outputs: new Map([["1Q", 4],["1#Q", 5],["2Q", 8],["2#Q", 7]]),
	},
	setup: () => ({n1:0,pastClk1:0,n2:0,pastClk2:0}),
	step: (pins,mem) => {
		if (pins.read("1CLK") != mem.pastClk1 && !mem.pastClk1) mem.n1 = pins.get("1D")
		if (pins.read("2CLK") != mem.pastClk2 && !mem.pastClk2) mem.n2 = pins.get("2D")
		
		if (!pins.read("1#PRE")) mem.n1 = 1
		if (!pins.read("2#PRE")) mem.n2 = 1
		
		if (!pins.read("1#CLR")) mem.n1 = 0
		if (!pins.read("2#CLR")) mem.n1 = 0
		
		pins.write("1Q", mem.n1)
		pins.write("1#Q", !mem.n1)
		pins.write("2Q", mem.n2)
		pins.write("2#Q", !mem.n2)
		
		mem.pastClk1 = pins.read("1CLK")
		mem.pastClk2 = pins.read("2CLK")
	}
})

icLib.set("4k", {
	type: "resistor 4k",
	pins: {
		free: new Map([["I",0],["O",1]])
	},
	setup: (eEq, pins, name) => {
		eEq.newResistor(pins.node("I"), pins.node("O"), {R:4e3}, name)
	}
})

icLib.set("SM4007PL", {
	type: "diode",
	pins: {
		free: new Map([["I",0],["O",1]])
	},
	setup: (eEq, pins, name) => {
		return eEq.newResistor(pins.node("I"), pins.node("O"), {R:1}, name)
	},
	step: (pins, resistor) => {
		resistor.defineR(resistor.readI() > 0? 1 : 1e9)
	}
})

icLib.set("FC-2012UGK-520D5", {
	type: "led",
	pins: {
		free: new Map([["I",0],["O",1]])
	},
	setup: (eEq, pins, name) => {
		return eEq.newResistor(pins.node("I"), pins.node("O"), {R:10}, name)
	},
	step: (pins, resistor) => {
		resistor.defineR(resistor.readI() > 0? 10 : 1e9)
	}
})