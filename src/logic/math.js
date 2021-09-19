class Num {
	smoothStep(edge0, edge1, x) {
		const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
		return -2 * Math.pow(t, 3) + 3 * Math.pow(t, 2);
	}
	roundDecimals(n, precision=1e13) {
		return Math.round(n*precision)/precision
	}
	significantDigits(n, digits=4) {
		return this.roundDecimals(Number(n.toPrecision(digits)))
	}
	equal(a, b, precision=1e-10) {
		return Math.abs(a - b) < precision
	}
	prefix(n, precision=4) {
		if (n == undefined) return "udef"
		const unitList = ['y', 'z', 'a', 'f', 'p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
		const zeroIndex = 8
		const me = n.toExponential(precision-1).split(/e/)
		const exponent = +me[1]
		
		let unitIndex = 0
		if (exponent > 0) unitIndex = Math.floor(exponent / 3) + zeroIndex
		else unitIndex = Math.round(exponent / 3) + zeroIndex
		unitIndex = this.clamp(unitIndex, unitList)
		
		return this.roundDecimals(+me[0] * (10 ** (exponent - (unitIndex - zeroIndex) * 3))) + unitList[unitIndex]
	}
	clamp(n, min, max) {
		if (Array.isArray(min)) return Math.max(0, Math.min(min.length-1, n))
		if (max == undefined) return Math.min(min, n)
		return Math.max(min, Math.min(max, n))
	}
}

export const num = new Num()
window.num = num


export class SystemEquations {
	constructor(variablesLen) {
		this.mat = mat.new(variablesLen + 1, variablesLen)
		this.length = variablesLen
	}
	clearEquation(equationIndex) {
		this.mat[equationIndex].fill(0)
	}
	setWeight(equationIndex, variableIndex, weight) {
		this.mat[equationIndex][variableIndex] = weight
	}
	addWeight(equationIndex, variableIndex, weight) {
		this.mat[equationIndex][variableIndex] += weight
	}
	setConstant(equationIndex, constant) {
		this.mat[equationIndex][this.mat.length] = constant
	}
	solve() {
		return mat.solve(this.mat)
	}
}