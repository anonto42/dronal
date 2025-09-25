import { ClientRepository } from './client.repository';
import generateOTP from '../../../util/generateOTP';
import { emailHelper } from '../../../helpers/emailHelper';
import { htmlTemplate } from '../../../shared/htmlTemplate';
import { JwtPayload } from 'jsonwebtoken';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import unlinkFile from '../../../shared/unlinkFile';
import { IUser } from '../user/user.interface';
import { IPaginationOptions } from '../../../types/pagination';

export class ClientService {
  private userRepo: ClientRepository;

  constructor() {
    this.userRepo = new ClientRepository();
  }

  public async getUserProfile(user: JwtPayload) {
    const existingUser = await this.userRepo.findById(user.id!);
    if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
    return existingUser;
  }

  public async updateProfile(user: JwtPayload, payload: Partial<IUser>) {
    const existingUser = await this.userRepo.findById(user.id!);
    if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");

    if (payload.image) unlinkFile(existingUser.image!);

    return this.userRepo.update(user.id!, payload);
  }

  public async getProviders(user: JwtPayload, pagication: IPaginationOptions) {
    
  }
}
