import { Notification } from "./notification.model";
import { INotification } from "./notification.interface";
import { PopulateOptions, Types, UpdateWriteOpResult } from "mongoose";
import { IPaginationOptions } from "../../../types/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";

export class NotificationRepository {
  
  async findById(id: Types.ObjectId) {
    return Notification.findById(id).lean().exec();
  }

  async findMany({
    filter,
    select,
    populate,
    paginationOptions,
  }: {
    filter: Partial<INotification>;
    select?: string;
    populate?: PopulateOptions;
    paginationOptions?: IPaginationOptions;
  }): Promise<INotification[]> {
    let query = Notification.find(filter);

    if (populate) query = query.populate(populate);
    if (select) query = query.select(select);

    if (paginationOptions) {
      const { skip, limit, sortBy, sortOrder } =
        paginationHelper.calculatePagination(paginationOptions);

      query = query.skip(skip).limit(limit).sort({
        [sortBy]: sortOrder === "asc" ? 1 : -1,
      });
    }

    return query.lean().exec();
  }

  async countDocument( id: Types.ObjectId ) {
    return Notification.countDocuments({ for: id })
  }
  
  async create(payload: Partial<INotification>) {
    return Notification.create(payload);
  }
  
  async update(id: Types.ObjectId, payload: Partial<INotification>) {
    return Notification.findByIdAndUpdate(id, payload, {
      new: true,
    })
      .lean()
      .exec();
  }

  async updateMany(
    filter: Partial<INotification>,
    payload: Partial<INotification>
  ): Promise<UpdateWriteOpResult> {
    return Notification.updateMany(filter, { $set: payload });
  }

  async updateManyByIds(
    ids: Types.ObjectId[],
    payload: Partial<INotification>
  ): Promise<UpdateWriteOpResult> {
    return Notification.updateMany(
      { _id: { $in: ids } },
      { $set: payload }
    );
  }
  
  async delete(id?: Types.ObjectId, ids?: Types.ObjectId[]) {
    if (id) {
      return Notification.findByIdAndDelete(id).lean().exec();
    } else if (ids) {
      return Notification.deleteMany({ _id: { $in: ids } });
    }
  }
}
