// 1. STATE
let tasks = []; 
let nextId = 1;
let currentColumnId = ""; 

// 2. DOM REFERENCES
const modal = document.getElementById("modal");
const taskCounter = document.getElementById("task-counter");
const cancelBtn = document.getElementById("cancel-task");
const saveBtn = document.getElementById("save-task");

// 3. HELPER FUNCTIONS
function updateCounter() {
    const total = tasks.length;
    taskCounter.textContent = total + (total === 1 ? " task" : " tasks");
}

function openModal(columnId) {
    currentColumnId = columnId;
    modal.classList.remove("is-hidden");
}

function closeModal() {
    modal.classList.add("is-hidden");
    // Clear inputs
    document.getElementById("task-title").value = "";
    document.getElementById("task-desc").value = "";
}

/**
 * TASK 2: Create Card (Pure DOM)
 * No innerHTML allowed
 */
function createTaskCard(taskObj) {
    const li = document.createElement("li");
    li.classList.add("task-card");
    li.setAttribute("data-id", taskObj.id);

    const title = document.createElement("h3");
    title.textContent = taskObj.title;
    
    const p = document.createElement("p");
    p.textContent = taskObj.description || "No description.";

    const badge = document.createElement("span");
    badge.textContent = taskObj.priority;
    badge.classList.add("badge", `badge-${taskObj.priority}`);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("data-action", "delete");
    deleteBtn.setAttribute("data-id", taskObj.id);

    li.appendChild(title);
    li.appendChild(p);
    li.appendChild(badge);
    li.appendChild(deleteBtn);

    return li;
}

// 4. EVENT LISTENERS
document.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const listId = btn.getAttribute("data-column");
        openModal(listId);
    });
});

cancelBtn.addEventListener("click", closeModal);