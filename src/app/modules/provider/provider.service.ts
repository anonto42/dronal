import { ProviderRepository } from "./provider.repository";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import { IUser } from "../user/user.interface";
import unlinkFile from "../../../shared/unlinkFile";
import { IVerificaiton } from "../verification/verification.interface";

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
    if (provider?.image) unlinkFile(provider.image);

    return data
  }

  public async profileDelete(
    payload: JwtPayload
  ) {
    
    const provider = await this.providerRepo.findById( new mongoose.Types.ObjectId( payload.id ));
    if (!provider) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User not found"
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

  public async sendVerificaitonRequest(
    payload: JwtPayload,
    data: IVerificaiton
  ) {

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

    const userObjID = new mongoose.Types.ObjectId( payload.id );
    const isVerifirequestExist = await this.providerRepo.viewVerification( userObjID );
    if (!isVerifirequestExist) {
      await this.providerRepo.createVerificationRequest({
        ...data,
        user: payload.id
      })
    }
    await this.providerRepo.updateVerificationRequest(userObjID,data)

    return data
  }

}
