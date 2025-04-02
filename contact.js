const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');
require('dotenv').config();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// GET route to fetch all contact form submissions
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const contacts = await Contact.find()
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Contact.countDocuments();

        res.status(200).json({ contacts, total });
    } catch (error) {
        console.error('Error fetching contact submissions:', error);
        res.status(500).json({ message: 'Error fetching submissions' });
    }
});

// POST route for contact form submission
router.post('/', async (req, res) => {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Save to MongoDB
        const newContact = new Contact({
            name,
            email,
            message,
        });
        await newContact.save();

        // Send email (handle failure gracefully)
        try {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER, // Send to your email
                subject: `New Contact Form Submission from ${name}`,
                text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
            };
            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully');
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            // Continue even if email fails
        }

        res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error handling contact form:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE route for individual submission
router.delete('/:id', async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        res.status(200).json({ message: 'Submission deleted successfully' });
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ message: 'Error deleting submission' });
    }
});

// DELETE route for all submissions
router.delete('/', async (req, res) => {
    try {
        await Contact.deleteMany({});
        res.status(200).json({ message: 'All submissions deleted successfully' });
    } catch (error) {
        console.error('Error deleting all submissions:', error);
        res.status(500).json({ message: 'Error deleting all submissions' });
    }
});

module.exports = router;