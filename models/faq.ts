import mongoose, {Schema, Document, Model} from "mongoose";


interface IFaq extends Document {
    question: string,
    answer: string
}

const FAQSchema : Schema<IFaq> = new Schema({
    question: {
        type: String,
        required: true,
        unique: true,
    },
    answer: {
        type: String,
        required: true
    },
})

const FAQModel: Model<IFaq> = mongoose.models.FAQ ||
mongoose.model<IFaq>("FAQ",FAQSchema);

export default FAQModel;