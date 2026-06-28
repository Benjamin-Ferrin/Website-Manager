// Fetch data from backend API
document.getElementById('fetchData').addEventListener('click', async () => {
    const responseDiv = document.getElementById('response');
    responseDiv.style.display = 'block';
    responseDiv.innerHTML = '<p>Loading...</p>';
    
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        
        responseDiv.innerHTML = `
            <h3>Backend Response:</h3>
            <p><strong>Message:</strong> ${data.message}</p>
            <p><strong>Timestamp:</strong> ${data.timestamp}</p>
        `;
    } catch (error) {
        responseDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
});

// Log when page loads
console.log('Frontend loaded successfully');
