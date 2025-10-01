import { Model, Types } from 'mongoose';
import { GENDER, STATUS, USER_ROLES, VERIFICATION_STATUS } from '../../../enums/user';
import { SERVICE_DAY } from '../../../enums/service';

export type IUser = {
  _id: Types.ObjectId;

  // Worker
  name: string;
  contact: string;
  whatsApp: string;
  image?: string;
  dateOfBirth: string;
  gender: GENDER  

  // Provider
  category: string,
  nationalId: string,
  nationality: string,
  experience: string,
  language: string,
  overView: string,
  wallet: number,
  
  // Same thinks
  fcmToken: string;
  email: string;
  password: string;
  role: USER_ROLES;
  address: string;
  location: {
    type: "Point",
    coordinates: [Number]
  };
  distance: number,
  availableDay: SERVICE_DAY[],
  startTime: string,
  endTime: string

  // Stripe
  stripeAccountId: string;

  // Auth
  status: STATUS;
  verified: boolean;
  authentication?: {
    isResetPassword?: boolean | null;
    oneTimeCode?: number | null;
    expireAt?: Date | null;
  };
};

export type UserModal = {
  isValidUser(id: string):any;
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;
