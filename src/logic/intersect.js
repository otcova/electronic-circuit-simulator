import { vec2 } from "./vec"

const marginError = 0.00000001

function scalarLineLine(pA, vecA, pB, vecB) {
	// iPoint = pA + vecA * t
	// this returns t
	return (vecB[0] * (pA[1] - pB[1]) - vecB[1] * (pA[0] - pB[0])) / (vecB[1] * vecA[0] - vecB[0] * vecA[1])
}

class Intersect {
	lineLine(a, vecA, b, vecB) {
		// iPoint = pA + vecA * t
		return vec2.add(a, vec2.scale(vecA, scalarLineLine(a, vecA, b, vecB)))
	}
	raySegment(a, vec, s0, s1) {
		const vecS = vec2.sub(s1, s0)
		const at = scalarLineLine(a, vec, s0, vecS)
		const st = scalarLineLine(s0, vecS, a, vec)
		if (st > -marginError && st < 1 + marginError && at > +marginError)
			return vec2.add(s0, vec2.scale(vecS, st)) // iPoint = pA + vecA * t
	}

	array(fnName, a0, a1, array) {
		const intersectFn = this[fnName].bind(this)
		if (!intersectFn) throw "unknown fn: intersect." + fnName
		const points = []
		for (let i = 0; i < array.length - 1; i += 2) {
			const p = intersectFn(a0, a1, array[i], array[i + 1])
			if (p) {
				let index = 0
				const sqDist = vec2.sqDist(a0, p)
				for (const b of points) {
					if (sqDist <= vec2.sqDist(a0, b)) break
					++index
				}
				points.splice(index, 0, p)
			}
		}
		return points
	}
}
export const intersect = new Intersect()

class Reflect {
	raySegment(a, vecA, s0, s1) {
		const point = intersect.raySegment(a, vecA, s0, s1)
		if (point) return { point, vec: this.#reflectVec(vecA, vec2.sub(s0, s1)) }
	}
	array(fnName, a0, a1, array) {
		const intersectFn = this[fnName].bind(this)
		if (!intersectFn) throw "unknown fn: intersect." + fnName
		const points = []
		for (let i = 0; i < array.length - 1; i += 2) {
			const p = intersectFn(a0, a1, array[i], array[i + 1])
			if (p) {
				let index = 0
				const sqDist = vec2.sqDist(a0, p.point)
				for (const b of points) {
					if (sqDist <= vec2.sqDist(a0, b.point)) break
					++index
				}
				points.splice(index, 0, p)
			}
		}
		return points
	}
	#reflectVec(d, plane) {
		const n = vec2.rotate90(vec2.norm(plane))
		return vec2.sub(d, vec2.scale(n, vec2.dot(d, n) * 2))
	}
}


export const reflect = new Reflect()

// export const IntersectArray = new IntersectArray()


// class Intersect {
// 	lineLine(a, vecA, b, vecB) {
// 		// iPoint = pA + vecA * t
// 		return vec2.add(a, vec2.scale(vecA, this.scalarLineLine(a, vecA, b, vecB)))
// 	}
// 	segmentSegment(a0, a1, b0, b1, {exclude=false}) {
// 		const vecA = vec2.sub(a1, a0)
// 		const vecB = vec2.sub(b1, b0)
// 		const at = this.scalarLineLine(a0, vecA, b0, vecB)
// 		const st = this.scalarLineLine(b0, vecB, a0, vecA)
// 		if (!exclude && st > -marginError && st < 1+marginError && at > -marginError && at < 1+marginError ||
// 			exclude && st > marginError && st < 1-marginError && at > +marginError && at < 1-marginError)
// 			return vec2.add(b0, vec2.scale(vecB, st))
// 	}

// 	raySegment(a, vec, s0, s1, {exclude=false}) {
// 		const vecS = vec2.sub(s1, s0)
// 		const at = this.scalarLineLine(a, vec, s0, vecS)
// 		const st = this.scalarLineLine(s0, vecS, a, vec)
// 		if (!exclude && st > -marginError && st < 1+marginError && at > -marginError ||
// 			exclude && st > marginError && st < 1-marginError && at > +marginError)
// 			return vec2.add(s0, vec2.scale(vecS, st)) // iPoint = pA + vecA * t
// 	}
// 	lineSegment(a, vec, s0, s1) {
// 		const vecS = vec2.sub(s1, s0)
// 		const t = this.scalarLineLine(s0, vecS, a, vec)
// 		if (t >= 0 && t <= 1)
// 			return vec2.add(s0, vec2.scale(vecS, t)) // iPoint = pA + vecA * t
// 	}
// 	lineSegmentArray(a, vec, segmentArray) {
// 		const points = []
// 		for (const segment of segmentArray) {
// 			const p = this.lineSegment(a, vec, segment[0], segment[1])
// 			if (p) points.push(p)
// 		}
// 		return points
// 	}
// 	raySegmentArray(a, vec, segmentArray, {sort=true,exclude=false}={}) {
// 		const points = []
// 		for (const segment of segmentArray) {
// 			const p = this.raySegment(a, vec, segment[0], segment[1], {exclude})
// 			if (p) {
// 				if (sort) {
// 					let index = 0
// 					const sqDist = vec2.sqDist(a, p)
// 					for (const b of points) {
// 						if (sqDist <= vec2.sqDist(a, b)) break
// 						++index
// 					}
// 					points.splice(index, 0, p)
// 				} else points.push(p)
// 			}
// 		}
// 		return points
// 	}
// 	segmentSegmentArray(a0, a1, segmentArray, {exclude=false}={}) {
// 		const points = []
// 		for (const segment of segmentArray) {
// 			const p = this.segmentSegment(a0, a1, segment[0], segment[1], {exclude})
// 			if (p) points.push(p)
// 		}
// 		return points
// 	}

// 	scalarLineLine(pA, vecA, pB, vecB) {
// 		// iPoint = pA + vecA * t
// 		// this returns t
// 		return (vecB[0] * (pA[1] - pB[1]) - vecB[1] * (pA[0] - pB[0])) / (vecB[1] * vecA[0] - vecB[0] * vecA[1])
// 	}
// }

// export const intersect = new Intersect()