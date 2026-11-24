import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /.+@.+\..+/,
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

// Never send the hash, even if a query selects it
userSchema.set('toJSON', {
  // Return a copy without the two fields instead of deleting them from ret
  // (Airbnb's no-param-reassign)
  transform: (doc, { passwordHash, __v, ...rest }) => rest,
});

export default model('User', userSchema);
