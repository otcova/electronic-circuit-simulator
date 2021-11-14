const instructions = new Map()
window.ins = instructions
//ALU Read Write
for (let a = 0; a < 4; ++a) {
	for (let b = 0; b < 4; ++b) {
		instructions.set(`r${a} = r${b}`, (b << 2) + a)
		instructions.set(`r${a} = r${a} & r${b}`, 16 + (b << 2) + a)
		instructions.set(`r${a} = r${a} | r${b}`, 32 + (b << 2) + a)
		instructions.set(`r${a} = r${a} + r${b}`, 48 + (b << 2) + a)
		instructions.set(`r${a} = ~r${b}`, 64 + (b << 2) + a)
		instructions.set(`r${a} = r${b} >> 1`, 80 + (b << 2) + a)
		instructions.set(`r${a} = r${b} + 1`, 96 + (b << 2) + a)
		instructions.set(`r${a} = r${b} - 1`, 112 + (b << 2) + a)
		instructions.set(`M[r${b}] = r${a}`, 144 + (b << 2) + a)
		instructions.set(`r${a} = M[r${b}]`, 128 + (b << 2) + a)


	}
}
//Branch Const
for (let n = 0; n < 256; ++n) {
	instructions.set(`${n}`, n)
	instructions.set(`jmp ${n}`, [192, n])
	instructions.set(`jz ${n}`, [208, n])
	instructions.set(`jc ${n}`, [224, n])
	instructions.set(`jn ${n}`, [240, n])
}
// Load
for (let a = 0; a < 4; ++a) {
	for (let n = 0; n < 256; ++n) {
		instructions.set(`r${a} = ${n}`, [160 + a, n])
		instructions.set(`r${a} = 0b${n.toString(2)}`, [160 + a, n])
		instructions.set(`r${a} = 0x${n.toString(16)}`, [160 + a, n])
	}
}
for (let a = 0; a < 4; ++a) {
	for (let b = 0; b < 4; ++b) {
		if (a != b) {
			instructions.set(`jmp r${a} (r${b})`, [
				instructions.get(`r${b} = 0`)[0],
				"3",
				instructions.get(`M[r${b}] = r${a}`),
				instructions.get(`jmp 0`)[0],
				0,
			])
		}
	}
}

function getInstCode(inst) {
	const n = instructions.get(inst)
	if (n == undefined) console.error(">", inst)
	if (typeof n == "number") return [n]
	return n
}

function loadConstants(src) {
	const constants = new Map()
	let index = 0
	for (let inst of src) {
		if (inst) {
			if (inst.startsWith(":")) constants.set(inst, index)
			else {
				if (inst.includes(":")) inst = inst.split(":")[0] + "0"
				index += getInstCode(inst).length
			}
		}
	}
	return constants
}

export function compile(src) {
	const machineCode = []
	const constants = loadConstants(src)
	for (let inst of src) {
		if (inst && !inst.startsWith(":")) {
			if (inst.includes(":")) inst = inst.split(":")[0] + constants.get(":" + inst.split(":")[1])
			for (const instCode of getInstCode(inst))
				machineCode.push(typeof instCode == "string"? machineCode.length + Number(instCode) : instCode)
		}
	}
	
	return machineCode
}