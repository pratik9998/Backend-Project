import { Router } from "express"
import {registerUser, 
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeUserPassword,
        getCurrentUser,
        updateUserAvatar,
        updateCoverImage,
        getUserChennelProfile,
        getWatchHistory
} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(  //tested
    upload.fields([   //used middleware here
        { name : "avatar", maxCount : 1 },
        { name : "coverImage", maxCount : 1 }
    ]),
    registerUser
)

router.route("/login").post(loginUser) //tested

//secure routes
router.route("/logout").post(verifyJWT, logoutUser) //tested
router.route("/refresh-access-token").post(refreshAccessToken) //not tested
router.route("/change-password").patch(verifyJWT, changeUserPassword) //not tested
router.route("/get-user").get(verifyJWT, getCurrentUser) //not tested

//patch method is used when we want to update a specific field 
router.route("/change-avatar").patch( //tested
    verifyJWT, 
    upload.single("newAvatar"),
    updateUserAvatar
)

router.route("/change-coverimage").patch(  //tested
    verifyJWT, 
    upload.single("newCoverImage"),
    updateCoverImage
)

router.route("/channel/:username").get(verifyJWT, getUserChennelProfile) //not tested
router.route("/watch-history").get(verifyJWT, getWatchHistory) //not tested


export default router