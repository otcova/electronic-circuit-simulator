#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;

void main() {
	vec2 clipSpace = 2. * a_position / u_resolution - 1.;

	gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
	gl_PointSize = 4.0;
}