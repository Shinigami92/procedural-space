import { BufferGeometry, Geometry, Group, Material, Matrix4, Mesh, Object3D, Scene } from 'three';

/* tslint:disable */

/**
 * @author alteredq / http://alteredqualia.com/
 * @author Christopher Quadflieg / converted to typescript
 */
export class SceneUtils {
	static createMultiMaterialObject(geometry: Geometry | BufferGeometry, materials: Material[]) {
		var group = new Group();

		for (var i = 0, l = materials.length; i < l; i++) {
			group.add(new Mesh(geometry, materials[i]));
		}

		return group;
	}

	static detach(child: Object3D, parent: Object3D, scene: Scene) {
		child.applyMatrix(parent.matrixWorld);
		parent.remove(child);
		scene.add(child);
	}

	static attach(child: Object3D, scene: Scene, parent: Object3D) {
		child.applyMatrix(new Matrix4().getInverse(parent.matrixWorld));

		scene.remove(child);
		parent.add(child);
	}
}
