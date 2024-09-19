import { ER_CHANGE_WRONG_PASSWORD, ER_LINK_EXPIRED, ER_USER_EMAIL_ALREADY_EXISTS, ER_USER_NOT_FOUND, ER_WRONG_EMAIL, ER_WRONG_PASSWORD } from "../constants/errorMessages.constants";
import { userProjectionFields } from "../constants/projectionFields.constants";
import { generatePasswordHash, generateRandomSalt } from "../helpers/encrypto";
import { MessageTemplateDTO } from "dto/messageTemplate/messageTemplate.dto";
import { decodeUserToken, generateUserToken } from "../helpers/jwt";
import { messageTemplatesModel } from "models/emailTemplate.model";
import { iterateObject, parseCSV } from "../helpers/common/common";
import { errorMessageHandle } from "helpers/common/error-handle";
import { adminModel } from "models/admin.model";
import { Injectable } from "@nestjs/common";
import { sendEmail } from "../mailer";
import { Types, FilterQuery } from "mongoose";
import logger from "utils/logger";

const { ObjectId } = Types;

@Injectable()
export class AdminService {
    async findAllUsers(filter = {}, projection = userProjectionFields, pagination = { pageNo: 1, pageSize: 0 }, sort = {}, expandSearch = false) {
        try {
            let result: any = adminModel;
            const { pageNo, pageSize } = pagination;
            if (pageNo > 0 || pageSize > 0) {
                result = result.find(filter, projection, {
                    skip: (pageNo - 1) * pageSize,
                    limit: pageSize,
                });
            } else {
                result = result.find(filter, projection);
            }
            if (Object.keys(sort).length) {
                result = result.sort(sort);
            }

            if (expandSearch) {
                result = result.populate("createdBy", userProjectionFields).populate("updatedBy", userProjectionFields);
            }
            const responseData = await result.lean();
            return responseData;
        } catch (error) {
            logger?.error("findAllUsers - Error: ", error);
        }
    }

    async findOneUser(filter, projection = userProjectionFields) {
        try {
            const result = await adminModel.findOne(filter, { ...projection });

            return result;
        } catch (error) {
            logger?.error("findOneUser - Error: ", error);
        }
    }

    async insertOneUser(data) {
        try {
            const userData = new adminModel(data);
            return await userData.save();
        } catch (error) {
            logger?.error("insertOneUser - Error: ", error);
        }
    }

    async updateOneUser(filter, reflection, projection = userProjectionFields) {
        try {
            const options = {
                upsert: false,
                returnOriginal: false,
                projection,
            };

            const result = adminModel.findOneAndUpdate(filter, reflection, options).lean();

            return await result.lean();
        } catch (error) {
            logger?.error("updateOneUser - Error: ", error);
        }
    }

    async updateManyUsers(filter, reflection, projection = userProjectionFields) {
        try {
            await adminModel
                .updateMany(filter, reflection, {
                    upsert: false,
                })
                .lean();
            return await this.findAllUsers(filter, projection, undefined, undefined, true);
        } catch (error) {
            logger?.error("updateManyUsers - Error: ", error);
        }
    }

    async countUsers(filter) {
        try {
            return await adminModel.countDocuments(filter);
        } catch (error) {
            logger?.error("countUsers - Error: ", error);
        }
    }

    async userAdd(body) {
        try {
            const userExists = await this.countUsers({
                emailId: body.emailId,
            });

            if (userExists) {
                throw ER_USER_EMAIL_ALREADY_EXISTS;
            }

            const salt = generateRandomSalt();
            const encryptoHash = generatePasswordHash(salt, body.password);
            await this.insertOneUser({
                ...body,
                password: {
                    hash: encryptoHash,
                    salt,
                },
            });

            return {
                statusCode: 201,
                message: "User Created.",
            };
        } catch (error) {
            errorMessageHandle(error, "userAdd");
        }
    }

    async userLogin(body, encryption = undefined) {
        interface Filter {
            emailId?: string;
        }

        const filter: Filter = {
            emailId: body.email,
        };

        const user = await this.findOneUser(filter);
        if (!user) throw ER_USER_NOT_FOUND;
        const encryptoPassword = encryption === "ignoreEncryption" ? body.password : generatePasswordHash(user?.password.salt, body.password);

        if (encryptoPassword !== user?.password.hash) {
            throw ER_WRONG_PASSWORD;
        }

        const token = generateUserToken(user?._id);
        const ref1 = {
            $push: {
                tokens: {
                    token,
                },
            },
            $set: {
                lastLoginTime: new Date(),
            },
        };
        const updatedUser = await this.updateOneUser(filter, ref1, userProjectionFields);

        // Find all expired tokens
        const expiredTokens = [];
        updatedUser?.tokens?.forEach((ele) => {
            if (!decodeUserToken(ele?.token)) expiredTokens.push(ele?.token);
        });

        const ref2 = {
            $pull: {
                tokens: {
                    token: {
                        $in: expiredTokens,
                    },
                },
            },
        };

        const response: any = await this.updateOneUser(filter, ref2, userProjectionFields);

        response.token = token;
        delete response.password;
        delete response.resetPassword;
        delete response.metadata;
        delete response.tokens;

        const message = "logged In Successfully.";
        return {
            data: response,
            message,
        };
    }

    async userLogout(userId, token) {
        try {
            const filter = {
                _id: userId,
            };

            if (!(await this.countUsers(filter))) throw ER_USER_NOT_FOUND;

            const reflection = {
                $pull: {
                    tokens: {
                        token,
                    },
                },
            };
            await this.updateOneUser(filter, reflection, userProjectionFields);

            return {
                data: "",
                message: "User logged out.",
            };
        } catch (error) {
            logger?.error("userLogout - Error: ", error);
        }
    }

    async userChangePassword(body) {
        try {
            const userData = await adminModel.findOne({ _id: body.id }).lean();
            const { oldPassword } = body;

            const encryptoHashOldPassword = generatePasswordHash(userData.password.salt, oldPassword);

            if (userData.password.hash !== encryptoHashOldPassword) {
                throw ER_CHANGE_WRONG_PASSWORD;
            }

            interface Filter {
                _id: string;
            }

            const filter: FilterQuery<Filter> = {
                _id: body.id,
            };

            const salt = generateRandomSalt();
            const encryptoHash = generatePasswordHash(salt, body.newPassword);
            const reflection = {
                $set: {
                    password: {
                        hash: encryptoHash,
                        salt,
                    },
                },
            };

            const data = await adminModel.findOneAndUpdate(filter, reflection);

            return {
                message: "User password has been changed.",
                data,
            };
        } catch (error) {
            logger?.error("userChangePassword - Error: ", error);
            errorMessageHandle(error, "userChangePassword");
        }
    }

    async userUpdate(userId, body) {
        try {
            if (!(await this.countUsers({ _id: userId }))) throw ER_USER_NOT_FOUND;

            interface Reflection {
                $set: {
                    [key: string]: any;
                };
                $unset?: {
                    [key: string]: any;
                };
            }

            const reflection: Reflection = { $set: {}, $unset: {} };

            let { ...restBody } = body;

            restBody = iterateObject(restBody);
            const filter = { _id: userId };

            reflection.$set = { ...reflection.$set, ...restBody };

            const updatedUser = await this.updateOneUser(filter, reflection, userProjectionFields);
            delete updatedUser.password;
            delete updatedUser.resetPassword;
            delete updatedUser.metadata;
            delete updatedUser.tokens;

            return {
                data: updatedUser,
                message: "User updated.",
            };
        } catch (error) {
            errorMessageHandle(error, "userUpdate");
        }
    }

    async userDelete(body) {
        try {
            const filter = {
                _id: { $in: [...body.userIds] },
                isDeleted: false,
            };
            const reflection = {
                $set: {
                    isDeleted: true,
                    updatedBy: body.updatedBy,
                },
            };

            return {
                data: await this.updateManyUsers(filter, reflection),
                message: "User(s) deleted.",
            };
        } catch (error) {
            logger?.error("userDelete - Error: ", error);
        }
    }

    async userForgotPassword(body) {
        try {
            const validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

            const filter = { emailId: body.email };
            const data = await this.findOneUser(filter, userProjectionFields);
            if (data) {
                if (body?.email.match(validRegex)) {
                    body.id = new ObjectId(data._id);

                    const now = new Date();
                    now.setMinutes(now.getMinutes() + 5);
                    const date = new Date();
                    const reflection = {
                        $set: {
                            "resetPassword.key": generateRandomSalt(),
                            "resetPassword.validityTime": date.setDate(date.getDate() + 24),
                        },
                    };

                    const filter = {
                        _id: body.id,
                    };
                    const options = {
                        upsert: false,
                        returnOriginal: false,
                        userProjectionFields,
                    };

                    const user = await adminModel.findOneAndUpdate(filter, reflection, options).lean();
                    const trigger: MessageTemplateDTO = await messageTemplatesModel
                        .findOne({
                            templateName: "reset_password",
                            isActive: true,
                        })
                        .select("_id");

                    if (trigger) {
                        sendEmail.userForgotPassword(user, trigger._id);
                    }
                } else {
                    throw ER_WRONG_EMAIL;
                }
                delete data.password;

                return {
                    message: "Reset password Link sent successfully to your email.",
                };
            } else {
                throw ER_USER_NOT_FOUND;
            }
        } catch (error) {
            errorMessageHandle(error, "userForgotPassword");
        }
    }

    async userPasswordReset(body) {
        try {
            const { keys, password } = body;
            const filter = {
                "resetPassword.key": keys,
            };
            const check = await adminModel.findOne(filter, { resetPassword: 1 }).lean();
            if (!check || new Date(check.resetPassword?.validityTime).getTime() < new Date().getTime()) {
                throw ER_LINK_EXPIRED;
            }

            const salt = generateRandomSalt();
            const encryptoHash = generatePasswordHash(salt, password);

            const reflection = {
                $set: {
                    password: {
                        hash: encryptoHash,
                        salt,
                    },
                    updatedBy: check._id,
                },
            };
            const data = await this.updateOneUser(filter, reflection, userProjectionFields);

            if (!data) throw ER_USER_NOT_FOUND;

            return {
                message: "User password has been reset.",
                data,
            };
        } catch (error) {
            logger?.error("userPasswordReset - Error: ", error);
        }
    }

    async linkExpired(id) {
        const filter = {
            "resetPassword.key": id,
        };
        const check = await adminModel.findOne(filter, { metadata: 1 }).lean();
        if (!check || new Date(check.resetPassword?.validityTime).getTime() < new Date().getTime()) {
            throw ER_LINK_EXPIRED;
        }
        return {
            data: id,
            message: "Link verified",
        };
    }

    async importCSV(files) {
        try {
            const file = files[0];
            const results = await parseCSV(file.buffer);

            results.forEach((e, index) => {
                e.lineNo = index + 1;
            });

            const { errorData, successData, duplicateData } = await this.processResults(results);

            const data = successData.length > 0 ? await adminModel.insertMany(successData) : [];

            return {
                message: "Csv added",
                data: {
                    successData: data,
                    errorData,
                    duplicateData,
                },
            };
        } catch (error) {
            console.error("importCSV - Error:", error);
            throw error;
        }
    }

    // Helper function to process results and separate success, error, and duplicate data
    async processResults(results) {
        const errorData = [];
        const successData = [];
        const duplicateData = [];

        for (const e of results) {
            const { errorMessages, countryCode } = this.validateRow(e);

            if (errorMessages.length > 0) {
                errorData.push({ ...e, errors: errorMessages });
            } else {
                const isDuplicate = await this.checkDuplicate(e.emailId);
                if (isDuplicate) {
                    duplicateData.push(isDuplicate);
                } else {
                    e.countryCode = countryCode;
                    successData.push(e);
                }
            }
        }

        return { errorData, successData, duplicateData };
    }

    // Helper function to validate each row of the CSV
    validateRow(row) {
        const errorMessages = [];
        let countryCode = "";

        if (!row.firstName) errorMessages.push("Missing firstName");
        if (!row.lastName) errorMessages.push("Missing lastName");

        if (!row.contact) {
            errorMessages.push("Missing contact");
        } else {
            ({ countryCode, contact: row.contact } = this.processContact(row.contact));
            if (row.contact.length !== 10) {
                errorMessages.push("Contact number should be 10 digits long");
            }
        }

        if (!row.emailId) {
            errorMessages.push("Missing emailId");
        } else if (!this.isValidEmail(row.emailId)) {
            errorMessages.push("Invalid emailId");
        }

        return { errorMessages, countryCode };
    }

    // Helper function to process the contact and handle the country code
    processContact(contact) {
        let countryCode = "";
        if (contact.startsWith("+91")) {
            countryCode = "+91";
            contact = contact.slice(3);
        }
        return { countryCode, contact };
    }

    // Helper function to validate email format
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Helper function to check for duplicates in the database
    async checkDuplicate(emailId) {
        const findDup = await adminModel.findOne({ emailId }).lean();
        return findDup && Object.keys(findDup).length > 0 ? findDup : null;
    }
}
