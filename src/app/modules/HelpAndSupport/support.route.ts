import { Router } from "express"
import { SupportController } from "./support.controller";
import auth from "../../middlewares/auth";
import { USER_ROLES } from "../../../enums/user";
import validateRequest from "../../middlewares/validateRequest";
import { supportValidation } from "./support.validation";
import fileUploadHandler from "../../middlewares/fileUploadHandler";


export class SupportRoute {
    public router: Router;
    private readonly supportController: SupportController;

    constructor(){
        this.router = Router();
        this.supportController = new SupportController();
        this.initializeRoutes();
    }

    private initializeRoutes(): void {

        this
        .router
        .route("/")
        .get(
            auth( USER_ROLES.ADMIN ),
            validateRequest( supportValidation.getSupportSchema ),
            this.supportController.getSupports
        )
        .post(
            auth( USER_ROLES.CLIENT, USER_ROLES.ADMIN, USER_ROLES.PROVIDER ),
            fileUploadHandler(),
            validateRequest( supportValidation.supportSchema ),
            this.supportController.createSupport
        )

        this
        .router
        .route("/:id")
        .patch(
            auth( USER_ROLES.ADMIN ),
            this.supportController.markAsResolve
        )

    }
    
}

export default new SupportRoute().router;