import React from "react"
import { render } from "react-dom"
import { BitMapGraph } from "./BitMapGraph"
import * as css from "./logic/style";

import schematicSrc from "./electronic circuit simulator/schematic/schematic.net"
import { IcCircuit, IcSwitch } from "./electronic circuit simulator/IcCircuit";
import { decodeSchematicSrc } from "./electronic circuit simulator/schematic/schematicDecoder";

const netsToWatch = [
	"CLK",
	"halted",
	"RESET",
	"",
	"phase-fetch",
	"phase-exe",
	// "",
	// "stage.0",
	// "stage.1",
	"",
	"stage-decode",
	"stage-set",
	"stage-calc",
	"stage-get",
	"",
	"RI.",
	"RC.",
	// "PRE-RC.",
	"",
	"R0.",
	"R1.",
	"R2.",
	"R3.",
	"",
	"Adder-num.",
	// "Adder-carry.",
	"Adder-result.",
	"setD-Adder",
	"",
	"BusA.",
	"BusB.",
	"BusD.",
	"",
	"BusIO.",
	"M-Page.",
	"enable-Device-0",
	"M-Read#",
	"",
	"Flag-carry",
	"Flag-neg",
	"Flag-zero",
	"flag-is-true",
	"jmp",
	"jz",
	"jc",
	"jn",
	"",
	"I-BinALU",
	"I-Read",
	"I-Write",
	"I-Mi=RA",
	"I-UnyALU",
	"I-RA=#",
	"I-Branch",
	"",
	"getD-RA",
	"getINC-RC",
	"setAB-GPR",
	"setAB-RC",
	"M-Read",
]


const data = []
// setInterval(() => {
// 		const slice = []
// 		for (const net of netsToWatch)
// 			slice.push(Math.floor(Math.random() * 2))
// 		data.push(slice)
// }, 30)



const schematic = decodeSchematicSrc(schematicSrc)

const gndNode = schematic.nets.indexOf("GND")
const ledGndNode = schematic.nets.indexOf("LED-GND")
for (const ic of schematic.ics) {
	ic.pinsNode = ic.pinsNode.map(e => e == ledGndNode ? gndNode : e)
}

const icc = new IcCircuit("+3V")
icc.loadSchematic(schematic)

// const btnReset = new IcSwitch(icc, "RESET").high()
const btnClk = new IcSwitch(icc, "CLK").high()


// icc.step(2)
// icc.log()
// console.log("PHASE-FETCH", icc.readNode("PHASE-FETCH").bit)

let stepCount = 0
const intervalId = setInterval(() => {
	icc.step()
	++stepCount
	if (stepCount % 5 == 0) btnClk.switch()
	
	const slice = []
	for (const net of netsToWatch) {
		if (net == "") slice.push(0)
		else if (!net.endsWith(".")) slice.push(icc.readNode(net.toUpperCase()).bit)
		else {
			let bit = 0
			
			for (let i = 0; i < 8; ++i) {
				if (icc.readNode(net.toUpperCase()+i).bit) {
					bit = 1
					break
				}
			}
					
			slice.push(bit)
		}
	}
	data.push(slice)
}, 100)

window.s = () => {
	clearInterval(intervalId)
}




//******************************************************************************//

render((
	<div className="exp" style={{ ...css.padding(10), ...css.background("#111") }}>
		<BitMapGraph header={netsToWatch} data={data} />
	</div>
), document.getElementById("root"))