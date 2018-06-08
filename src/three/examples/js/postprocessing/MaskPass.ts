import { Camera, Scene, WebGLRenderer, WebGLRenderTarget, WebGLState } from 'three';
import { Pass } from './Pass';

/**
 * @author alteredq / http://alteredqualia.com/
 * @author Christopher Quadflieg / converted to typescript
 */
export class MaskPass extends Pass {
	public clear: boolean = true;
	public needsSwap: boolean = false;

	public inverse: boolean = false;

	constructor(public scene: Scene, public camera: Camera) {
		super();
	}

	public render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget): void {
		const context: WebGLRenderingContext = renderer.context;
		const state: WebGLState = renderer.state;

		// don't update color or depth

		state.buffers.color.setMask(0);
		state.buffers.depth.setMask(0);

		// lock buffers

		state.buffers.color.setLocked(true);
		state.buffers.depth.setLocked(true);

		// set up stencil

		let writeValue: 0 | 1;
		let clearValue: 0 | 1;

		if (this.inverse) {
			writeValue = 0;
			clearValue = 1;
		} else {
			writeValue = 1;
			clearValue = 0;
		}

		state.buffers.stencil.setTest(true);
		state.buffers.stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
		state.buffers.stencil.setFunc(context.ALWAYS, writeValue, 0xffffffff);
		state.buffers.stencil.setClear(clearValue);

		// draw into the stencil buffer

		renderer.render(this.scene, this.camera, readBuffer, this.clear);
		renderer.render(this.scene, this.camera, writeBuffer, this.clear);

		// unlock color and depth buffer for subsequent rendering

		state.buffers.color.setLocked(false);
		state.buffers.depth.setLocked(false);

		// only render where stencil is set to 1

		state.buffers.stencil.setFunc(context.EQUAL, 1, 0xffffffff); // draw if == 1
		state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.KEEP);
	}
}

export class ClearMaskPass extends Pass {
	public needsSwap: boolean = false;

	public render(renderer: WebGLRenderer): void {
		renderer.state.buffers.stencil.setTest(false);
	}
}
