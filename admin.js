document.addEventListener('DOMContentLoaded', () => {
    const submissionsBody = document.getElementById('submissions-body');
    const searchInput = document.getElementById('search-input');
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
    let sortBy = 'date';
    let sortOrder = -1;

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Logout functionality
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }

    // Fetch and display contact submissions
    const loadSubmissions = async (page = 1, searchQuery = '', sortByParam = sortBy, sortOrderParam = sortOrder) => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html'; // Redirect to login if no token
            return;
        }

        try {
            const response = await fetch(`/api/contact?page=${page}&limit=${limit}&sortBy=${sortByParam}&sortOrder=${sortOrderParam}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Fetched data:', data);

            totalSubmissions = data.total || 0;
            filteredSubmissions = data.contacts || [];

            if (searchQuery) {
                filteredSubmissions = filteredSubmissions.filter(contact =>
                    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }

            submissionsBody.innerHTML = '';
            if (filteredSubmissions.length > 0) {
                filteredSubmissions.forEach(contact => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${contact.name}</td>
                        <td>${contact.email}</td>
                        <td>${contact.message}</td>
                        <td>${new Date(contact.date).toLocaleString()}</td>
                        <td>
                            <a href="mailto:${contact.email}" class="email-action" title="Email ${contact.name}">
                                <i class="fas fa-envelope"></i>
                            </a>
                            <button class="delete-action" data-id="${contact._id}">Delete</button>
                        </td>
                    `;
                    submissionsBody.appendChild(row);
                });

                // Add event listeners to delete buttons
                document.querySelectorAll('.delete-action').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const id = e.target.getAttribute('data-id');
                        if (confirm('Are you sure you want to delete this submission?')) {
                            try {
                                const deleteResponse = await fetch(`/api/contact/${id}`, {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                    },
                                });

                                if (deleteResponse.ok) {
                                    loadSubmissions(currentPage, searchInput ? searchInput.value : '', sortBy, sortOrder);
                                } else {
                                    alert('Error deleting submission');
                                }
                            } catch (error) {
                                console.error('Error deleting submission:', error);
                                alert('Error deleting submission');
                            }
                        }
                    });
                });
            } else {
                submissionsBody.innerHTML = '<tr><td colspan="5">No submissions found.</td></tr>';
            }

            // Update pagination
            pageInfo.textContent = `Page ${page}`;
            prevPageBtn.disabled = page === 1;
            nextPageBtn.disabled = page * limit >= totalSubmissions;
        } catch (error) {
            console.error('Error fetching submissions:', error);
            submissionsBody.innerHTML = '<tr><td colspan="5">Error loading submissions.</td></tr>';
        }
    };

    // Admin page functionality
    if (submissionsBody) {
        loadSubmissions(currentPage);

        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                currentPage = 1;
                loadSubmissions(currentPage, searchInput.value, sortBy, sortOrder);
            });
        }

        // Refresh button
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                currentPage = 1;
                searchInput.value = '';
                loadSubmissions(currentPage);
            });
        }

        // Delete all button
        if (deleteAllBtn) {
            deleteAllBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to delete all submissions?')) {
                    try {
                        const token = localStorage.getItem('token');
                        const response = await fetch('/api/contact', {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                        });

                        if (response.ok) {
                            loadSubmissions(currentPage);
                        } else {
                            alert('Error deleting all submissions');
                        }
                    } catch (error) {
                        console.error('Error deleting all submissions:', error);
                        alert('Error deleting all submissions');
                    }
                }
            });
        }

        // Export as CSV
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch('/api/contact?limit=1000', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch submissions for export');
                    }

                    const data = await response.json();
                    const contacts = data.contacts || [];

                    // Convert to CSV
                    const csv = [
                        'Name,Email,Message,Date',
                        ...contacts.map(contact =>
                            `"${contact.name}","${contact.email}","${contact.message}","${new Date(contact.date).toLocaleString()}"`
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
                    alert('Error exporting submissions');
                }
            });
        }

        // Pagination
        if (prevPageBtn && nextPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    loadSubmissions(currentPage, searchInput ? searchInput.value : '', sortBy, sortOrder);
                }
            });

            nextPageBtn.addEventListener('click', () => {
                if (currentPage * limit < totalSubmissions) {
                    currentPage++;
                    loadSubmissions(currentPage, searchInput ? searchInput.value : '', sortBy, sortOrder);
                }
            });
        }

        // Sorting
        document.querySelectorAll('th[data-sort]').forEach(header => {
            header.addEventListener('click', () => {
                const newSortBy = header.getAttribute('data-sort');
                if (sortBy === newSortBy) {
                    sortOrder = -sortOrder; // Toggle sort order
                } else {
                    sortBy = newSortBy;
                    sortOrder = 1; // Default to ascending
                }
                loadSubmissions(currentPage, searchInput ? searchInput.value : '', sortBy, sortOrder);
            });
        });
    }
});