import React from "react";
import { Stopwatch } from "../logic/Stopwatch";
import defFragShaderSrc from "./shaders/fragment.fs"
import defVertShaderSrc from "./shaders/vertex.vs"
import { LineArray, PointArray } from "./simpleShapes";

class Shader {
	constructor(gl, vertexShaderSource, fragmentShaderSource) {
		this.gl = gl
		const vertShader = this.#createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
		const fragShader = this.#createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
		this.program = this.#createProgram(vertShader, fragShader)
		this.resolutionUniformLocation = this.gl.getUniformLocation(this.program, "u_resolution");
	}
	#createShader(type, source) {
		var shader = this.gl.createShader(type);
		this.gl.shaderSource(shader, source);
		this.gl.compileShader(shader);
		var success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
		if (success) {
			return shader;
		}
		this.gl.deleteShader(shader);

		let shaderName
		if (type == this.gl.VERTEX_SHADER) shaderName = "vertex"
		else if (type == this.gl.FRAGMENT_SHADER) shaderName = "fragment"
		if (!shader) throw "[ERROR] shader type is unknown"
		throw `Error compiling ${shaderName} shader:\n${this.gl.getShaderInfoLog(shader)}`
	}
	#createProgram(vertexShader, fragmentShader) {
		var program = this.gl.createProgram();
		this.gl.attachShader(program, vertexShader);
		this.gl.attachShader(program, fragmentShader);
		this.gl.linkProgram(program);
		var success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
		if (success) {
			return program;
		}
		console.error(this.gl.getProgramInfoLog(program));
		this.gl.deleteProgram(program);
	}
	set resolution(size) {
		this.gl.uniform2f(this.resolutionUniformLocation, ...size);
	}
}

export class WebGLCanvas extends React.Component {
	constructor(props) {
		super(props)
		this.size = [0, 0]
		this.frameCount = 0
		this.frameTimer = new Stopwatch()
		this.timer = new Stopwatch()
	}
	render() {
		return <div ref={r => this.container = r} className="exp">
			<canvas ref={r => {this.htmlCanvas = r;if(this.props.canvas)this.props.canvas.current=r}} onMouseMove={this.props.onMouseMove}></canvas>
		</div>
	}
	componentDidMount() {
		const antialias = this.props.antialias == undefined ? true : this.props.antialias
		this.gl = this.htmlCanvas.getContext("webgl2", { antialias })
		this.gl.clearColor(0, 0, 0, 0)
		window.gl = this.gl

		this.shader = new Shader(this.gl, defVertShaderSrc, defFragShaderSrc)
		this.gl.useProgram(this.shader.program)
		this.meshes = []
		this.meshPoints = new PointArray(this)
		this.meshLines = new LineArray(this)

		this.#resize()
		if (this.props.onSetup) this.props.onSetup(this)
		this.frameTimer.start()
		requestAnimationFrame(this.#drawLoop.bind(this))
	}

	#resize() {
		this.size[0] = this.container.offsetWidth
		this.size[1] = this.container.offsetHeight
		if (this.htmlCanvas.width !== this.size[0] || this.htmlCanvas.height !== this.size[1]) {
			this.htmlCanvas.width = this.size[0]
			this.htmlCanvas.height = this.size[1]
			this.gl.viewport(0, 0, this.size[0], this.size[1]);
			this.shader.resolution = [this.size[0], this.size[1]]
		}
	}

	#drawLoop() {
		// this.timer.start() //timer
		++this.frameCount
		this.#resize()
		
		// this.timer.divide("Loop") //timer
		if (this.props.onDraw) this.props.onDraw(this)
		
		// this.timer.divide("Draw") //timer
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		for (const mesh of this.meshes)
			mesh.draw()
			
		this.meshLines.draw()
		this.meshPoints.draw()
		
		// this.timer.log() //timer
		// this.timer.end() //timer
		// console.log("frame: " + (1000/this.frameTimer.reset()).toFixed(1) + "fps")

		requestAnimationFrame(this.#drawLoop.bind(this))
	}

	// public
	set background(color) {
		this.gl.clearColor(...color)
	}

	addMesh(mesh) {
		this.meshes.push(mesh)
	}
	removeMesh(mesh) {
		const index = this.meshes.indexOf(mesh)
		if (index >= 0) this.meshes.splice(index, 1)
	}

	// simple Draw (debug)

	point(...pos) {
		this.meshPoints.push(...pos)
	}
	resetPoints() {
		this.meshPoints.reset()
	}
	line(...pos) {
		this.meshLines.push(...pos)
	}
	resetLines() {
		this.meshLines.reset()
	}
}

export class GLMesh {
	constructor(canvas, primitiveType = 4, addToMesh = true) {
		this.canvas = canvas
		/** @type {WebGL2RenderingContext} */
		this.gl = canvas.gl
		this.buffer = new ArrayBuffer(this.gl)
		this.bufferNeedsUpdate = false

		this.color = [.5, .5, .5, 1]
		this.primitiveType = primitiveType

		this.positionAttributeLocation = this.gl.getAttribLocation(canvas.shader.program, "a_position")
		this.colorUniformLocation = this.gl.getUniformLocation(canvas.shader.program, "u_color")

		if (addToMesh) canvas.addMesh(this)
	}

	updateVertices(vertices, unpack = true) {
		if (unpack) this.vertices = this.#defaultVerticesUnpackFilter(vertices)
		else this.vertices = vertices
		this.bufferNeedsUpdate = true
	}
	#defaultVerticesUnpackFilter(vertices) {
		const meshVertices = new Float32Array(vertices.length * 2)
		for (let i = 0; i < vertices.length; ++i) {
			meshVertices[i * 2] = vertices[i][0]
			meshVertices[i * 2 + 1] = vertices[i][1]
		}
		return meshVertices
	}

	#updateBuffer() {
		this.bufferNeedsUpdate = false
		this.buffer.setData(this.vertices)
	}
	#updateGlobalVAO() {
		this.gl.enableVertexAttribArray(this.positionAttributeLocation)
		this.buffer.bind()
		const size = 2; // 2 components per iteration
		this.gl.vertexAttribPointer(this.positionAttributeLocation, size, this.gl.FLOAT, false, 0, 0)

		this.gl.uniform4f(this.colorUniformLocation, ...this.color);
	}

	draw() {
		if (this.bufferNeedsUpdate) this.#updateBuffer()
		if (!this.buffer.dataLength) return

		this.#updateGlobalVAO()
		this.gl.drawArrays(this.primitiveType, 0, Math.floor(this.buffer.dataLength / 2))
	}

	delete() {
		this.gl.deleteBuffer(this.verticesBuffer)
		this.canvas.removeMesh(this)
		this.gl = null
	}
}

export class ArrayBuffer {
	constructor(gl) {
		this.gl = gl
		this.id = this.gl.createBuffer()
		this.bufferLength = 0
		this.dataLength = 0
	}
	setData(data) {
		this.bind()
		if (this.bufferLength < data.length) this.#allocateBuffer(data)
		else this.#updateBuffer(data)
		this.dataLength = data.length
	}
	bind() {
		this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.id)
	}
	#allocateBuffer(data) {
		this.bufferLength = data.length
		this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.DYNAMIC_DRAW)
	}
	#updateBuffer(data) {
		this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, data)
	}
}