export interface CopyShader {
	uniforms: {
		tDiffuse: {
			value: null;
		};
		opacity: {
			value: number;
		};
	};
	vertexShader: string;
	fragmentShader: string;
}

/**
 * @author alteredq / http://alteredqualia.com/
 * @author Christopher Quadflieg / converted to typescript
 *
 * Full-screen textured quad shader
 */
// tslint:disable-next-line:variable-name
export const CopyShader: CopyShader = {
	uniforms: {
		tDiffuse: { value: null },
		opacity: { value: 1.0 }
	},

	vertexShader: [
		'varying vec2 vUv;',

		'void main() {',

		'vUv = uv;',
		'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

		'}'
	].join('\n'),

	fragmentShader: [
		'uniform float opacity;',

		'uniform sampler2D tDiffuse;',

		'varying vec2 vUv;',

		'void main() {',

		'vec4 texel = texture2D( tDiffuse, vUv );',
		'gl_FragColor = opacity * texel;',

		'}'
	].join('\n')
};
