import { Router } from "express"
import {registerUser, 
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeUserPassword,
        getCurrentUser,
        updateUserAvatar,
        updateCoverImage
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
router.route("/change-password").post(verifyJWT, changeUserPassword) //not tested
router.route("/get-user").get(verifyJWT, getCurrentUser) //not tested

router.route("/change-avatar").post( //tested
    verifyJWT, 
    upload.single("newAvatar"),
    updateUserAvatar
)

router.route("/change-coverimage").post(  //tested
    verifyJWT, 
    upload.single("newCoverImage"),
    updateCoverImage
)

export default router