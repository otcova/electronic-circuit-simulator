import { vec } from "./vec"

export function border(color="#333", collapse="") {
	const style = {border: "1px solid" + vec.toColor(color)}
	if (collapse.includes("r")) style.marginRight = -1
	if (collapse.includes("l")) style.marginLeft = -1
	if (collapse.includes("u")) style.marginUp = -1
	if (collapse.includes("b")) style.marginBottom = -1
	return style
}

export function size(width, height) {
	return {
		width,
		height,
	}
}

export function background(color) {
	return {
		backgroundColor: vec.toColor(color)
	}
}

export function color(font, background) {
	const style = {color: vec.toColor(font)}
	if (background) style.backgroundColor = vec.toColor(background)
	return style
}

export function padding(value, direction="burl") {
	const style = {}
	if (direction.includes("r")) style.paddingRight = value
	if (direction.includes("l")) style.paddingLeft = value
	if (direction.includes("u")) style.paddingTop = value
	if (direction.includes("b")) style.paddingBottom = value
	return style
}
export function margin(value, direction="burl") {
	const style = {}
	if (direction.includes("r")) style.marginRight = value
	if (direction.includes("l")) style.marginLeft = value
	if (direction.includes("u")) style.marginTop = value
	if (direction.includes("b")) style.marginBottom = value
	return style
}