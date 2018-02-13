
import { Camera, Vector3, PerspectiveCamera } from "three";
import { Car } from "../car/car";

export abstract class GameCamera extends Camera {
    public abstract zoomIn(): void;
    public abstract zoomOut(): void;
    public abstract update(car: Car): void;
    public abstract init(lookAt: Vector3): void;
    public abstract onResize(width: number, height: number): void;
}
