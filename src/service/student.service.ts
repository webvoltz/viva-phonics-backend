import { ER_Student_NOT_FOUND } from "constants/errorMessages.constants";
import { errorMessageHandle } from "helpers/common/error-handle";
import studentModel from "models/student.model";
import { Injectable } from "@nestjs/common";
import tutorModel from "models/tutor.model";
import logger from "utils/logger";
import { Types } from "mongoose";

const { ObjectId } = Types;

@Injectable()
export class StudentService {
    async getStudentData(studentId: string) {
        try {
            const student = await studentModel.findById(studentId).exec();
            return student;
        } catch (error) {
            throw new Error("Error fetching student data");
        }
    }

    async getTutorData(tutorId: string) {
        try {
            const tutor = await tutorModel.findById(tutorId).exec();
            return tutor;
        } catch (error) {
            throw new Error("Error fetching tutor data");
        }
    }

    async getStudentNo() {
        try {
            const lastStudent = await studentModel.findOne().sort({ studentNumber: -1 }).select("studentNumber");
            const nextStudentNumber = lastStudent ? Number(lastStudent.studentNumber) + 1 : 0o1;
            const formattedStudentNumber = nextStudentNumber.toString().padStart(3, "0");

            return {
                statusCode: 201,
                data: { nextStudentNumber: formattedStudentNumber },
            };
        } catch (error) {
            logger.error("addStudent - Error: ", error);
            errorMessageHandle(error, "addStudent");
        }
    }

    async addStudent(body: any) {
        try {
            const createdStudent = await studentModel.create(body);

            return {
                statusCode: 201,
                data: createdStudent,
                message: "Student Data Saved.",
            };
        } catch (error) {
            logger.error("addStudent - Error: ", error);
            errorMessageHandle(error, "addStudent");
        }
    }

    // to update student data
    async updateStudent(studentId: string, body: any) {
        try {
            const studentExists = await studentModel.findOne({ _id: studentId });
            if (!studentExists) throw ER_Student_NOT_FOUND;

            let student: any;

            if (this.hasPersonalDetails(body)) {
                student = await this.updateStudentData(studentId, body);
            }

            if (this.hasEnrollmentDetails(body)) {
                student = await this.updateStudentData(studentId, body);
            }

            if (this.hasTutorDetails(body)) {
                const payload = this.createTutorPayload(body);
                student = await this.updateTutorData(studentId, payload);
            }

            if (this.hasPaymentDetails(body)) {
                const payment = this.createPaymentPayload(body);
                student = await this.updatePaymentData(studentId, payment);
            }

            if (body?.leaves?.length > 0) {
                student = await this.updateLeaves(studentId, body.leaves);
            }

            if (body?.extendedBrakes?.length > 0) {
                student = await this.updateExtendedBreaks(studentId, body.extendedBrakes);
            }

            return { statusCode: 200, data: student, message: "Student Data Saved." };
        } catch (error) {
            logger.error("updateStudent - Error: ", error);
            errorMessageHandle(error, "updateStudent");
        }
    }

    // Helper functions

    hasPersonalDetails(body: any) {
        return body.firstName && body.lastName;
    }

    hasEnrollmentDetails(body: any) {
        return body.startDate && body.dischargeDate && body.referralSource && body.meetingLink;
    }

    hasTutorDetails(body: any) {
        return body.tutorId && body.sessionDuration;
    }

    hasPaymentDetails(body: any) {
        return body.paymentMethod && body.totalAmount && body.transectionFee && body.totalReceivedAmount && body.tutorPayout && body.oneWeek && body.fourWeeks;
    }

    createTutorPayload(body: any) {
        return {
            tutor: {
                tutorId: body.tutorId,
                sessionDuration: body.sessionDuration,
                timeZone: body.timeZone,
                time: body.time,
            },
            frequency: body.time.length + "x",
        };
    }

    createPaymentPayload(body: any) {
        return {
            paymentMethod: body.paymentMethod,
            totalAmount: body.totalAmount,
            transectionFee: body.transectionFee,
            totalReceivedAmount: body.totalReceivedAmount,
            tutorPayout: body.tutorPayout,
            profit: {
                oneWeek: body.oneWeek,
                fourWeeks: body.fourWeeks,
            },
        };
    }

    async updateStudentData(studentId: string, body: any) {
        return studentModel.findOneAndUpdate({ _id: studentId }, body, { new: true });
    }

    async updateTutorData(studentId: string, payload: any) {
        return studentModel.findOneAndUpdate(
            { _id: studentId },
            {
                $set: {
                    tutor: payload.tutor,
                    frequency: payload.frequency,
                },
            },
            { new: true },
        );
    }

    async updatePaymentData(studentId: string, payment: any) {
        return studentModel.findOneAndUpdate(
            { _id: studentId },
            {
                $set: {
                    payment,
                },
            },
            { new: true },
        );
    }

    async updateLeaves(studentId: string, leaves: any[]) {
        if (leaves[0]._id) {
            const leaveId = leaves[0]._id;
            return studentModel.findOneAndUpdate({ _id: studentId, "leaves._id": leaveId }, { $set: { "leaves.$[elem]": leaves[0] } }, { new: true, arrayFilters: [{ "elem._id": leaveId }] });
        } else {
            return studentModel.findOneAndUpdate({ _id: studentId }, { $push: { leaves: leaves[0] } }, { new: true });
        }
    }

    async updateExtendedBreaks(studentId: string, extendedBrakes: any[]) {
        if (extendedBrakes[0]._id) {
            const breakId = extendedBrakes[0]._id;
            return studentModel.findOneAndUpdate(
                { _id: studentId, "extendedBrakes._id": breakId },
                { $set: { "extendedBrakes.$[elem]": extendedBrakes[0] } },
                { new: true, arrayFilters: [{ "elem._id": breakId }] },
            );
        } else {
            return studentModel.findOneAndUpdate({ _id: studentId }, { $push: { extendedBrakes: extendedBrakes[0] } }, { new: true });
        }
    }

    // to get student data by Id
    async getStudentByid(studentId: string) {
        try {
            const studentWithTutor = await studentModel
                .aggregate([
                    { $match: { _id: new ObjectId(studentId), isDeleted: false } },
                    {
                        $lookup: {
                            from: "tutors",
                            localField: "tutor.tutorId",
                            foreignField: "_id",
                            as: "tutorInfo",
                        },
                    },
                    {
                        $unwind: {
                            path: "$tutorInfo",
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                ])
                .exec();

            return { data: studentWithTutor[0] || null, message: "Student Data Listed." };
        } catch (error) {
            logger.error("getStudentByid - Error: ", error);
            errorMessageHandle(error, "getStudentByid");
        }
    }

    // to delete student data
    async deleteStudent(body: any) {
        try {
            const filter = {
                _id: { $in: [...body.studentIds] },
                isDeleted: false,
            };
            const reflection = {
                $set: {
                    isDeleted: true,
                },
            };

            const tutors = await studentModel
                .updateMany(filter, reflection, {
                    upsert: false,
                })
                .lean();

            return {
                data: tutors,
                message: "User(s) deleted.",
            };
        } catch (error) {
            logger.error("deleteStudent - Error: ", error);
            errorMessageHandle(error, "deleteStudent");
        }
    }

    async getStudentTime(body: any, tutorId: string) {
        try {
            const students = await studentModel
                .find({
                    "tutor.tutorId": tutorId,
                    isDeleted: false,
                    status: "Active",
                })
                .select("tutor");

            const timesWithSessionDuration = students.flatMap((student) =>
                student.tutor.time.map((time) => ({
                    day: time.day,
                    time: time.time,
                    _id: time._id,
                    sessionDuration: student.tutor.sessionDuration,
                })),
            );

            return {
                data: timesWithSessionDuration,
            };
        } catch (error) {
            logger.error("Dashboard Count - Error: ", error);
            errorMessageHandle(error, "getStudentTime");
        }
    }

    // to get profit sheet data and filter with profit sheet
    async profitSheet(search = "") {
        try {
            const profitSheet = await studentModel.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "studentId",
                        foreignField: "_id",
                        as: "studentDetails",
                    },
                },
                { $unwind: "$studentDetails" },
                {
                    $lookup: {
                        from: "users",
                        localField: "tutorId",
                        foreignField: "_id", // Ensure this matches the correct field in the tutors collection
                        as: "tutorDetails",
                    },
                },
                { $unwind: "$tutorDetails" },
                {
                    $match: {
                        "tutorDetails.firstName": { $regex: search, $options: "i" },
                    },
                },
                {
                    $group: {
                        _id: "$tutorId",
                        totalProfitOneWeek: { $sum: "$profit.oneWeek" },
                        totalProfitFourWeeks: { $sum: "$profit.fourWeeks" },
                        tutorPayout: { $first: "$tutorPayout" },
                        count: { $sum: 1 },
                        studentStatus: { $first: "$studentStatus" },
                        studentFirstName: { $first: "$studentDetails.firstName" },
                        studentLastName: { $first: "$studentDetails.lastName" },
                        payment: { $first: "$payment" },
                        tutorFirstName: { $first: "$tutorDetails.firstName" },
                        tutorLastName: { $first: "$tutorDetails.lastName" },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalProfitOneWeekAllTutors: { $sum: "$totalProfitOneWeek" },
                        totalProfitFourWeeksAllTutors: { $sum: "$totalProfitFourWeeks" },
                        tutors: {
                            $push: {
                                tutorId: "$_id",
                                totalProfitOneWeek: "$totalProfitOneWeek",
                                totalProfitFourWeeks: "$totalProfitFourWeeks",
                                tutorPayout: "$tutorPayout",
                                count: "$count",
                                studentFirstName: "$studentFirstName",
                                studentLastName: "$studentLastName",
                                payment: "$payment",
                                studentStatus: "$studentStatus",
                                tutorFirstName: "$tutorFirstName",
                                tutorLastName: "$tutorLastName",
                            },
                        },
                    },
                },
            ]);

            return {
                statusCode: 200,
                data: profitSheet,
            };
        } catch (error) {
            logger.error("profitSheet - Error: ", error);
            errorMessageHandle(error, "profitSheet");
        }
    }

    // to filter student data with status, tutor name, and referral source
    async studentFilterService(body: any) {
        try {
            const { page = 1, pageSize = 10, search = "" } = body;

            const pageInt = parseInt(page, 10);
            const pageSizeInt = parseInt(pageSize, 10);

            const searchTerms = search
                .trim()
                .split(" ")
                .filter((term) => term.length > 0);
            const searchQuery =
                searchTerms.length > 0
                    ? {
                          $or: searchTerms.map((term) => ({
                              $or: [{ firstName: { $regex: term, $options: "i" } }, { lastName: { $regex: term, $options: "i" } }],
                          })),
                      }
                    : {};

            const students = await studentModel.aggregate([
                { $match: { isDeleted: false, ...searchQuery } },
                {
                    $addFields: {
                        statusSort: {
                            $cond: { if: { $eq: ["$status", "Active"] }, then: 1, else: 2 },
                        },
                    },
                },
                { $sort: { statusSort: 1, _id: -1 } },
                {
                    $lookup: {
                        from: "tutors",
                        localField: "tutor.tutorId",
                        foreignField: "_id",
                        as: "tutorInfo",
                    },
                },
                {
                    $unwind: {
                        path: "$tutorInfo",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $project: {
                        firstName: 1,
                        lastName: 1,
                        status: 1,
                        startDate: 1,
                        dischargeDate: 1,
                        tutor: 1,
                        referralSource: 1,
                        studentNumber: 1,
                        "tutorInfo.firstName": 1,
                        "tutorInfo.lastName": 1,
                        "tutorInfo._id": 1,
                    },
                },
                { $skip: (pageInt - 1) * pageSizeInt },
                { $limit: pageSizeInt },
            ]);

            const totalStudents = await studentModel.countDocuments({
                isDeleted: false,
                ...searchQuery,
            });

            return {
                statusCode: 200,
                data: {
                    students,
                    total: totalStudents,
                    page: pageInt,
                    pageSize: pageSizeInt,
                },
            };
        } catch (error) {
            logger.error("studentFilterService - Error: ", error);
            errorMessageHandle(error, "studentFilterService");
        }
    }

    async getDashboardCountService() {
        try {
            const activeStudentCount = await studentModel
                .find({
                    status: "Active",
                })
                .countDocuments();
            const onleaveStudentCount = await studentModel
                .find({
                    leaves: { $exists: true, $not: { $size: 0 } },
                })
                .countDocuments();

            const TotalTutorCount = await tutorModel.find().countDocuments();

            const count = {
                activeStudent: activeStudentCount,
                studentOnleave: onleaveStudentCount,
                allTutor: TotalTutorCount,
            };

            return {
                statusCode: 200,
                data: count,
            };
        } catch (error) {
            logger.error("Dashboard Count - Error: ", error);
            errorMessageHandle(error, "getDashboardCountService");
        }
    }
}
