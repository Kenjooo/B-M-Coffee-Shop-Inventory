document.addEventListener('DOMContentLoaded', function() {
    // Tab switching
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    loginTab.addEventListener('click', function() {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });
    
    registerTab.addEventListener('click', function() {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });
    
    // Mock user database
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    
    // Registration
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // Simple validation
        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        if (password.length < 6) {
            alert('Password must be at least 6 characters long!');
            return;
        }
        
        // Check if user exists
        const users = JSON.parse(localStorage.getItem('users'));
        const userExists = users.some(user => user.username === username);
        
        if (userExists) {
            alert('Username already taken!');
            return;
        }
        
        // Simple password hashing (not secure for production)
        const hashedPassword = btoa(password);
        
        // Add new user
        users.push({
            username,
            email,
            password: hashedPassword
        });
        
        localStorage.setItem('users', JSON.stringify(users));
        
        alert('Registration successful! Please login.');
        loginTab.click();
        registerForm.reset();
    });
    
    // Login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const hashedPassword = btoa(password);
        
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.find(user => user.username === username && user.password === hashedPassword);
        
        if (user) {
            // Create session
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            
            // Redirect to main page
            window.location.href = 'index.html';
        } else {
            alert('Invalid username or password!');
        }
    });
});