import * as csv from "csv-parser";
import { Readable } from "stream";
import logger from "utils/logger";

export const iterateObject = (requestObj, superKey = "", processObj = {}) => {
    Object.keys(requestObj).forEach((key) => {
        const sk = `${superKey}.${key}`;
        if (requestObj[key] !== null && requestObj[key] !== undefined && requestObj[key].constructor === Object) {
            processObj = iterateObject(requestObj[key], sk, processObj);
        } else {
            processObj[`${sk.slice(1)}`] = requestObj[key];
        }
    });
    return processObj;
};

export const bufferToStream = (buffer: Buffer): Readable => {
    try {
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);
        return stream;
    } catch (error) {
        logger?.error("bufferToStream - Error: ", error);
    }
};

export const parseCSV = async (buffer: Buffer): Promise<any[]> => {
    try {
        return await new Promise((resolve, reject) => {
            const results = [];
            const stream = bufferToStream(buffer);
            stream
                .pipe(csv())
                .on("data", (data) => results.push(data))
                .on("end", () => resolve(results))
                .on("error", (error) => reject(error));
        });
    } catch (error) {
        logger?.error("parseCSV - Error: ", error);
    }
};
