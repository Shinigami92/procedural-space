import { LinearFilter, RGBAFormat, WebGLRenderer, WebGLRenderTarget } from 'three';
import { CopyShader } from '../shaders/CopyShader';
import { ClearMaskPass, MaskPass } from './MaskPass';
import { Pass } from './Pass';
import { ShaderPass } from './ShaderPass';

/* tslint:disable */

/**
 * @author alteredq / http://alteredqualia.com/
 * @author Christopher Quadflieg / converted to typescript
 */

export class EffectComposer {
	renderTarget1: WebGLRenderTarget;
	renderTarget2: WebGLRenderTarget;
	writeBuffer: WebGLRenderTarget;
	readBuffer: WebGLRenderTarget;

	passes: Pass[] = [];
	copyPass: ShaderPass;

	constructor(public renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget) {
		if (renderTarget === undefined) {
			const parameters = {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				format: RGBAFormat,
				stencilBuffer: false
			};

			// @ts-ignore
			const size = renderer.getDrawingBufferSize();
			renderTarget = new WebGLRenderTarget(size.width, size.height, parameters);
			renderTarget.texture.name = 'EffectComposer.rt1';
		}

		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();
		this.renderTarget2.texture.name = 'EffectComposer.rt2';

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

		this.copyPass = new ShaderPass(CopyShader);
	}

	public swapBuffers() {
		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;
	}

	public addPass(pass: Pass) {
		this.passes.push(pass);

		// @ts-ignore
		var size = this.renderer.getDrawingBufferSize();
		pass.setSize(size.width, size.height);
	}

	public insertPass(pass: Pass, index: number) {
		this.passes.splice(index, 0, pass);
	}

	public render(delta: number) {
		var maskActive = false;

		var pass: Pass,
			i,
			il = this.passes.length;

		for (i = 0; i < il; i++) {
			pass = this.passes[i];

			if (pass.enabled === false) continue;

			pass.render(this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive);

			if (pass.needsSwap) {
				if (maskActive) {
					var context = this.renderer.context;

					context.stencilFunc(context.NOTEQUAL, 1, 0xffffffff);

					this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, delta);

					context.stencilFunc(context.EQUAL, 1, 0xffffffff);
				}

				this.swapBuffers();
			}

			// if (MaskPass !== undefined) {
			if (pass instanceof MaskPass) {
				maskActive = true;
			} else if (pass instanceof ClearMaskPass) {
				maskActive = false;
			}
			// }
		}
	}

	public reset(renderTarget?: WebGLRenderTarget) {
		if (renderTarget === undefined) {
			// @ts-ignore
			var size = this.renderer.getDrawingBufferSize();

			renderTarget = this.renderTarget1.clone();
			renderTarget.setSize(size.width, size.height);
		}

		this.renderTarget1.dispose();
		this.renderTarget2.dispose();
		this.renderTarget1 = renderTarget;
		this.renderTarget2 = renderTarget.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;
	}

	public setSize(width: number, height: number) {
		this.renderTarget1.setSize(width, height);
		this.renderTarget2.setSize(width, height);

		for (var i = 0; i < this.passes.length; i++) {
			this.passes[i].setSize(width, height);
		}
	}
}
