import express, { json } from "express";
import webpush from "web-push"
import cors from "cors"
import dotenv from "dotenv";
dotenv.config();

const app = express()
app.use(cors())
app.use(express.json())
webpush.setVapidDetails(
    "mailto:p-mahmoud.sheliel@zewailcity.edu.eg", 
    process.env.public_key,
    process.env.private_key
)

app.post("/sub", (req, res) => {
    const { sub } = req.body
    // save the sub

    groups.get(group).push(sub)
    res.json({ success: true })
})


app.post("/notify", async (req, res) => {
    const { userIds, title, body } = req.body
    //get the sub
    const subs = groups.get(group)
    const payload = JSON.stringify({ title, body })
    const alive = []
    for (const sub of subs) {
        try {
            await webpush.sendNotification(sub, payload)
        }
        catch (e) {
            console.log(e)
        }
    }
    console.log(alive)
    res.json({ sent: alive })
})


app.get("/vapid_key", (req, res) => {
    res.send(process.env.public_key)
})

app.listen(process.env.port, () => console.log("Running"))