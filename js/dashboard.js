   
        // Check if user is logged in
        window.addEventListener('load', function() {
            // This is where you'd check if the user has a valid session/token
            // If not, redirect to login page
            console.log('Dashboard loaded successfully');
        });

        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                // Clear session/token
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('userEmail');
                // Redirect to login
                window.location.href = 'index.html';
            }
        }
   