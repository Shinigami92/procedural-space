import { WebGLRenderer, WebGLRenderTarget } from 'three';

/**
 * @author alteredq / http://alteredqualia.com/
 * @author Christopher Quadflieg / converted to typescript
 */
export abstract class Pass {
	// if set to true, the pass is processed by the composer
	public enabled: boolean = true;

	// if set to true, the pass indicates to swap read and write buffer after rendering
	public needsSwap: boolean = true;

	// if set to true, the pass clears its buffer before rendering
	public clear: boolean = false;

	// if set to true, the result of the pass is rendered to screen
	public renderToScreen: boolean = false;

	public setSize(_width: number, _height: number): void {
		//TODO: abstract?
	}

	public abstract render(
		renderer: WebGLRenderer,
		writeBuffer: WebGLRenderTarget,
		readBuffer: WebGLRenderTarget,
		delta: number,
		maskActive?: boolean
	): void;
}
