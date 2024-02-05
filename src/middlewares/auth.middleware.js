import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

const verifyJwt = asyncHandler(async (req, res, next) => {
    // getting token from large devices using cookies but for small devices we will use header and resplace "Bearer " with empty string 
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    console.log(token);
    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Unauthorized request");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Unauthorized request");
    }
})

export {
    verifyJwt,
}