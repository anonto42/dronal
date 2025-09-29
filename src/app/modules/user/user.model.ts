import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { GENDER, STATUS, USER_ROLES, VERIFICATION_STATUS } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { IUser, UserModal } from './user.interface';
import { SERVICE_DAY } from '../../../enums/service';

const userSchema = new Schema<IUser, UserModal>(
  {
    // Client
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: '',
    },
    contact: {
      type: String,
      default: "not given"
    },
    gender: {
      type: String,
      enum: Object.values(GENDER),
      default: GENDER.MAN
    },
    whatsApp: {
      type: String,
      default: ""
    },

    // Provider
    category: {
      type: String,
      default: ""
    },
    nationalId: {
      type: String,
      default: ""
    },
    nationality: {
      type: String,
      default: ""
    },
    experience: {
      type: String,
      default: ""
    },
    language: {
      type: String,
      default: ""
    },
    overView:{
      type: String,
      default: ""
    },
    wallet: {
      type: Number,
      default: 0
    },

    // Same thinks
    fcmToken:{
      type: String,
      default: ""
    },
    dateOfBirth:{
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [ 
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
        'Please provide a valid email address' 
      ],
    },
    password: {
      type: String,
      required: true,
      select: 0,
      minlength: 8,
    },
    address: {
      type: String,
      min: [10,"You must give minimum 10 characters"],
      max: [150,"You can give max 150 characters"],
      default: "not given"
    },
    location: {
      type: {
        type: String,
        default: "Point"
      },
      coordinates: {
        type: [Number],
        default: [0,0]
      }
    },

    // Provider
    distance:{
      type: Number,
      default: 20
    },
    availableDay:{
        type: [String],
        enum: Object.values(SERVICE_DAY),
        default: []
    },
    startTime:{
        type: String,
        default: ""
    },
    endTime:{
        type: String,
        default: ""
    },

    // Basic auth
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    authentication: {
      isResetPassword: {
        type: Boolean,
        default: false,
      },
      oneTimeCode: {
        type: Number,
        default: null,
      },
      expireAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email });
  return isExist;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//Check user With validation in shourt and return the user
userSchema.statics.isValidUser = async (id: string) => {
  const isExist = await User  
                        .findById( id)
                        .select("-password -authentication -__v -updatedAt -createdAt")
                        .lean()
                        .exec();

  if (!isExist) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      "User not found"
    );
  };

  if (!isExist.verified) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Your account was not verified!"
    )
  };

  if (isExist.status !== STATUS.ACTIVE) {
    throw new ApiError(
      StatusCodes.NOT_ACCEPTABLE,
      `You account was ${isExist.status}!`
    );
  };
  return isExist;
};


// Hash password if the password was modified on every save call
userSchema.pre('save', async function (next) {
  
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(
      this.password,
      Number(config.bcrypt_salt_rounds)
    );
  }

  next();
});

// Hash on findOneAndUpdate
userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;

  if (update?.password) {
    update.password = await bcrypt.hash(
      update.password,
      Number(config.bcrypt_salt_rounds)
    );
    this.setUpdate(update);
  }
  next();
});

export const User = model<IUser, UserModal>('User', userSchema);
