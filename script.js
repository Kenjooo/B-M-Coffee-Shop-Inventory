document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }
    
    // Update user profile in sidebar
    document.querySelector('.username').textContent = currentUser.username;
    document.querySelector('.user-email').textContent = currentUser.email;
    
    // Initialize inventory data
    if (!localStorage.getItem('inventory')) {
        localStorage.setItem('inventory', JSON.stringify([]));
    }
    
    // Navigation
    const navItems = document.querySelectorAll('.nav-menu li');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all nav items and sections
            navItems.forEach(navItem => navItem.classList.remove('active'));
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked nav item
            this.classList.add('active');
            
            // Show corresponding section
            const sectionId = this.getAttribute('data-section') + '-section';
            document.getElementById(sectionId).classList.add('active');
            document.getElementById('section-title').textContent = this.querySelector('span').textContent;
        });
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', function() {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'auth.html';
    });
    
    // Dashboard Stats
    updateDashboardStats();
    
    // Initialize Charts
    initializeCharts();
    
    // Inventory Management
    displayInventoryItems();
    
    // Filter Controls
    document.getElementById('category-filter').addEventListener('change', function() {
        displayInventoryItems();
    });
    
    document.getElementById('low-stock-filter').addEventListener('click', function() {
        this.classList.toggle('active');
        displayInventoryItems();
    });
    
    document.getElementById('expiring-filter').addEventListener('click', function() {
        this.classList.toggle('active');
        displayInventoryItems();
    });
    
    // Export/Import
    document.getElementById('export-csv').addEventListener('click', exportToCSV);
    document.getElementById('export-json').addEventListener('click', exportToJSON);
    document.getElementById('import-data').addEventListener('click', function() {
        document.getElementById('file-input').click();
    });
    
    document.getElementById('file-input').addEventListener('change', importData);
    
    // Add Item Form
    document.getElementById('add-item-form').addEventListener('submit', function(e) {
        e.preventDefault();
        addInventoryItem();
    });
    
    // Edit Modal
    const editModal = document.getElementById('edit-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            editModal.style.display = 'none';
            document.getElementById('import-modal').style.display = 'none';
        });
    });
    
    document.getElementById('cancel-edit').addEventListener('click', function() {
        editModal.style.display = 'none';
    });
    
    document.getElementById('cancel-import').addEventListener('click', function() {
        document.getElementById('import-modal').style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
        if (event.target === document.getElementById('import-modal')) {
            document.getElementById('import-modal').style.display = 'none';
        }
    });
    
    // Edit Item Form
    document.getElementById('edit-item-form').addEventListener('submit', function(e) {
        e.preventDefault();
        updateInventoryItem();
    });
    
    // Settings Tabs
    const settingsTabs = document.querySelectorAll('.settings-tab');
    const settingsTabContents = document.querySelectorAll('.settings-tab-content');
    
    settingsTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            settingsTabs.forEach(t => t.classList.remove('active'));
            settingsTabContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab') + '-tab';
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Load profile data
    document.getElementById('profile-username').value = currentUser.username;
    document.getElementById('profile-email').value = currentUser.email || '';
    
    // Profile Form
    document.getElementById('profile-form').addEventListener('submit', function(e) {
        e.preventDefault();
        updateProfile();
    });
    
    // Save Notifications
    document.getElementById('save-notifications').addEventListener('click', function() {
        alert('Notification preferences saved!');
    });
    
    // Save Preferences
    document.getElementById('save-preferences').addEventListener('click', function() {
        alert('Application preferences saved!');
    });
    
    // Generate Report
    document.getElementById('generate-report').addEventListener('click', function() {
        generateReport();
    });
});

// Inventory Functions
function getInventory() {
    return JSON.parse(localStorage.getItem('inventory')) || [];
}

function saveInventory(inventory) {
    localStorage.setItem('inventory', JSON.stringify(inventory));
    updateDashboardStats();
    initializeCharts();
}

function displayInventoryItems() {
    const inventory = getInventory();
    const tableBody = document.getElementById('inventory-table-body');
    tableBody.innerHTML = '';
    
    const categoryFilter = document.getElementById('category-filter').value;
    const lowStockFilter = document.getElementById('low-stock-filter').classList.contains('active');
    const expiringFilter = document.getElementById('expiring-filter').classList.contains('active');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const filteredItems = inventory.filter(item => {
        // Category filter
        if (categoryFilter && item.category !== categoryFilter) return false;
        
        // Low stock filter
        if (lowStockFilter && item.quantity > 5) return false;
        
        // Expiring soon filter (within 7 days)
        if (expiringFilter && item.expiryDate) {
            const expiryDate = new Date(item.expiryDate);
            const diffTime = expiryDate - today;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            if (diffDays > 7) return false;
        }
        
        return true;
    });
    
    if (filteredItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No items found</td></tr>';
        return;
    }
    
    filteredItems.forEach(item => {
        const row = document.createElement('tr');
        
        // Highlight low stock items
        if (item.quantity <= 5) {
            row.classList.add('low-stock');
        }
        
        // Format expiry date
        let expiryDisplay = 'N/A';
        if (item.expiryDate) {
            const expiryDate = new Date(item.expiryDate);
            expiryDisplay = expiryDate.toLocaleDateString();
            
            // Highlight expiring soon (within 7 days)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = expiryDate - today;
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            
            if (diffDays <= 7 && diffDays >= 0) {
                row.classList.add('expiring-soon');
            } else if (diffDays < 0) {
                row.classList.add('expired');
            }
        }
        
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${expiryDisplay}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit-btn" data-id="${item.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="action-btn delete-btn" data-id="${item.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            openEditModal(itemId);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            deleteInventoryItem(itemId);
        });
    });
}

function addInventoryItem() {
    const form = document.getElementById('add-item-form');
    const inventory = getInventory();
    
    const newItem = {
        id: Date.now().toString(),
        name: document.getElementById('item-name').value,
        category: document.getElementById('item-category').value,
        quantity: parseInt(document.getElementById('item-quantity').value),
        price: parseFloat(document.getElementById('item-price').value),
        expiryDate: document.getElementById('item-expiry').value || null,
        addedDate: new Date().toISOString()
    };
    
    // Handle image upload
    const imageInput = document.getElementById('item-image');
    if (imageInput.files.length > 0) {
        const file = imageInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            newItem.image = e.target.result;
            inventory.push(newItem);
            saveInventory(inventory);
            form.reset();
            displayInventoryItems();
        };
        
        reader.readAsDataURL(file);
    } else {
        inventory.push(newItem);
        saveInventory(inventory);
        form.reset();
        displayInventoryItems();
    }
}

function openEditModal(itemId) {
    const inventory = getInventory();
    const item = inventory.find(item => item.id === itemId);
    
    if (!item) return;
    
    document.getElementById('edit-item-id').value = item.id;
    document.getElementById('edit-item-name').value = item.name;
    document.getElementById('edit-item-category').value = item.category;
    document.getElementById('edit-item-quantity').value = item.quantity;
    document.getElementById('edit-item-price').value = item.price;
    document.getElementById('edit-item-expiry').value = item.expiryDate || '';
    
    document.getElementById('edit-modal').style.display = 'block';
}

function updateInventoryItem() {
    const itemId = document.getElementById('edit-item-id').value;
    const inventory = getInventory();
    const itemIndex = inventory.findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) return;
    
    inventory[itemIndex] = {
        ...inventory[itemIndex],
        name: document.getElementById('edit-item-name').value,
        category: document.getElementById('edit-item-category').value,
        quantity: parseInt(document.getElementById('edit-item-quantity').value),
        price: parseFloat(document.getElementById('edit-item-price').value),
        expiryDate: document.getElementById('edit-item-expiry').value || null
    };
    
    // Handle image upload
    const imageInput = document.getElementById('edit-item-image');
    if (imageInput.files.length > 0) {
        const file = imageInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            inventory[itemIndex].image = e.target.result;
            saveInventory(inventory);
            document.getElementById('edit-modal').style.display = 'none';
            displayInventoryItems();
        };
        
        reader.readAsDataURL(file);
    } else {
        saveInventory(inventory);
        document.getElementById('edit-modal').style.display = 'none';
        displayInventoryItems();
    }
}

function deleteInventoryItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const inventory = getInventory();
    const updatedInventory = inventory.filter(item => item.id !== itemId);
    
    saveInventory(updatedInventory);
    displayInventoryItems();
}

// Dashboard Functions
function updateDashboardStats() {
    const inventory = getInventory();
    
    // Total Items
    document.getElementById('total-items').textContent = inventory.length;
    
    // Low Stock Items (quantity <= 5)
    const lowStockItems = inventory.filter(item => item.quantity <= 5).length;
    document.getElementById('low-stock-items').textContent = lowStockItems;
    
    // Total Inventory Value
    const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;
    
    // Expiring Soon (within 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiringItems = inventory.filter(item => {
        if (!item.expiryDate) return false;
        
        const expiryDate = new Date(item.expiryDate);
        const diffTime = expiryDate - today;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        return diffDays <= 7 && diffDays >= 0;
    }).length;
    
    document.getElementById('expiring-items').textContent = expiringItems;
}

function initializeCharts() {
    const inventory = getInventory();
    
    // Category Distribution Chart
    const categoryChartCtx = document.getElementById('category-chart').getContext('2d');
    
    // Group by category
    const categories = {};
    inventory.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = 0;
        }
        categories[item.category]++;
    });
    
    const categoryLabels = Object.keys(categories);
    const categoryData = Object.values(categories);
    
    // Generate colors based on coffee theme
    const backgroundColors = categoryLabels.map((_, i) => {
        const hue = 25; // Brown hue
        const saturation = 30 + (i * 10);
        const lightness = 50 + (i * 5);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    });
    
    if (window.categoryChart) {
        window.categoryChart.destroy();
    }
    
    window.categoryChart = new Chart(categoryChartCtx, {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryData,
                backgroundColor: backgroundColors,
                borderColor: '#FFF4E6',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
    
    // Stock Levels Chart
    const stockChartCtx = document.getElementById('stock-chart').getContext('2d');
    
    // Get top 10 items by quantity
    const sortedByQuantity = [...inventory].sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    const stockLabels = sortedByQuantity.map(item => item.name);
    const stockData = sortedByQuantity.map(item => item.quantity);
    
    if (window.stockChart) {
        window.stockChart.destroy();
    }
    
    window.stockChart = new Chart(stockChartCtx, {
        type: 'bar',
        data: {
            labels: stockLabels,
            datasets: [{
                label: 'Quantity in Stock',
                data: stockData,
                backgroundColor: 'rgba(111, 78, 55, 0.7)',
                borderColor: 'rgba(111, 78, 55, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Export/Import Functions
function exportToCSV() {
    const inventory = getInventory();
    if (inventory.length === 0) {
        alert('No data to export!');
        return;
    }
    
    // Prepare CSV content
    const headers = ['Name', 'Category', 'Quantity', 'Price', 'Expiry Date', 'Added Date'];
    const rows = inventory.map(item => [
        `"${item.name}"`,
        `"${item.category}"`,
        item.quantity,
        item.price,
        item.expiryDate || 'N/A',
        item.addedDate
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'coffee-shop-inventory.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportToJSON() {
    const inventory = getInventory();
    if (inventory.length === 0) {
        alert('No data to export!');
        return;
    }
    
    // Prepare JSON content
    const jsonContent = JSON.stringify(inventory, null, 2);
    
    // Create download link
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'coffee-shop-inventory.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let importedData = [];
            
            if (file.name.endsWith('.csv')) {
                // Parse CSV
                const csvContent = e.target.result;
                const lines = csvContent.split('\n');
                const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
                
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;
                    
                    const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
                    const item = {};
                    
                    headers.forEach((header, index) => {
                        item[header.toLowerCase().replace(' ', '_')] = values[index];
                    });
                    
                    // Convert to proper types
                    item.quantity = parseInt(item.quantity) || 0;
                    item.price = parseFloat(item.price) || 0;
                    item.expiry_date = item.expiry_date === 'N/A' ? null : item.expiry_date;
                    
                    importedData.push({
                        id: Date.now().toString() + i,
                        name: item.name || 'Unknown',
                        category: item.category || 'Other',
                        quantity: item.quantity,
                        price: item.price,
                        expiryDate: item.expiry_date || item.expiry_date,
                        addedDate: new Date().toISOString()
                    });
                }
            } else if (file.name.endsWith('.json')) {
                // Parse JSON
                importedData = JSON.parse(e.target.result);
                
                // Ensure data has required fields
                importedData = importedData.map(item => ({
                    id: item.id || Date.now().toString(),
                    name: item.name || 'Unknown',
                    category: item.category || 'Other',
                    quantity: parseInt(item.quantity) || 0,
                    price: parseFloat(item.price) || 0,
                    expiryDate: item.expiryDate || null,
                    addedDate: item.addedDate || new Date().toISOString()
                }));
            }
            
            if (importedData.length > 0) {
                if (confirm(`Import ${importedData.length} items? This will add to your existing inventory.`)) {
                    const currentInventory = getInventory();
                    const updatedInventory = [...currentInventory, ...importedData];
                    saveInventory(updatedInventory);
                    displayInventoryItems();
                    alert('Import successful!');
                }
            } else {
                alert('No valid data found in the file.');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Error importing data. Please check the file format.');
        }
        
        // Reset file input
        event.target.value = '';
    };
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else if (file.name.endsWith('.json')) {
        reader.readAsText(file);
    } else {
        alert('Unsupported file format. Please upload a CSV or JSON file.');
    }
}

// Report Functions
function generateReport() {
    const inventory = getInventory();
    const reportType = document.getElementById('report-type').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    let reportData = [...inventory];
    let reportTitle = '';
    
    // Apply date filter if dates are selected
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        reportData = reportData.filter(item => {
            const itemDate = new Date(item.addedDate);
            return itemDate >= start && itemDate <= end;
        });
    }
    
    // Generate report based on type
    switch (reportType) {
        case 'stock-levels':
            reportTitle = 'Stock Levels Report';
            reportData.sort((a, b) => b.quantity - a.quantity);
            break;
            
        case 'category-distribution':
            reportTitle = 'Category Distribution Report';
            reportData.sort((a, b) => a.category.localeCompare(b.category));
            break;
            
        case 'expiry-report':
            reportTitle = 'Expiry Report';
            reportData = reportData.filter(item => item.expiryDate)
                .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            break;
            
        case 'value-report':
            reportTitle = 'Inventory Value Report';
            reportData.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
            break;
    }
    
    // Update report table
    const tableBody = document.getElementById('report-table-body');
    tableBody.innerHTML = '';
    
    if (reportData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No data found for the selected criteria</td></tr>';
    } else {
        reportData.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>${item.category}</td>
                <td>${item.quantity}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Update report chart
    const reportChartCtx = document.getElementById('report-chart').getContext('2d');
    
    if (window.reportChart) {
        window.reportChart.destroy();
    }
    
    let chartData, chartType, chartOptions;
    
    switch (reportType) {
        case 'stock-levels':
            chartType = 'bar';
            chartData = {
                labels: reportData.slice(0, 10).map(item => item.name),
                datasets: [{
                    label: 'Quantity',
                    data: reportData.slice(0, 10).map(item => item.quantity),
                    backgroundColor: 'rgba(111, 78, 55, 0.7)'
                }]
            };
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true }
                }
            };
            break;
            
        case 'category-distribution':
            // Group by category
            const categories = {};
            reportData.forEach(item => {
                if (!categories[item.category]) {
                    categories[item.category] = 0;
                }
                categories[item.category]++;
            });
            
            chartType = 'pie';
            chartData = {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: [
                        'rgba(75, 56, 50, 0.7)',
                        'rgba(111, 78, 55, 0.7)',
                        'rgba(196, 164, 132, 0.7)',
                        'rgba(212, 165, 154, 0.7)',
                        'rgba(227, 202, 165, 0.7)'
                    ]
                }]
            };
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false
            };
            break;
            
        case 'expiry-report':
            chartType = 'line';
            chartData = {
                labels: reportData.slice(0, 10).map(item => 
                    new Date(item.expiryDate).toLocaleDateString()),
                datasets: [{
                    label: 'Days Until Expiry',
                    data: reportData.slice(0, 10).map(item => {
                        const today = new Date();
                        const expiry = new Date(item.expiryDate);
                        return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                    }),
                    borderColor: 'rgba(212, 165, 154, 0.7)',
                    backgroundColor: 'rgba(212, 165, 154, 0.3)',
                    fill: true
                }]
            };
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Days Until Expiry' }
                    }
                }
            };
            break;
            
        case 'value-report':
            chartType = 'bar';
            chartData = {
                labels: reportData.slice(0, 10).map(item => item.name),
                datasets: [{
                    label: 'Inventory Value',
                    data: reportData.slice(0, 10).map(item => item.price * item.quantity),
                    backgroundColor: 'rgba(165, 196, 164, 0.7)'
                }]
            };
            chartOptions = {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true,
                        title: { display: true, text: 'Value ($)' }
                    }
                }
            };
            break;
    }
    
    window.reportChart = new Chart(reportChartCtx, {
        type: chartType,
        data: chartData,
        options: chartOptions
    });
}

// Profile Functions
function updateProfile() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    
    if (userIndex === -1) return;
    
    const newEmail = document.getElementById('profile-email').value;
    const newPassword = document.getElementById('profile-password').value;
    const confirmPassword = document.getElementById('profile-confirm-password').value;
    
    // Validate password if changed
    if (newPassword && newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    // Update user data
    users[userIndex].email = newEmail;
    if (newPassword) {
        users[userIndex].password = btoa(newPassword);
    }
    
    // Update storage
    localStorage.setItem('users', JSON.stringify(users));
    sessionStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
    
    // Update UI
    document.querySelector('.user-email').textContent = newEmail;
    document.getElementById('profile-password').value = '';
    document.getElementById('profile-confirm-password').value = '';
    
    alert('Profile updated successfully!');
}