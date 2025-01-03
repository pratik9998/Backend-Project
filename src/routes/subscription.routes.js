import { Router } from "express"
import {toggleSubscription,
        getSubscribedChannels
} from "../controllers/subscription.controller.js"
import {verifyJWT} from '../middlewares/auth.middleware.js'

const router = Router()
router.use(verifyJWT)

router.route("/:channelId").get(getSubscribedChannels).post(toggleSubscription) //tested

export default router