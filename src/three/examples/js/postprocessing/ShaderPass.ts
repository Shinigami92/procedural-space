import {
	IUniform,
	Mesh,
	OrthographicCamera,
	PlaneBufferGeometry,
	Scene,
	ShaderMaterial,
	ShaderMaterialParameters,
	UniformsUtils,
	WebGLRenderer,
	WebGLRenderTarget
} from 'three';
import { Pass } from './Pass';

/* tslint:disable */

/**
 * @author alteredq / http://alteredqualia.com/
 * @author Christopher Quadflieg / converted to typescript
 */

export class ShaderPass extends Pass {
	uniforms: { [uniform: string]: IUniform };
	material: ShaderMaterial;
	camera: OrthographicCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
	scene: Scene = new Scene();
	quad: Mesh = new Mesh(new PlaneBufferGeometry(2, 2), undefined);

	constructor(shader?: ShaderMaterial | ShaderMaterialParameters, public textureID: string = 'tDiffuse') {
		super();
		if (shader instanceof ShaderMaterial) {
			this.uniforms = shader.uniforms;

			this.material = shader;
		} else if (shader) {
			this.uniforms = UniformsUtils.clone(shader.uniforms);

			this.material = new ShaderMaterial({
				defines: Object.assign({}, shader.defines),
				uniforms: this.uniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader
			});
		}

		this.quad.frustumCulled = false; // Avoid getting clipped
		this.scene.add(this.quad);
	}

	public render(
		renderer: WebGLRenderer,
		writeBuffer: WebGLRenderTarget,
		readBuffer: WebGLRenderTarget,
		_delta: number,
		_maskActive?: boolean
	) {
		if (this.uniforms[this.textureID]) {
			this.uniforms[this.textureID].value = readBuffer.texture;
		}

		this.quad.material = this.material;

		if (this.renderToScreen) {
			renderer.render(this.scene, this.camera);
		} else {
			renderer.render(this.scene, this.camera, writeBuffer, this.clear);
		}
	}
}
