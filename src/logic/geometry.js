import { vec2 } from "./vec"

export function widthLine(dots, width) {
	if (dots.length < 2) return []
	const meshVerts = new Array(dots.length * 2)
	for (let i = 0; i < dots.length; ++i) {

		const d = dots[i]
		const past = i == 0 ? vec2.sub(vec2.scale(d, 2), dots[i + 1]) : dots[i - 1]
		const next = i == dots.length - 1 ? vec2.sub(vec2.scale(d, 2), dots[i - 1]) : dots[i + 1]

		const bisector = vec2.bisectorPoints(past, d, next)
		
		if (Number.isNaN(bisector[0])) {
			window.d = d
			window.past = past
			window.next = next
			console.log("NANA", d, past, next, vec2.bisectorPoints(past, d, next))
		}
		const dot_up = vec2.add(d, vec2.scale(bisector, width))
		const dot_down = vec2.add(d, vec2.scale(bisector, -width))
		
		
		meshVerts[i * 2] = dot_up
		meshVerts[i * 2 + 1] = dot_down
	}
	
	return meshVerts
}


export function subdivide(dots, subdivisionsSize = 10, smoothRatio = 1) {
	const vertices = removeRepeatedPoints(dots)
	if (vertices.length < 2) return vertices

	const curve = []
	smoothRatio *= 0.5
	const sqSubdivisionsSize = subdivisionsSize * subdivisionsSize

	const getTan = (i) => {
		const v = vertices[i]
		if (i == 0) return vec2.norm(vec2.sub(vertices[i + 1], v))
		else if (i == vertices.length - 1) return vec2.norm(vec2.sub(vertices[i - 1], v))
		else return vec2.tangentPoints(vertices[i + 1], v, vertices[i - 1])
	}

	for (let i = 0; i < vertices.length - 1; ++i) {

		const a = vertices[i]
		const b = vertices[i + 1]

		const sqLength = vec2.sqDist(a, b)

		if (sqLength <= sqSubdivisionsSize) {
			curve.push(a)
			continue
		}

		let tgA = getTan(i)
		let tgB = getTan(i + 1)

		if (vec2.sqDist(b, vec2.add(a, tgA)) > vec2.sqDist(b, vec2.sub(a, tgA))) tgA = vec2.scale(tgA, -1)
		if (vec2.sqDist(a, vec2.add(b, tgB)) > vec2.sqDist(a, vec2.sub(b, tgB))) tgB = vec2.scale(tgB, -1)

		const length = Math.sqrt(sqLength)
		const cosTgA = vec2.cosAngleBetween(vec2.sub(b, a), tgA)
		const cosTgB = vec2.cosAngleBetween(vec2.sub(a, b), tgB)

		const tgALen = smoothRatio * length * (cosTgA*cosTgA * .8 + .2)
		const tgBLen = smoothRatio * length * (cosTgB*cosTgB * .8 + .2)

		tgA = vec2.add(vec2.scale(tgA, Math.max(0, tgALen)), a)
		tgB = vec2.add(vec2.scale(tgB, Math.max(0, tgBLen)), b)

		let optimizedSubdivision = 1/10
		if (Math.min(cosTgA, cosTgB) < 0.9) optimizedSubdivision = 1

		const subdivisions = Math.max(1, Math.ceil(optimizedSubdivision * length / subdivisionsSize))
		curve.push(...cubicBezierCurve(a, tgA, tgB, b, subdivisions))
	}
	curve.push(vertices[vertices.length - 1])
	return curve
}

export function removeRepeatedPoints(vertices, epsilon = 0.000001) {
	const result = []
	for (let i = 0; i < vertices.length - 1; ++i) {
		if (!vec2.equal(vertices[i], vertices[i + 1], epsilon))
			result.push(vertices[i])
	}
	result.push(vertices[vertices.length - 1])
	return result
}

export function bezierCurve(vertices, t) {
	if (vertices.length == 1) return vertices[0]
	const subVertices = new Array(vertices.length - 1)
	for (let i = 0; i < vertices.length - 1; ++i)
		subVertices[i] = vec2.lerp(vertices[i], vertices[i + 1], t)
	return bezierCurve(subVertices, t)
}

export function fastBezierCurve(vertices, subdivisions) {
	const result = new Array(subdivisions)

	for (let i = 0; i < subdivisions; ++i) {
		const t = i / subdivisions
		
		result[i] = bezierCurve(vertices, t)
	}
	return result
}

export function cubicBezierCurve(p0, p1, p2, p3, subdivisions) {

	const result = new Array(subdivisions)

	for (let i = 0; i < subdivisions; ++i) {
		const t = i / subdivisions

		const q0 = vec2.lerp(p0, p1, t)
		const q1 = vec2.lerp(p1, p2, t)
		const q2 = vec2.lerp(p2, p3, t)

		const n0 = vec2.lerp(q0, q1, t)
		const n1 = vec2.lerp(q1, q2, t)

		result[i] = vec2.lerp(n0, n1, t)
	}
	return result
}