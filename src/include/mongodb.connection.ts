import { universalLogger } from "plug-in/mongoose-logger.plugin";
import logger from "utils/logger";
import mongoose from "mongoose";
import { CONFIG } from "config";

const { username, password, port, host, dbName } = CONFIG.mongo;
const isSrv = port ? "" : "+srv";
const auth = username && password ? `${username}:${password}@` : "";
const portString = port ? `:${port}` : "";

const mongodbConnectionUrl = `mongodb${isSrv}://${auth}${host}${portString}/${dbName}`;

const options: any = {
    autoIndex: true,
};

if (CONFIG.mongo.username && CONFIG.mongo.password) {
    options.user = CONFIG.mongo.username;
    options.pass = CONFIG.mongo.password;
    options.authSource = CONFIG.mongo.authSource;
    options.readPreference = "primary";
    if (CONFIG.mongo.isSSL === "true") {
        options.ssl = true;
        if (CONFIG.mongo.caFile) {
            options.tlsCAFile = CONFIG.mongo.caFile;
        }
    }
}

if (CONFIG.env !== "production") {
    mongoose.plugin(universalLogger());
}

mongoose
    .connect(mongodbConnectionUrl)
    .then(() => {
        logger.info("Mongodb connection done");
    })
    .catch((err) => {
        logger.error("Mongodb error", err);
        process.exit(1);
    });

const getCollection = (collectionName: any) => {
    return mongoose.connection.db.collection(collectionName);
};

export { getCollection };
