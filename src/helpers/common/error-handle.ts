import { HttpException } from "@nestjs/common";
import logger from "utils/logger";

export const errorMessageHandle = (error: { message: string; statusCode: number }, methodName: string) => {
    logger?.error(`${methodName} - Error: `, error);
    const errorMessage = error?.message || "Internal server error";
    const statusCode = error instanceof HttpException ? error?.getStatus() : error?.statusCode;
    throw new HttpException(
        {
            status: statusCode,
            message: errorMessage,
        },
        statusCode,
    );
};
