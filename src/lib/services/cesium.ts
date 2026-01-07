import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

export interface CesiumServiceConfig {
    accessToken?: string;
}

export class CesiumService {
    private static viewer: Cesium.Viewer | null = null;
    private static DEFAULT_TOKEN =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI1OGEyYWQ4MS0yZDRlLTRlOWYtYjRmNy1hYzVhYzE4Yzg0MDgiLCJpZCI6MTIwMTY5LCJpYXQiOjE2NzI3NDY1OTh9.p3YAFdYWw1FmX-67dQAnbbEVOpVOW1JU_sRXlgSNe9A';

    static initialize(container: HTMLElement, config: CesiumServiceConfig = {}): Cesium.Viewer {
        const accessToken = config.accessToken ?? CesiumService.DEFAULT_TOKEN;
        Cesium.Ion.defaultAccessToken = accessToken;


        CesiumService.viewer = new Cesium.Viewer(container, {
            terrain: Cesium.Terrain.fromWorldTerrain(),
            timeline: true,
            animation: true,
            shouldAnimate: true,
            infoBox: false,
            selectionIndicator: false
        });

        CesiumService.viewer.scene.debugShowFramesPerSecond = true;

        return CesiumService.viewer;
    }

    static getViewer(): Cesium.Viewer | null {
        return CesiumService.viewer;
    }

    static addEntity(entityOptions: Cesium.Entity.ConstructorOptions): Cesium.Entity | undefined {
        return CesiumService.viewer?.entities.add(entityOptions);
    }

    static removeEntity(entity: Cesium.Entity): boolean {
        return CesiumService.viewer?.entities.remove(entity) ?? false;
    }

    static removeEntityById(id: string): boolean {
        return CesiumService.viewer?.entities.removeById(id) ?? false;
    }

    static getEntityById(id: string): Cesium.Entity | undefined {
        return CesiumService.viewer?.entities.getById(id);
    }

    static clearEntities(): void {
        CesiumService.viewer?.entities.removeAll();
    }

    static zoomToEntities(): void {
        if (CesiumService.viewer) {
            CesiumService.viewer.zoomTo(CesiumService.viewer.entities);
        }
    }

    static flyTo(entity: Cesium.Entity): void {
        CesiumService.viewer?.flyTo(entity);
    }

    static destroy(): void {
        if (CesiumService.viewer && !CesiumService.viewer.isDestroyed()) {
            CesiumService.viewer.destroy();
            CesiumService.viewer = null;
        }
    }

    static isInitialized(): boolean {
        return CesiumService.viewer !== null && !CesiumService.viewer.isDestroyed();
    }
}
