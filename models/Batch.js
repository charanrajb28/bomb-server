import mongoose from "mongoose";

const BatchSchema = new mongoose.Schema({
    batchName: { type: String, required: true },
    playerCount: { type: Number, required: true },
    grid: { type: Array, required: true },
    players: { type: Object, default: {} }
});

export default mongoose.model("Batch", BatchSchema);
