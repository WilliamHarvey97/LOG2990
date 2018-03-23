import { Injectable } from "@angular/core";
import Stats = require("stats.js");
import { WebGLRenderer, Scene, AmbientLight,
         Mesh, PlaneBufferGeometry, MeshBasicMaterial,
         Vector2, BackSide, CircleBufferGeometry,
         Texture, RepeatWrapping, TextureLoader, ObjectLoader, Object3D } from "three";
import { Car } from "../car/car";
import { ThirdPersonCamera } from "../camera/camera-perspective";
import { TopViewCamera } from "../camera/camera-orthogonal";
import { INITIAL_CAMERA_POSITION_Y, FRUSTUM_RATIO, PI_OVER_2, HALF } from "../../constants";
import { Skybox } from "../skybox/skybox";
import { CameraContext } from "../camera/camera-context";
import { ITrack, TrackType } from "../../../../../common/interfaces/ITrack";
import { CollisionManager } from "../car/collision-manager";

export const FAR_CLIPPING_PLANE: number = 1000;
export const NEAR_CLIPPING_PLANE: number = 1;
export const FIELD_OF_VIEW: number = 70;

const WHITE: number = 0xFFFFFF;
const AMBIENT_LIGHT_OPACITY: number = 0.5;
const TEXTURE_TILE_REPETIONS: number = 200;
const WORLD_SIZE: number = 1000;
const FLOOR_SIZE: number = WORLD_SIZE / HALF;
const ROAD_WIDTH: number = 10;
const QUARTER_ROAD_WIDTH: number = 2.5;
const SUPERPOSITION: number = 0.001;
const CAR_OFFSET_FROM_STARTLINE: number = 0.01;
const PLAYER: number = 0;
const NUMBER_OF_CARS: number = 4;

@Injectable()
export class RenderService {
    private cameraContext: CameraContext;
    private container: HTMLDivElement;
    private cars: Array<Car>;
    private renderer: WebGLRenderer;
    private scene: THREE.Scene;
    private stats: Stats;
    private lastDate: number;
    private superposition: number;
    private activeTrack: ITrack;
    private floorTextures: Map<TrackType, Texture>;

    private collisionManager: CollisionManager;

    public get car(): Car {
        return this.cars[PLAYER];
    }

    public get CameraContext(): CameraContext {
        return this.cameraContext;
    }

    public constructor() {
        this.cars = new Array<Car>();
        for (let i: number = 0; i < NUMBER_OF_CARS; i++) {
            this.cars.push(new Car());
        }
        this.floorTextures = new Map<TrackType, Texture>();
        this.superposition = 0;
        this.collisionManager = new CollisionManager();
    }

    public async initialize(container: HTMLDivElement, track: ITrack): Promise<void> {
        if (container) {
            this.container = container;
        }
        this.activeTrack = track;
        this.initFloorTextures();

        await this.createScene();
        this.initStats();
        this.startRenderingLoop();
    }

    public onResize(): void {
        this.cameraContext.onResize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    private initStats(): void {
        this.stats = new Stats();
        this.stats.dom.style.position = "absolute";
        this.container.appendChild(this.stats.dom);
    }

    private initFloorTextures(): void {
        const textureLoader: TextureLoader = new TextureLoader();
        this.floorTextures.set(TrackType.REGULAR, textureLoader.load("/assets/grass.jpg"));
    }

    private update(): void {
        const timeSinceLastFrame: number = Date.now() - this.lastDate;
        this.cars.forEach((car: Car) => car.update(timeSinceLastFrame));
        this.cameraContext.update(this.cars[PLAYER]);
        this.lastDate = Date.now();
        this.collisionManager.update();
    }

    private async createScene(): Promise<void> {
        this.scene = new Scene();
        this.cameraContext = new CameraContext();
        this.cameraContext.addState(new ThirdPersonCamera(FIELD_OF_VIEW,
                                                          NEAR_CLIPPING_PLANE,
                                                          FAR_CLIPPING_PLANE,
                                                          this.container.clientWidth,
                                                          this.container.clientHeight));

        this.cameraContext.addState(new TopViewCamera(-this.container.clientWidth / FRUSTUM_RATIO,
                                                      this.container.clientWidth / FRUSTUM_RATIO,
                                                      this.container.clientHeight / FRUSTUM_RATIO,
                                                      -this.container.clientHeight / FRUSTUM_RATIO,
                                                      1, INITIAL_CAMERA_POSITION_Y + 1)); // Add 1 to see the floor

        await this.createCars();

        this.cameraContext.initStates(this.cars[PLAYER].getPosition());
        this.cameraContext.setInitialState();

        this.scene.add(new AmbientLight(WHITE, AMBIENT_LIGHT_OPACITY));

        const skybox: Skybox = new Skybox();
        this.scene.background = skybox.CubeTexture;
        this.scene.add(this.createFloorMesh());
        this.generateTrack();
    }

    private async createCars(): Promise<void> {
        for (const car of this.cars) {
            await car.init();
            this.collisionManager.addCar(car);
            this.scene.add(car);
        }
    }

    private generateTrack(): void {
        for (let i: number = 0; i < this.activeTrack.points.length - 1; ++i) {
            this.scene.add(this.createRoad(i));
            this.scene.add(this.createIntersection(i));
        }
    }

    private generateStartLine(firstRoad: Vector2): void {
        const loader: ObjectLoader = new ObjectLoader;
        loader.load("../../assets/startLine.json", (startLine: Object3D) => {
            startLine.position.x = -(this.activeTrack.points[0].y + firstRoad.y * HALF) * WORLD_SIZE + WORLD_SIZE * HALF;
            startLine.position.z = -(this.activeTrack.points[0].x + firstRoad.x * HALF) * WORLD_SIZE + WORLD_SIZE * HALF;
            startLine.rotation.y = firstRoad.x === 0 ? PI_OVER_2 : Math.atan(firstRoad.y / firstRoad.x);
            this.scene.add(startLine);
            this.placeCarsBehindStartLine(firstRoad, startLine);
            this.setCarsInitialPosition(firstRoad, startLine);
        });
    }

    private placeCarsBehindStartLine(firstRoad: Vector2, startLine: Object3D): void {
        for (const car of this.cars) {
            car.Mesh.position.x = startLine.position.x - ( CAR_OFFSET_FROM_STARTLINE * WORLD_SIZE ) * firstRoad.y / firstRoad.length();
            car.Mesh.position.z = startLine.position.z - ( CAR_OFFSET_FROM_STARTLINE * WORLD_SIZE ) * firstRoad.x / firstRoad.length();
            car.Mesh.rotation.y = car.Mesh.position.length() < startLine.position.length() ?
                                  startLine.rotation.y + Math.PI : startLine.rotation.y;
        }
    }

    private setCarsInitialPosition(firstRoad: Vector2, startLine: Object3D): void {
        const CAR_OFFSET_FROM_EACH_OTHER: number = 5;
        const EVEN: number = 2;
        let row: number = 0 ;
        let column: number = 0;
        const shuffledCars: Array<Car> = this.cars.slice();
        this.shuffleCars(shuffledCars);
        const perpendicularDirection: Vector2 = new Vector2(-firstRoad.y, firstRoad.x);
        for (let i: number = 0; i < shuffledCars.length; i++) {
            column = i % EVEN;
            shuffledCars[i].Mesh.position.x += (row * CAR_OFFSET_FROM_EACH_OTHER - QUARTER_ROAD_WIDTH)
            * perpendicularDirection.y / perpendicularDirection.length();
            shuffledCars[i].Mesh.position.z += (row * CAR_OFFSET_FROM_EACH_OTHER - QUARTER_ROAD_WIDTH)
            * perpendicularDirection.x / perpendicularDirection.length();
            shuffledCars[i].Mesh.position.x += Math.pow(-1, column) * CAR_OFFSET_FROM_EACH_OTHER * firstRoad.y / firstRoad.length();
            shuffledCars[i].Mesh.position.z += Math.pow(-1, column) * CAR_OFFSET_FROM_EACH_OTHER * firstRoad.x / firstRoad.length();
            if (column === 1) {
                row++;
            }
        }
    }

    // Fisher-Yates Algorithm
    private shuffleCars(cars: Array<Car>): void {
        let currentIndex: number = cars.length;
        let temporaryValue: Car;
        let randomIndex: number;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            temporaryValue = cars[currentIndex];
            cars[currentIndex] = cars[randomIndex];
            cars[randomIndex] = temporaryValue;
        }
    }

    private createRoad(index: number): Mesh {
        const trackTexture: Texture = new TextureLoader().load("/assets/road.jpg");
        trackTexture.wrapS = RepeatWrapping;
        const road: Vector2 = new Vector2(this.activeTrack.points[index + 1].x -
                                          this.activeTrack.points[index].x,
                                          this.activeTrack.points[index + 1].y -
                                          this.activeTrack.points[index].y);
        if (index === 0) {
            this.generateStartLine(road);
        }
        const plane: PlaneBufferGeometry = new PlaneBufferGeometry(road.length() * WORLD_SIZE, ROAD_WIDTH);
        const mesh: Mesh = new Mesh(plane, new MeshBasicMaterial({ map: trackTexture, side: BackSide }));
        trackTexture.repeat.set(road.length() * TEXTURE_TILE_REPETIONS, 1);
        mesh.position.x = -(this.activeTrack.points[index].y + road.y * HALF) * WORLD_SIZE + WORLD_SIZE * HALF;
        mesh.position.z = -(this.activeTrack.points[index].x + road.x * HALF) * WORLD_SIZE + WORLD_SIZE * HALF;
        mesh.rotation.x = PI_OVER_2;
        mesh.rotation.z = road.y === 0 ? PI_OVER_2 : Math.atan(road.x / road.y);
        this.superimpose(mesh);

        return mesh;
    }

    private createIntersection(index: number): Mesh {
        const POLYGONS_NUMBER: number = 32;
        const trackTexture: Texture = new TextureLoader().load("/assets/road.jpg");
        const circle: CircleBufferGeometry = new CircleBufferGeometry(ROAD_WIDTH * HALF, POLYGONS_NUMBER);
        const mesh: Mesh = new Mesh(circle, new MeshBasicMaterial({ map: trackTexture, side: BackSide }));
        mesh.position.x = -(this.activeTrack.points[index].y) * WORLD_SIZE + WORLD_SIZE * HALF;
        mesh.position.z = -(this.activeTrack.points[index].x) * WORLD_SIZE + WORLD_SIZE * HALF;
        mesh.rotation.x = PI_OVER_2;
        this.superimpose(mesh);

        return mesh;
    }

    private createFloorMesh(): Mesh {
        this.floorTextures.get(this.activeTrack.type).wrapS = this.floorTextures.get(this.activeTrack.type).wrapT = RepeatWrapping;
        this.floorTextures.get(this.activeTrack.type).repeat.set(TEXTURE_TILE_REPETIONS, TEXTURE_TILE_REPETIONS);
        const mesh: Mesh = new Mesh(new PlaneBufferGeometry(FLOOR_SIZE, FLOOR_SIZE, 1, 1),
                                    new MeshBasicMaterial({ map: this.floorTextures.get(this.activeTrack.type), side: BackSide }));
        mesh.rotation.x = PI_OVER_2;

        return mesh;
    }

    private superimpose(mesh: Mesh): void {
        this.superposition += SUPERPOSITION;
        mesh.position.y = this.superposition;
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
        this.renderer.render(this.scene, this.cameraContext.CurrentState);
        this.stats.update();
    }
}
