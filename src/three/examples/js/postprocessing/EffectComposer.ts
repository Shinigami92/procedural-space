import { LinearFilter, PixelFormat, RGBAFormat, TextureFilter, WebGLRenderer, WebGLRenderTarget } from 'three';
import { CopyShader } from '../shaders/CopyShader';
import { ClearMaskPass, MaskPass } from './MaskPass';
import { Pass } from './Pass';
import { ShaderPass } from './ShaderPass';

/**
 * @author alteredq / http://alteredqualia.com/
 * @author Christopher Quadflieg / converted to typescript
 */
export class EffectComposer {
	public renderTarget1: WebGLRenderTarget;
	public renderTarget2: WebGLRenderTarget;
	public writeBuffer: WebGLRenderTarget;
	public readBuffer: WebGLRenderTarget;

	public passes: Pass[] = [];
	public copyPass: ShaderPass;

	constructor(public renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget) {
		if (renderTarget === undefined) {
			const parameters: {
				minFilter: TextureFilter;
				magFilter: TextureFilter;
				format: PixelFormat;
				stencilBuffer: boolean;
			} = {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				format: RGBAFormat,
				stencilBuffer: false
			};

			// @ts-ignore
			const size: { width: number; height: number } = renderer.getDrawingBufferSize();
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

	public swapBuffers(): void {
		const tmp: WebGLRenderTarget = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;
	}

	public addPass(pass: Pass): void {
		this.passes.push(pass);

		// @ts-ignore
		const size: { width: number; height: number } = this.renderer.getDrawingBufferSize();
		pass.setSize(size.width, size.height);
	}

	public insertPass(pass: Pass, index: number): void {
		this.passes.splice(index, 0, pass);
	}

	public render(delta: number): void {
		let maskActive: boolean = false;

		let pass: Pass;
		let i: number;
		const il: number = this.passes.length;

		for (i = 0; i < il; i++) {
			pass = this.passes[i];

			if (pass.enabled === false) {
				continue;
			}

			pass.render(this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive);

			if (pass.needsSwap) {
				if (maskActive) {
					const context: WebGLRenderingContext = this.renderer.context;

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

	public reset(renderTarget?: WebGLRenderTarget): void {
		if (renderTarget === undefined) {
			// @ts-ignore
			const size: { width: number; height: number } = this.renderer.getDrawingBufferSize();

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

	public setSize(width: number, height: number): void {
		this.renderTarget1.setSize(width, height);
		this.renderTarget2.setSize(width, height);

		for (const pass of this.passes) {
			pass.setSize(width, height);
		}
	}
}
