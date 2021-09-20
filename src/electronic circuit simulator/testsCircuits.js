
const netsToWatch = [
	"GND",
	"+3V",
	"",
	"A",
	"B",
	"",
	"C0",
	"C1",
	"C2",
	"",
	"L0",
	"L1",
	"L2",
	"",
	"LE",
]






const schematic = {nets: ["GND","+3V","A","B","C0","C1","C2","L0","L1","L2","LE"]}
schematic.ics = [
	new Ic("74LVC1G14SE-7", "Inv", ["","A","GND","B","+3V"], schematic.nets),
	new Ic("SN74LV4040APWR", "Counter", ["","", "", "", "", "C2", "C1", "GND","C0","B", "GND", "", "", "", "", "+3V"], schematic.nets),
	new Ic("MC74LCX573DTR2G", "Latch", [
		"GND", "C0", "C1", "C2", "", "",   "",   "",   "", "GND",
		"LE",    "",   "",   "", "", "", "L2", "L1", "L0", "+3V"
	], schematic.nets),
]




const icc = new IcCircuit("+3V")
icc.loadSchematic(schematic)

const btnReset = new IcSwitch(icc, "LE").low()
const btnClk = new IcSwitch(icc, "A").high()

let stepCount = 0
const intervalId = setInterval(() => {
	icc.step()
	// icc.log()
	++stepCount
	if (stepCount % 5 == 0) btnClk.switch()
	if (stepCount % 10 == 0) btnReset.high()
	if (stepCount % 10 == 1) btnReset.low()
	
	const slice = []
	for (const net of netsToWatch) {
		if (net == "") slice.push(0)
		else if (!net.endsWith(".")) {
			slice.push(icc.readNode(net.toUpperCase()).bit)
		}
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