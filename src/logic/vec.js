import { num } from "./math"
import { Stopwatch } from "./Stopwatch"

class Vec {

	// create

	new(len, fill = 0) {
		if (typeof fill == "function") return (new Array(len)).fill(0).map((e, i) => fill(i))
		return (new Array(len)).fill(fill)
	}
	random(dimensions, min = 0, max = 1) {
		const getMax = i => Array.isArray(max) ? max[i] : max
		const getMin = i => Array.isArray(min) ? min[i] : min
		return new Array(dimensions).fill(0).map((e, i) => getMin(i) + Math.random() * (getMax(i) - getMin(i)))
	}
	range(start, end, step = 1) {
		if (end < start) step = -Math.abs(step)
		else step = Math.abs(step)
		return Array.from({ length: Math.abs(Math.floor((end - start) / step) + 1) }, (x, i) => {
			return start + i * step
		})
	}

	// single vec

	sqLen(v) {
		return v.reduce((a, b) => a + b * b, 0)
	}
	len(v) {
		return Math.sqrt(this.sqLen(v))
	}
	norm(v) {
		// if (v.reduce((a,b)=>Math.abs(a)+Math.abs(b)) == 0) console.error(`vec.norm(${v})`)
		const len = this.len(v)
		return v.map(e => e / len)
	}
	rotate180(v) {
		return v.map(e => -e)
	}
	toColor(v) {
		if (typeof v == "string") return v
		if (v.length == 1) return "#" + Math.round(255 * v[0]).toString(16).repeat(3)
		if (v.length == 3) return "#" + Math.round(255 * v[0]).toString(16) + Math.round(255 * v[1]).toString(16) + Math.round(255 * v[2]).toString(16)
		if (v.length == 4) return "#" + Math.round(255 * v[0]).toString(16) + Math.round(255 * v[1]).toString(16) + Math.round(255 * v[2]).toString(16) + Math.round(255 * v[3]).toString(16)
		throw "invalid vector length"
	}
	// 2 vec

	add(v, u) {
		const a = new Array(v.length)
		for (let i = 0; i < v.length; ++i) a[i] = v[i] + u[i]
		return a
	}
	sub(v, u) {
		if (typeof u == "number") return v.map(e => e - u)
		const a = new Array(v.length)
		for (let i = 0; i < v.length; ++i) a[i] = v[i] - u[i]
		return a
	}
	mult(v, u) {
		return v.map((e, i) => e * u[i])
	}
	dot(v, u) {
		return v.reduce((a, b, i) => a + b * u[i], 0)
	}
	cosAngleBetween(v, u) {
		return this.dot(v, u) / (this.len(v) * this.len(u))
	}
	angleBetween(v, u) {
		return Math.acos(this.cosAngleBetween(v, u))
	}
	median(a, b, ratio = 0.5) {
		return a.map((n, i) => (n * (1 - ratio) + b[i] * ratio))
	}

	// vec and const

	scale(v, c) {
		const a = new Array(v.length)
		for (let i = 0; i < v.length; ++i)
			a[i] = v[i] * c
		return a
	}

	// 2 dots


	sqDist(a, b) {
		return this.sqLen(this.sub(a, b))
	}
	dist(a, b) {
		return Math.sqrt(this.sqDist(a, b))
	}

	// 3 dots

	cosAngleBetweenPoints(a, b, c) {
		return this.cosAngleBetween(this.sub(a, b), this.sub(c, b))
	}
	angleBetweenPoints(a, b, c) {
		return this.angleBetween(this.sub(a, b), this.sub(c, b))
	}
}

export const vec = new Vec()
window.vec = vec

class Vec2 {
	//create
	polar(angle, radius = 1, center = [0, 0]) {
		return [
			center[0] + radius * Math.cos(angle),
			center[1] + radius * Math.sin(angle)
		]
	}

	// v
	rotate90(v) {
		return [-v[1], v[0]]
	}
	rotate180(v) {
		return [-v[0], -v[1]]
	}
	sqLen(v) {
		return v[0] * v[0] + v[1] * v[1]
	}
	len(v) {
		return Math.sqrt(this.sqLen(v))
	}
	norm(v) {
		const len = this.len(v)
		return [v[0] / len, v[1] / len]
	}
	floor(v) {
		return [Math.floor(v[0]), Math.floor(v[1])]
	}
	round(v) {
		return [Math.round(v[0]), Math.round(v[1])]
	}
	ceil(v) {
		return [Math.ceil(v[0]), Math.ceil(v[1])]
	}

	angle(v, center = [0, 0]) {
		return Math.atan2(v[1] - center[1], v[0] - center[0])
	}

	// v u

	add(v, u) {
		return [v[0] + u[0], v[1] + u[1]]
	}
	sub(v, u) {
		return [v[0] - u[0], v[1] - u[1]]
	}
	mult(v, u) {
		return [v[0] * u[0], v[1] * u[1]]
	}
	cross(v, u) {
		return v[0] * u[1] - v[1] * u[0] // z component of cross product
	}
	bisector(v, u) {
		const cross = this.cross(v, u)
		if (Math.abs(cross) < 0.0000001) return this.norm(this.rotate90(v))
		const bisector = this.norm(this.add(this.scale(v, this.len(u)), this.scale(u, this.len(v))))
		return cross > 0 ? bisector : this.scale(bisector, -1)
	}
	tangent(v, u) {
		return this.rotate90(this.bisector(v, u))
	}
	dot(v, u) {
		return v[0] * u[0] + v[1] * u[1]
	}
	cosAngleBetween(v, u) {
		return this.dot(v, u) / Math.sqrt(this.sqLen(v) * this.sqLen(u))
	}
	angleBetween(v, u) {
		return Math.acos(this.cosAngleBetween(v, u))
	}
	// a b
	equal(a, b, precision) {
		return num.equal(a[0], b[0], precision) && num.equal(a[1], b[1], precision)
	}
	lerp(a, b, ratio = 0.5) {
		const invRatio = 1 - ratio
		return [
			a[0] * invRatio + b[0] * ratio,
			a[1] * invRatio + b[1] * ratio,
		]
	}
	sqDist(a, b) {
		const vx = a[0] - b[0]
		const vy = a[1] - b[1]
		return vx * vx + vy * vy
	}
	dist(a, b) {
		return Math.sqrt(this.sqDist(a, b))
	}
	// a b c

	bisectorPoints(a, b, c) {
		return this.bisector(this.sub(a, b), this.sub(c, b))
	}
	tangentPoints(a, b, c) {
		return this.tangent(this.sub(a, b), this.sub(c, b))
	}
	cosAngleBetweenPoints(a, b, c) {
		return this.cosAngleBetween(this.sub(a, b), this.sub(c, b))
	}
	angleBetweenPoints(a, b, c) {
		return this.angleBetween(this.sub(a, b), this.sub(c, b))
	}

	// v c
	scale(v, c) {
		if (typeof c == "number") return [v[0] * c, v[1] * c]
		return this.mult(v, c)
	}
}

export const vec2 = new Vec2()
window.vec2 = vec2

class Matrix {

	new(c, r, defaultValue = 0) {
		return (new Array(r)).fill(0).map(() => (new Array(c)).fill(defaultValue))
	}
	copy(mat) {
		if (mat == undefined) throw "mat.copy(undefined)"
		const newMat = new Array(mat.length)
		for (let i = 0; i < mat.length; ++i)
			newMat[i] = [...mat[i]]
		return newMat
	}

	log(mat) {
		if (typeof mat == "number") return console.log("[" + mat + "]")
		let txt = ""
		for (const row of mat) {
			txt += "|"
			if (row.length) {
				for (let i = 0; i < row.length; ++i) {
					const n = num.prefix(row[i])
					txt += " ".repeat(Math.max(1, 6 - n.length)) + n
				}
			} else {
				const n = num.prefix(row)
				txt += " ".repeat(Math.max(1, 6 - n.length)) + n
			}
			txt += " |\n"
		}
		console.log(txt.substr(0, txt.length - 1))
	}

	solve(mat) {
		if (mat == undefined) throw Error("> mat.solve(undefined)")
		mat = this.copy(mat)
		const n = mat.length
		const mergeZero = (x, y) => {
			if (mat[y][x] != 0) {
				if (num.equal(mat[x][x], 0)) {
					let yy = 0
					for (; yy < n; ++yy)
						if (!num.equal(mat[yy][x], 0)) break;
					if (yy == n) return;
					mat[x] = vec.add(mat[x], mat[yy])
				}
				mat[y] = vec.sub(mat[y], vec.scale(mat[x], mat[y][x] / mat[x][x]))
			}
		}
		for (let i = 0; i < 2; ++i) {
			for (let x = 0; x < n - 1; ++x) {
				for (let y = n - 1; y > x; --y)
					mergeZero(x, y)
			}
			for (let x = n - 1; x > 0; --x) {
				for (let y = 0; y < x; ++y)
					mergeZero(x, y)
			}
		}

		// for (let y = 0; y < n; ++y)
		// 	mat[y] = vec.scale(mat[y], 1 / mat[y][y])
		return vec.new(n, y => mat[y][n] / mat[y][y])
	}

	dot(matA, matB) {
		if (matA[0].length != matB.length) throw "invalid mat dimensions"
		const result = this.new(matB[0].length, matA.length)
		for (let y = 0; y < matA.length; ++y) {
			for (let x = 0; x < matB[0].length; ++x) {
				let sum = 0
				for (let i = 0; i < matA.length; ++i)
					sum += matA[y][i] * matB[i][x]
				result[y][x] = sum
			}
		}
		return result
	}

	// mat
	solveInv(weights, constants) {
		return this.dot(this.inverse(weights), constants)
	}
	
	inverse(mat) {
		const determinant = this.determinant(mat)
		if (determinant == 0)
			throw Error("Determinant can't be  zero.")

		const adjugate = this.adjugate(mat)
		return this.scale(adjugate, 1 / determinant)
	}
	determinant(mat) {
		if (mat.length == 2)
			return mat[0][0]*mat[1][1] - mat[0][1]*mat[1][0]
		let d = 0
		for (let x = 0; x < mat[0].length; ++x) {
			if (x%2 == 0) d += mat[0][x] * this.minor(mat, x, 0)
			else d -= mat[0][x] * this.minor(mat, x, 0)
		}
		return d
	}
	adjugate(mat) {
		return this.transpose(this.map(mat, (_,x,y) => this.cofactor(mat, x, y)))
	}
	scale(mat, scalar) {
		return this.map(mat, e => e * scalar)
	}
	minor(mat, c, r) {
		const newMat = this.new(mat[0].length - 1, mat.length - 1)
		for (let y = 0; y < mat.length - 1; ++y) {
			for (let x = 0; x < mat[y].length - 1; ++x) {
				newMat[y][x] = mat[y < r ? y : y + 1][x < c ? x : x + 1]
			}
		}
		return this.determinant(newMat)
	}
	cofactor(mat, c, r) {
		const sign = Math.pow(-1, c + r)
		const minor = this.minor(mat, c, r)
		return sign * minor
	}
	transpose(mat) {
		const newMat = this.new(mat.length, mat[0].length)
		for (let y = 0; y < mat.length; ++y) {
			for (let x = 0; x < mat[y].length; ++x) {
				newMat[x][y] = mat[y][x]
			}
		}
		return newMat
	}
	deleteColumn(mat, c) {
		const newMat = this.new(mat[0].length-1, mat.length)
		for (let y = 0; y < mat.length; ++y) {
			for (let x = 0; x < mat[y].length-1; ++x) {
				newMat[y][x] = mat[y][x < c ? x : x + 1]
			}
		}
		return newMat
	}
	getColumn(mat, c) {
		const newMat = this.new(1, mat.length)
		for (let y = 0; y < mat.length; ++y) {
			newMat[y][0] = mat[y][c]
		}
		return newMat
	}
	// Utils
	map(mat, callback) {
		const newMat = this.new(mat[0].length, mat.length)
		for (let y = 0; y < mat.length; ++y) {
			for (let x = 0; x < mat[y].length; ++x) {
				newMat[y][x] = callback(mat[y][x], x, y)
			}
		}
		return newMat
	}
}

export const mat = new Matrix()
window.mat = mat