import { NotificationRepository } from "./notification.repository";
import mongoose, { Types } from "mongoose";
import { IPaginationOptions } from "../../../types/pagination";
import { JwtPayload } from "jsonwebtoken";
import { buildPaginationResponse } from "../../../util/pagination";
import { Notification } from "./notification.model";

export class NotificationService {
  private notificationRepo: NotificationRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
  }

  public async getMany(
    payload: JwtPayload,
    paginationOptions: IPaginationOptions & { status: "read" | "unRead" | null }
  ): Promise<any> {
    const data = await this.notificationRepo.findMany({
      filter:{
        for: new mongoose.Types.ObjectId(payload.id),//@ts-ignore
        isRead: paginationOptions.status 
          ? paginationOptions.status === "read" 
            ? true 
            : paginationOptions.status === "unRead" 
            ? false 
            : { $ne: null }
          : { $ne: null }
      },
      paginationOptions,
      select: "-for -updatedAt"
    });
    const coutuntDocument = await Notification.countDocuments({for: payload.id, isRead: paginationOptions.status 
          ? paginationOptions.status === "read" 
            ? true 
            : paginationOptions.status === "unRead" 
            ? false 
            : { $ne: null }
          : { $ne: null }});

    return buildPaginationResponse(data,coutuntDocument,paginationOptions.page!, paginationOptions.limit!)
  }

  public async delete(ids: string[]) {
    const objIds = ids.map((id) => new Types.ObjectId(id));
    return this.notificationRepo.delete(undefined, objIds);
  }

  public async markAllAsRead(
    ids: string[],
    payload: JwtPayload
  ) {
    const objectIds = ids.map(id => new Types.ObjectId(id));
    if( objectIds.length <= 0 ) await this.notificationRepo.updateMany({for: payload.id},{ isRead: true, readAt: new Date( Date.now())});

    return await this.notificationRepo.updateManyByIds(
      objectIds,
      { isRead: true, readAt: new Date() }
    );
  }
}
