import { model, Schema } from "mongoose";
import { IService } from "./service.interface";

const serviceSchema = new Schema<IService>({
    creator:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    image:{
        type: String,
        required: true
    },
    category:{
        type: String,
        required: true
    },
    subCategory:{
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true
    },
    isDeleted:{
        type: Boolean,
        default: false
    }
},{
    timestamps: true,
    versionKey: false
});

export const Service = model<IService>("Service", serviceSchema);