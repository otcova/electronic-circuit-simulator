export class Stopwatch {
	constructor(autoStart = false) {
		this.logCount = 0
		this.totalMs = 0
		this.divisions = []
		if (autoStart) this.start()
	}
	start() {
		this.startTime = performance.now()
	}
	stop() {
		this.totalMs += performance.now() - this.startTime
		this.startTime = undefined
	}
	end() {
		const time = this.reset()
		this.stop()
		return time
	}
	log(txt) {
		this.endDivision()
		++this.logCount
		if (this.logCount % 5 == 0 || this.logCount == 1) {
			const restartTimer = this.startTime
			if (restartTimer) this.stop()

			const time = this.getMs()
			if (txt) console.log(`Timer ${txt}: ${time.toFixed(2)}ms`)
			else console.log(`Timer: ${time.toFixed(2)}ms`)

			for (const division of this.divisions) {
				const divTime = division.end - division.start
				console.log(`    | ${division.name}: ${divTime.toFixed(3)}ms  ${(100 * divTime / time).toFixed(1)}%`)
			}

			if (restartTimer) this.start()
		}
	}
	reset() {
		const time = this.getMs()
		this.totalMs = 0
		this.divisions = []
		return time
	}
	getMs() {
		if (this.startTime) {
			this.stop()
			this.start()
		}
		return this.totalMs
	}

	divide(name) {
		const restartTimer = this.startTime
		if (restartTimer) this.stop()

		this.endDivision()

		this.divisions.push({
			name,
			start: this.totalMs
		})

		if (restartTimer) this.start()
	}
	endDivision() {
		const restartTimer = this.startTime
		if (restartTimer) this.stop()

		if (this.divisions.length > 0) {
			const lastDivision = this.divisions[this.divisions.length - 1]
			if (!lastDivision.end)
				lastDivision.end = this.totalMs
		}
		if (restartTimer) this.start()
	}
}

window.Stopwatch = Stopwatch