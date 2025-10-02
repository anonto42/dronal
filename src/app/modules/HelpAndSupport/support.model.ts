import { model, Schema } from "mongoose";
import { ISupport } from "./support.interface";
import { SupportStatus } from "../../../enums/support";

const supportSchema = new Schema<ISupport>({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    attachment: {
        type: String,
        required: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: Object.values(SupportStatus),
        default: SupportStatus.PENDING
    }
},{
    timestamps: true,
    versionKey: false
});

export const Support = model<ISupport>("Support", supportSchema);
