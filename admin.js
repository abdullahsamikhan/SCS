document.addEventListener('DOMContentLoaded', () => {
    const submissionsBody = document.getElementById('submissions-body');
    const searchInput = document.getElementById('search-input');
    const sortBySelect = document.getElementById('sort-by');
    const sortOrderSelect = document.getElementById('sort-order');
    const refreshBtn = document.getElementById('refresh-btn');
    const deleteAllBtn = document.getElementById('delete-all-btn');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const logoutLink = document.getElementById('logout');
    const navbar = document.querySelector('.navbar');
    const exportBtn = document.getElementById('export-btn');

    let currentPage = 1;
    const limit = 10;
    let totalSubmissions = 0;
    let filteredSubmissions = [];

    // Navbar scroll effect
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    } else {
        console.error('Navbar element not found');
    }

    // Logout functionality
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Logging out, removing token');
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    } else {
        console.error('Logout link not found');
    }

    // Fetch and display contact submissions
    const loadSubmissions = async (page = 1, searchQuery = '', sortBy = sortBySelect?.value || 'date', sortOrder = sortOrderSelect?.value || '-1') => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found in localStorage, redirecting to login');
            window.location.href = 'login.html';
            return;
        }

        try {
            console.log(`Fetching submissions: page=${page}, limit=${limit}, sortBy=${sortBy}, sortOrder=${sortOrder}`);
            console.log('Token being sent:', token);
            const response = await fetch(`/api/contact?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                if (response.status === 403) {
                    console.error('Invalid token detected, redirecting to login');
                    localStorage.removeItem('token');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            totalSubmissions = data.total || 0;
            filteredSubmissions = data.contacts || [];

            if (!Array.isArray(filteredSubmissions)) {
                throw new Error('Expected contacts to be an array, but got:', filteredSubmissions);
            }

            if (searchQuery) {
                filteredSubmissions = filteredSubmissions.filter(contact => {
                    if (!contact.name || !contact.email) return false;
                    return (
                        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        contact.email.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                });
            }

            if (!submissionsBody) {
                console.error('Submissions body element not found');
                return;
            }

            submissionsBody.innerHTML = '';
            if (filteredSubmissions.length > 0) {
                filteredSubmissions.forEach(contact => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${contact.name || 'N/A'}</td>
                        <td>${contact.email || 'N/A'}</td>
                        <td>${contact.message || 'N/A'}</td>
                        <td>${contact.date ? new Date(contact.date).toLocaleString() : 'N/A'}</td>
                        <td>
                            <a href="mailto:${contact.email || ''}" class="email-action" title="Email ${contact.name || 'User'}">
                                <i class="fas fa-envelope"></i>
                            </a>
                            <button class="delete-action" data-id="${contact._id || ''}">Delete</button>
                        </td>
                    `;
                    submissionsBody.appendChild(row);
                });

                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-action').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const id = e.target.getAttribute('data-id');
                        if (!id) {
                            console.error('No ID found for deletion');
                            alert('Error: Submission ID not found');
                            return;
                        }

                        if (confirm('Are you sure you want to delete this submission?')) {
                            try {
                                console.log(`Attempting to delete submission with ID: ${id}`);
                                console.log('Token being sent for deletion:', token);
                                const deleteResponse = await fetch(`/api/contact/${id}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json',
                                    },
                                });

                                console.log('Delete response status:', deleteResponse.status);
                                console.log('Delete response headers:', [...deleteResponse.headers.entries()]);

                                if (!deleteResponse.ok) {
                                    const errorText = await deleteResponse.text();
                                    console.error('Delete failed with status:', deleteResponse.status);
                                    console.error('Delete error response:', errorText);
                                    if (deleteResponse.status === 403) {
                                        console.error('Invalid token detected during deletion, redirecting to login');
                                        localStorage.removeItem('token');
                                        window.location.href = 'login.html';
                                        return;
                                    }
                                    throw new Error(`Error deleting submission: Status ${deleteResponse.status}, Message: ${errorText}`);
                                }

                                console.log(`Successfully deleted submission with ID: ${id}`);
                                loadSubmissions(currentPage, searchInput ? searchInput.value : '');
                            } catch (error) {
                                console.error('Error deleting submission:', error);
                                alert('Error deleting submission: ' + error.message);
                            }
                        }
                    });
                });
            } else {
                submissionsBody.innerHTML = '<tr><td colspan="5">No submissions found.</td></tr>';
            }

            // Update pagination
            if (pageInfo) {
                pageInfo.textContent = `Page ${page}`;
            }
            if (prevPageBtn) {
                prevPageBtn.disabled = page === 1;
            }
            if (nextPageBtn) {
                nextPageBtn.disabled = page * limit >= totalSubmissions;
            }
        } catch (error) {
            console.error('Error fetching submissions:', error);
            if (submissionsBody) {
                submissionsBody.innerHTML = `<tr><td colspan="5">Error loading submissions: ${error.message}</td></tr>`;
            }
        }
    };

    // Admin page functionality
    if (submissionsBody) {
        // Initial load
        loadSubmissions(currentPage);

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                currentPage = 1;
                loadSubmissions(currentPage, searchInput.value);
            });
        } else {
            console.error('Search input not found');
        }

        // Sort functionality
        if (sortBySelect && sortOrderSelect) {
            sortBySelect.addEventListener('change', () => {
                currentPage = 1;
                loadSubmissions(currentPage, searchInput ? searchInput.value : '');
            });

            sortOrderSelect.addEventListener('change', () => {
                currentPage = 1;
                loadSubmissions(currentPage, searchInput ? searchInput.value : '');
            });
        } else {
            console.error('Sort dropdowns not found');
        }

        // Refresh button
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                currentPage = 1;
                if (searchInput) searchInput.value = '';
                if (sortBySelect) sortBySelect.value = 'date';
                if (sortOrderSelect) sortOrderSelect.value = '-1';
                loadSubmissions(currentPage);
            });
        } else {
            console.error('Refresh button not found');
        }

        // Delete all button
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete all submissions?')) {
                    try {
                        const token = localStorage.getItem('token');
                        if (!token) {
                            console.error('No token found for delete all, redirecting to login');
                            window.location.href = 'login.html';
                            return;
                        }

                        console.log('Attempting to delete all submissions');
                        console.log('Token being sent for delete all:', token);
                        const response = await fetch('/api/contact', {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });

                        console.log('Delete all response status:', response.status);
                        console.log('Delete all response headers:', [...response.headers.entries()]);

                        if (!response.ok) {
                            const errorText = await response.text();
                            console.error('Delete all failed with status:', response.status);
                            console.error('Delete all error response:', errorText);
                            if (response.status === 403) {
                                console.error('Invalid token detected during delete all, redirecting to login');
                                localStorage.removeItem('token');
                                window.location.href = 'login.html';
                                return;
                            }
                            throw new Error(`Error deleting all submissions: Status ${response.status}, Message: ${errorText}`);
                        }

                        console.log('Successfully deleted all submissions');
                        loadSubmissions(currentPage);
                    } catch (error) {
                        console.error('Error deleting all submissions:', error);
                        alert('Error deleting all submissions: ' + error.message);
                    }
                }
            });
        } else {
            console.error('Delete all button not found');
        }

        // Export as CSV
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        console.error('No token found for export, redirecting to login');
                        window.location.href = 'login.html';
                        return;
                    }

                    const response = await fetch('/api/contact?limit=1000', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        if (response.status === 403) {
                            console.error('Invalid token detected during export, redirecting to login');
                            localStorage.removeItem('token');
                            window.location.href = 'login.html';
                            return;
                        }
                        throw new Error('Failed to fetch submissions for export: ' + errorText);
                    }

                    const data = await response.json();
                    const contacts = data.contacts || [];

                    // Convert to CSV
                    const csv = [
                        'Name,Email,Message,Date',
                        ...contacts.map(contact =>
                            `"${contact.name || 'N/A'}","${contact.email || 'N/A'}","${contact.message || 'N/A'}","${contact.date ? new Date(contact.date).toLocaleString() : 'N/A'}"`
                        ),
                    ].join('\n');

                    // Create a downloadable file
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'submissions.csv';
                    a.click();
                    window.URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Error exporting submissions:', error);
                    alert('Error exporting submissions: ' + error.message);
                }
            });
        } else {
            console.error('Export button not found');
        }

        // Pagination
        if (prevPageBtn && nextPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    loadSubmissions(currentPage, searchInput ? searchInput.value : '');
                }
            });

            nextPageBtn.addEventListener('click', () => {
                if (currentPage * limit < totalSubmissions) {
                    currentPage++;
                    loadSubmissions(currentPage, searchInput ? searchInput.value : '');
                }
            });
        } else {
            console.error('Pagination buttons not found');
        }
    } else {
        console.error('Submissions table body not found');
    }
});