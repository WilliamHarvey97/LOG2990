import { Car } from "./car";
import { Vector2, Vector3, Matrix3 } from "three";

const MINIMUM_ANGLE_FOR_STEERING: number = 0.1;

export class CarAI extends Car {
    public isInitialized: boolean;
    public isStuck: boolean;
    private positionAtStuckPoint: Vector3;
    public constructor() {
        super();
        this.isInitialized = false;
        this.isStuck = false;
        this.positionAtStuckPoint = undefined;
    }

    private steer(): void {
        if ( this.angleBetweenTrackAndCarDirection() < MINIMUM_ANGLE_FOR_STEERING) {
            this.releaseSteering();
        } else if ( this.trackDirection().x * this.direction.z -  this.trackDirection().y * this.direction.x >= 0) {
            this.steerLeft();
        } else {
            this.steerRight();
        }
    }

    private angleBetweenTrackAndCarDirection(): number {
        const carDirection: Vector2 = new Vector2( this.direction.x, this.direction.z).normalize();
        if (carDirection.length() === 0) {
            return 0;
        }

        return Math.acos(this.trackDirection().dot(carDirection) / (this.trackDirection().length() * carDirection.length()));
    }

    public update(deltaTime: number): void {
        super.update(deltaTime);
        if (!this.isInitialized) {
            return;
        }
        if (this.isStuck) {
            this.stuckRoutine();
        } else {
            this.isAcceleratorPressed = true;
            this.steer();
        }
    }

    private stuckRoutine(): void {
        if (this.positionAtStuckPoint === undefined) {
            this.positionAtStuckPoint = this.getPosition().clone();
        }
        console.log("ShouldMoveFwrd: " + this.shouldMoveForward());
        if (!this.shouldMoveForward()) {
            this.isAcceleratorPressed = false;
            this.brake();
            if ( this.getPosition().clone().sub(this.positionAtStuckPoint).length() >= 10 ) {
                this.releaseBrakes();
                this.isStuck = false;
                this.positionAtStuckPoint = undefined;
            }
        } else {
            this.isStuck = false;
        }
    }

    // https://mathoverflow.net/a/44098
    private isCarOnLeftSideOfRoad(): boolean {
        const intersections: Array<Vector2> = this.Information.IntersectionPositions;
        const previousCheckpoint: number = this.Information.nextCheckpoint - 1 < 0 ? this.Information.Checkpoints.length - 1 :
                                                                                     this.Information.nextCheckpoint - 1;
        const triangle: Matrix3 = new Matrix3().fromArray(
            [1, 1, 1,
             this.getPosition().x, intersections[this.Information.nextCheckpoint].x, intersections[previousCheckpoint].x,
             this.getPosition().z, intersections[this.Information.nextCheckpoint].y, intersections[previousCheckpoint].y]);

        return triangle.determinant() < 0;
    }

    private shouldMoveForward(): boolean {
        const carDirection: Vector2 = new Vector2( this.direction.x, this.direction.z).normalize();
        const perpendicularToTrackDirection: Vector2 = new Vector2(-this.trackDirection().y, this.trackDirection().x);
        const isFacingLeft: boolean = carDirection.dot(perpendicularToTrackDirection.normalize()) >= 0;
        if (this.isCarOnLeftSideOfRoad()) {
            return !isFacingLeft;
        } else {
            return isFacingLeft;
        }
    }

    private trackDirection(): Vector2 {
        const previousCheckpoint: number = (this.Information.nextCheckpoint - 1 < 0) ? this.Information.Checkpoints.length - 1 :
                                            this.Information.nextCheckpoint - 1;

        return new Vector2().subVectors(this.Information.IntersectionPositions[this.Information.nextCheckpoint],
                                        this.Information.IntersectionPositions[previousCheckpoint]).normalize();
    }
}
