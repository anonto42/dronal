import { Model, Types } from 'mongoose';
import { GENDER, STATUS, USER_ROLES, VERIFICATION_STATUS } from '../../../enums/user';

export type IUser = {
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
