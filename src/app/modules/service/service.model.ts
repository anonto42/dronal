import { model, Schema } from "mongoose";
import { IService } from "./service.interface";
import { SERVICE_DAY } from "../../../enums/service";

const serviceSchema = new Schema<IService>({
    user:{
        type: Schema.Types.ObjectId,
        ref: "User"
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
    distance:{
        type: Number,
        required: true
    },
    availableDay:{
        type: [String],
        enum: Object.values(SERVICE_DAY),
        required: true
    },
    startTime:{
        type: String,
        required: true
    },
    endTime:{
        type: String,
        required: true
    }
},{
    timestamps: true,
    versionKey: false
});

export const Service = model<IService>("Service", serviceSchema);