document.addEventListener("contextmenu", e => e.preventDefault())

export class MouseTracker {

	#events

	constructor(element) {
		this.element = element

		this.x = 0
		this.y = 0
		this.deltaX = 0
		this.deltaY = 0
		this.scrollDelta = 0
		this.button = [false, false, false]
		this.drag = [false, false, false]

		this.#events = {
			onDrag: [],
			onDragStart: [],
			onDragEnd: [],
		}

		this.element.onmousemove = e => this.#updatePos(e)
		this.element.onwheel = e => this.#updateScrollDelta(e)
		this.element.onmousedown = e => this.#updateButtons(e)
		this.element.onmouseup = e => this.#updateButtons(e)
		this.element.onmouseleave = () => this.#updateButtons({buttons: 0})
		this.element.onmouseenter = e => this.#updateButtons(e)
		// document.
	}
	#updateScrollDelta(e) {
		this.scrollDelta += Math.ceil(e.deltaY / 100)
	}
	#updatePos(e) {
		this.deltaX = e.clientX - this.x
		this.deltaY = e.clientY - this.y
		this.x = e.clientX
		this.y = e.clientY

		this.button.forEach((pressed, i) => {
			if (pressed) {
				if (!this.drag[i] && pressed) this.#events.onDragStart.forEach(callback => callback(i))
				this.#events.onDrag.forEach(callback => callback(i))
				this.drag[i] = true
			}
		})
	}
	#updateButtons(e) {
		for (let i = 0; i < 3; ++i) {
			const state = e.buttons & 1 << i
			if (this.button[i] != state) {
				this.button[i] = state
				this.#stopDrag(i);
			}
		}
	}

	#stopDrag(buttonIndex) {
		if (this.drag[buttonIndex]) {
			this.drag[buttonIndex] = false
			this.#events.onDragEnd.forEach(callback => callback(buttonIndex))
		}
	}

	set onMove(callback) {
		this.element.addEventListener("mousemove", callback)
	}
	set onClick(callback) {
		this.element.addEventListener("click", callback)
	}
	set onUp(callback) {
		this.element.addEventListener("mouseup", e=>callback(e.button))
	}
	set onDrag(callback) {
		this.#events.onDrag.push(callback)
	}
	set onDragStart(callback) {
		this.#events.onDragStart.push(callback)
	}
	set onDragEnd(callback) {
		this.#events.onDragEnd.push(callback)
	}

	get pos() {
		return [this.x, this.y]
	}
}