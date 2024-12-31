import {Router} from "express"
import {publishVideo,
        getAllVideos,
        getVideoById,
        deleteVideo,
        updateThumbnail,
        togglePublishStatus
} from "../controllers/video.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

router.route("/upload").post(   //tested
    upload.fields([
        {
            name : "videoFile",
            maxCount : 1
        },
        {
            name : "thumbnail",
            maxCount : 1
        }
    ]),
    publishVideo
)

router.route("/").get(getAllVideos) //tested -> uses query
router.route("/:videoId").get(getVideoById) // tested -> uses params
router.route("/:videoId").delete(deleteVideo) // tested -> uses params
router.route("/:videoId").patch(upload.single("newThumbnail"),updateThumbnail) //tested
router.route("/toggle/publish/:videoId").patch(togglePublishStatus) //not tested

export default router