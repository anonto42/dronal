import { Router } from "express";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";
import validateRequest from "../../middlewares/validateRequest";
import { USER_ROLES } from "../../../enums/user";
import auth from "../../middlewares/auth";
import fileUploadHandler from "../../middlewares/fileUploadHandler";

export class AdminRoutes {
  public router: Router;
  private adminController: AdminController;

  constructor() {
    this.router = Router();
    this.adminController = new AdminController();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this
      .router
      .route("/overview")
      .get(this.adminController.overview);

    this 
      .router
      .route("/users")
      .get(
        auth( USER_ROLES.ADMIN ),
        validateRequest(AdminValidation.usersAdminSchema),
        this.adminController.getUsers
      );

    this 
      .router
      .route("/users/:id")
      .get(
        auth( USER_ROLES.ADMIN ),
        validateRequest(AdminValidation.idParamsAdminSchema),
        this.adminController.getUser
      );
      // Have to work 
    
    this
      .router
      .route("/categories")
      .get(
        auth( USER_ROLES.ADMIN ),
        validateRequest(AdminValidation.getCategoriesSchema),
        this.adminController.getCategories
      )
      .post(
        auth( USER_ROLES.ADMIN ),
        fileUploadHandler(),
        validateRequest(AdminValidation.addNewCategorySchema),
        this.adminController.addNewCategory
      )
      .patch(
        auth( USER_ROLES.ADMIN ),
        fileUploadHandler(),
        validateRequest(AdminValidation.updateCategorySchema),
        this.adminController.updateCategory
      );

    this
      .router
      .route("/categories/:id")
      .delete(
        auth( USER_ROLES.ADMIN ),
        validateRequest(AdminValidation.idParamsAdminSchema),
        this.adminController.deleteCategory
      );
      
    this
    .router
    .route("/policy")
    .get(
      auth( USER_ROLES.ADMIN, USER_ROLES.CLIENT, USER_ROLES.PROVIDER ),
      this.adminController.getPolicy
    )
    .patch(
      auth( USER_ROLES.ADMIN ),
      validateRequest(AdminValidation.updatePolicySchema),
      this.adminController.updatePolicy
    );

    this
    .router
    .route("/terms")
    .get(
      auth( USER_ROLES.ADMIN, USER_ROLES.CLIENT, USER_ROLES.PROVIDER ),
      this.adminController.getTerms
    )
    .patch(
      auth( USER_ROLES.ADMIN ),
      validateRequest(AdminValidation.updateTermsSchema),
      this.adminController.updateTerms
    );

  }
}

export default new AdminRoutes().router;
