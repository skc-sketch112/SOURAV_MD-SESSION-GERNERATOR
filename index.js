const {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const fs = require("fs");

// Your number with country code (without +)
const OWNER_NUMBER = "91XXXXXXXXXX";  

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./auth");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    // 🔑 Pairing code login
    if (!sock.authState.creds.registered) {
        try {
            const code = await sock.requestPairingCode(OWNER_NUMBER);
            console.log(`🔗 Pairing Code: ${code}`);
            console.log("⚡ Enter this code in WhatsApp > Linked Devices > Link with phone number.");
        } catch (err) {
            console.error("❌ Pairing code error:", err);
        }
    }

    // 🔄 Save session automatically
    sock.ev.on("creds.update", saveCreds);

    // ✅ Once connected, send session ID file to your WhatsApp
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
            console.log("✅ Connected to WhatsApp");

            // Read saved session from auth folder
            const sessionData = fs.readFileSync("./auth/creds.json", "utf8");

            // Save also as session.json
            fs.writeFileSync("session.json", sessionData);

            // Send it to your WhatsApp
            await sock.sendMessage(OWNER_NUMBER + "@s.whatsapp.net", {
                document: { url: "./session.json" },
                mimetype: "application/json",
                fileName: "session.json",
                caption: "✅ Here is your WhatsApp Session ID"
            });

            console.log("📤 Session ID sent to your WhatsApp!");
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("❌ Connection closed. Reconnect:", shouldReconnect);
            if (shouldReconnect) startBot();
        }
    });
}

startBot();
