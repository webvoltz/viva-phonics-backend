import { errorMessageHandle } from "helpers/common/error-handle";
import studentModel from "models/student.model";
import { Injectable } from "@nestjs/common";
import logger from "utils/logger";

@Injectable()
export class FinanceService {
    async financeFilterService(body: any) {
        try {
            const { page = 1, pageSize = 10, search = "" } = body;
            const pageInt = parseInt(page, 10);
            const pageSizeInt = parseInt(pageSize, 10);

            const searchTerms = this.getSearchTerms(search);
            const studentSearchQuery = this.createSearchQuery(searchTerms, "student");
            const tutorSearchQuery = this.createSearchQuery(searchTerms, "tutor");

            const students = await this.fetchStudents(studentSearchQuery, tutorSearchQuery, pageInt, pageSizeInt);

            const { totalProfitOneWeek, totalProfitFourWeeks, totalPaypalReceived, totalStripeReceived, totalStudents } = search
                ? await this.calculateSearchTotals(students, studentSearchQuery)
                : await this.calculateOverallTotals(studentSearchQuery);

            return {
                statusCode: 200,
                data: {
                    students,
                    total: totalStudents || students.length,
                    page: pageInt,
                    pageSize: pageSizeInt,
                    totalProfitOneWeek,
                    totalProfitFourWeeks,
                    totalPaypalReceived,
                    totalStripeReceived,
                },
            };
        } catch (error) {
            logger.error("financeFilterService - Error: ", error);
            errorMessageHandle(error, "financeFilterService");
        }
    }

    getSearchTerms(search: string): string[] {
        return search
            .trim()
            .split(" ")
            .filter((term) => term.length > 0);
    }

    createSearchQuery(searchTerms: string[], type: "student" | "tutor") {
        const nameField = type === "student" ? ["firstName", "lastName"] : ["tutorInfo.firstName", "tutorInfo.lastName"];
        return searchTerms.length > 0
            ? {
                  $or: searchTerms.map((term) => ({
                      $or: nameField.map((field) => ({ [field]: { $regex: term, $options: "i" } })),
                  })),
              }
            : {};
    }

    async fetchStudents(studentSearchQuery: any, tutorSearchQuery: any, pageInt: number, pageSizeInt: number) {
        return await studentModel.aggregate([
            { $lookup: { from: "tutors", localField: "tutor.tutorId", foreignField: "_id", as: "tutorInfo" } },
            { $unwind: { path: "$tutorInfo", preserveNullAndEmptyArrays: true } },
            { $match: { isDeleted: false, $or: [studentSearchQuery, tutorSearchQuery] } },
            { $addFields: { statusSort: { $cond: { if: { $eq: ["$status", "Active"] }, then: 1, else: 2 } } } },
            { $sort: { statusSort: 1, _id: -1 } },
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
                    frequency: 1,
                    "tutorInfo.firstName": 1,
                    "tutorInfo.lastName": 1,
                    "tutorInfo._id": 1,
                    payment: 1,
                },
            },
            { $skip: (pageInt - 1) * pageSizeInt },
            { $limit: pageSizeInt },
        ]);
    }

    async calculateSearchTotals(students: any[], studentSearchQuery: any) {
        const totalProfitOneWeek = students.reduce((sum, student) => sum + (student.payment?.profit?.oneWeek || 0), 0);
        const totalProfitFourWeeks = students.reduce((sum, student) => sum + (student.payment?.profit?.fourWeeks || 0), 0);

        const totalPaypalReceived = students.reduce((sum, student) => sum + (student.payment?.paymentMethod === "Paypal" ? student.payment?.totalReceivedAmount || 0 : 0), 0);

        const totalStripeReceived = students.reduce((sum, student) => sum + (student.payment?.paymentMethod === "Stripe" ? student.payment?.totalReceivedAmount || 0 : 0), 0);

        const totalStudents = await studentModel.countDocuments({
            isDeleted: false,
            ...studentSearchQuery,
        });

        return { totalProfitOneWeek, totalProfitFourWeeks, totalPaypalReceived, totalStripeReceived, totalStudents };
    }

    async calculateOverallTotals(studentSearchQuery: any) {
        const totalStudents = await studentModel.countDocuments({ isDeleted: false, ...studentSearchQuery });

        const totalProfitOneWeekResult = await studentModel.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, totalProfit: { $sum: "$payment.profit.oneWeek" } } }]);

        const totalProfitFourWeeksResult = await studentModel.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, totalProfit: { $sum: "$payment.profit.fourWeeks" } } }]);

        const totalPaypalReceivedResult = await studentModel.aggregate([
            { $match: { isDeleted: false, "payment.paymentMethod": "Paypal" } },
            { $group: { _id: null, totalReceived: { $sum: "$payment.totalReceivedAmount" } } },
        ]);

        const totalStripeReceivedResult = await studentModel.aggregate([
            { $match: { isDeleted: false, "payment.paymentMethod": "Stripe" } },
            { $group: { _id: null, totalReceived: { $sum: "$payment.totalReceivedAmount" } } },
        ]);

        const totalProfitOneWeek = totalProfitOneWeekResult.length > 0 ? totalProfitOneWeekResult[0].totalProfit : 0;
        const totalProfitFourWeeks = totalProfitFourWeeksResult.length > 0 ? totalProfitFourWeeksResult[0].totalProfit : 0;
        const totalPaypalReceived = totalPaypalReceivedResult.length > 0 ? totalPaypalReceivedResult[0].totalReceived : 0;
        const totalStripeReceived = totalStripeReceivedResult.length > 0 ? totalStripeReceivedResult[0].totalReceived : 0;

        return { totalProfitOneWeek, totalProfitFourWeeks, totalPaypalReceived, totalStripeReceived, totalStudents };
    }
}
