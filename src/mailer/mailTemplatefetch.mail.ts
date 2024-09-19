import { messageTemplatesModel } from "../models/emailTemplate.model";
import { adminModel } from "models/admin.model";

export const mailTemplatefetchEmail = async (data: any, senderEmail, trigger, link = "") => {
    try {
        const template = await messageTemplatesModel.findOne({ _id: trigger }).lean();
        if (template?.isActive === true) {
            const finalTemplate = {
                body: template?.body || {},
                subject: template?.subject || "",
                name: template.templateName,
                _id: template._id,
            };
            const userData = await adminModel.findById(data._id).select("firstName lastName emailId");

            if (userData?.emailId) {
                let updates: any = {};

                updates = {
                    firstName: `${userData.firstName}`,
                    lastName: `${userData.lastName}`,
                    senderUser: "BolierPlate",
                    link,
                };

                if (typeof finalTemplate.body === "string") {
                    const EmailBody = finalTemplate.body.replace(/\$\{(\w+)\}/g, (match, key) => updates[key]);
                    const subject = finalTemplate.subject.replace(/\$\{(\w+)\}/g, (match, key) => updates[key]);
                    let mailOptions: any = {};

                    mailOptions = {
                        from: senderEmail,
                        to: userData.emailId,
                        subject,
                        html: EmailBody,
                        replyTo: senderEmail,
                    };
                    return mailOptions;
                } else {
                    return false;
                }
            }
            return false;
        }
        return false;
    } catch (error) {
        return error;
    }
};
