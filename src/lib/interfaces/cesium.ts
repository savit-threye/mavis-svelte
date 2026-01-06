
export interface IPolyline {
    position?: any;
    data?: any;
    key?: any;
    name?: string;
    width?: number;
    color?: any;
    cesiumRef?: any;
    show?: boolean;
}

export interface IBox {
    position?: any;
    data?: any;
    key?: any;
    name?: string;
    width?: number;
    color?: any;
}

export interface IModel {
    uri?: string;
    minimumPixelSize?: any;
    key?: any;
    shadows?: number;
    color?: any;
    maximumScale?: any;
}

export interface ILabel {
    text?: string;
    show?: boolean;
    horizontalOrigin?: any;
    verticalOrigin?: any;
    fillColor?: any;
    showBackground?: boolean;
    backgroundColor?: any;
    backgroundPadding?: any;
    pixelOffset?: any;
    disableDepthTestDistance?: any;
}

export interface IEntity {
    id: string;
    name: string;
    Polyline?: IPolyline;
    Box?: IBox;
    Model?: IModel;
    Label?: ILabel;
}

export interface IPoint {
    key?: any;
    name?: string;
    outlineWidth?: number;
    color?: any;
    cesiumRef?: any;
    show?: boolean;
}