import { Router } from "express"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {createPlaylist,
        deletePlaylist,
        getPlaylistById,
        updatePlaylist
} from "../controllers/playlist.controller.js"

const router = Router()
router.use(verifyJWT)

router.route("/create").post(createPlaylist) //tested
router.route("/:playlistId").delete(deletePlaylist) //tested
router.route("/:playlistId").get(getPlaylistById) //tested
router.route("/:playlistId").patch(updatePlaylist) //tested

export default router