import { Schema, model } from 'mongoose';

const communitySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 21,
    match: /^[a-z0-9_]+$/,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default model('Community', communitySchema);
