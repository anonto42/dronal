
import { Types } from "mongoose";
import { User } from "../user/user.model";
import { IUser } from "../user/user.interface";
import { Verification } from "../verification/verification.model";
import { IVerificaiton } from "../verification/verification.interface";

export class ProviderRepository {

  async findById(
    id: Types.ObjectId,
    select?: string
  ) {
    
    let query = User.findById(id)
    
    if (select) {
      query = query.select(select)
    }

    return query.lean().exec(); 
  }

  async update(id: Types.ObjectId, payload: Partial<IUser>) {
    return User.findByIdAndUpdate(id, payload).lean().exec();
  }

  async delete(id: Types.ObjectId){
    return User.findByIdAndDelete(id).lean().exec();
  }

  async viewVerification(user: Types.ObjectId){
    return Verification.findOne({
      user
    }).select("-updatedAt -user").lean().exec();
  }

  async createVerificationRequest(data: IVerificaiton){
    return Verification.create(data)
  }
  
  async updateVerificationRequest(id: Types.ObjectId, data: IVerificaiton){
    return Verification.findByIdAndUpdate(id, data, { new: true }).lean().exec()
  }
  
}
