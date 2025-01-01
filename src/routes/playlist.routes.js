import { Router } from "express"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {createPlaylist,
        deletePlaylist,
        getPlaylistById,
        updatePlaylist,
        getUserPlaylists,
        addVideoToPlaylist,
        removeVideoFromPlaylist
} from "../controllers/playlist.controller.js"

const router = Router()
router.use(verifyJWT)

router.route("/create").post(createPlaylist) //tested
router.route("/:playlistId").delete(deletePlaylist) //tested
router.route("/:playlistId").get(getPlaylistById) //tested
router.route("/:playlistId").patch(updatePlaylist) //tested
router.route("/user/:userId").get(getUserPlaylists) //tested

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist) //tested
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist) //tested

export default router