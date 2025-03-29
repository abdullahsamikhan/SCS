require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Endpoint to serve environment variables to the frontend
app.get('/config', (req, res) => {
    res.json({
        callLink: process.env.CALL_LINK,
        whatsappLink: process.env.WHATSAPP_LINK,
        emailLink: process.env.EMAIL_LINK
    });
});

app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;
    console.log('Contact Form Submission:', { name, email, message });
    res.status(200).json({ message: 'Message received' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});