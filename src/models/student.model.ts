import { STUDENT } from "constants/mongooseTable.constants";
import mongoose from "mongoose";

const { Schema } = mongoose;

const studentSchema = new Schema(
    {
        studentNumber: {
            type: String,
        },
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        familyName: {
            type: String,
        },
        grade: {
            type: String,
        },
        year: {
            type: String,
        },
        email: {
            type: String,
        },
        countryCode: {
            type: String,
        },
        timeZone: {
            type: String,
        },
        number: {
            type: String,
        },
        address: {
            type: String,
        },
        city: {
            type: String,
        },
        state: {
            type: String,
        },
        postalCode: {
            type: String,
        },
        country: {
            type: String,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        startDate: {
            type: Date,
        },
        dischargeDate: {
            type: Date,
        },
        referralSource: {
            type: String,
        },
        meetingLink: {
            type: String,
        },
        frequency: {
            type: String,
        },
        status: {
            type: String,
            enum: ["Active", "Inactive", "OnPause"],
            default: "Active",
        },
        tutor: {
            tutorId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "tutor",
            },
            sessionDuration: {
                type: String,
            },
            time: [
                {
                    day: { type: String },
                    time: { type: String },
                },
            ],
            timeZone: {
                type: String,
            },
        },
        payment: {
            paymentMethod: { type: String },
            totalAmount: { type: Number },
            transectionFee: { type: Number },
            totalReceivedAmount: { type: Number },
            tutorPayout: { type: Number },
            profit: {
                oneWeek: { type: Number },
                fourWeeks: { type: Number },
            },
        },
        leaves: [
            {
                reason: { type: String },
                startDate: { type: Date },
                endDate: { type: Date },
            },
        ],
        extendedBrakes: [
            {
                startDate: { type: Date },
                endDate: { type: Date },
                followUpDate: { type: Date },
            },
        ],
        userType: {
            type: String,
            enum: ["STUDENT"],
            default: "STUDENT",
        },
    },
    {
        timestamps: true,
    },
);

const studentModel = mongoose.model(STUDENT, studentSchema);

export default studentModel;
