import type { IHeaderOption } from "$lib/interfaces";


/**
 * Parses the header data from a string and returns an object with the parsed values.
 * @param {string} data - The header data as a string.
 * @returns {IHeaderOption} An object containing the parsed header values.
 */
export const parseHeader = (data: string) => {
    // Initialize headerData with default values
    const headerData: IHeaderOption = {
        FileType: "",
        FileVersion: "",
        ReferenceTime: "",
        ReferenceLongitude: 0,
        ReferenceLatitude: 0,
        Title: "",
    };

    // Split the input data by newlines and process each line
    data.split("\n").forEach((item: string) => {
        const [key, value] = item.split("=");

        // Map the key to the corresponding field in headerData
        switch (true) {
            case key.includes("FileType"):
                headerData.FileType = value;
                break;
            case key.includes("FileVersion"):
                headerData.FileVersion = value;
                break;
            case key.includes("ReferenceTime"):
                headerData.ReferenceTime = value;
                break;
            case key.includes("ReferenceLongitude"):
                headerData.ReferenceLongitude = parseFloat(value);
                break;
            case key.includes("ReferenceLatitude"):
                headerData.ReferenceLatitude = parseFloat(value);
                break;
            case key.includes("Title"):
                headerData.Title = value;
                break;
        }
    });

    // Return the populated headerData object
    return headerData;
};
