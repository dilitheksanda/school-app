const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const publicVapidKey = 'BP0baLDBZkHyVfV8aCAQguTJad01jNF2Uz8-CTXuAGIX42OLuXMuGmeh77JjtAWQfgh7u9MjVNansfsJIX8u1Sg';
const privateVapidKey = 'YOUR_PRIVATE_VAPID_KEY'; // අවශ්‍ය නම් ඔබේ Private Vapid Key එක මෙහි දමන්න
const FIREBASE_DB_URL = 'https://smmv-relief-system-default-rtdb.firebaseio.com'; // ඔබේ Firebase Database URL එක

webpush.setVapidDetails('mailto:admin@smmv.com', publicVapidKey, privateVapidKey);

// Subscriptions Firebase වලට Save කිරීම
app.post('/api/save-subscription', async (req, res) => {
    try {
        const { teacherId, subscription } = req.body;
        const response = await fetch(`${FIREBASE_DB_URL}/push_subscriptions/${teacherId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        if (response.ok) {
            res.status(201).json({ message: 'Subscription saved successfully in Firebase' });
        } else {
            res.status(500).json({ error: 'Failed to save in Firebase' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Notifications යැවීම
app.post('/api/send-notification', async (req, res) => {
    try {
        const { teacherId, title, message } = req.body;
        
        // Firebase එකෙන් අදාළ ගුරුවරයාගේ Subscription එක ලබා ගැනීම
        const response = await fetch(`${FIREBASE_DB_URL}/push_subscriptions/${teacherId}.json`);
        const subscription = await response.json();

        if (!subscription) {
            return res.status(404).json({ error: 'Teacher subscription not found' });
        }

        const payload = JSON.stringify({ title, body: message });

        await webpush.sendNotification(subscription, payload);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error sending push notification', err);
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
