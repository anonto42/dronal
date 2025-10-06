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
import { buildPaginationResponse } from "../../../util/pagination";

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

    public async getSupports(pagination: IPaginationOptions & { status?: string; search?: string }) {
        const {
            page = 1,
            limit = 10,
            sortOrder = "desc",
            sortBy = "createdAt",
            status,
            search,
        } = pagination;

        const skip = (page - 1) * limit;
        const queryFilter: any = {};

        if (status && status.trim() !== "") {
            queryFilter.status = status == "pending"? SupportStatus.PENDING : SupportStatus.COMPLETED;
        }

        if (search && search.trim() !== "") {
            const userFilter: any = {
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                // { contact: { $regex: search, $options: "i" } },
            ],
            };

            // Find matching users
            const matchedUsers = await User.find(userFilter).select("_id").lean();
            const userIds = matchedUsers.map((u) => u._id);

            // Apply to main query
            queryFilter.user = { $in: userIds };
        }

        // ⚙️ Fetch paginated results
        const [data, total] = await Promise.all([
            Support.find(queryFilter)
            .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
            .select("-updatedAt -__v")
            .populate("user", "name email role category contact")
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
            Support.countDocuments(queryFilter),
        ]);

        // 📦 Return paginated response
        return buildPaginationResponse(data, total, page, limit);
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
