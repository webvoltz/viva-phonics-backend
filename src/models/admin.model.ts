import mongoose from "mongoose";
import { ADMIN } from "../constants/mongooseTable.constants";
const { Schema } = mongoose;

const AdminSchema = new Schema(
    {
        firstName: {
            type: String,
        },

        lastName: {
            type: String,
        },
        emailId: {
            type: String,
            required: true,
        },
        tokens: [
            {
                _id: false,
                token: {
                    type: String,
                    default: null,
                },
            },
        ],
        password: {
            hash: {
                type: String,
            },
            salt: {
                type: String,
            },
        },
        resetPassword: {
            key: {
                type: String,
                default: "",
            },
            validityTime: {
                type: Date,
                default: null,
            },
        },
        metadata: {
            key: {
                type: String,
                default: "",
            },
            validityTime: {
                type: Date,
                default: null,
            },
        },
        userType: {
            type: String,
            enum: ["ADMIN"],
            default: "ADMIN",
        },
    },
    {
        timestamps: true,
    },
);

AdminSchema.index({ firstName: 1 });
AdminSchema.index({ middleName: 1 });
AdminSchema.index({ lastName: 1 });
AdminSchema.index({ emailId: 1 });
AdminSchema.index({ contact: 1 });
AdminSchema.index({ isActive: 1 });
AdminSchema.index({ isDeleted: 1 });

export const adminModel = mongoose.model(ADMIN, AdminSchema);
