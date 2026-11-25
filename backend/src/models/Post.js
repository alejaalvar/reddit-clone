import { Schema, model } from 'mongoose';

const postSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300,
  },
  body: {
    type: String,
    trim: true,
    maxlength: 40000,
    default: '',
  },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  community: { type: Schema.Types.ObjectId, ref: 'Community', required: true },
  // Counters: only the vote and comment code changes these, always with $inc
  score: { type: Number, default: 0 },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
}, { timestamps: true });

postSchema.index({ createdAt: -1, _id: -1 }); // home feed, New
postSchema.index({ score: -1, createdAt: -1, _id: -1 }); // home feed, Top
postSchema.index({ community: 1, createdAt: -1, _id: -1 }); // community feed, New
postSchema.index({
  community: 1, score: -1, createdAt: -1, _id: -1,
}); // community feed, Top

export default model('Post', postSchema);
