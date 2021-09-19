import React, { useEffect, useRef, useState } from "react";
import * as css from "./logic/style";
import { QuadArray } from "./WebGL/simpleShapes";
import { WebGLCanvas } from "./WebGL/WebGL";

const colors = {
	font: [.9, .9, .9],
	background: [.1, .1, .1, 1],
	on: [0.2, 0.9, 0.4, 1],
	off: [0.92, 0.4, 0.2, 1],
}

export function BitMapGraph(props) {
	return <div className="exp row" style={{ ...css.padding(5), ...css.background(colors.background), ...css.border(colors.font) }}>
		<BitMapGraphHeader header={props.header} />
		<BitMapGraphCanvas data={props.data} header={props.header} />
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
	
	const updateGraph = canvas => {
		const columnW = 10
		const rowH = canvas.size[1] / props.header.length
		const rows = canvas.size[0] / columnW + 1
		const columns = props.header.length

		let offset = 10 * canvas.frameCount / 60
		offset = Math.min(props.data.length - rows, offset)
		const boxOffset = (-offset + Math.floor(offset))*columnW

		points[0].reset()
		points[1].reset()
		
		for (let x = 0; x < rows; ++x) {
			for (let y = 0; y < columns; ++y) {
				if (props.header[y]) {
					
					const posTopLeft = [x*columnW + boxOffset, y * rowH + 1]
					const posBottomRight = [posTopLeft[0]+columnW-1, posTopLeft[1]+rowH-2]
					
					if (props.data[x + Math.floor(offset)][y]) points[0].quad(posTopLeft, posBottomRight)
					else points[1].quad(posTopLeft, posBottomRight)
				}
			}
		}
	}
	
	const setup = canvas => {
		canvas.background = colors.background

		points.push(new QuadArray(canvas, colors.off))
		points.push(new QuadArray(canvas, colors.on))
		
		setTimeout(() => updateGraph(canvas), 1);
	}

	return <WebGLCanvas onSetup={setup} onDraw={()=>{}} antialias={false} />
}