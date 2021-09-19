import React from "react"
import { render } from "react-dom"
import { BitMapGraph } from "./BitMapGraph"
import * as css from "./logic/style";

// import "./schematicDecoder/schematicDecoder"
// import "./electronic circuit simulator/SchematicSimulator"
import "./electronic circuit simulator/IcCircuit"

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
for (let i = 0; i < 1000; ++i) {
	const slice = []
	for (const net of netsToWatch)
		slice.push(Math.floor(Math.random() * 2))
	data.push(slice)
}


render((
	<div className="exp" style={{...css.padding(10),...css.background("#111")}}>
		<BitMapGraph header={netsToWatch} data={data} />
	</div>
), document.getElementById("root"))
