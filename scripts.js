document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');
    const navbar = document.querySelector('.navbar');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Contact form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission

            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            // Create payload
            const data = { name, email, message };

            try {
                console.log('Submitting form data:', data); // Log the data being sent
                // Send data to backend and capture the response
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                console.log('Response status:', response.status); // Log the response status
                const result = await response.json();
                console.log('Response data:', result); // Log the response data

                if (response.ok) {
                    formMessage.textContent = result.message; // Should be "Message sent successfully"
                    formMessage.classList.add('show'); // Trigger drop-down animation
                    form.reset(); // Clear the form
                    // Hide the message after 3 seconds
                    setTimeout(() => {
                        formMessage.classList.remove('show');
                    }, 3000);
                } else {
                    formMessage.textContent = result.message || 'Error submitting form';
                    formMessage.classList.add('show'); // Trigger drop-down animation
                    // Hide the message after 3 seconds
                    setTimeout(() => {
                        formMessage.classList.remove('show');
                    }, 3000);
                }
            } catch (error) {
                console.error('Error submitting form:', error.message);
                console.error('Error stack:', error.stack);
                formMessage.textContent = 'Error submitting form';
                formMessage.classList.add('show'); // Trigger drop-down animation
                // Hide the message after 3 seconds
                setTimeout(() => {
                    formMessage.classList.remove('show');
                }, 3000);
            }
        });
    }
});