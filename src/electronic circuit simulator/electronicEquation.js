import { num, SystemEquations } from "../logic/math"
import { Stopwatch } from "../logic/Stopwatch"
import { icRanges } from "./ics"

class Source {
	constructor(index, nodes, constant, name) {
		this.name = name || "[Source]"
		this.index = index
		this.nodes = nodes
		this.initialConstant = constant
	}
	init(mesh) {
		this.mesh = mesh
		this.mesh.stampKirchhoffCurrentLaw(this.index, this.nodes)
		this.defineV(this.initialConstant.V)
	}
	defineV(V) {
		if (!this.mesh) this.initialConstant = { V }
		else this.mesh.stampBranchEquation(this.index, 0, [
			{ index: this.nodes.a, weight: -1 },
			{ index: this.nodes.b, weight: 1 },
		], V)
	}
	readV() { return this.mesh.readV(this.nodes) }
	readI() { return this.mesh.readI(this.index) }
	readR() { return this.mesh.calcR(this.index, this.nodes) }
}

class Resistor {
	constructor(index, nodes, constant, name) {
		this.name = name || "[Resistor]"
		this.index = index
		this.nodes = nodes
		this.initialConstant = constant
		if (constant.R == undefined && constant.I == undefined) throw Error("> Resistor constant undefined")
	}
	init(mesh) {
		this.mesh = mesh
		this.mesh.stampKirchhoffCurrentLaw(this.index, this.nodes)
		if (this.initialConstant.R != undefined) this.defineR(this.initialConstant.R)
		else if (this.initialConstant.I != undefined) this.defineI(this.initialConstant.I)
	}
	defineR(R) {
		if (!this.mesh) this.initialConstant = { R }
		else this.mesh.stampBranchEquation(this.index, R, [
			{ index: this.nodes.a, weight: -1 },
			{ index: this.nodes.b, weight: 1 },
		])
	}
	defineI(I) {
		if (!this.mesh) this.initialConstant = { I }
		else this.mesh.stampBranchEquation(this.index, 1, [], I)
	}
	readV() { return this.mesh.readV(this.nodes) }
	readI() { return this.mesh.readI(this.index) }
	readR() { return this.mesh.calcR(this.index, this.nodes) }
}

export class ElectronicEquation {

	constructor() {
		this.nodesLen = 0
		this.components = []
	}
	reserveNodes(...nodeId) {
		this.nodesLen = Math.max(this.nodesLen - 1, ...nodeId) + 1
	}
	newNode() {
		return this.nodesLen++
	}

	newSource(nodeA, nodeB, { V }, name) {
		const source = new Source(this.components.length, { a: nodeA, b: nodeB }, { V }, name)
		this.reserveNodes(nodeA, nodeB)
		this.components.push(source)
		return source
	}
	newResistor(nodeA, nodeB, { R, I }, name) {
		const resistor = new Resistor(this.components.length, { a: nodeA, b: nodeB }, { R, I }, name)
		this.reserveNodes(nodeA, nodeB)
		this.components.push(resistor)
		return resistor
	}

	solve(nodeGND) {
		if (!this.mesh) this.#createMesh(nodeGND)
		this.mesh.solve()
	}

	#createMesh(nodeGND) {
		if (nodeGND == undefined) throw "> Node GND index is not defined"
		if (Number.isNaN(this.nodesLen)) throw Error("> nodesLen is NaN")
		this.mesh = new ElectricMesh(this.components.length, this.nodesLen)
		// Write Equations
		for (const comp of this.components)
			comp.init(this.mesh)

		// Set GND
		this.mesh.stampGND(nodeGND)
	}

	logResults(nodeNames) {
		const getNodeName = index => nodeNames ? (nodeNames.length > index ? nodeNames[index] : index) : index

		const eqData = new Array(this.components.length)
		for (let i = 0; i < this.components.length; ++i) {
			const comp = this.components[i]
			eqData[i] = {
				name: comp.name,
				bit: icRanges.toDigital(comp.readV()),
				V_drop: num.prefix(comp.readV()), I: num.prefix(comp.readI()), R: num.prefix(comp.readR()),
				// type: comp.data.type, 
				nodeA: getNodeName(comp.nodes.a), nodeB: getNodeName(comp.nodes.b)
			}
		}
		console.table(eqData)
		console.table(this.mesh.results.voltages.map((voltage, i) => {
			return {
				node: getNodeName(i),
				bit: icRanges.toDigital(voltage),
				voltage: num.prefix(voltage)
			}
		}))
	}
}

/*
Electric System of Equations:

branch equation: 0 > I0 + I1 + ... + In + V0 + V1 + ... + Vm = k
branch equation: 1 > I0 + I1 + ... + In + V0 + V1 + ... + Vm = k
...
branch equation: n-1 > I0 + I1 + ... + In + V0 + V1 + ... + Vm = k

GND equation: n > I0 + I1 + ... + In + V0 + V1 + ... + Vm = 0

kirchhoff's current law: n+1 > I0 + I1 + ... + In + V0 + V1 + ... + Vm = k
kirchhoff's current law: n+2 > I0 + I1 + ... + In + V0 + V1 + ... + Vm = k
...
kirchhoff's current law: n+m > I0 + I1 + ... + In + V0 + V1 + ... + Vm = k
*/
class ElectricMesh {
	constructor(branchesLen, nodesLen) {
		this.branchesLen = branchesLen
		this.sysEqs = new SystemEquations(branchesLen + nodesLen)
	}
	stampKirchhoffCurrentLaw(branchIndex, nodes) {
		if (nodes.a > 0) this.sysEqs.addWeight(this.branchesLen + nodes.a, branchIndex, -1)
		if (nodes.b > 0) this.sysEqs.addWeight(this.branchesLen + nodes.b, branchIndex, 1)
	}
	stampBranchEquation(branchIndex, intensityWeight, voltagesWeight, constant = 0) {
		this.sysEqs.clearEquation(branchIndex)

		this.sysEqs.setWeight(branchIndex, branchIndex, intensityWeight)

		for (const { index, weight } of voltagesWeight)
			this.sysEqs.setWeight(branchIndex, this.branchesLen + index, weight)

		this.sysEqs.setConstant(branchIndex, constant)
	}
	stampGND(nodeGND) {
		this.sysEqs.clearEquation(this.branchesLen)
		this.sysEqs.setWeight(this.branchesLen, this.branchesLen + nodeGND, 1)
	}
	solve() {
		const results = this.sysEqs.solve()
		this.results = {
			intensities: results.splice(0, this.branchesLen),
			voltages: results,
		}
	}
	readV(nodes) {
		if (!this.results) throw "> electric mesh has not been solved yet"
		return this.results.voltages[nodes.a] - this.results.voltages[nodes.b]
	}
	readI(branchIndex) {
		if (!this.results) throw "> electric mesh has not been solved yet"
		return this.results.intensities[branchIndex]
	}
	calcR(branchIndex, nodes) {
		if (!this.results) throw "> electric mesh has not been solved yet"
		return this.readV(nodes) / this.readI(branchIndex)
	}
}


// {
// 	const eEq = new ElectronicEquation()

// 	const source = eEq.newSource(0, 1, { V: 5 })
// 	const r1 = eEq.newResistor(1, 2, { I: 25e-3 })
// 	const r2 = eEq.newResistor(2, 0, { R: 100 })

// 	eEq.solve(0)

// 	mat.log(eEq.mesh.sysEqs.mat)
// 	eEq.logResults(["GND", "VCC"])

// 	r1.defineI(16.666667e-3)

// 	eEq.solve()
// 	eEq.logResults(["GND", "VCC"])
// }