import { tutorProjectionFields } from "constants/projectionFields.constants";
import { ER_USER_NOT_FOUND } from "constants/errorMessages.constants";
import { errorMessageHandle } from "helpers/common/error-handle";
import { iterateObject } from "helpers/common/common";
import { Injectable } from "@nestjs/common";
import tutorModel from "models/tutor.model";
import logger from "utils/logger";
import { Types } from "mongoose";

const { ObjectId } = Types;

@Injectable()
export class TutorService {
    async findAllTutors(filter = {}, projection = tutorProjectionFields, pagination = { pageNo: 1, pageSize: 10 }, sort = {}) {
        try {
            let result: any = tutorModel;
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

            const responseData = await result.lean();
            return responseData;
        } catch (error) {
            logger?.error("findAllUsers - Error: ", error);
        }
    }

    async countTutors(filter: any) {
        try {
            return await tutorModel.countDocuments(filter);
        } catch (error) {
            logger?.error("countUsers - Error: ", error);
        }
    }

    async updateOneTutor(filter: any, reflection: any, projection = tutorProjectionFields) {
        try {
            const options = {
                upsert: false,
                returnOriginal: false,
                projection,
            };

            const result = tutorModel.findOneAndUpdate(filter, reflection, options).lean();

            return await result.lean();
        } catch (error) {
            logger?.error("updateOneUser - Error: ", error);
        }
    }

    async updateManyTutor(filter: any, reflection: any) {
        try {
            return await tutorModel
                .updateMany(filter, reflection, {
                    upsert: false,
                })
                .lean();
        } catch (error) {
            logger?.error("updateManyUsers - Error: ", error);
        }
    }

    async gettutors() {
        try {
            const allTutors = await tutorModel.find({ isDeleted: false });

            return {
                statusCode: 201,
                data: { tutors: allTutors, count: allTutors.length },
            };
        } catch (error) {
            logger.error("addTutor - Error: ", error);
            errorMessageHandle(error, "addTutor");
        }
    }

    async getalltutors(body: any) {
        try {
            const { page = 1, pageSize = 10, search = "" } = body;

            const pageInt = parseInt(page, 10);
            const pageSizeInt = parseInt(pageSize, 10);

            const searchTerms = search
                .trim()
                .split(" ")
                .filter((term: string) => term.length > 0);

            const searchQuery =
                searchTerms.length > 0
                    ? {
                          $or: searchTerms.map((term: string) => ({
                              $or: [{ firstName: { $regex: term, $options: "i" } }, { lastName: { $regex: term, $options: "i" } }],
                          })),
                      }
                    : {};

            const tutors = await tutorModel.aggregate([
                { $match: { isDeleted: false, ...searchQuery } },
                { $sort: { statusSort: 1, _id: -1 } },
                { $skip: (pageInt - 1) * pageSizeInt },
                { $limit: pageSizeInt },
                {
                    $lookup: {
                        from: "students",
                        let: { tutorId: "$_id" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$tutor.tutorId", "$$tutorId"] } } },
                            { $match: { isDeleted: false } },
                            {
                                $facet: {
                                    assignedStudents: [{ $count: "count" }],
                                    activeStudents: [{ $match: { status: "Active" } }, { $count: "count" }],
                                    onPauseStudents: [{ $match: { status: "OnPause" } }, { $count: "count" }],
                                },
                            },
                            {
                                $project: {
                                    assignedStudents: { $arrayElemAt: ["$assignedStudents.count", 0] },
                                    activeStudents: { $arrayElemAt: ["$activeStudents.count", 0] },
                                    onPauseStudents: { $arrayElemAt: ["$onPauseStudents.count", 0] },
                                },
                            },
                        ],
                        as: "studentsData",
                    },
                },
            ]);

            const totalTutors = await tutorModel.countDocuments({
                isDeleted: false,
                ...searchQuery,
            });

            return {
                statusCode: 200,
                data: {
                    tutors,
                    total: totalTutors,
                    page: pageInt,
                    pageSize: pageSizeInt,
                },
                message: "All Tutor Listed.",
            };
        } catch (error) {
            logger.error("addTutor - Error: ", error);
            errorMessageHandle(error, "addTutor");
        }
    }

    async addtutor(body: any) {
        try {
            const createdTutor = await tutorModel.create(body);

            return {
                statusCode: 201,
                data: createdTutor,
                message: "Tutor Data Saved.",
            };
        } catch (error) {
            logger.error("addTutor - Error: ", error);
            errorMessageHandle(error, "addTutor");
        }
    }

    async updatetutor(tutorId: string, body: any) {
        try {
            if (!(await this.countTutors({ _id: tutorId }))) throw ER_USER_NOT_FOUND;

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
            const filter = { _id: tutorId };

            reflection.$set = { ...reflection.$set, ...restBody };

            const updatedTutor = await this.updateOneTutor(filter, reflection, tutorProjectionFields);

            return {
                statusCode: 201,
                data: updatedTutor,
                message: "Tutor Data Saved.",
            };
        } catch (error) {
            logger.error("addTutor - Error: ", error);
            errorMessageHandle(error, "addTutor");
        }
    }

    async archivetutor(body: any) {
        try {
            const filter = {
                _id: { $in: [...body.tutorIds] },
                isDeleted: false,
            };
            const reflection = {
                $set: {
                    isDeleted: true,
                },
            };

            return {
                data: await this.updateManyTutor(filter, reflection),
                message: "User(s) deleted.",
            };
        } catch (error) {
            logger.error("addTutor - Error: ", error);
            errorMessageHandle(error, "addTutor");
        }
    }

    async getsingletutor(tutorId: string) {
        try {
            const tutorData = await tutorModel
                .aggregate([
                    { $match: { _id: new ObjectId(tutorId), isDeleted: false } },
                    {
                        $lookup: {
                            from: "students",
                            localField: "_id",
                            foreignField: "tutor.tutorId",
                            as: "studentInfo",
                        },
                    },
                    {
                        $addFields: {
                            studentInfo: {
                                $filter: {
                                    input: "$studentInfo",
                                    as: "student",
                                    cond: { $eq: ["$$student.isDeleted", false] },
                                },
                            },
                        },
                    },
                    {
                        $addFields: {
                            studentInfo: {
                                $map: {
                                    input: "$studentInfo",
                                    as: "student",
                                    in: {
                                        $mergeObjects: ["$$student", { isActive: { $cond: [{ $eq: ["$$student.status", "Active"] }, 1, 0] } }],
                                    },
                                },
                            },
                        },
                    },
                    {
                        $addFields: {
                            studentInfo: {
                                $sortArray: {
                                    input: "$studentInfo",
                                    sortBy: { isActive: -1 },
                                },
                            },
                        },
                    },
                    {
                        $unwind: {
                            path: "$studentInfo",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $group: {
                            _id: "$_id",
                            tutor: { $first: "$$ROOT" },
                            studentInfo: { $push: "$studentInfo" },
                        },
                    },
                    {
                        $replaceRoot: {
                            newRoot: {
                                $mergeObjects: ["$tutor", { studentInfo: "$studentInfo" }],
                            },
                        },
                    },
                ])
                .exec();

            return {
                data: tutorData,
                message: "Tutor Data Listed.",
            };
        } catch (error) {
            logger.error("addTutor - Error: ", error);
            errorMessageHandle(error, "addTutor");
        }
    }
}
