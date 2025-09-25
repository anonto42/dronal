import { Router } from 'express';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { USER_ROLES } from '../../../enums/user';

export class AuthRoutes {
  public router: Router;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController(); 
    this.initializeRoutes();
  }

  private initializeRoutes(): void {

    // POST /signup
    this
    .router
    .route('/signup')
    .post(
      validateRequest(AuthValidation.signUpZodSchema),
      this.authController.signUp
    );
    
    // POST /login
    this
    .router
    .route('/login')
    .post(
      validateRequest(AuthValidation.createLoginZodSchema),
      this.authController.loginUser
    );

    // POST /refresh-fcm
    this
    .router
    .route('/refresh-fcm')
    .post(
      auth( USER_ROLES.CLIENT, USER_ROLES.PROVIDER, USER_ROLES.ADMIN ),
      validateRequest(AuthValidation.createRefreshFcmTokenZodSchema),
      this.authController.refreshFcm
    );

    // POST /forget-password
    this
    .router
    .route('/forget-password')
    .post(
      validateRequest(AuthValidation.createForgetPasswordZodSchema),
      this.authController.forgetPassword
    );

    // POST /verify-email
    this
    .router
    .route('/verify-email')
    .post(
      validateRequest(AuthValidation.createVerifyEmailZodSchema),
      this.authController.verifyEmail
    );

    // POST /reset-password
    this
    .router
    .route('/reset-password')
    .post(
      validateRequest(AuthValidation.createResetPasswordZodSchema),
      this.authController.resetPassword
    );

    // POST /refresh-token
    this
    .router
    .route('/refresh-token')
    .post(
      validateRequest(AuthValidation.createRefreshToken),
      this.authController.refreshAccessToken
    );

    // POST /change-password
    this
    .router
    .route('/change-password')
    .post(
      auth(USER_ROLES.ADMIN, USER_ROLES.CLIENT, USER_ROLES.PROVIDER),
      validateRequest(AuthValidation.createChangePasswordZodSchema),
      this.authController.changePassword
    );
  }
}

export default new AuthRoutes().router;