import { Injectable } from "@angular/core";
import Stats = require("stats.js");
import { WebGLRenderer, Scene, AmbientLight,
         AxisHelper, Mesh, PlaneBufferGeometry, MeshBasicMaterial,
         DoubleSide, Texture, RepeatWrapping, TextureLoader } from "three";
import { Car } from "../car/car";
import { ThirdPersonCamera } from "../camera/camera-perspective";
// import { TopViewCamera } from "../camera/camera-orthogonal";
import { /*INITIAL_CAMERA_POSITION_Y, FRUSTUM_RATIO,*/ PI_OVER_2 } from "../../constants";
import { Skybox } from "../skybox/skybox";

export const FAR_CLIPPING_PLANE: number = 1000;
export const NEAR_CLIPPING_PLANE: number = 1;
export const FIELD_OF_VIEW: number = 70;

const WHITE: number = 0xFFFFFF;
const AMBIENT_LIGHT_OPACITY: number = 0.5;

@Injectable()
export class RenderService {
    // private camera: TopViewCamera;
    private camera: ThirdPersonCamera;
    private container: HTMLDivElement;
    private _car: Car;
    private renderer: WebGLRenderer;
    private scene: THREE.Scene;
    private stats: Stats;
    private lastDate: number;

    public get car(): Car {
        return this._car;
    }

    public constructor() {
        this._car = new Car();
    }

    public async initialize(container: HTMLDivElement): Promise<void> {
        if (container) {
            this.container = container;
        }

        await this.createScene();
        this.initStats();
        this.startRenderingLoop();
    }

    private initStats(): void {
        this.stats = new Stats();
        this.stats.dom.style.position = "absolute";
        this.container.appendChild(this.stats.dom);
    }

    private update(): void {
        const timeSinceLastFrame: number = Date.now() - this.lastDate;
        this._car.update(timeSinceLastFrame);
        this.camera.update(this._car);
        this.lastDate = Date.now();
    }

    private async createScene(): Promise<void> {
        this.scene = new Scene();
        // Decomment to view the third person camera and comment the orthogonal camera below
        //
        this.camera = new ThirdPersonCamera(
             FIELD_OF_VIEW,
             NEAR_CLIPPING_PLANE,
             FAR_CLIPPING_PLANE,
             this.container.clientWidth,
             this.container.clientHeight
         );

        /* this.camera = new TopViewCamera(-this.container.clientWidth / FRUSTUM_RATIO,
                                           this.container.clientWidth / FRUSTUM_RATIO,
                                           this.container.clientHeight / FRUSTUM_RATIO,
                                           -this.container.clientHeight / FRUSTUM_RATIO,
                                           1, INITIAL_CAMERA_POSITION_Y + 1); // Add 1 to see the floor */

        await this._car.init();
        this.camera.init(this._car.getPosition());
        this.scene.add(this._car);
        this.scene.add(new AmbientLight(WHITE, AMBIENT_LIGHT_OPACITY));

        // Addon for the floor and axis for future parts (Will be deleted in future fonctionalities)
        const axesHelper: AxisHelper = new AxisHelper();
        this.scene.add( axesHelper );

        const TEXTURE_TILE_SIZE: number = 10;
        const TEXTURE_SIZE: number = 100;
        /* tslint:disable */
        // Loading picture with its URI
        const floorTexture: Texture = new TextureLoader().load("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAEAAQADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigD4AooooAKKKKACiiigAooooA+/6KKKACiiigAooooAKKKKAPgCiiigAooooAKKKKACiiigD7/ooooAKKKKACiiigAooooA+AKKKKACiiigAooooAKKKKAPv+iiigAooooAKKKKACiiigD4AooooAKKKKACiiigAooooA+/6KKKACiiigAooooAKKKKAPgCiiigAooooAKKKKACiiigD7/ooooAKKKKACiiigAooooA+AKKKKACiiigAooooAKKKKAPv+iiigAooooAKKKKACiiigD4AooooAKKKKACiiigAooooA+/6KKKACiiigAooooAKKKKAPgCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA+/6KKKACiiigAooooAKKKKAPgCiiigAooooAKKKKACiiigD7/ooooAKKKKACiiigAooooA+AKKKKACiiigAooooAKKKKAPv+iiigAooooAKKKKACiiigD4AooooAKKKKACiiigAooooA+/6KKKACiiigAooooAKKKKAPgCiiigAooooAKKKKACiiigD7/ooooAKKKKACiiigAooooA+AKKKKACiiigAooooAKKKKAPv+iiigAooooAKKKKACiiigD4AooooAKKKKACiiigAooooA+/6KKKACiiigAooooAKKKKAPgCiiigAooooAKKKKACiiigD7/ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAPgCiiigAooooAKKKKACiiigD7/ooooAKKKKACiiigAooooA+AKKKKACiiigAooooAKKKKAPv+iiigAooooAKKKKACiiigD4AooooAKKKKACiiigAooooA+/6KKKACiiigAooooAKKKKAPgCiiigAooooAKKKKACiiigD7/ooooAKKKKACiiigAooooA+AKKKKACiiigAooooAKKKKAPv+iiigAooooAKKKKACiiigD4AooooAKKKKACiiigAooooA+/6KKKACiiigAooooAKKKKAPgCiiigAooooAKKKKACiiigD7/ooooAKKKKACiiigAooooA+AKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigD7/ooooAKKKKACiiigAooooA+AKKKKACiiigAooooAKKKKAPv+iiigAooooAKKKKACiiigD4AooooAKKKKACiiigAooooA+/6KKKACiiigAooooAKKKKAPgCiiigAooooAKKKKACiiigD7/ooooAKKKKACiiigAooooA+AKKKKACiiigAooooAKKKKAPv+iiigAooooAKKKKACiiigD4AooooAKKKKACiiigAooooA+/6KKKACiiigAooooAKKKKAPgCiiigAooooAKKKKACiiigD7/ooooAKKKKACiiigAooooA+AKKKKACiiigAooooAKKKKAPv+iiigAooooAKKKKACiiigD//2Q==");
        /* tslint:enable */
        floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
        floorTexture.repeat.set(TEXTURE_TILE_SIZE, TEXTURE_TILE_SIZE);
        const geometry: PlaneBufferGeometry = new PlaneBufferGeometry(TEXTURE_SIZE, TEXTURE_SIZE, 1, 1);
        const material: MeshBasicMaterial = new MeshBasicMaterial( { map: floorTexture, side: DoubleSide } );
        const mesh: Mesh = new Mesh( geometry, material );
        mesh.rotation.x = PI_OVER_2;

        const skybox: Skybox = new Skybox(1, TEXTURE_SIZE);

        this.scene.add( mesh );
        this.scene.add(skybox.Sky);
    }

    private startRenderingLoop(): void {
        this.renderer = new WebGLRenderer();
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

        this.lastDate = Date.now();
        this.container.appendChild(this.renderer.domElement);
        this.render();
    }

    private render(): void {
        requestAnimationFrame(() => this.render());
        this.update();
        this.renderer.render(this.scene, this.camera);
        this.stats.update();
    }

    public onResize(): void {
        this.camera.onResize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
}