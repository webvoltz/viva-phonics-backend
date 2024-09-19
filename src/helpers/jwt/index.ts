import * as jwt from "jsonwebtoken";
import { CONFIG } from "../../config";

const decodeUserToken = (token) => {
    try {
        const decodedToken = jwt.verify(token, CONFIG.jwtConfig.secret);
        return decodedToken;
    } catch (error) {
        return false;
    }
};

const generateUserToken = (_userId, type = "") => {
    const generateToken = jwt.sign({ _userId, type }, CONFIG.jwtConfig.secret, {
        expiresIn: `${CONFIG.jwtConfig.expiryTime}`,
    });
    return generateToken;
};

export { decodeUserToken, generateUserToken };
