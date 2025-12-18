import mongoose from "mongoose";
import { IVesselVisitExecutionPersistence } from "../../dataschema/IVesselVisitExecutionPersistence";
import { VesselVisitExecution } from "../../domain/VesselVisitExecution";
import { VesselVisitExecutionStatus } from "../../domain/VesselVisitExecutionStatus";

const VesselVisitExecutionSchema = new mongoose.Schema(
  {
    code: {
        type: String,
        required: false,
        unique: true
    },

    vesselIMO: {
        type: String,
        required: false,
        unique: true
    },

    status: {
      type: String,
      enum: Object.values(VesselVisitExecutionStatus),
      required: false,
      unique: false
    },

    arrivalDate: {
        type: Date,
        required: true,
        unique: false
    },

    departureDate: {
      type: Date,
      required: false,
      unique: false
    },

    lastUpdated: {
        type: Date,
        required: false,
        unique: false
    },

    systemUserID: {
        type: String,
        required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model<IVesselVisitExecutionPersistence & mongoose.Document>(
  "VesselVisitExecution",
  VesselVisitExecutionSchema
);
