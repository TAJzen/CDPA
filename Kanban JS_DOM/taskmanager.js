// 1. STATE: Our memory for tasks
let tasks = []; 
let nextId = 1;
let currentColumnId = ""; // To remember which column we are adding to

// 2. DOM REFERENCES: Finding the elements
const modal = document.getElementById("modal");
const taskCounter = document.getElementById("task-counter");

// 3. OPEN MODAL FUNCTION
function openModal(columnId) {
    currentColumnId = columnId; // Remember if we clicked 'To Do', 'In Progress', or 'Done'
    modal.classList.remove("is-hidden"); // This makes the modal reappear!
}

// 4. ATTACH LISTENERS: Tell the buttons to run the function
document.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        // Get the list ID (like 'todo-list') from the button's data attribute
        const listId = btn.getAttribute("data-column");
        openModal(listId);
    });
});