import { Camera, Color, Material, Scene, WebGLRenderer, WebGLRenderTarget } from 'three';
import { Pass } from './Pass';

/**
 * @author alteredq / http://alteredqualia.com/
 * @author Christopher Quadflieg / converted to typescript
 */
export class RenderPass extends Pass {
	public clear: boolean = true;
	public clearDepth: boolean = false;
	public needsSwap: boolean = false;

	constructor(
		public scene: Scene,
		public camera: Camera,
		public overrideMaterial?: Material,
		public clearColor?: string | number | Color,
		public clearAlpha: number = 0
	) {
		super();
	}

	public render(
		renderer: WebGLRenderer,
		_writeBuffer: WebGLRenderTarget,
		readBuffer: WebGLRenderTarget,
		_delta: number,
		_maskActive?: boolean
	): void {
		const oldAutoClear: boolean = renderer.autoClear;
		renderer.autoClear = false;

		this.scene.overrideMaterial = this.overrideMaterial!;

		let oldClearColor: number | undefined;
		let oldClearAlpha: number | undefined;

		if (this.clearColor) {
			oldClearColor = renderer.getClearColor().getHex();
			oldClearAlpha = renderer.getClearAlpha();

			const clearColor: string | number | Color = this.clearColor!;
			if (clearColor instanceof Color) {
				renderer.setClearColor(clearColor, this.clearAlpha);
			} else if (typeof clearColor === 'number') {
				renderer.setClearColor(clearColor, this.clearAlpha);
			} else {
				renderer.setClearColor(clearColor, this.clearAlpha);
			}
		}

		if (this.clearDepth) {
			renderer.clearDepth();
		}

		renderer.render(this.scene, this.camera, this.renderToScreen ? undefined : readBuffer, this.clear);

		if (this.clearColor) {
			renderer.setClearColor(oldClearColor!, oldClearAlpha);
		}

		// @ts-ignore
		this.scene.overrideMaterial = null;
		renderer.autoClear = oldAutoClear;
	}
}
