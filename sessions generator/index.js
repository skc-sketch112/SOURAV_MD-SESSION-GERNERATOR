const express = require("express");
const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send(`
        <h2>🔐 WhatsApp Session Generator</h2>
        <form method="get" action="/pair">
            <label>Enter Phone Number (with country code):</label><br>
            <input type="text" name="number" placeholder="91XXXXXXXXXX" required />
            <button type="submit">Get Pairing Code</button>
        </form>
    `);
});

app.get("/pair", async (req, res) => {
    const number = req.query.number;
    if (!number) return res.send("⚠️ Please provide your number!");

    try {
        const { state, saveCreds } = await useMultiFileAuthState("auth_info");
        const sock = makeWASocket({
            auth: state,
            printQRInTerminal: false
        });

        if (!sock.authState.creds.registered) {
            const code = await sock.requestPairingCode(number);
            console.log(`✅ Pairing code for ${number}: ${code}`);
            res.send(`<h3>✅ Pairing Code: <b>${code}</b></h3>
                      <p>Open WhatsApp > Linked Devices > Link with phone number and enter this code.</p>`);
        }

        sock.ev.on("creds.update", saveCreds);
    } catch (err) {
        console.error("❌ Error generating pairing code:", err);
        res.send("❌ Error generating pairing code. Check server logs.");
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Session generator running at http://localhost:${PORT}`);
});
