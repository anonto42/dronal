import { z } from 'zod';
import { USER_ROLES } from '../../../enums/user';

const signUpZodSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    email: z.string({ required_error: 'Email is required' }),
    role: z.enum([USER_ROLES.CLIENT, USER_ROLES.PROVIDER ],{ invalid_type_error: "You must give the role on this formet 'PROVIDER' or 'CLIENT' "}),
    password: z.string({ required_error: 'Password is required' }),
  }).strict()
});

const createVerifyEmailZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }),
    oneTimeCode: z.number({ required_error: 'One time code is required' }),
  }),
});

const createLoginZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }),
    password: z.string({ required_error: 'Password is required' }),
    fmToken: z.string({ required_error: "You must give the fcm token to get push notification!"})
  }).strict()
});

const createRefreshFcmTokenZodSchema = z.object({
  body: z.object({
    fmToken: z.string({ required_error: "You must give the fcm token to get push notification!"})
  }).strict()
});

const createForgetPasswordZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: 'Email is required' }),
  }),
});

const createResetPasswordZodSchema = z.object({
  body: z.object({
    newPassword: z.string({ required_error: 'Password is required' }),
    confirmPassword: z.string({
      required_error: 'Confirm Password is required',
    }),
  }),
});

const createChangePasswordZodSchema = z.object({
  body: z.object({
    currentPassword: z.string({
      required_error: 'Current Password is required',
    }),
    newPassword: z.string({ required_error: 'New Password is required' }),
    confirmPassword: z.string({
      required_error: 'Confirm Password is required',
    }),
  }),
});

const createRefreshToken = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: "You must give the refreshtoken to genarate a access token"})
  })
})

export const AuthValidation = {
  createVerifyEmailZodSchema,
  signUpZodSchema,
  createRefreshFcmTokenZodSchema,
  createForgetPasswordZodSchema,
  createLoginZodSchema,
  createResetPasswordZodSchema,
  createChangePasswordZodSchema,
  createRefreshToken,
};
