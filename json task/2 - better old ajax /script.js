// Get HTML elements
const btn = document.getElementById('loadBtn');
const display = document.getElementById('result');

// Add click event to button
btn.addEventListener('click', function() {
    // 1. Create the XMLHttpRequest object [cite: 136, 137]
    const xhr = new XMLHttpRequest();

    // 2. Configure the request (GET data from this URL) [cite: 138, 142, 212]
    xhr.open("GET", "https://jsonplaceholder.typicode.com/users/1", true);

    // 3. Define what to do when data arrives [cite: 143, 144]
    xhr.onload = function() {
        if (xhr.status === 200) { // 200 = Success [cite: 145, 176, 177]
            // Parse JSON string into a JS object [cite: 147, 213]
            const data = JSON.parse(xhr.responseText);
            
            // Display data in the div [cite: 214]
            display.innerHTML = `
                <p>Name: ${data.name}</p>
                <p>Email: ${data.email}</p>
            `;
        }
    };

    // 4. Send the request [cite: 156, 157]
    xhr.send();
});