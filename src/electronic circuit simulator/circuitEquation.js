import { num } from "../logic/math"
import { mat } from "../logic/vec"



export class CircuitEquation {

	constructor() {
		this.nodesLen = 0
		this.components = []
		this.result = { voltages: [], intensities: [] }
	}
	reserveNodes(...nodeId) {
		this.nodesLen = Math.max(this.nodesLen - 1, ...nodeId) + 1
	}
	newNode() {
		return this.nodesLen++
	}

	defineSourceByV(nodeA, nodeB, V) {
		const compIndex = this.components.length
		const comp = {
			readV: () => V,
			readI: () => this.result.intensities[compIndex],
			readR: () => 0,
			init: () => {
				comp.modifyV(V)
				this.#stampNodeEq(nodeA, compIndex, -1)
				this.#stampNodeEq(nodeB, compIndex, 1)
			},
			modifyV: (newV) => {
				V = newV
				this.equations[compIndex][this.components.length + nodeA] = -1
				this.equations[compIndex][this.components.length + nodeB] = 1
				this.equations[compIndex][this.equations.length] = V
			}
		}
		this.#pushComp(comp, nodeA, nodeB)
		return comp
	}
	defineResistorByR(nodeA, nodeB, R) {
		const compIndex = this.components.length
		const comp = {
			readV: () => this.result.voltages[nodeA] - this.result.voltages[nodeB],
			readI: () => this.result.intensities[compIndex],
			readR: () => R,
			init: () => {
				comp.modifyR(R)
				this.#stampNodeEq(nodeA, compIndex, -1)
				this.#stampNodeEq(nodeB, compIndex, 1)
			},
			modifyR: (newR) => {
				R = newR
				this.equations[compIndex][this.components.length + nodeA] = -1
				this.equations[compIndex][this.components.length + nodeB] = 1
				this.equations[compIndex][compIndex] = R
			},
		}
		this.#pushComp(comp, nodeA, nodeB)
		return comp
	}
	pushResistorByI(nodeA, nodeB, I) {
		this.#pushComp({ nodeA, nodeB, I, type: "resistor" })
	}
	pushResistorByV(nodeA, nodeB, V) {
		this.#pushComp({ nodeA, nodeB, V, type: "resistor" })
	}
	#pushComp(comp, nodeA, nodeB) {
		this.reserveNodes(nodeA)
		this.reserveNodes(nodeB)
		this.components.push(comp)
	}
	#stampGND(nodeGND = 0) {
		this.equations[this.components.length][this.components.length + nodeGND] = 1
		this.equations[this.components.length][this.components.length + this.nodesLen] = 0
	}
	#stampNodeEq(nodeIndex, compIndex, value) {
		const i = this.components.length + 1 + nodeIndex
		if (i < this.equations.length)
			this.equations[i][compIndex] = value
	}
	solveEquations() {
		if (!this.equations) this.#createEquations()

		const result = mat.solve(this.equations)

		this.result.intensities = result.splice(0, this.components.length)
		this.result.voltages = result
	}
	/* 
		Comp0Eq
		Comp1Eq
		Comp2Eq
		...
		GND
		Node0
		Node1
		Node2
		...
	*/
	#createEquations() {
		const matrixLen = this.components.length + this.nodesLen
		this.equations = mat.new(matrixLen + 1, matrixLen)
		this.nodes = new Array(this.nodesLen).fill(0)

		// Component Equation
		for (const comp of this.components)
			comp.init()
		// GND
		this.#stampGND()
	}

	logResults() {
		const eqData = new Array(this.components.length)
		for (let i = 0; i < this.components.length; ++i) {
			const comp = this.components[i]
			eqData[i] = { V: num.prefix(comp.readV()), I: num.prefix(comp.readI()), R: num.prefix(comp.readR()) }
		}
		console.table(eqData)
	}
}

const cEq = new CircuitEquation()

{
	const s0 = cEq.defineSourceByV(0, 1, 5)
	const r1 = cEq.defineResistorByR(1, 2, 100)
	const r2 = cEq.defineResistorByR(2, 0, 100)

	cEq.solveEquations()
	cEq.logResults()
	
	r1.modifyR(200)
	
	cEq.solveEquations()
	cEq.logResults()
}