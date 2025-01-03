import {Router} from "express"
import {toggleVideoLike,
        toggleCommentLike,
        getLikedVideos
} from "../controllers/like.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

router.route("/v/:videoId").post(toggleVideoLike)
router.route("/c/:commentId").post(toggleCommentLike)
router.route("/videos").get(getLikedVideos)

export default router