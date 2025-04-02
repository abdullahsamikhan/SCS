document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    localStorage.setItem('token', result.token); // Store the token
                    window.location.href = 'admin.html'; // Redirect to admin page
                } else {
                    loginMessage.textContent = result.message || 'Error logging in';
                }
            } catch (error) {
                console.error('Error logging in:', error);
                loginMessage.textContent = 'Error logging in';
            }
        });
    }
});