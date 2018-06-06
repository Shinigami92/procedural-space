import { WebGLRenderer, WebGLRenderTarget } from 'three';

/* tslint:disable */

/**
 * @author alteredq / http://alteredqualia.com/
 * @author Christopher Quadflieg / converted to typescript
 */

export abstract class Pass {
	// if set to true, the pass is processed by the composer
	public enabled = true;

	// if set to true, the pass indicates to swap read and write buffer after rendering
	public needsSwap = true;

	// if set to true, the pass clears its buffer before rendering
	public clear = false;

	// if set to true, the result of the pass is rendered to screen
	public renderToScreen = false;

	public setSize(_width: number, _height: number) {}

	public abstract render(
		renderer: WebGLRenderer,
		writeBuffer: WebGLRenderTarget,
		readBuffer: WebGLRenderTarget,
		delta: number,
		maskActive?: boolean
	): void;
}
