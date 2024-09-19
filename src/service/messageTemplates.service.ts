import { Injectable } from "@nestjs/common";
import { messageTemplatesModel } from "../models/emailTemplate.model";
import { ObjectId } from "mongodb";
import logger from "utils/logger";

@Injectable()
export class MessageTemplatesService {
    /**
     * message template add
     * @param body
     * @returns
     */
    async messageTemplatesInsert(body) {
        try {
            const messageTemplatesData = new messageTemplatesModel(body);

            const record = await messageTemplatesData.save();

            const data = await messageTemplatesModel.findById(record._id).lean();

            return {
                data,
                message: "Message Data Added.",
                statusCode: 201,
            };
        } catch (error) {
            logger?.error("messageTemplatesInsert - Error: ", error);
        }
    }

    /**
     * update message template
     * @param id
     * @param body
     * @returns
     */
    async messageTemplatesUpdate(id, body) {
        try {
            const reflection = {
                $set: { ...body },
            };

            const messageTemplateId = await messageTemplatesModel.findByIdAndUpdate(id, reflection, { upsert: true, new: true }).lean();

            return {
                data: messageTemplateId,
                message: "Message Data Updated.",
            };
        } catch (error) {
            logger?.error("messageTemplatesUpdate - Error: ", error);
        }
    }

    /**
     * delete message template
     * @param id
     * @returns
     */
    async messageTemplatesDelete(id) {
        try {
            await messageTemplatesModel.findByIdAndUpdate({ _id: new ObjectId(String(id)) }, { isDeleted: true }).lean();
            const datadelete = await messageTemplatesModel.findById({ _id: new ObjectId(String(id)), isDeleted: true }).lean();

            return {
                data: datadelete,
                message: "Message Data Deleted.",
            };
        } catch (error) {
            logger?.error("messageTemplatesDelete - Error: ", error);
        }
    }

    /**
     * message template list
     * @param body
     * @returns
     */
    async messageTemplatesList(body) {
        try {
            const { pagination, search } = body;
            let paginationData;
            if (pagination && (!search || search === "")) {
                paginationData = [
                    {
                        $skip: (pagination.pageNo - 1) * pagination.pageSize,
                    },
                    {
                        $limit: pagination.pageSize,
                    },
                ];
            }
            const aggregateArray = [
                {
                    $match: {
                        isDeleted: false,
                    },
                },
                {
                    $sort: {
                        createdAt: -1,
                    },
                },
                ...(paginationData || []),
            ];

            if (search && search !== "") {
                const searchValue = search.trim().split(" ");
                const matchExpressions = [
                    {
                        $cond: {
                            if: {
                                $regexMatch: {
                                    input: "$templateName",
                                    regex: new RegExp(`${searchValue}`, "i"),
                                },
                            },
                            then: 1,
                            else: 0,
                        },
                    },
                    {
                        $cond: {
                            if: {
                                $regexMatch: {
                                    input: "$subject",
                                    regex: new RegExp(`${searchValue}`, "i"),
                                },
                            },
                            then: 1,
                            else: 0,
                        },
                    },
                    {
                        $cond: {
                            if: {
                                $regexMatch: {
                                    input: "$type",
                                    regex: new RegExp(`${searchValue}`, "i"),
                                },
                            },
                            then: 1,
                            else: 0,
                        },
                    },
                ];

                aggregateArray.push({
                    $addFields: { searchScore: { $sum: matchExpressions } },
                });

                aggregateArray.push({
                    $match: { searchScore: { $ne: 0 } },
                });

                aggregateArray.push({
                    $sort: { searchScore: -1 },
                });
                if (pagination != undefined) {
                    aggregateArray.push(
                        {
                            $skip: (pagination.pageNo - 1) * pagination.pageSize,
                        },
                        {
                            $limit: pagination.pageSize,
                        },
                    );
                }
            }

            const aggregateArrayCount = aggregateArray.slice(0, -2);
            aggregateArrayCount.push({ $count: "total" });

            const [msgTempCount, msgTemp] = await Promise.all([messageTemplatesModel.aggregate(aggregateArrayCount), messageTemplatesModel.aggregate(aggregateArray)]);
            return {
                count: msgTempCount.length > 0 ? msgTempCount?.[0].total : 0,
                data: msgTemp.length > 0 ? msgTemp : [],
                message: "Message Data Listed.",
            };
        } catch (error) {
            logger?.error("messageTemplatesList - Error: ", error);
        }
    }

    /**
     * message tempplate list by id
     * @param id
     * @returns
     */
    async messageTemplatesListOne(id) {
        try {
            const filter = {
                _id: id,
                isDeleted: false,
            };
            const data = await messageTemplatesModel.find(filter).lean();

            return {
                data,
                message: "Message Data Listed.",
            };
        } catch (error) {
            logger?.error("messageTemplatesListOne - Error: ", error);
        }
    }
}
