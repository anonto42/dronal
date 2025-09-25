// auth.service.ts
import { AuthRepository } from './auth.repository';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { htmlTemplate } from '../../../shared/htmlTemplate';
import cryptoToken from '../../../util/cryptoToken';
import generateOTP from '../../../util/generateOTP';
import bcrypt from 'bcrypt';
import ms, { StringValue } from "ms";
import { ILoginData, IVerifyEmail, IAuthResetPassword, IChangePassword, ISignUp } from '../../../types/auth';
import { STATUS } from '../../../enums/user';
import { IUser } from '../user/user.interface';
import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';

export class AuthService {
  private authRepo: AuthRepository;

  constructor() {
    this.authRepo = new AuthRepository();
  }

  public async signUp(payload: Partial<IUser>) {

    const existingUser = await this.authRepo.findUserByEmail(payload.email!);

    if (existingUser) {
      const otp = generateOTP(6);
      const values = { name: existingUser.name, otp, email: existingUser.email! };
      emailHelper.sendEmail(htmlTemplate.createAccount(values));

      await this.authRepo.updateUserById(existingUser._id, {
        password: payload.password,
        authentication: {
          oneTimeCode: otp,
          expireAt: new Date(Date.now() + 5 * 60_000),
          isResetPassword: false,
        },
      });

      return {
        message: 'OTP sent successfully!',
        statusCode: 409,
        user: { name: existingUser.name, email: existingUser.email, image: existingUser.image },
      };
    }

    const newUser = await this.authRepo.saveUser(payload);
    const otp = generateOTP(6);
    emailHelper.sendEmail(htmlTemplate.createAccount({ name: newUser.name, otp, email: newUser.email! }));

    await this.authRepo.updateUserById(newUser._id, {
      authentication: {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 5 * 60_000),
        isResetPassword: false,
      }
    });

    return { name: newUser.name, email: newUser.email, image: newUser.image };
  }

  public async loginUser(payload: ILoginData) {
    const { email, password, fcmToken } = payload;
    const user = await this.authRepo.findUserByEmail(email, true);
    if (!user) throw new ApiError(400, "User doesn't exist");

    if (!user.verified) throw new ApiError(400, 'Please verify your account first');
    if ([STATUS.BLOCKED, STATUS.DELETED].includes(user.status)) {
      throw new ApiError(400, `Your account is ${user.status}`);
    }

    const isPasswordMatch = password && await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) throw new ApiError(400, 'Password is incorrect');

    const accessToken = jwtHelper.createToken(
      { id: user._id, role: user.role, email: user.email },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as StringValue
    );

    const expireMs = ms(config.jwt.jwt_refresh_expire_in as StringValue)!;
    const refreshToken = jwtHelper.createToken(
      { id: user._id, role: user.role, email: user.email },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_refresh_expire_in as StringValue
    );

    await this.authRepo.createResetToken(user._id, refreshToken, new Date(Date.now() + expireMs));

    await this.authRepo.updateUserById(user._id,{fcmToken: fcmToken})

    return { 
      accessToken, 
      refreshToken, 
      user:{
        name: user.name,
        email: user.email,
        image: user.image,
        _id: user._id
      }
    };
  }

  public async refreshFcmToken(payload: JwtPayload, token: string) {

    const user = await this.authRepo.updateUserById(
      new mongoose.Types.ObjectId( payload.id ),
      {
        fcmToken: token
      }
    )
    if (!user) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        "User not found!"
      )
    }

  }

  public async refreshToken(refreshToken: string) {
    const tokenDoc = await this.authRepo.findValidResetToken(refreshToken);
    if (!tokenDoc) throw new ApiError(401, "Invalid or expired refresh token");

    const user = await this.authRepo.findUserById(tokenDoc.user);
    if (!user) throw new ApiError(401, "User not found");

    const newAccessToken = jwtHelper.createToken(
      { id: user._id, role: user.role, email: user.email },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as StringValue
    );

    return { newAccessToken };
  }

  public async forgetPassword(email: string) {
    const user = await this.authRepo.findUserByEmail(email);
    if (!user) throw new ApiError(400, "User doesn't exist");

    const otp = generateOTP(6);
    emailHelper.sendEmail(htmlTemplate.resetPassword({ otp, email: user.email }));

    const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 5 * 60000), isResetPassword: true };
    await this.authRepo.updateUserById(user._id, { authentication });
  }

  public async verifyEmail(payload: IVerifyEmail) {
    const user = await this.authRepo.findUserByEmail(payload.email, true);
    if (!user) throw new ApiError(400, "User doesn't exist");

    if (!payload.oneTimeCode) throw new ApiError(400, "OTP is required");
    if (user.authentication?.oneTimeCode !== payload.oneTimeCode) throw new ApiError(400, "Wrong OTP");
    if (new Date() > user.authentication.expireAt!) throw new ApiError(400, "OTP expired");

    let data;
    if (!user.authentication.isResetPassword) {
      await this.authRepo.updateUserById(user._id, { verified: true, authentication: { oneTimeCode: null, expireAt: null } });
    } else {
      const token = cryptoToken();
      await this.authRepo.createResetToken(user._id, token, new Date(Date.now() + 5 * 60000));
      await this.authRepo.updateUserById(user._id, { authentication: { isResetPassword: true, oneTimeCode: null, expireAt: null } });
      data = token;
    }
    return { data:{ token: data }, message: 'Verification Successfull' };
  }

  public async resetPassword(payload: IAuthResetPassword) {
    const tokenDoc = await this.authRepo.isTokenExist(payload.token);
    if (!tokenDoc) throw new ApiError(401, "Unauthorized");

    //@ts-ignore
    const user = await this.authRepo.findUserById(tokenDoc.user, true);
    if (!user?.authentication?.isResetPassword) throw new ApiError(401, "No permission");

    const isExpired = await this.authRepo.isTokenExpired(payload.token);
    if (isExpired) throw new ApiError(400, "Token expired");

    if (payload.newPassword !== payload.confirmPassword) throw new ApiError(400, "Passwords do not match");

    // const hashPassword = await bcrypt.hash(payload.newPassword, Number(config.bcrypt_salt_rounds));
    await this.authRepo.updateUserById(user._id, { password: payload.confirmPassword, authentication: { isResetPassword: null } });
  }

  public async changePassword(user: JwtPayload, payload: IChangePassword) {
    const dbUser = await this.authRepo.findUserById(user.id, true);
    if (!dbUser) throw new ApiError(400, "User doesn't exist");

    const isMatch = await bcrypt.compare(payload.currentPassword, dbUser.password!);
    
    if (!isMatch) throw new ApiError(400, "Current password is incorrect");

    if (payload.currentPassword === payload.newPassword) throw new ApiError(400, "New password must be different");

    if (payload.newPassword !== payload.confirmPassword) throw new ApiError(400, "Passwords do not match");

    const hashPassword = await bcrypt.hash(payload.newPassword, Number(config.bcrypt_salt_rounds));
    await this.authRepo.updateUserById(user.id, { password: hashPassword });
  }
}
