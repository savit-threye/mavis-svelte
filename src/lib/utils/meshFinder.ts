
import type { IPropertiesOption } from "$lib/interfaces";
import meshData from "../data/meshes.json";

// Iterate over metadata
/**
 * Clean a string by removing any special characters, spaces, or punctuation.
 * @param {string} str - The string to clean.
 * @returns {string} The cleaned string.
 */
function cleanString(str: string) {
    return str?.replace(/[-_!@#$%^&()\s]/g, "");
}

/**
 * Split a string by "+" and clean each part.
 * @param {string[]} typeArray - The array of strings to split and clean.
 * @returns {string[]} The cleaned array of strings.
 */
function splitAndCleanType(typeArray: string[]) {
    return typeArray
        ? typeArray
            .flatMap((type: any) => type?.split("+")) // Split by "+"
            .map((type: any) => cleanString(type)) // Clean each part
        : [];
}

/**
 * Find the highest matching character count between a word and an input string.
 * @param {string[]} arr - The array of strings to search.
 * @param {string} inputStr - The input string to search for.
 * @returns {number} The highest matching character count.
 */
function findHighestMatchingCharacterCount(arr: string[], inputStr: string) {
    let maxCount = 0;

    arr.forEach((word: any) => {
        let i = 0,
            j = 0,
            count = 0,
            maxSubStr = "";

        if (word === "*") {
            maxCount = 1;
            return;
        }

        while (i < word.length && j < inputStr?.length) {
            if (word[i] === inputStr[j]) {
                count++;
                maxSubStr += word[i]; // Build the matched substring
                j++; // Move inputStr pointer
            }
            i++; // Always move word pointer
        }

        // Update best match if the current word has a higher matching count

        if (count > maxCount) {
            maxCount = count;
        }
    });

    return maxCount;
}

const classType = [
    "Air",
    "Ground",
    "Sea",
    "Weapon",
    "Sensor",
    "Navaid",
    "Misc",
    "Space",
];
const attributeType = ["Static", "Heavy", "Medium", "Light", "Minor"];
const basicType = [
    "FixedWing",
    "Rotorcraft",
    "Armor",
    "AntiAircraft",
    "Vehicle",
    "Watercraft",
    "Human",
    "Biologic",
    "Missile",
    "Rocket",
    "Bomb",
    "Torpedo",
    "Projectile",
    "Beam",
    "Decoy",
    "Building",
    "Bullseye",
    "Waypoint",
    "Spacecraft",
];
const specificType = [
    "Tank",
    "Warship",
    "AircraftCarrier",
    "Submarine",
    "Infantry",
    "Parachutist",
    "Shell",
    "Bullet",
    "Grenade",
    "Flare",
    "Chaff",
    "SmokeGrenade",
    "Aerodrome",
    "Container",
    "Shrapnel",
    "Explosion",
];

/**
 * Find the best matching mesh based on the input type and name.
 * @param {string} inputType - The type of the mesh to search for.
 * @param {string} name - The name of the mesh to search for.
 * @returns {IPropertiesOption | null} The best matching mesh or null if no match is found.
 */
export const meshFinder = (inputType: string, name: string) => {
    const cleanedTargetTypes = splitAndCleanType([inputType]); // Split and clean the input type
    const cleanedTargetName = cleanString(name); // Clean the input name

    const type: IPropertiesOption = {
        class: null,
        attribute: null,
        basic: null,
        specific: null,
    };

    cleanedTargetTypes.forEach((targetType) => {
        if (classType.includes(targetType)) {
            type.class = targetType;
        } else if (attributeType.includes(targetType)) {
            type.attribute = targetType;
        } else if (basicType.includes(targetType)) {
            type.basic = targetType;
        } else if (specificType.includes(targetType)) {
            type.specific = targetType;
        }
    });

    let bestMatch = null;
    let highestMatchCount = 0;

    (Object.keys(meshData) as Array<keyof typeof meshData>).forEach((key) => {
        const mesh = meshData[key];

        mesh.forEach((item: any) => {
            const hasName = item.hasOwnProperty("Name");
            const hasType = item.hasOwnProperty("Type");

            if (hasName && hasType) {
                let isTypeMatch = true;
                if (inputType !== "++") {
                    const itemType = splitAndCleanType(item.Type);
                    const additionalType = splitAndCleanType(item.AdditionalType);

                    let itemTypeParts: any = new Set([...itemType, additionalType]);

                    const itemTypePartsTemp = Array.from(itemTypeParts);
                    itemTypeParts = {
                        class: null,
                        attribute: null,
                        basic: null,
                        specific: null,
                    };

                    itemTypePartsTemp.forEach((itemTypeEach: any) => {
                        if (classType.includes(itemTypeEach)) {
                            itemTypeParts.class = itemTypeEach;
                        } else if (attributeType.includes(itemTypeEach)) {
                            itemTypeParts.attribute = itemTypeEach;
                        } else if (basicType.includes(itemTypeEach)) {
                            itemTypeParts.basic = itemTypeEach;
                        } else if (specificType.includes(itemTypeEach)) {
                            itemTypeParts.specific = itemTypeEach;
                        }
                    });

                    (
                        Object.keys(itemTypeParts) as Array<keyof IPropertiesOption>
                    ).forEach((key) => {
                        if (
                            itemTypeParts[key] !== null &&
                            itemTypeParts[key] !== type[key]
                        ) {
                            isTypeMatch = false;
                        }
                    });
                }

                if (isTypeMatch) {
                    const itemNames = item.Name
                        ? item.Name.map((name: string) => cleanString(name))
                        : [];

                    // Find the best name match within the filtered items
                    const maxCount = findHighestMatchingCharacterCount(
                        itemNames,
                        cleanedTargetName
                    );

                    if (maxCount > highestMatchCount) {
                        highestMatchCount = maxCount;
                        bestMatch = item;
                    }
                }
            }
        });
    });

    return bestMatch;
};
