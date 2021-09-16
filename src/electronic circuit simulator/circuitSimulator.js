import { ICCircuit } from "./circuit";

class CircuitSimulator {
	constructor() {
		
	}
	
	loadCircuit(components) {
		this.circuit = new ICCircuit(components)
	}
	
	step() {
		
	}
}