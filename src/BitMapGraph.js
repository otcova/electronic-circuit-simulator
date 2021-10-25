import React, { useCallback, useEffect, useRef, useState } from "react";
import * as css from "./logic/style";
import { num } from "./logic/math";
import { QuadArray } from "./WebGL/simpleShapes";
import { WebGLCanvas } from "./WebGL/WebGL";


const mousePos = [0,0]
document.addEventListener("mousemove", e=>{mousePos[0] = e.clientX; mousePos[1]=e.clientY})

const colors = {
	font: [.9, .9, .9],
	background: [.1, .1, .1, 1],
	on: [0.2, 0.9, 0.4, 1],
	off: [0.92, 0.4, 0.2, 1],
	error: [1, 0, 1, 1],
	popUp: [.2, .2, .2, 1],
}

export function BitMapGraph(props) {
	
	const popup = useRef()
	
	const movePopup = useCallback(e => {
		if (popup.current) {
			popup.current.style.display = e.value != undefined? "block" : "none"
			popup.current.style.left = (mousePos[0]) + "px"
			popup.current.style.top = (mousePos[1] - popup.current.offsetHeight) + "px"
			popup.current.innerHTML = e.value//(e.clientX - e.target.offsetLeft) / 5
		}
	})
	return <div className="exp row" style={{ ...css.padding(5), ...css.color(colors.font,colors.background), ...css.border(colors.font) }}>
		<BitMapGraphHeader header={props.header} />
		<BitMapGraphCanvas data={props.data} header={props.header} onMouseMove={movePopup}/>
		<div ref={popup} style={{position:"absolute",display:"none", ...css.border(colors.font),...css.padding(3),...css.padding(5,"lr"), ...css.background(colors.popUp)}}>23</div>
	</div>
}

function BitMapGraphHeader(props) {
	return <div className="column nowrap" style={{ flexShrink: 0, ...css.size("fit-content", "100%"), ...css.color(colors.font, colors.background) }}>
		{props.header.map((title, i) =>
			<Text key={i} className="exp" style={{ textAlign: "right", ...css.padding(10, "r") }} txt={title} />
		)}
	</div>
}

function Text(props) {
	const [fontSize, setFontSize] = useState(14)
	const [minWidth, setWidth] = useState("fit-content")
	const container = useRef(null)
	useEffect(() => {
		const resize = async () => setFontSize(Math.min(14, container.current.getBoundingClientRect().height - 1))
		window.addEventListener('resize', resize)
		resize()
	}, [container])
	return <div ref={container} className={props.className} style={{ ...props.style, fontSize, minWidth }}>{props.txt}</div>
}

function BitMapGraphCanvas(props) {
	const [points] = useState([])
	const pastDataLen = useRef(0)
	
	const gridSize = useRef([0,0])
	const offsetRef = useRef(0)
	
	const canvas = useRef()
	
	const updatePopup = useCallback(() => {
		if (props.onMouseMove && canvas.current) {
			
			const x = Math.floor(offsetRef.current + (mousePos[0] - canvas.current.offsetLeft) / gridSize.current[0])
			const y = Math.floor((mousePos[1] - canvas.current.offsetTop) / gridSize.current[1])
			const value = props.data[x]? props.data[x][y] : undefined
			props.onMouseMove({value})
		}
	})
	
	const updateGraph = useCallback(canvas => {
		
		if (pastDataLen.current != props.data.length)
			pastDataLen.current = props.data.length
		else return
			
			
		const columnW = 10
		const rowH = canvas.size[1] / props.header.length
		gridSize.current = [columnW, rowH]
		const rows = canvas.size[0] / columnW + 1
		const columns = props.header.length

		let offset = Infinity//10 * canvas.frameCount / 60
		offset = num.clamp(offset, 0, props.data.length - rows)
		offsetRef.current = offset
		const boxOffset = (-offset + Math.floor(offset))*columnW
		
		points[0].reset()
		points[1].reset()
		points[2].reset()
		
		for (let x = 0; x < rows; ++x) {
			const dataX = x + Math.floor(offset)
			if (dataX >= props.data.length) break
			for (let y = 0; y < columns; ++y) {
				if (props.header[y]) {
					
					const posTopLeft = [x*columnW + boxOffset, y * rowH + 1]
					const posBottomRight = [posTopLeft[0]+columnW-1, posTopLeft[1]+rowH-2]
					
					const n = props.data[dataX][y]
					
					if (n == undefined || Number.isNaN(n)) points[2].quad(posTopLeft, posBottomRight)
					else if (n) points[1].quad(posTopLeft, posBottomRight)
					else points[0].quad(posTopLeft, posBottomRight)
				}
			}
		}
		updatePopup()
	})
	
	const setup = useCallback(canvas => {
		canvas.background = colors.background

		points.push(new QuadArray(canvas, colors.off))
		points.push(new QuadArray(canvas, colors.on))
		points.push(new QuadArray(canvas, colors.error))
	})
	
	document.addEventListener("mousemove", updatePopup)
	
	return <WebGLCanvas onSetup={setup} onDraw={updateGraph} antialias={false} canvas={canvas}/>
}