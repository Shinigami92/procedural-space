import { BufferGeometry, Geometry, Group, Material, Matrix4, Mesh, Object3D, Scene } from 'three';

/**
 * @author alteredq / http://alteredqualia.com/
 * @author Christopher Quadflieg / converted to typescript
 */
export class SceneUtils {
	public static createMultiMaterialObject(geometry: Geometry | BufferGeometry, materials: Material[]): Group {
		const group: Group = new Group();

		for (let i: number = 0, l: number = materials.length; i < l; i++) {
			group.add(new Mesh(geometry, materials[i]));
		}

		return group;
	}

	public static detach(child: Object3D, parent: Object3D, scene: Scene): void {
		child.applyMatrix(parent.matrixWorld);
		parent.remove(child);
		scene.add(child);
	}

	public static attach(child: Object3D, scene: Scene, parent: Object3D): void {
		child.applyMatrix(new Matrix4().getInverse(parent.matrixWorld));

		scene.remove(child);
		parent.add(child);
	}
}
