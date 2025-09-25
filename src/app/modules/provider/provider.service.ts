import { ProviderRepository } from "./provider.repository";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../user/user.interface";
import unlinkFile from "../../../shared/unlinkFile";
import { IVerificaiton } from "../verification/verification.interface";
import { VERIFICATION_STATUS } from "../../../enums/user";
import { IService } from "../service/service.interface";
import bcrypt from "bcryptjs";

export class ProviderService {
  private providerRepo: ProviderRepository;

  constructor() {
    this.providerRepo = new ProviderRepository();
  }

  public async profile(
    payload: JwtPayload
  ) {
    const provider = await this.providerRepo.findById(
      new mongoose.Types.ObjectId( payload.id ),
      "name image overView gender dateOfBirth nationality experience language contact whatsApp nationalId email address"
    )
    if (!provider) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User not found!"
      )
    }

    return provider
  }

  public async profileUpdate(
    payload: JwtPayload,
    data: Partial<IUser>
  ) {
    const provider = await this.providerRepo.update(
      new mongoose.Types.ObjectId( payload.id ),
      data
    )
    if (!provider) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User not found!"
      )
    }
    if (payload.image && provider.image) unlinkFile(provider.image);

    return data
  }

  public async profileDelete(
    payload: JwtPayload,
    data: { password: string }
  ) {
    
    const provider = await this.providerRepo.findById( new mongoose.Types.ObjectId( payload.id ),"+password");
    if (!provider) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User not found"
      )
    };

    const isMatch = data.password && await bcrypt.compare(data.password, provider.password);
    if (!isMatch) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Password not match!"
      )
    };

    await this.providerRepo.delete( provider._id );

  }

  public async verificaitonStatusCheck(
    payload: JwtPayload
  ) {
    const userId = new mongoose.Types.ObjectId( payload.id );
    const request = await this.providerRepo.viewVerification(userId);
    const user = await this.providerRepo.findById(userId);
    
    return request? { 
      message: "This is your current request status", 
      user: {
        name: user?.name,
        image: user?.image,
        category: user?.category,
        data: request
    }} : { 
      message: "You don't have send the request!", 
      user: {
        name: user?.name,
        image: user?.image,
        category: user?.category,
        data: null
    }}
  }

  // Have to add the notification push
  public async sendVerificaitonRequest(
    payload: JwtPayload,
    data: IVerificaiton
  ) {
    const userObjID = new mongoose.Types.ObjectId( payload.id );
    const isVerifirequestExist = await this.providerRepo.viewVerification( userObjID );
    if (isVerifirequestExist) {
      if (isVerifirequestExist.status == VERIFICATION_STATUS.PENDING) {
        throw new ApiError(
          StatusCodes.EXPECTATION_FAILED,
          "You are already sended the request so you must wait"
        )
      }
    }

    if (!data.license) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "License not found!"
      )
    }
    
    if (!data.nid) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "License not found!"
      )
    }
    
    if (!isVerifirequestExist) {
      await this.providerRepo.createVerificationRequest({
        ...data,
        status: VERIFICATION_STATUS.PENDING,
        user: payload.id
      })
      return
    }
    //@ts-ignore
    delete isVerifirequestExist?.status

    await this.providerRepo.updateVerificationRequest(isVerifirequestExist._id,{
      ...data,
      status: VERIFICATION_STATUS.PENDING
    })

    return data
  }

  public async providerServices(
    payload: JwtPayload,
    query: {
      page: number;
      limit: number;
      sortBy: string;
      sortOrder: "asc" | "desc";
    }
  ) {
    const result = await this.providerRepo.providerServices({
      filter: { user: new mongoose.Types.ObjectId( payload.id ) },
      paginationOptions: query,
      select:"-__v -updatedAt -user"
    });
    return result
  }

  public async addService(
    payload: JwtPayload,
    data: Partial<IService>
  ) {
    const result = await this.providerRepo.addService({...data,user: new mongoose.Types.ObjectId( payload.id )});

    //@ts-ignore
    delete result.user
    //@ts-ignore
    delete result.__v
    //@ts-ignore
    delete result.updatedAt
    //@ts-ignore
    delete result.createdAt
    //@ts-ignore
    delete result._id

    return result
  }

  public async deleteService(
    payload: JwtPayload,
    id: string
  ) {
    const result = await this.providerRepo.deleteService(new mongoose.Types.ObjectId(id));
    if (!result) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Service not found!"
      )
    }

    //@ts-ignore
    delete result.user
    //@ts-ignore
    delete result.__v
    //@ts-ignore
    delete result.updatedAt
    //@ts-ignore
    delete result.createdAt
    //@ts-ignore
    delete result._id

    return result
  }

  public async updateService(
    payload: JwtPayload,
    id: string,
    data: Partial<IService>
  ) {
    const result = await this.providerRepo.updateService(new mongoose.Types.ObjectId(id),data);
    if (!result) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Service not found!"
      )
    }

    //@ts-ignore
    delete result.user
    //@ts-ignore
    delete result.__v
    //@ts-ignore
    delete result.updatedAt
    //@ts-ignore
    delete result.createdAt
    //@ts-ignore
    delete result._id
    
    return result
  }

  public async viewService(
    payload: JwtPayload,
    id: string
  ) {
    const result = await this.providerRepo.providerServices({
      filter: { user: new mongoose.Types.ObjectId( payload.id ), _id: new mongoose.Types.ObjectId( id ) },
      paginationOptions: { page: 1, limit: 1 },
      select:"-__v -updatedAt -user"
    });
    if (!result.length) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "Service not found!"
      )
    }

    //@ts-ignore
    delete result.user
    //@ts-ignore
    delete result.__v
    //@ts-ignore
    delete result.updatedAt
    //@ts-ignore
    delete result.createdAt
    //@ts-ignore
    delete result._id
    
    return result[0]
  }

}
