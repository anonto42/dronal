import { NotificationRepository } from "./notification.repository";
import { INotification } from "./notification.interface";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import mongoose, { Types } from "mongoose";
import { IPaginationOptions } from "../../../types/pagination";
import { JwtPayload } from "jsonwebtoken";

export class NotificationService {
  private notificationRepo: NotificationRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
  }

  public async getMany(
    payload: JwtPayload,
    paginationOptions: IPaginationOptions
  ): Promise<INotification[]> {
    return this.notificationRepo.findMany({
      filter:{ for: new mongoose.Types.ObjectId( payload.id )},
      paginationOptions,
      select: "-for -updatedAt"
    });
  }

  public async delete(ids: string[]) {
    const objIds = ids.map((id) => new Types.ObjectId(id));
    return this.notificationRepo.delete(undefined, objIds);
  }

  public async markAllAsRead(
    ids: string[]
  ) {
    const objectIds = ids.map(id => new Types.ObjectId(id));

    return this.notificationRepo.updateManyByIds(
      objectIds,
      { isRead: true, readAt: new Date() }
    );
  }
}
