import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { jwt } from "jsonwebtoken";

const options = {
    httpOnly: true,
    secure: true,
};

const generateAccessandRefreshToken = async (userId) => {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
}

const registerUser = asyncHandler( async (request, response) => {
    // await res.status(200).json({
    //     success: true,
    //     message: 'User registered successfully'
    // })

    // Now register the user 
    // Steps
    // 1. get the user user details from the frontend.
    // 2. validate either the user filled the all fields or has left some fields empty
    // 3. check if the user already exists
    // 4. check for images and avatar and Again check avatar
    // 5. upload images on cloudinary server
    // 6. create object of given fields and then create entry in db 
    // 7. remove password and refresh token from the response object
    // 8. return the response object

    // 1. get the user details
    const {fullname, username, email, password} = request.body;

    // 2. validate either the user filled the all fields or has left some fields empty
    // if (!fullnamem ||!username ||!email ||!password) {
    //     return res.status(400).json({
    //         success: false,
    //         message: 'Please fill all the fields'
    //     })
    // }
    // Or 
    if ( [fullname, username, email].some((field) => field?.trim() == '') ) {
        throw new ApiError(400, 'Please fill all the fields');
    }

    // 3. check if the user already exists
    // const user = await User.findOne({ email });
    // If we want to check multiple fields then we need to use $ with some functions
    const userExisted = await User.findOne({
        $or: [ { email },  { username } ]
    });
    if (userExisted) {
        throw new ApiError(400, 'User already exists');
    }

    // 4. check for images and avatar and upload
    // as express is giving us body function to get data like this multer is giving us files function to get data path
    const avatarLocalPath = request.files?.avatar[0]?.path;
    // const coverImageLocalPath = request.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (request.files && Array.isArray(request.files.coverImage) && request.files.coverImage.length > 0) {
        coverImageLocalPath = request.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required');
    }
    console.log(avatarLocalPath);
    console.log(coverImageLocalPath);

    // 5. upload the images on cloudinary server
    const avatarCloudinaryResponse = await uploadOnCloudinary(avatarLocalPath);
    const coverImageCloudinaryResponse = await uploadOnCloudinary(coverImageLocalPath);

    // checking again avatar 
    if (!avatarCloudinaryResponse) {
        throw new ApiError(400, 'Avatar upload failed');
    }

    // 6. create object of given fields and then create entry in db 
    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatarCloudinaryResponse.url,
        coverImage: coverImageCloudinaryResponse?.url || "" // agr hy to dedo wrna khali chor do 
    });

    // 7. remove password and refresh token from the response object
    const createdUser = await User.findById(user._id).select(
        '-password -refreshToken'
    )

    if (!createdUser) {
        throw new ApiError(500, 'Something went wrong while registering user');
    }

    // 8. return the response object
    return response.status(201).json(
        new ApiResponse(200, createdUser, 'registration successful')
    )
    
});

const loginUser = asyncHandler(async (request, response) => {
    // Steps for login user
    // 1. request for get data from user
    // 2. ask for username or email
    // 3. find user by username or email
    // 4. validate password
    // 5. access and refresh tokens
    // 6. send cookies

    // 1. request for get data from user
    // console.log(request.body);
    const {email, username, password} = request.body;
    // console.log(email, username, password);
    // 2. ask for username or email
    if ( !(email || username) ) {
        throw new ApiError('username or email is required');
    }

    // 3. find user by username or email
    const user = await User.findOne({
        $or: [ { email },  { username } ]
    })

    if (!user) {
        throw new ApiError(400, 'User not found');
    }

    // 4. validate password
    const isValidPassword = await user.isValidPassword(password);
    if (!isValidPassword) {
        throw new ApiError(400, 'Invalid password');
    }

    // 5. access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);
    
    // 6. send cookies
    const loggedInUser = await User.findById(user._id).select(
        '-password -refreshToken'
    )

    return response
    .status(200)
    .cookie("accessToken", accessToken, options) // accessToken parameter is name which will used to access the cookie
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, { loggedInUser, accessToken, refreshToken }, 'login successful')
    )
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, 
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    );

    return res
        .status(200)
        .clearCookies("accessToken", accessToken, options)
        .clearCookies('refreshToken', refreshToken, options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));

});

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incommingRefreshToken = req.body.refreshToken || req.cookies.refreshToken;

    if (!incommingRefreshToken) {
        throw new ApiError(400, 'Refresh token is required');
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(400, 'User not found');
        }

        if (incommingRefreshToken !== user?.refreshToken) {
            throw new ApiError(400, 'Refresh token has already been expired or used');
        }
        const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);

        return res
         .status(200)
         .cookie("accessToken", accessToken, options) // accessToken parameter is name which will used to access the cookie
         .cookie("refreshToken", refreshToken, options)
         .json(
                new ApiResponse(200, { accessToken, refreshToken },'refresh token refreshed successfully')
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    } 
});

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req?._id);

    const isValidPassword = user.isValidPassword(oldPassword);
    if (!isValidPassword) {
        throw new ApiError(400, 'Invalid old password');
    }

    if (newPassword!== confirmPassword) {
        throw new ApiError(400, 'Passwords do not match');
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(
            new ApiResponse(200, {}, 'Password changed successfully')
        );

});

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
        .status(200)
        .json( 200, res?.user, "User has been fetched successfully" );
});

const updateAccountDetails = asyncHandler( async (req, res) => {
    const {fullname, email} = req.body;

    if (!fullname ||!email) {
        throw new ApiError(400, 'Please fill all the fields');
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { email, fullname }
        },
        {
            new: true
        }
    ).select('-password');
    return res
        .status(200)
        .json( new ApiResponse(200, user, "Account updated successfully" ));
});

const updateUserAvatar = asyncHandler( async(req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required');
    }

    // Upload the avatar on the server of cloudinary
    const avatarCloudinaryResponse = await uploadOnCloudinary(avatarLocalPath);

    if (!avatarCloudinaryResponse) {
        throw new ApiError(400, 'Avatar upload failed');
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatarCloudinaryResponse.url }
        },
        {
            new: true
        }
    ).select('-password');
    return res
       .status(200)
       .json( new ApiResponse(200, user, "Avatar updated successfully" ));
});

const updateUserCoverImage = asyncHandler( async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, 'Cover image is required');
    }

    // Upload the cover image on the server of cloudinary
    const coverImageCloudinaryResponse = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImageCloudinaryResponse) {
        throw new ApiError(400, 'Cover image upload failed');
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { coverImage: coverImageCloudinaryResponse.url }
        },
        {
            new: true
        }
    ).select('-password');
    return res
      .status(200)
      .json( new ApiResponse(200, user, "Cover image updated successfully" ));
});

const getUserProfile = asyncHandler( async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, 'Username not found!');
    }

    const channel = await User.aggregate(
        [
            {
                $match: { 
                    username: username?.toLowerCase() 
                },
            },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'channel',
                    as:'subscribers'
                }
            },
            {
                $lookup: {
                    from:  'subscriptions',
                    localField: '_id',
                    foreignField: 'subscriber',
                    as: 'subscribedTo'
                }
            },
            {
                $addFields: {
                    subscribers: { $size: '$subscribers' },
                    subscribedTo: { $size: '$subscribedTo' },
                    isSubscribed: {
                        if: { 
                            $in: [req.user?._id, '$subscribers.subscriber']
                        }, 
                        then: true, 
                        else: false
                    }
                }
            },
            {
                $project: {
                    username: 1,
                    fullname: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribers: 1,
                    subscribedTo: 1
                }
            }
        ]
    );

    if (!channel) {
        throw new ApiError(400, 'Channel not found');
    }

    return res
      .status(200)
      .json( new ApiResponse(200, channel, "Channel fetched successfully" ));
})

const getWatchHistory = asyncHandler( async (req, res) => {
    const user = await User.aggregate([
        {
            $match: { 
                // _id: req.user?._id  this is wrong because we can't get user id mongodb always returns a string like ObjectId(fjasj949349) then mongoose converts it to id removes ObjectId so if we want the actual id we will use new mongoose object

                _id: new mongoose.Types.ObjectId(req.user?._id)
            },
            $lookup: {
                from: 'videos',
                localField: 'watchHistory',
                foreignField: '_id',
                as: 'watchHistory',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'owner',
                            pipeline: [
                                {
                                     $project: {
                                        username: 1,
                                        fullname: 1,
                                        email: 1,
                                        avatar: 1,
                                        coverImage: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ]);

    return res
        .status(200)
        .json( new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserProfile,
    getWatchHistory
}