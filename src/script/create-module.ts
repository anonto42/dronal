import fs from "fs";
import path from "path";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const templates = {
  controller: (name: string) => `import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ${capitalize(name)}Service } from "./${name}.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

export class ${capitalize(name)}Controller {
  private ${name}Service: ${capitalize(name)}Service;

  constructor() {
    this.${name}Service = new ${capitalize(name)}Service();
  }

  // POST /${name}
  public create = catchAsync(async (req: Request, res: Response) => {
    const result = await this.${name}Service.create(req.body);

    sendResponse(res, {
      success: true,
      statusCode: result?.statusCode || StatusCodes.CREATED,
      message: result?.message || "${capitalize(name)} created successfully",
      data: result,
    });
  });

  // GET /${name}/:id
  public getById = catchAsync(async (req: Request, res: Response) => {
    const result = await this.${name}Service.getById(req.params.id);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: "${capitalize(name)} retrieved successfully",
      data: result,
    });
  });
}
`,

  repository: (name: string) => `import { ${capitalize(name)} } from "./${name}.model";
import { I${capitalize(name)} } from "./${name}.interface";
import { Types } from "mongoose";

export class ${capitalize(name)}Repository {
  async findById(id: Types.ObjectId) {
    return ${capitalize(name)}.findById(id).lean().exec();
  }

  async create(payload: Partial<I${capitalize(name)}>) {
    return ${capitalize(name)}.create(payload);
  }

  async update(id: Types.ObjectId, payload: Partial<I${capitalize(name)}>) {
    return ${capitalize(name)}.findByIdAndUpdate(id, payload, { new: true }).lean().exec();
  }

  async delete(id: Types.ObjectId) {
    return ${capitalize(name)}.findByIdAndDelete(id).lean().exec();
  }
}
`,

  service: (name: string) => `import { ${capitalize(name)}Repository } from "./${name}.repository";
import { I${capitalize(name)} } from "./${name}.interface";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

export class ${capitalize(name)}Service {
  private ${name}Repo: ${capitalize(name)}Repository;

  constructor() {
    this.${name}Repo = new ${capitalize(name)}Repository();
  }

  public async create(payload: Partial<I${capitalize(name)}>) {
    return this.${name}Repo.create(payload);
  }

  public async getById(id: string) {
    const result = await this.${name}Repo.findById(new Types.ObjectId(id));
    if (!result) throw new ApiError(StatusCodes.NOT_FOUND, "${capitalize(name)} not found!");
    return result;
  }
}
`,

  route: (name: string) => `import { Router } from "express";
import { ${capitalize(name)}Controller } from "./${name}.controller";
import { ${capitalize(name)}Validation } from "./${name}.validation";
import validateRequest from "../../middlewares/validateRequest";

export class ${capitalize(name)}Routes {
  public router: Router;
  private ${name}Controller: ${capitalize(name)}Controller;

  constructor() {
    this.router = Router();
    this.${name}Controller = new ${capitalize(name)}Controller();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router
      .route("/")
      .post(
        validateRequest(${capitalize(name)}Validation.create${capitalize(name)}Schema),
        this.${name}Controller.create
      );

    this.router
      .route("/:id")
      .get(this.${name}Controller.getById);
  }
}

export default new ${capitalize(name)}Routes().router;
`,

  interface: (name: string) => `export interface I${capitalize(name)} {
  _id?: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}
`,

  model: (name: string) => `import { Schema, model } from "mongoose";
import { I${capitalize(name)} } from "./${name}.interface";

const ${name}Schema = new Schema<I${capitalize(name)}>({
  name: { type: String, required: true },
}, { timestamps: true });

export const ${capitalize(name)} = model<I${capitalize(name)}>("${capitalize(name)}", ${name}Schema);
`,

  validation: (name: string) => `import { z } from "zod";

const create${capitalize(name)}Schema = z.object({
  body: z.object({
    name: z.string({ required_error: "${capitalize(name)} name is required" }),
  }),
});

export const ${capitalize(name)}Validation = {
  create${capitalize(name)}Schema,
};
`,
};

async function main() {
  const moduleName = process.argv[2];
  if (!moduleName) {
    console.error("Usage: npm run create-module <module-name>");
    process.exit(1);
  }

  const modulePath = path.join(process.cwd(), "src", "app", "modules", moduleName);
  if (!fs.existsSync(modulePath)) {
    fs.mkdirSync(modulePath, { recursive: true });
    console.log(`Created module folder: ${modulePath}`);
  }

  const files = [
    { key: "controller", filename: `${moduleName}.controller.ts` },
    { key: "service", filename: `${moduleName}.service.ts` },
    { key: "repository", filename: `${moduleName}.repository.ts` },
    { key: "route", filename: `${moduleName}.route.ts` },
    { key: "model", filename: `${moduleName}.model.ts` },
    { key: "interface", filename: `${moduleName}.interface.ts` },
    { key: "validation", filename: `${moduleName}.validation.ts` },
  ];

  for (const file of files) {
    const answer = await askQuestion(`Do you want to create ${file.filename}? (y/n) `);
    if (answer === "y" || answer === "yes") {
      const filePath = path.join(modulePath, file.filename);
      if (fs.existsSync(filePath)) {
        console.log(`${file.filename} already exists. Skipping...`);
        continue;
      }
      const content = (templates as any)[file.key](moduleName);
      fs.writeFileSync(filePath, content, "utf-8");
      console.log(`Created ${file.filename}`);
    } else {
      console.log(`Skipped ${file.filename}`);
    }
  }

  rl.close();
};

main();