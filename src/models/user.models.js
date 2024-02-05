import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
    { 
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 5,
            maxlength: 15,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            maxlength: 15,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Video'
            },
        ],
        refreshToken: {
            type: String,
        }

    }
);

// Using mongoose pre code so that when we update anything and we want to save the change we will use it

userSchema.pre('save', async function (next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }
    next();
}); 

// Designing custom Methods
userSchema.methods.isValidPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            fullname: this.fullname,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
};

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    );
};
export const User = mongoose.model('User', userSchema)