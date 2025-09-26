import { paginationHelper } from '../../../helpers/paginationHelper';
import { IPaginationOptions } from '../../../types/pagination';
import { CustomerFavorite } from '../favorites/customer.favorite.model';
import { IUser } from '../user/user.interface';
import { User } from '../user/user.model';
import { PopulateOptions, Types } from 'mongoose';

export class ClientRepository {
  async findById(id: Types.ObjectId,select?: string) {
    return User.findById(id).select(select?? "").lean().exec();
  }

  async findByEmail(email: string) {
    return User.findOne({ email }).lean().exec();
  }

  async create(payload: Partial<IUser>) {
    return User.create(payload);
  }

  async update(id: Types.ObjectId, payload: Partial<IUser>) {
    return User.findByIdAndUpdate(id, payload, { new: true }).lean().exec();
  }

  async isExistById(id: Types.ObjectId) {
    return User.exists({ _id: id });
  }

  async findMany(
    {
      filter,
      select,
      populate,
      paginationOptions
    } : { 
      filter: Partial<IUser>; 
      select?: string; 
      populate?: PopulateOptions; 
      paginationOptions?: IPaginationOptions 
    }
  ): Promise<IUser[] | []> {
    let query = User.find(filter);

    // Only populate if defined
    if (populate) {
      query = query.populate(populate);
    }

    // Only select if defined
    if (select) {
      query = query.select(select);
    }

    // Apply pagination if provided
    if (paginationOptions) {
      const { skip, limit, sortBy, sortOrder } = paginationHelper.calculatePagination(paginationOptions);

      query = query
        .skip(skip)
        .limit(limit)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });
    }

    return query.lean().exec();
  }

  async isExistByEmail(email: string) {
    return User.exists({ email });
  }

  async addFavorite(user: Types.ObjectId, provider: Types.ObjectId) {
    const providerUser = await User.findById(provider).lean().exec();
    if (!providerUser) return providerUser;
    const isExistFavorite = await CustomerFavorite.findOne({ customer: user, provider: providerUser._id });
    if(isExistFavorite) return isExistFavorite;
    return CustomerFavorite.create({ customer: user, provider: providerUser._id });
  }

  async removeFavorite(id: Types.ObjectId) {
    return CustomerFavorite.findByIdAndDelete(id).lean().exec();
  }

  async getFavorites(user: Types.ObjectId,select?: string) {
    return CustomerFavorite.find({ customer: user }).populate("provider",select?? "").select("provider").lean().exec();
  }
}
