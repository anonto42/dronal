import { JwtPayload } from "jsonwebtoken";
import { IPaginationOptions } from "../../../types/pagination";
import { ISupport } from "./support.interface";
import { Support } from "./support.model";
import { User } from "../user/user.model";
import { USER_ROLES } from "../../../enums/user";
import { Notification } from "../notification/notification.model";
import { emailQueue } from "../../../queues/email.queue";
import { Types } from "mongoose";
import { SupportStatus } from "../../../enums/support";
import { htmlTemplate } from "../../../shared/htmlTemplate";

export class SupportService {


    async createSupport(user: JwtPayload, data: Partial<ISupport>) {

        const support = await Support.create({
            attachment: data.attachment,
            description: data.description,
            title: data.title,
            user: user.id
        });

        const getAdmins = await User.find({ role: USER_ROLES.ADMIN });

        getAdmins.forEach(async element => {

            const notification = await Notification.create({
              for: element._id,
              message: "New Support Request"
            });
            
            await emailQueue.add("socket-notification", notification, {
                removeOnComplete: true,
                removeOnFail: false,
            });
            
        });

        return support;
    }

    async getSupports(pagination: IPaginationOptions) {
        const { page = 1, limit = 10, sortOrder = "desc", sortBy = "createdAt" } = pagination;
        
        const query = {};
        
        const result = await Support.find(query)
            .sort({ [sortBy]: sortOrder })
            .select("-updatedAt ")
            .populate("user", "name email role category contact")
            .skip((page - 1) * limit)
            .limit(limit);
        
        return result;
    }

    async markAsResolve(user: JwtPayload, supportId: Types.ObjectId ) {
        const support = await Support.findById(supportId);
        if (!support) {
            throw new Error("Support not found");
        }
        
        support.status = SupportStatus.COMPLETED;
        await support.save();

        const data = htmlTemplate.supportGived();
        await emailQueue.add("email-send", {
            to: user.email,
            subject: "Support Gived",
            html: data,
          }, {
            removeOnComplete: true,
            removeOnFail: false,
        });

        return support;
    }
    
}
