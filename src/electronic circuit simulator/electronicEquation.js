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

export class ElectronicEquation {

	constructor() {
		this.nodesLen = 0
		this.components = []
	}
	#reserveNodes(...nodeId) {
		this.nodesLen = Math.max(this.nodesLen - 1, ...nodeId) + 1
	}
	newNode() {
		return this.nodesLen++
	}

	newSource(nodeA, nodeB, { V }, name) {
		const source = new Source(-1, { a: nodeA, b: nodeB }, { V }, name)
		this.pushComponent(source)
		return source
	}
	newResistor(nodeA, nodeB, { R, I }, name) {
		const resistor = new Resistor(-1, { a: nodeA, b: nodeB }, { R, I }, name)
		this.pushComponent(resistor)
		return resistor
	}
	pushComponent(component) {
		component.index = this.components.length
		this.#reserveNodes(component.nodes.a, component.nodes.b)
		this.components.push(component)
	}

	solve(nodeGND) {
		if (!this.mesh) this.createMesh(nodeGND)
		this.mesh.solve()
	}

	createMesh(nodeGND) {
		if (this.mesh) throw Error("> mesh already created")
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
Divides a big electronic Meshes by mainSource
*/
export class BigElectronicEquation {
	constructor() {
		this.components = new Map()
		this.componentsCount = 0
		this.eEqs = []
	}
	setMainSource(gndNode, vccNode, { V }, name = "Main Source") {
		this.vccNode = vccNode
		this.gndNode = gndNode
		this.mainSource = { V, name }
	}
	newSource(nodeA, nodeB, { V }, name) {
		return this.#pushComponent(new Source(-1, { a: nodeA, b: nodeB }, { V }, name))
	}
	newResistor(nodeA, nodeB, { R, I }, name) {
		return this.#pushComponent(new Resistor(-1, { a: nodeA, b: nodeB }, { R, I }, name))
	}
	#pushComponent(comp) {
		const listA = this.components.get(comp.nodes.a)
		if (!listA) this.components.set(comp.nodes.a, [comp])
		else listA.push(comp)
		if (comp.nodes.a != comp.nodes.b) {
			const listB = this.components.get(comp.nodes.b)
			if (!listB) this.components.set(comp.nodes.b, [comp])
			else listB.push(comp)
		}
		this.componentsCount++
		return comp
	}
	createMesh() {
		if (!this.mainSource) throw Error("Main source is not defined yet")
		let i = 0
		for (const comp of this.components.get(this.gndNode)) {
			if (!this.#compHasMeshAssigned(comp)) {
				const eEq = new ElectronicEquation()
				eEq.i = i++
				eEq.nodesMap = new Map([[this.gndNode, 0], [this.vccNode, 1]])
				eEq.newSource(0, 1, { V: this.mainSource.V }, this.mainSource.name)
				
				this.#pushCompToEEq(eEq, comp)
				
				this.eEqs.push(eEq)
			}
		}
	}
	#getMesh(eEq, node) {
		if (node == this.vccNode || node == this.gndNode) return
		if (eEq.nodesLen > 50) console.log(node, this.nets[node])
		for (const comp of this.components.get(node) || []) {
			if (!this.#compHasMeshAssigned(comp))
				this.#pushCompToEEq(eEq, comp, node)
		}
	}
	#pushCompToEEq(eEq, comp, node=-1) {
		comp.index = 0
		if (node != comp.nodes.a) this.#getMesh(eEq, comp.nodes.a)
		if (node != comp.nodes.b) this.#getMesh(eEq, comp.nodes.b)
		comp.nodes.a = this.#getLocalNode(eEq, comp.nodes.a)
		comp.nodes.b = this.#getLocalNode(eEq, comp.nodes.b)
		eEq.pushComponent(comp)
	}
	#getLocalNode(eEq, globalNode) {
		const localNode = eEq.nodesMap.get(globalNode)
		if (localNode == undefined) eEq.nodesMap.set(globalNode, eEq.newNode())
		return eEq.nodesMap.get(globalNode)
	}
	#compHasMeshAssigned(comp) {
		return comp.index != -1
	}

	solve() {
		if (!this.eEqs.length) this.createMesh()
		for (const eEq of this.eEqs) {
			// if (eEq.nodesLen > 100)
			// console.log(eEq, Array.from(eEq.nodesMap.keys()).map(e => this.nets[e]))
			eEq.solve(0)
		}
	}

	logResults(nodesName) {
		let table = []
		for (let node = 0; node < nodesName.length; ++node) {
			table.push({ index: node, node: nodesName[node], ...this.readNode(node) })
		}
		console.table(table)
	}

	readNode(node) {
		const comps = this.components.get(node)
		if (node == this.gndNode) return { bit: 0, voltage: num.prefix(0) }
		else if (node == this.vccNode) return { bit: icRanges.toDigital(this.mainSource.V), voltage: num.prefix(this.mainSource.V) }
		else if (comps && this.#compHasMeshAssigned(comps[0])) {
			const V = comps[0].mesh.readV({ a: comps[0].nodes.a, b: 0 })
			return { bit: icRanges.toDigital(V), voltage: num.prefix(V) }
		} else {
			if (!node) throw Error("> eEq.readNode(undef)")
			console.warn("> Unset component (", comps, ") on node: '", node, "'")
		}
	}
}