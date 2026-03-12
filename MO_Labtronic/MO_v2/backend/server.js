require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/notify', async (req, res) => {
    const apiKey = process.env.PUSHALERT_API_KEY;
    const frontendPayload = req.body;

    const params = new URLSearchParams();
    
    for (const key in frontendPayload) {
        if (Array.isArray(frontendPayload[key]) || typeof frontendPayload[key] === 'object') {
            params.append(key, JSON.stringify(frontendPayload[key]));
        } else {
            params.append(key, frontendPayload[key]);
        }
    }

    try {
        const pushResponse = await fetch("https://api.pushalert.co/rest/v1/send", {
            method: "POST",
            headers: {
                "Authorization": `api_key=${apiKey}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: params.toString()
        });

        const data = await pushResponse.json();
        res.status(pushResponse.status).json(data);

    } catch (error) {
        console.error("Proxy forwarding failed:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/test-server',(req,res)=>{
    res.send('OK!')
})
app.listen(port, () => {
    console.log(`Pass-Through Proxy securely running on port ${port}`);
});