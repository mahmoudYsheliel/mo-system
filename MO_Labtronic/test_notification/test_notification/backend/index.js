import express, { json } from "express";
import webpush from "web-push"
import cors from "cors"



// in memory DB 
const groups = new Map();
// keys to use with webpush
const keys = {
    "public_key": "BEc6kl8jtYvDcjPAag2jH8uGHAaaUy6SgbvSfM2qvmt76i8R1b2PtNuNw7gEDKivzo_9otyOMcW-2N4S7jQ9fbg",
    "private_key": "w-3Dme19ozLlB4yR3QlD9-GVdVvgjnEz9qZ325KHhtM"
}



const app = express()
app.use(cors())
app.use(express.json())
webpush.setVapidDetails(
    "mailto:p-mahmoud.sheliel@zewailcity.edu.eg", // this email should be changed to the compony name
    keys.public_key,
    keys.private_key
)



// this api for subscribing to groups
app.post("/sub", (req, res) => {
    // user want to subscribe to this group of news
    const { group, sub } = req.body
    console.log(group, sub)
    // if the group doesn't exist=> create
    if (!groups.has(group)) groups.set(group, [])
    console.log(group, sub)
    console.log(groups[group])
    groups.get(group).push(sub)
    res.json({ success: true })
    console.log(groups)
})


app.post("/notify", async (req, res) => {
    const { group, title, body } = req.body
    if (!groups.has(group)) return res.status(404)
    const subs = groups.get(group)
    const payload = JSON.stringify({ title, body })
    const alive = []
    for (const sub of subs) {
        try {
            console.log(sub)
            await webpush.sendNotification(sub, payload)
            alive.push(sub)
        }
        catch (e) {
            console.log(e)
        }
    }
    console.log(alive)
    res.json({ sent: alive })
})


app.get("/vapid_key", (req, res) => {
    res.send(keys.public_key)
})

app.listen(3000, () => console.log("Running"))