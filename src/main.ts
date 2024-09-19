import { NestExpressApplication } from "@nestjs/platform-express";
import { LoggerInterceptor } from "logger/logger.interceptor";
import { NestFactory } from "@nestjs/core";
import * as bodyParser from "body-parser";
import { AppModule } from "./app.module";
import "./include/mongodb.connection";
import logger from "utils/logger";
import * as dotenv from "dotenv";
import * as morgan from "morgan";
import { CONFIG } from "config";
import * as cors from "cors";

async function bootstrap() {
    dotenv.config();
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.useGlobalInterceptors(new LoggerInterceptor());
    app.use(cors());
    app.setGlobalPrefix("v1");
    app.use(morgan("tiny"));
    app.use(bodyParser.json({ limit: "100mb" }));
    app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

    await app.listen(CONFIG.port, async () => {
        logger?.info(`VIVA Phonics server listening on ${CONFIG.port} in ${CONFIG.env} mode`);
        logger.info(`Application is running on: ${await app.getUrl()}`);
    });
}
bootstrap();
