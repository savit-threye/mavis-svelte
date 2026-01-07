import type { DynamicEntityModel, IHeaderOption, StaticViewerEntityModel } from "$lib/interfaces";
import { CoordProperties } from "./coordParser";

export const convertToEntity = (
    data: string,
    header: IHeaderOption
): StaticViewerEntityModel & DynamicEntityModel => {
    const parts = data.split(",");
    const properties: StaticViewerEntityModel & DynamicEntityModel = {};
    let id = properties.id = parts.shift() as string;
    let TParesent = false

    // properties.isCgf = parts.some((part) => part.startsWith("CallSign="))
    //   ? false
    //   : true;

    parts.forEach((part) => {
        const [key, value] = part.split("=");

        switch (key) {
            case "Name":
                properties.Name = value;
                break;
            case "Type":
                properties.Type = value;
                break;
            case "Color":
                properties.Color = value;
                break;
            case "Coalition":
                properties.Coalition = value;
                break;
            case "CallSign":
                properties.isCgf = false;
                properties.CallSign = value;
                break;
            case "Visible":
                properties.Visible = value === "1";
                break;
            case "VerticalEngagementRange":
                properties.verticalEngagementRange = value ? parseInt(value) : 0;
                break;
            case "EngagementRange":
                properties.engagementRange = value ? parseInt(value) : 0;
                break;
            case "T":
                TParesent = true
                const coords = CoordProperties.getInstance().setProperties(
                    id,
                    value.split("|"),
                    header
                );
                properties.Altitude = coords.Altitude;
                properties.Longitude = coords.Longitude;
                properties.Latitude = coords.Latitude;
                properties.Roll = coords.Roll;
                properties.Pitch = coords.Pitch;
                properties.Yaw = coords.Yaw;
                break;
            case "Debug":
                properties.Debug = value;
                break;
        }
    });

    if (!TParesent) {
        const coords = CoordProperties.getInstance().setProperties(
            id,
            ["", "", "", "", "", ""],
            header
        );
        properties.Altitude = coords.Altitude;
        properties.Longitude = coords.Longitude;
        properties.Latitude = coords.Latitude;
        properties.Roll = coords.Roll;
        properties.Pitch = coords.Pitch;
        properties.Yaw = coords.Yaw;
    }

    return properties;
};