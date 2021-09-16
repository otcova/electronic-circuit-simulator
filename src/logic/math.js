class Num {
	smoothStep(edge0, edge1, x) {
		const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
		return -2 * Math.pow(t, 3) + 3 * Math.pow(t, 2);
	}
	roundDecimals(n, precision=1e15) {
		return Math.round(n*precision)/precision
	}
	significantDigits(n, digits=4) {
		return this.roundDecimals(Number(n.toPrecision(digits)))
	}
	equal(a, b, precision=1e-10) {
		return Math.abs(a - b) < precision
	}
	prefix(n, precision=4) {
		if (n == undefined) return
		const unitList = ['y', 'z', 'a', 'f', 'p', 'n', 'u', 'm', '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y']
		const zeroIndex = 8
		const me = n.toExponential().split(/e/)
		let u = this.clamp(Math.floor(+me[1] / 3) + zeroIndex, 0, unitList.length - 1)
		return this.significantDigits(+me[0],precision) * Math.pow(10, +me[1] - (u - zeroIndex) * 3) + unitList[u]
	}
	clamp(n, min, max) {
		return Math.max(min, Math.min(max, n))
	}
}

export const num = new Num()
window.num = num