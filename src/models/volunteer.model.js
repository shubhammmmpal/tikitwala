import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema(
  {
    campId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Camp",
      required: true,
    },
    agent_id:{
    type: String,
    unique: true,
    sparse: true
  },

    name: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "Volunteer",
    },

    image: {
      type: String,
    },
    age: {
      type: Number,
    },
    batchNo: {
      type: String,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Volunteer", volunteerSchema);
