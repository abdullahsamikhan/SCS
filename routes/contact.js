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

// Verify Nodemailer configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Nodemailer configuration error:', error);
    } else {
        console.log('Nodemailer is ready to send emails');
    }
});

// GET route to fetch paginated contact form submissions
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'date';
        const sortOrder = parseInt(req.query.sortOrder) || -1;
        const skip = (page - 1) * limit;

        const total = await Contact.countDocuments();
        const contacts = await Contact.find()
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            total,
            contacts,
        });
    } catch (error) {
        console.error('Error fetching contact submissions:', error);
        res.status(500).json({ message: 'Error fetching submissions', error: error.message });
    }
});

// POST route for contact form submission
router.post('/', async (req, res) => {
    const { name, email, message } = req.body;

    // Basic validation
    if (!name || !email || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    try {
        // Save to MongoDB
        const newContact = new Contact({
            name,
            email,
            message,
        });
        await newContact.save();
        console.log(`New contact submission saved: ${name}, ${email}`);

        // Send email to admin
        try {
            const adminMailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: `New Contact Form Submission from ${name}`,
                text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
            };
            await transporter.sendMail(adminMailOptions);
            console.log('Email sent successfully to admin');
        } catch (emailError) {
            console.error('Error sending email to admin:', emailError);
        }

        // Send confirmation email to user
        try {
            const userMailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Thank You for Contacting Saeed Creative Studio',
                text: `Hi ${name},\n\nThank you for reaching out! We have received your message:\n\n"${message}"\n\nWe will get back to you soon.\n\nBest regards,\nSaeed Creative Studio`,
            };
            await transporter.sendMail(userMailOptions);
            console.log('Confirmation email sent successfully to user');
        } catch (emailError) {
            console.error('Error sending confirmation email to user:', emailError);
        }

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error handling contact form:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;