import type { ICoordOption, IHeaderOption } from "../interfaces/socket";



/**
 * @description: This class is used to parse and manage coordinate properties.
 * It provides methods to set properties, calculate roll and pitch, and convert
 * between geodetic and Cartesian coordinates.
 */
interface CoordProperty {
    [key: string]: ICoordOption;
}

/**
 * @description: This class is a singleton that manages coordinate properties.
 * It provides methods to set properties, calculate roll and pitch, and convert
 * between geodetic and Cartesian coordinates.
 */
export class CoordProperties {
    private coordsProperties: CoordProperty; // Store coordinate properties by ID
    // private coordinateProperties: CoordinateProperty;
    private static instance: CoordProperties;
    private earthRadius = 6371000;

    // Private constructor to prevent direct instantiation
    private constructor() {
        this.coordsProperties = {};
        // this.coordinateProperties = {};
    }

    /**
     * @description: Returns the singleton instance of CoordProperties.
     * @returns {CoordProperties} The singleton instance of CoordProperties.
     */
    public static getInstance(): CoordProperties {
        if (!CoordProperties.instance) {
            CoordProperties.instance = new CoordProperties();
        }
        return CoordProperties.instance;
    }

    /**
     * @description: Sets the properties of a coordinate based on the provided ID, coordinates, and header.
     * @param {string} id - The ID of the coordinate.
     * @param {string[]} coords - The coordinates to set.
     * @param {IHeaderOption} header - The header containing reference values.
     * @returns {ICoordOption} The updated coordinate properties.
     */
    setProperties(
        id: string,
        coords: string[],
        header: IHeaderOption
    ): ICoordOption {
        if (!this.coordsProperties[id]) {
            this.coordsProperties[id] = {
                Latitude: 0,
                Longitude: 0,
                Altitude: 0,
                Roll: 0,
                Pitch: 0,
                Yaw: 0,
            };
        }

        this.coordsProperties[id] = this.parseCoords(
            coords.map((coord) => parseFloat(coord)),
            header,
            this.coordsProperties[id]
        );

        return this.coordsProperties[id];
    }

    /**
     * @description: Calculates the roll and pitch angles based on two geodetic coordinates.
     * @param {number} lat1 - Latitude of the first point.
     * @param {number} long1 - Longitude of the first point.
     * @param {number} alt1 - Altitude of the first point.
     * @param {number} lat2 - Latitude of the second point.
     * @param {number} long2 - Longitude of the second point.
     * @param {number} alt2 - Altitude of the second point.
     * @returns {{ yaw: number, pitch: number }} The calculated yaw and pitch angles in degrees.
     */
    calculateRollAndPitch(
        lat1: any,
        long1: any,
        alt1: any,
        lat2: any,
        long2: any,
        alt2: any
    ) {
        // point1 and point2 are objects with { lat, long, alt } properties

        // 1. Convert lat/long/alt to Cartesian coordinates
        const cartesian1 = this.geodeticToCartesian(lat1, long1, alt1);
        const cartesian2 = this.geodeticToCartesian(lat2, long2, alt2);

        // 2. Calculate direction vector
        const dx = cartesian2.x - cartesian1.x;
        const dy = cartesian2.y - cartesian1.y;
        const dz = cartesian2.z - cartesian1.z;

        // 3. Calculate pitch (elevation angle)
        // Pitch is angle from horizontal plane (up/down)
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        const pitch = Math.atan2(dy, horizontalDistance);

        // 4. Calculate yaw (heading angle)
        // Yaw is the angle in the horizontal plane (left/right)
        const yaw = Math.atan2(dx, dz);

        // Convert to degrees
        const pitchDegrees = pitch * (180 / Math.PI);
        const yawDegrees = yaw * (180 / Math.PI);

        return { yaw: yawDegrees, pitch: pitchDegrees };
    }

    // Helper function to convert geodetic coordinates to Cartesian
    geodeticToCartesian(lat: any, long: any, alt: any) {
        // Constants for WGS84 ellipsoid
        const a = 6378137.0; // semi-major axis in meters
        const e2 = 0.00669437999014; // square of eccentricity

        // Convert degrees to radians
        const latRad = lat * (Math.PI / 180);
        const longRad = long * (Math.PI / 180);

        // Calculate radius of curvature in the prime vertical
        const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) * Math.sin(latRad));

        // Calculate Cartesian coordinates
        const x = (N + alt) * Math.cos(latRad) * Math.cos(longRad);
        const y = (N + alt) * Math.cos(latRad) * Math.sin(longRad);
        const z = (N * (1 - e2) + alt) * Math.sin(latRad);

        return { x, y, z };
    }

    /**
     * @description: Parses the coordinates and updates the coordinate properties.
     * @param {number[]} coords - The coordinates to parse.
     * @param {IHeaderOption} header - The header containing reference values.
     * @param {ICoordOption} prevCoords - The previous coordinate properties.
     * @returns {ICoordOption} The updated coordinate properties.
     */
    parseCoords(
        coords: number[],
        header: IHeaderOption,
        prevCoords: ICoordOption
    ): ICoordOption {
        const coordProperties: ICoordOption = {
            Latitude: 0,
            Longitude: 0,
            Altitude: 0,
            Roll: 0,
            Pitch: 0,
            Yaw: 0,
        };

        switch (coords.length) {
            case 3:
                // const data = this.calculateRollAndPitch(
                //   prevCoords.Latitude,
                //   prevCoords.Longitude,
                //   prevCoords.Altitude,
                //   coords[0] + parseInt(header.ReferenceLatitude), // latitude
                //   coords[1] + parseInt(header.ReferenceLongitude), // longitude
                //   coords[2]
                // );
                coordProperties.Latitude = !isNaN(
                    coords[1] + header.ReferenceLatitude
                )
                    ? coords[1] + header.ReferenceLatitude
                    : prevCoords.Latitude;
                coordProperties.Longitude = !isNaN(
                    coords[0] + header.ReferenceLongitude
                )
                    ? coords[0] + header.ReferenceLongitude
                    : prevCoords.Longitude;
                coordProperties.Altitude = !isNaN(coords[2])
                    ? coords[2]
                    : prevCoords.Altitude;
                coordProperties.Roll = prevCoords.Roll;
                coordProperties.Pitch = prevCoords.Pitch;
                coordProperties.Yaw = prevCoords.Yaw;
                break;
            case 5:
                coordProperties.Latitude = !isNaN(
                    coords[1] + header.ReferenceLatitude
                )
                    ? coords[1] + header.ReferenceLatitude
                    : prevCoords.Latitude;
                coordProperties.Longitude = !isNaN(
                    coords[0] + header.ReferenceLongitude
                )
                    ? coords[0] + header.ReferenceLongitude
                    : prevCoords.Longitude;
                coordProperties.Altitude = !isNaN(coords[2])
                    ? coords[2]
                    : prevCoords.Altitude;
                // const { roll, pitch, yaw } = this.computeOrientation(
                //   coords[0],
                //   coords[1],
                //   coords[2],
                //   coords[3],
                //   coords[4]
                // );
                // coordProperties.Roll = !isNaN(roll) ? roll : prevCoords.Roll;
                // coordProperties.Pitch = !isNaN(pitch) ? pitch : prevCoords.Pitch;
                // coordProperties.Yaw = !isNaN(yaw) ? yaw : prevCoords.Yaw;
                coordProperties.Roll = prevCoords.Roll;
                coordProperties.Pitch = prevCoords.Pitch;
                coordProperties.Yaw = prevCoords.Yaw;
                break;
            case 6:
                coordProperties.Latitude = !isNaN(
                    coords[1] + header.ReferenceLatitude
                )
                    ? coords[1] + header.ReferenceLatitude
                    : prevCoords.Latitude;
                coordProperties.Longitude = !isNaN(
                    coords[0] + header.ReferenceLongitude
                )
                    ? coords[0] + header.ReferenceLongitude
                    : prevCoords.Longitude;
                coordProperties.Altitude = !isNaN(coords[2])
                    ? coords[2]
                    : prevCoords.Altitude;
                coordProperties.Roll = !isNaN(coords[3]) ? coords[3] : prevCoords.Roll;
                coordProperties.Pitch = !isNaN(coords[4])
                    ? coords[4]
                    : prevCoords.Pitch;
                coordProperties.Yaw = !isNaN(coords[5]) ? coords[5] : prevCoords.Yaw;
                break;
            case 9:
                coordProperties.Latitude = !isNaN(
                    coords[1] + header.ReferenceLatitude
                )
                    ? coords[1] + header.ReferenceLatitude
                    : prevCoords.Latitude;
                coordProperties.Longitude = !isNaN(
                    coords[0] + header.ReferenceLongitude
                )
                    ? coords[0] + header.ReferenceLongitude
                    : prevCoords.Longitude;
                coordProperties.Altitude = !isNaN(coords[2])
                    ? coords[2]
                    : prevCoords.Altitude;
                coordProperties.Roll = !isNaN(coords[3]) ? coords[3] : prevCoords.Roll;
                coordProperties.Pitch = !isNaN(coords[4])
                    ? coords[4]
                    : prevCoords.Pitch;
                coordProperties.Yaw = !isNaN(coords[5]) ? coords[5] : prevCoords.Yaw;
        }
        return coordProperties;
    }

    /**
     * @description: Converts latitude and longitude to meters.
     * @param {number} lat - The latitude in degrees.
     * @param {number} long - The longitude in degrees.
     * @returns {{ x: number, y: number }} The coordinates in meters.
     */
    latLongToMeters(lat: number, long: number) {
        const x =
            this.earthRadius *
            Math.cos((lat * Math.PI) / 180) *
            Math.cos((long * Math.PI) / 180);
        const y =
            this.earthRadius *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin((long * Math.PI) / 180);
        return { x, y };
    }

    /**
     * @description: Calculates the yaw angle based on the given u and v components.
     * @param {any} u - The u component.
     * @param {any} v - The v component.
     * @returns {number} The calculated yaw angle in degrees.
     */

    calculateYaw(u: any, v: any) {
        return Math.atan2(v, u) * (180 / Math.PI);
    }

    /**
     * @description: Computes the orientation based on latitude, longitude, altitude, and u/v components.
     * @param {number} lat - The latitude in degrees.
     * @param {number} long - The longitude in degrees.
     * @param {number} alt - The altitude in meters.
     * @param {any} u - The u component.
     * @param {any} v - The v component.
     * @returns {{ yaw: number, pitch: number, roll: number }} The computed orientation.
     */
    computeOrientation(lat: number, long: number, alt: number, u: any, v: any) {
        const { x, y } = this.latLongToMeters(lat, long);
        const yaw = this.calculateYaw(u, v);

        return {
            yaw,
            pitch: 0,
            roll: 0,
        };
    }
}
