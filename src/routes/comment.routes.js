import { Router } from "express"
import {addComment,
        getVideoComments,
        updateComment,
        deleteComment
} from "../controllers/comment.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

router.route("/:videoId").post(addComment).get(getVideoComments) // tested
router.route("/c/:commentId").delete(deleteComment).patch(updateComment) //tested

export default router