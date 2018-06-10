import { PerspectiveCamera, Quaternion, Vector3 } from 'three';

function bind(scope: FlyControls, fn: ((event: MouseEvent) => void) | ((event: KeyboardEvent) => void)): () => void {
	return function(): void {
		fn.apply(scope, arguments);
	};
}

function contextmenu(event: { preventDefault: () => void }): void {
	event.preventDefault();
}

export interface MoveState {
	up: number;
	down: number;
	left: number;
	right: number;
	forward: number;
	back: number;
	pitchUp: number;
	pitchDown: number;
	yawLeft: number;
	yawRight: number;
	rollLeft: number;
	rollRight: number;
}

export type FixedSizeArray<N extends number, T> = { 0: any; length: N } & ReadonlyArray<T>;

export interface ContainerDimension {
	size: FixedSizeArray<2, number>;
	offset: FixedSizeArray<2, number>;
}

/**
 * @author James Baicoianu / http://www.baicoianu.com/
 * @author Christopher Quadflieg / converted to typescript
 */
export class FlyControls {
	public domElement: HTMLElement | Document;

	// API

	public movementSpeed: number = 1.0;
	public movementSpeedMultiplier: number;
	public rollSpeed: number = 0.005;

	public dragToLook: boolean = false;
	public autoForward: boolean = false;

	// disable default target object behavior

	// internals

	private tmpQuaternion: Quaternion = new Quaternion();

	private mouseStatus: number = 0;

	private moveState: MoveState = {
		up: 0,
		down: 0,
		left: 0,
		right: 0,
		forward: 0,
		back: 0,
		pitchUp: 0,
		pitchDown: 0,
		yawLeft: 0,
		yawRight: 0,
		rollLeft: 0,
		rollRight: 0
	};
	private moveVector: Vector3 = new Vector3(0, 0, 0);
	private rotationVector: Vector3 = new Vector3(0, 0, 0);

	private _mousemove: () => void;
	private _mousedown: () => void;
	private _mouseup: () => void;
	private _keydown: () => void;
	private _keyup: () => void;

	constructor(public object: PerspectiveCamera, domElement?: HTMLElement) {
		this.domElement = domElement !== undefined ? domElement : document;
		if (domElement) {
			(this.domElement as HTMLElement).setAttribute('tabindex', '-1');
		}

		this.init();
	}

	public handleEvent(event: KeyboardEvent): void {
		switch (event.type) {
			case 'keydown':
				this.keydown(event);
				break;
		}
	}

	public keydown(event: KeyboardEvent): void {
		if (event.altKey) {
			return;
		}

		// event.preventDefault();

		switch (event.keyCode) {
			case 16:
				/* shift */
				this.movementSpeedMultiplier = 0.1;
				break;

			case 87:
				/*W*/
				this.moveState.forward = 1;
				break;
			case 83:
				/*S*/
				this.moveState.back = 1;
				break;

			case 65:
				/*A*/
				this.moveState.left = 1;
				break;
			case 68:
				/*D*/
				this.moveState.right = 1;
				break;

			case 82:
				/*R*/
				this.moveState.up = 1;
				break;
			case 70:
				/*F*/
				this.moveState.down = 1;
				break;

			case 38:
				/*up*/
				this.moveState.pitchUp = 1;
				break;
			case 40:
				/*down*/
				this.moveState.pitchDown = 1;
				break;

			case 37:
				/*left*/
				this.moveState.yawLeft = 1;
				break;
			case 39:
				/*right*/
				this.moveState.yawRight = 1;
				break;

			case 81:
				/*Q*/
				this.moveState.rollLeft = 1;
				break;
			case 69:
				/*E*/
				this.moveState.rollRight = 1;
				break;
		}

		this.updateMovementVector();
		this.updateRotationVector();
	}

	public keyup(event: KeyboardEvent): void {
		switch (event.keyCode) {
			case 16:
				/* shift */
				this.movementSpeedMultiplier = 1;
				break;

			case 87:
				/*W*/
				this.moveState.forward = 0;
				break;
			case 83:
				/*S*/
				this.moveState.back = 0;
				break;

			case 65:
				/*A*/
				this.moveState.left = 0;
				break;
			case 68:
				/*D*/
				this.moveState.right = 0;
				break;

			case 82:
				/*R*/
				this.moveState.up = 0;
				break;
			case 70:
				/*F*/
				this.moveState.down = 0;
				break;

			case 38:
				/*up*/
				this.moveState.pitchUp = 0;
				break;
			case 40:
				/*down*/
				this.moveState.pitchDown = 0;
				break;

			case 37:
				/*left*/
				this.moveState.yawLeft = 0;
				break;
			case 39:
				/*right*/
				this.moveState.yawRight = 0;
				break;

			case 81:
				/*Q*/
				this.moveState.rollLeft = 0;
				break;
			case 69:
				/*E*/
				this.moveState.rollRight = 0;
				break;
		}

		this.updateMovementVector();
		this.updateRotationVector();
	}

	public mousedown(event: MouseEvent): void {
		if (this.domElement !== document) {
			(this.domElement as HTMLElement).focus();
		}

		event.preventDefault();
		event.stopPropagation();

		if (this.dragToLook) {
			this.mouseStatus++;
		} else {
			switch (event.button) {
				case 0:
					this.moveState.forward = 1;
					break;
				case 2:
					this.moveState.back = 1;
					break;
			}

			this.updateMovementVector();
		}
	}

	public mousemove(event: MouseEvent): void {
		if (!this.dragToLook || this.mouseStatus > 0) {
			const container: ContainerDimension = this.getContainerDimensions();
			const halfWidth: number = container.size[0] / 2;
			const halfHeight: number = container.size[1] / 2;

			this.moveState.yawLeft = -(event.pageX - container.offset[0] - halfWidth) / halfWidth;
			this.moveState.pitchDown = (event.pageY - container.offset[1] - halfHeight) / halfHeight;

			this.updateRotationVector();
		}
	}

	public mouseup(event: MouseEvent): void {
		event.preventDefault();
		event.stopPropagation();

		if (this.dragToLook) {
			this.mouseStatus--;

			this.moveState.yawLeft = this.moveState.pitchDown = 0;
		} else {
			switch (event.button) {
				case 0:
					this.moveState.forward = 0;
					break;
				case 2:
					this.moveState.back = 0;
					break;
			}

			this.updateMovementVector();
		}

		this.updateRotationVector();
	}

	public update(delta: number): void {
		const moveMult: number = delta * this.movementSpeed;
		const rotMult: number = delta * this.rollSpeed;

		this.object.translateX(this.moveVector.x * moveMult);
		this.object.translateY(this.moveVector.y * moveMult);
		this.object.translateZ(this.moveVector.z * moveMult);

		this.tmpQuaternion
			.set(this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1)
			.normalize();
		this.object.quaternion.multiply(this.tmpQuaternion);

		// expose the rotation vector for convenience
		this.object.rotation.setFromQuaternion(this.object.quaternion, this.object.rotation.order);
	}

	public updateMovementVector(): void {
		const forward: 0 | 1 = this.moveState.forward || (this.autoForward && !this.moveState.back) ? 1 : 0;

		this.moveVector.x = -this.moveState.left + this.moveState.right;
		this.moveVector.y = -this.moveState.down + this.moveState.up;
		this.moveVector.z = -forward + this.moveState.back;

		// console.log( 'move:', [ this.moveVector.x, this.moveVector.y, this.moveVector.z ] );
	}

	public updateRotationVector(): void {
		this.rotationVector.x = -this.moveState.pitchDown + this.moveState.pitchUp;
		this.rotationVector.y = -this.moveState.yawRight + this.moveState.yawLeft;
		this.rotationVector.z = -this.moveState.rollRight + this.moveState.rollLeft;

		// console.log( 'rotate:', [ this.rotationVector.x, this.rotationVector.y, this.rotationVector.z ] );
	}

	public getContainerDimensions(): ContainerDimension {
		if (this.domElement !== document) {
			const domElement: HTMLElement = this.domElement as HTMLElement;
			return {
				size: [domElement.offsetWidth, domElement.offsetHeight],
				offset: [domElement.offsetLeft, domElement.offsetTop]
			};
		} else {
			return { size: [window.innerWidth, window.innerHeight], offset: [0, 0] };
		}
	}

	public dispose(): void {
		this.domElement.removeEventListener('contextmenu', contextmenu, false);
		this.domElement.removeEventListener('mousedown', this._mousedown, false);
		this.domElement.removeEventListener('mousemove', this._mousemove, false);
		this.domElement.removeEventListener('mouseup', this._mouseup, false);

		window.removeEventListener('keydown', this._keydown, false);
		window.removeEventListener('keyup', this._keyup, false);
	}

	private init(): void {
		this._mousemove = bind(this, this.mousemove);
		this._mousedown = bind(this, this.mousedown);
		this._mouseup = bind(this, this.mouseup);
		this._keydown = bind(this, this.keydown);
		this._keyup = bind(this, this.keyup);

		this.domElement.addEventListener('contextmenu', contextmenu, false);

		this.domElement.addEventListener('mousemove', this._mousemove, false);
		this.domElement.addEventListener('mousedown', this._mousedown, false);
		this.domElement.addEventListener('mouseup', this._mouseup, false);

		window.addEventListener('keydown', this._keydown, false);
		window.addEventListener('keyup', this._keyup, false);

		this.updateMovementVector();
		this.updateRotationVector();
	}
}
