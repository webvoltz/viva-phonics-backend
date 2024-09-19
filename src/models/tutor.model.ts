import { TUTOR } from "constants/mongooseTable.constants";
import mongoose from "mongoose";

const { Schema } = mongoose;

const timeSlotsSchema = new Schema({
    startTime: {
        type: String,
        default: "",
    },
    endTime: {
        type: String,
        default: "",
    },
});

const tutorSchema = new Schema(
    {
        firstName: {
            type: String,
        },
        lastName: {
            type: String,
        },
        email: {
            type: String,
        },
        countryCode: {
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
        rate: {
            type: String,
        },
        timeZone: {
            type: String,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        availability: {
            monday: {
                isOpen: {
                    type: Boolean,
                },
                timeSlots: [timeSlotsSchema],
            },
            tuesday: {
                isOpen: {
                    type: Boolean,
                },
                timeSlots: [timeSlotsSchema],
            },
            wednesday: {
                isOpen: {
                    type: Boolean,
                },
                timeSlots: [timeSlotsSchema],
            },
            thursday: {
                isOpen: {
                    type: Boolean,
                },
                timeSlots: [timeSlotsSchema],
            },
            friday: {
                isOpen: {
                    type: Boolean,
                },
                timeSlots: [timeSlotsSchema],
            },
            saturday: {
                isOpen: {
                    type: Boolean,
                },
                timeSlots: [timeSlotsSchema],
            },
            sunday: {
                isOpen: {
                    type: Boolean,
                },
                timeSlots: [timeSlotsSchema],
            },
        },
        // active_students: [
        //     {
        //         available_times: { type: String },
        //         studentId: { type: Schema.Types.ObjectId },
        //         studentName: { type: String },
        //     },
        // ],
        userType: {
            type: String,
            enum: ["TUTOR"],
            default: "TUTOR",
        },
    },
    {
        timestamps: true,
    },
);

const tutorModel = mongoose.model(TUTOR, tutorSchema);

export default tutorModel;
