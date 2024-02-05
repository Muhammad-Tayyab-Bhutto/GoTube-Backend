import { Router } from "express";
import { loginUser, registerUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/register').post(upload.fields([
    {
        name: 'avatar',
        maxCount: 1
    },
    {
        name: 'coverImage',
        maxCount: 1
    }
]), registerUser);

router.route('/login').post(loginUser);

router.route('/logout').post(verifyJwt, logoutUser);

router.route('/refresh-token').post(refreshAccessToken);

router.route('/change-password').post(verifyJwt, changeCurrentPassword);

router.route('/current-user').get(verifyJwt, getCurrentUser);

router.route('/update-account-details').patch(verifyJwt, updateAccountDetails);

router.route('/update-user-avatar').patch(verifyJwt, upload.single('avatar'), updateUserAvatar);

router.route('/update-user-cover-image').patch(verifyJwt, upload.single('coverImage'), updateUserCoverImage);

router.route('/user-profile/:username').get(verifyJwt, getUserProfile);

router.route('/watch-history').get(verifyJwt, getWatchHistory);



export default router;