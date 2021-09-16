import { GLMesh } from "./WebGL"

export class CircleArray {
	constructor(canvas, color) {
		this.canvas = canvas
		this.mesh = new GLMesh(canvas, canvas.gl.TRIANGLES)
		this.mesh.color = color
		canvas.addMesh(this.mesh)
		this.verts = []
	}
	push(pos, radius) {
		if (radius) {
			const edgeSize = radius / 3
			const angleInc = Math.max(0.01, Math.asin(edgeSize / (2 * radius)))
			for (let a = 0; a < Math.PI * 2 - angleInc * .5; a += angleInc) {
				this.verts.push(pos)
				this.verts.push(vec2.polar(a, radius, pos))
				this.verts.push(vec2.polar(a + angleInc, radius, pos))
			}
		}
	}
	update() {
		this.mesh.updateVertices(this.verts)
		this.verts = []
	}
}

export class Circle {
	constructor(canvas, config) {
		this.gl = canvas.gl
		this.mesh = new GLMesh(canvas, canvas.gl.TRIANGLE_FAN)
		canvas.addMesh(this.mesh)

		this.setConfig(config, {
			radius: 100,
			color: [.2, .5, .9, 1]
		})
	}
	update(pos, config) {
		this.setConfig(config)
		const verts = []
		if (this.radius > 0) {
			const edgeSize = this.radius / 2
			const angleInc = Math.min(0.01, Math.max(0.01, Math.asin(edgeSize / (2 * this.radius))))
			for (let a = 0; a < Math.PI * 2 - angleInc * .5; a += angleInc) {
				verts.push(vec2.polar(a, this.radius, pos))
			}
		}
		this.mesh.updateVertices(verts)
	}

	setConfig(config, defaultConfig = {}) {
		if (config) {
			if (config.radius) this.radius = config.radius
			else if (defaultConfig.radius) this.radius = defaultConfig.radius
			if (config.color) this.mesh.color = config.color
			else if (defaultConfig.color) this.mesh.color = defaultConfig.color
		}
	}
}

export class PointArray {
	constructor(canvas, color) {
		this.mesh = new GLMesh(canvas, canvas.gl.POINTS, false)
		if (color) canvas.addMesh(this)
		this.mesh.color = color || [0.1, 0.6, 0.8, 1]
		this.meshPointsVerts = []
		this.updateVerts = true
	}
	draw() {
		if (this.updateVerts) {
			this.mesh.updateVertices(this.meshPointsVerts)
			this.updateVerts = false
		}
		this.mesh.draw()
	}
	push(...positions) {
		this.meshPointsVerts.push(...positions)
		this.updateVerts = true
	}
	reset() {
		this.meshPointsVerts = []
		this.updateVerts = true
	}
}

export class LineArray {
	constructor(canvas, color) {
		this.mesh = new GLMesh(canvas, canvas.gl.LINES, false)
		if (color) canvas.addMesh(this)
		this.mesh.color = color || [1, 0.3, 0.0, 1]
		this.meshPointsVerts = []
		this.needUpdate = false
	}
	draw() {
		if (this.needUpdate) {
			this.mesh.updateVertices(this.meshPointsVerts)
			this.needUpdate = false
		}
		this.mesh.draw()
	}
	push(...positions) {
		if (positions.length < 2) return
		if (positions.length == 2) {
			this.meshPointsVerts.push(positions[0], positions[1])
		} else {
			const vertices = []
			vertices.push(positions[0])
			for (let i = 1; i < positions.length - 1; ++i)
				vertices.push(positions[i], positions[i])
			vertices.push(positions[positions.length - 1])
			this.meshPointsVerts.push(...vertices)
		}
		this.needUpdate = true
	}
	reset() {
		this.meshPointsVerts = []
		this.needUpdate = true
	}
}

export class QuadArray {
	constructor(canvas, color) {
		this.mesh = new GLMesh(canvas, canvas.gl.TRIANGLES, false)
		if (color) canvas.addMesh(this)
		this.mesh.color = color || [1, 0.3, 0.1, 1]
		this.meshPointsVerts = []
		this.needUpdate = false
	}
	draw() {
		if (this.needUpdate) {
			this.mesh.updateVertices(new Float32Array(this.meshPointsVerts), false)
			this.needUpdate = false
		}
		this.mesh.draw()
	}
	quad(a, b) {
		this.meshPointsVerts.push(
			a[0], a[1], // left   - top
			a[0], b[1], // left   - bottom
			b[0], b[1], // right  - bottom
			a[0], a[1], // left   - top
			b[0], a[1], // right  - top
			b[0], b[1]  // right  - bottom
		)
		this.needUpdate = true
	}
	reset() {
		this.meshPointsVerts = []
		this.needUpdate = true
	}
}