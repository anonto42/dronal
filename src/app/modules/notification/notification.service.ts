import { NotificationRepository } from "./notification.repository";
import mongoose, { Types } from "mongoose";
import { IPaginationOptions } from "../../../types/pagination";
import { JwtPayload } from "jsonwebtoken";
import { buildPaginationResponse } from "../../../util/pagination";

export class NotificationService {
  private notificationRepo: NotificationRepository;

  constructor() {
    this.notificationRepo = new NotificationRepository();
  }

  public async getMany(
    payload: JwtPayload,
    paginationOptions: IPaginationOptions
  ): Promise<any> {
    const data = await this.notificationRepo.findMany({
      filter:{ for: new mongoose.Types.ObjectId( payload.id )},
      paginationOptions,
      select: "-for -updatedAt"
    });
    const coutuntDocument = await this.notificationRepo.countDocument(payload.id);

    return buildPaginationResponse(data,coutuntDocument,paginationOptions.page!, paginationOptions.limit!)
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
