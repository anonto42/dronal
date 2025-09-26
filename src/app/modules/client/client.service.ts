import { ClientRepository } from './client.repository';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import unlinkFile from '../../../shared/unlinkFile';
import { IUser } from '../user/user.interface';
import { IPaginationOptions } from '../../../types/pagination';
import { STATUS, USER_ROLES } from '../../../enums/user';
import { Types } from 'mongoose';

export class ClientService {
  private userRepo: ClientRepository;

  constructor() {
    this.userRepo = new ClientRepository();
  }

  public async getUserProfile(user: JwtPayload) {
    const existingUser = await this.userRepo.findById(user.id!,"name image gender email address dateOfBirth nationality whatsApp contact");
    if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
    return existingUser;
  }

  public async updateProfile(user: JwtPayload, payload: Partial<IUser>) {
    const existingUser = await this.userRepo.findById(user.id!);
    if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");

    if (payload.image && existingUser.image) unlinkFile(existingUser.image!);

    await this.userRepo.update(user.id!, payload);

    return payload
  }

  public async deleteProfile(user: JwtPayload) {
    const existingUser = await this.userRepo.findById(new Types.ObjectId(user.id!));
    if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");

    // const isMatch = data.password && await bcrypt.compare(data.password, existingUser.password);
    // if (!isMatch) {
    //   throw new ApiError(
    //     StatusCodes.NOT_FOUND,
    //     "Password not match!"
    //   )
    // };

    await this.userRepo.update(existingUser._id, { status: STATUS.DELETED });

  }

  public async getProviders(user: JwtPayload, pagication: IPaginationOptions) {
    const providers = await this.userRepo.findMany({ 
      filter: { role: USER_ROLES.PROVIDER },
      select: "name image gender email address dateOfBirth nationality whatsApp contact",
      paginationOptions: pagication
    });

    return providers;
  }

  public async getProviderById(user: JwtPayload, id: Types.ObjectId) {
    // const existingUser = await this.userRepo.findById(new Types.ObjectId(user.id!));
    // if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");

    const provider = await this.userRepo.findById(id,"name image gender email address dateOfBirth nationality whatsApp contact");
    if (!provider) throw new ApiError(StatusCodes.NOT_FOUND, "Provider not found!");

    return provider;
  }

  public async addFavorite(user: JwtPayload, id: Types.ObjectId) {
    const provider = await this.userRepo.addFavorite(new Types.ObjectId(user.id!), id);
    if (!provider) throw new ApiError(StatusCodes.NOT_FOUND, "Provider not found!");

    return provider.provider;
  }

  public async removeFavorite(user: JwtPayload, id: Types.ObjectId) {
    const provider = await this.userRepo.removeFavorite(id);
    if (!provider) throw new ApiError(StatusCodes.NOT_FOUND, "Favorite item is not exist on the list!");

    return provider.provider;
  }

  public async getFavorites(user: JwtPayload) {
    const favorites = await this.userRepo.getFavorites(new Types.ObjectId(user.id!),"name image overView");
    if (!favorites) throw new ApiError(StatusCodes.NOT_FOUND, "Favorites not found!");

    return favorites;
  }

}
