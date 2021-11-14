import { vec } from "./vec"

function toColor(c) {
	if (typeof c == "string") return c
	if (c.length == 1) return "#" + Math.round(255 * c[0]).toString(16).repeat(3)
	if (c.length == 2) return "#" + Math.round(255 * c[0]).toString(16).repeat(3) + Math.round(255 * c[1]).toString(16)
	if (c.length == 3) return "#" + Math.round(255 * c[0]).toString(16) + Math.round(255 * c[1]).toString(16) + Math.round(255 * c[2]).toString(16)
	if (c.length == 4) return "#" + Math.round(255 * c[0]).toString(16) + Math.round(255 * c[1]).toString(16) + Math.round(255 * c[2]).toString(16) + Math.round(255 * c[3]).toString(16)
	return NaN
}

class Css {
	constructor(css, newProps) {
		if (!css) return
		Object.assign(this, css)
		Object.assign(this, newProps)
	}
	///////
	exp() { return this.size("100%", "100%") }
	expX() { return new Css(this, { width: "100%" }) }
	expY() { return new Css(this, { height: "100%" }) }
	///////
	sizeX(width) { return new Css(this, {width}) }
	sizeY(height) { return new Css(this, {height}) }
	size(size, height) {
		if (size == "%") size = "100%"
		if (height == undefined) {
			if (size == undefined) return new Css(this, { width: undefined, height: undefined })
			if (Array.isArray(size)) return new Css(this, { width: size[0], height: size[0] })
			return new Css(this, { width: size, height: size })
		}
		if (height == "%") height = "100%"
		return new Css(this, { width: size, height })
	}
	floatLeft() {
		return new Css(this, { float: "left" })
	}
	floatRight() {
		return new Css(this, { float: "right" })
	}
	noScroll() { return new Css(this, { scroll: "none" }) }
	background(color) {
		return new Css(this, { backgroundColor: toColor(color) })
	}
	color(color, background) {
		if (background) return new Css(this, { color: toColor(color), backgroundColor: toColor(background) })
		return new Css(this, { color: toColor(color) })
	}
	padding(value, direction = "tblr") {
		const style = {}
		if (direction.includes("t")) style.paddingTop = value
		if (direction.includes("b")) style.paddingBottom = value
		if (direction.includes("l")) style.paddingLeft = value
		if (direction.includes("r")) style.paddingRight = value
		return new Css(this, style)
	}
	margin(value, direction = "tblr") {
		const style = {}
		if (direction.includes("t")) style.marginTop = value
		if (direction.includes("b")) style.marginBottom = value
		if (direction.includes("l")) style.marginLeft = value
		if (direction.includes("r")) style.marginRight = value
		return new Css(this, style)
	}
	noOutline() {
		return new Css(this, {outline:"none"})
	}
	noBorder() {
		return new Css(this, {border:"none"})
	}
	border(color = "#000", width = 1, direction = "tblr") {
		color = toColor(color)
		const style = {}
		if (direction.includes("t")) {
			style.borderTopWidth = width
			style.borderTopStyle = "solid"
			style.borderTopColor = color
		}
		if (direction.includes("b")) {
			style.borderBottomWidth = width
			style.borderBottomStyle = "solid"
			style.borderBottomColor = color
		}
		if (direction.includes("l")) {
			style.borderLeftWidth = width
			style.borderLeftStyle = "solid"
			style.borderLeftColor = color
		}
		if (direction.includes("r")) {
			style.borderRightWidth = width
			style.borderRightStyle = "solid"
			style.borderRightColor = color
		}
		return new Css(this, style)
	}
	scrollY(when="auto") {
		return new Css(this, {
			overflowY: when,
		})
	}
	//////
	hide(hide=true) {
		if (!hide) return this
		return new Css(this, {
			display: "none",
		})
	}
	column(alignItems="center") {
		if (alignItems == "left") alignItems = "flex-start"
		else if (alignItems == "right") alignItems = "flex-end"
		return new Css(this, {
			display: "flex",
			flexDirection: "column",
			alignItems,
		})
	}
	row(alignItems="center", justifyContent="left") {
		if (alignItems == "left") alignItems = "flex-start"
		else if (alignItems == "right") alignItems = "flex-end"
		if (alignItems == "top") alignItems = "flex-start"
		else if (alignItems == "bottom") alignItems = "flex-end"
		return new Css(this, {
			display: "flex",
			flexDirection: "row",
			alignItems,
			justifyContent
		})
	}
	shrink(flexShrink=1) {
		return new Css(this, {
			flexShrink,
		})
	}
	
	/// ALIGN
	font(fontSize, textAlign) {
		if (typeof fontSize == "number") fontSize += "rem"
		return new Css(this, {
			fontSize,
			textAlign,
			whiteSpace: "pre-wrap",
		})
	}
	textAlign(textAlign="center") {
		return new Css(this, {
			textAlign,
		})
	}
	lineHeight(lineHeight=1) {
		return new Css(this, {lineHeight})
	}
	lineCap(maxLines=2) {
		return new Css(this, {
			display: "-webkit-box",
			WebkitBoxOrient: "vertical", 
			WebkitLineClamp: maxLines, 
			textOverflow: "ellipsis", 
			overflow: "hidden"
		})
	}
}
export const css = new Css()
window.css = css
