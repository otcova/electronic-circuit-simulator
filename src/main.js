import React, { useCallback, useEffect, useRef, useState } from "react"
import { render } from "react-dom"
import { BitMapGraph, BitMapSlideGraph } from "./BitMapGraph"
import { Processor, programs, setActiveProgramIndex } from "./CPUClass";
import { css } from "./logic/style";

const netsToWatch = ["CLK", "", "RI-write", "RC-inc", "RC-write", "RC-read", "RA-write", "RA-read", "RB-read", "ALU-read", "M-write", "M-read", "", "BusA", "BusB", "BusD", "", "I", "RC", "R0", "R1", "R2", "R3"]

class Computer {
	constructor(programIndex) {
		setActiveProgramIndex(programIndex)
		this.processor = new Processor()
		this.programIndex = programIndex
		this.interval = 0
		this.frequency = 100
		this.wireData = []
	}
	step() {
		const slice = []
		const state = this.processor.step()
		for (const net of netsToWatch)
			slice.push(state.get(net))
		this.wireData.push(slice)
		if (this.wireData.length > 500)
			this.wireData.shift()
	}
	play() {
		this.stop()
		const div = Math.min(60, this.frequency)
		this.interval = setInterval(() => {
			for (let i = 0; i < this.frequency / div; ++i)
				this.step()
		}, 1000 / div)
	}
	stop() {
		clearInterval(this.interval)
	}
}


function Header(props) {
	const [frequency, setFrequency] = useState(props.computer.frequency)
	const playStopRef = useRef()
	
	useEffect(() => {
		if (frequency != props.computer.frequency)
			setFrequency(props.computer.frequency)
	}, [props.computer.frequency])


	const updateFrequency = useCallback(e => {
		const newValue = e.target.value.replace(/[^0-9]/g, '')
		if (newValue != frequency) {
			setFrequency(newValue)
			props.computer.frequency = Number(newValue) || 0
			if (playStopRef.current.innerText != "▶") props.computer.play()
		}
	})

	const onPlayPauseStep = useCallback(e => {
		if (e.target.innerText == "▶") {
			playStopRef.current.innerText = "❚❚"
			playStopRef.current.style.paddingLeft = "5.1px"
			playStopRef.current.style.paddingTop = "5px"
			props.computer.play()
		} else {
			playStopRef.current.innerText = "▶"
			playStopRef.current.style.paddingLeft = "6px"
			playStopRef.current.style.paddingTop = "6px"
			props.computer.stop()
			if (e.target.innerText == "Step")
				props.computer.step()
		}
	})

	const onChangeProgram = useCallback(() => {
		playStopRef.current.innerText = "▶"
		playStopRef.current.style.paddingLeft = "6px"
		playStopRef.current.style.paddingTop = "6px"
		props.onChangeProgram()
	})

	return <div style={css.size("%", 50).color("#fff", "#555").row("center", "center").font(1.2).margin(10, "b")}>
		<div style={css.margin(20, "l").padding(5).border("#FFF", 1)}>{programs[props.computer.programIndex][0]}</div>
		<div style={css.exp().shrink().row("center", "center")}>
			<button ref={playStopRef} onClick={onPlayPauseStep}>▶</button>
			<button onClick={onPlayPauseStep} style={css.margin(10, "l").margin(20, "r")}>Step</button>
			<div style={css.background("#").border("#FFF", 1).row().padding(5)}>
				<div style={css.margin(10, "r")}>Simulation Frequency:</div>
				<input value={frequency} onChange={updateFrequency} style={{ textAlign: "right", ...css.sizeX(40).floatRight().color("#000", "#eee").noOutline().border("none", 0).border("#000", 1, "b") }} />
				<div style={css.margin(10, "l")}>Hz</div>
			</div>
		</div>
		<button onClick={props.onChangeGraph}>Change Diagram</button>
		<button onClick={onChangeProgram} style={css.margin(20, "lr")}>Change Program</button>
	</div>
}


function Screen() {
	const [hideGraph, setHideGraph] = useState(false)
	const [computer, setComputer] = useState(() => new Computer(0))

	const changeProgram = useCallback(e => {

		setComputer(new Computer((computer.programIndex + 1) % programs.length))
	})

	return <div className="exp" style={{ ...css.padding(10).background("#111").column() }}>
		<Header onChangeGraph={() => setHideGraph(!hideGraph)} onChangeProgram={changeProgram} computer={computer} />
		<div style={css.exp().shrink()}>
			<BitMapSlideGraph hide={hideGraph} header={netsToWatch} data={computer.wireData} />
			<BitMapGraph header={netsToWatch} data={computer.processor.comps[4].memory} />
		</div>
	</div>
}
render(<Screen />, document.getElementById("root"))