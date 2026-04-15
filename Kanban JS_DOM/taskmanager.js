// 1. STATE
let tasks = []; 
let nextId = 1;
let currentColumnId = ""; 
let editingTaskId = null; // Keeps track of which card we are currently editing

// 2. DOM REFERENCES
const modal = document.getElementById("modal");
const taskCounter = document.getElementById("task-counter");
const cancelBtn = document.getElementById("cancel-task");
const saveBtn = document.getElementById("save-task");
const clearDoneBtn = document.getElementById("clear-done-btn");

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
    document.getElementById("task-date").value = "";
}

/**
 * TASK 2: Create Card (Pure DOM)
 * No innerHTML allowed
 */
function createTaskCard(taskObj) {
    const li = document.createElement("li");
    li.classList.add("task-card");
    li.setAttribute("data-id", taskObj.id);

    // 1. Title
    const title = document.createElement("h3");
    title.textContent = taskObj.title;
    title.classList.add("task-title");

    // 2. Description
    const p = document.createElement("p");
    p.textContent = taskObj.description || "No description provided.";
    p.classList.add("task-desc");

    // 3. Priority Badge
    const badge = document.createElement("span");
    badge.textContent = taskObj.priority;
    badge.classList.add("badge", `badge-${taskObj.priority}`);

    // 4. Due Date
    const dateDiv = document.createElement("div");
    // LANDMARK: Flip the date from YYYY-MM-DD to DD/MM/YYYY
    const rawDate = taskObj.date || "";
    // If there is a date, split it, flip it, and join with slashes. Otherwise, say "No date"
    const formattedDate = rawDate ? rawDate.split('-').reverse().join('/') : "No date set";
    dateDiv.textContent = `Due: ${formattedDate}`;    dateDiv.classList.add("task-date");

    // 5. Action Buttons (Edit & Delete)
    const btnGroup = document.createElement("div");
    btnGroup.classList.add("btn-group");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.setAttribute("data-action", "edit");
    editBtn.setAttribute("data-id", taskObj.id);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.setAttribute("data-action", "delete");
    deleteBtn.setAttribute("data-id", taskObj.id);

    // 6. Assemble the card
    btnGroup.appendChild(editBtn);
    btnGroup.appendChild(deleteBtn);
    
    li.appendChild(title);
    li.appendChild(p);
    li.appendChild(badge);
    li.appendChild(dateDiv);
    li.appendChild(btnGroup);

    return li;
}

/**
 * Step 7.1: Physically adds the card to the board.
 */
function addTask(columnId, taskObj) {
    // 1. Add task to our 'tasks' array memory
    tasks.push(taskObj);

    // 2. Find the column <ul> on the page using the ID
    const targetList = document.getElementById(columnId);

    // 3. Use the function we made in Step 6 to build the card
    const newCard = createTaskCard(taskObj);

    // 4. Stick the card into the list
    targetList.appendChild(newCard);

    // 5. Update the "0 tasks" number at the top
    updateCounter();
}

/**
 * Step 8.1: Deletes a task with a fade-out animation.
 */
function deleteTask(taskId) {
    // 1. Find the specific card using its data-id
    const card = document.querySelector(`li[data-id="${taskId}"]`);

    if (card) {
        // 2. Add the CSS class to start the fade-out
        card.classList.add("fade-out");

        // 3. Wait 500ms (for the animation to finish) then remove it
        setTimeout(() => {
            card.remove(); // Remove from the screen

            // 4. Remove from our 'tasks' array memory
            tasks = tasks.filter(t => t.id !== taskId);

            // 5. Update the task counter at the top
            updateCounter();
        }, 500);
    }
}

// 4. EVENT LISTENERS
document.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const listId = btn.getAttribute("data-column");
        openModal(listId);
    });
});

cancelBtn.addEventListener("click", closeModal);

// Step 7.2: The "Smart" Save button (Handles both Add and Edit)
saveBtn.addEventListener("click", () => {
    const title = document.getElementById("task-title").value;
    const desc = document.getElementById("task-desc").value;
    const priority = document.getElementById("task-priority").value;
    const date = document.getElementById("task-date").value;
    const status = document.getElementById("task-status").value;

    if (title.trim() === "") {
        alert("Title is required!");
        return;
    }

    if (editingTaskId) {
        // --- MODE A: UPDATING AN EXISTING TASK ---
        const task = tasks.find(t => t.id === editingTaskId);
        task.title = title;
        task.description = desc;
        task.priority = priority;
        task.date = date;

        // Find the card on the board and update its visuals
        const card = document.querySelector(`li[data-id="${editingTaskId}"]`);
        card.querySelector(".task-title").textContent = title;
        card.querySelector(".task-desc").textContent = desc;
        card.querySelector(".badge").textContent = priority;
        card.querySelector(".badge").className = `badge badge-${priority}`;
        // LANDMARK: Move the card to the new column
        const newColumn = document.getElementById(status);
        newColumn.appendChild(card);
        
        editingTaskId = null; // Reset back to "Add" mode
    } else {
        // --- MODE B: ADDING A BRAND NEW TASK ---
        const newTask = {
            id: nextId++,
            title: title,
            description: desc,
            priority: priority,
            date: date
        };
        addTask(currentColumnId, newTask);
    }

    closeModal();
    // Change the title back to "New Task" for next time
    document.querySelector(".modal-content h2").textContent = "New Task";
});
// Step 8.2: Event Delegation - One listener for all Delete buttons
document.querySelectorAll(".task-list").forEach(list => {
    list.addEventListener("click", (event) => {
        // Check if what was clicked has the 'data-action="delete"' attribute
        const action = event.target.getAttribute("data-action");
        const id = parseInt(event.target.getAttribute("data-id"));

        if (action === "delete") {
            deleteTask(id);
        }
        // If the click was on an "Edit" button
        if (action === "edit") {
            const task = tasks.find(t => t.id === id);
            if (task) {
                editingTaskId = id; // Tell the app we are in Edit Mode
                // LANDMARK: Pre-select the current column in the dropdown
document.getElementById("task-status").value = event.target.closest("ul").id;
                
                // Fill the modal with the task's current data
                document.getElementById("task-title").value = task.title;
                document.getElementById("task-desc").value = task.description;
                document.getElementById("task-priority").value = task.priority;
                document.getElementById("task-date").value = task.date;

                // Change the modal title so you know you're editing
                document.querySelector(".modal-content h2").textContent = "Edit Task";
                
                modal.classList.remove("is-hidden"); // Open the modal
            }
        }
    });
});

/**
 * Step 9.1: Inline Editing - Double-click title to rename.
 */
document.querySelectorAll(".task-list").forEach(list => {
    list.addEventListener("dblclick", (event) => {
        // 1. Check if the thing we double-clicked is the task title
        if (event.target.classList.contains("task-title")) {
            const titleElement = event.target;
            const originalText = titleElement.textContent;
            const cardId = parseInt(titleElement.parentElement.getAttribute("data-id"));

            // 2. Create an input box to replace the text
            const input = document.createElement("input");
            input.type = "text";
            input.value = originalText;
            input.classList.add("edit-input");

            // 3. Swap the title for the input box
            titleElement.replaceWith(input);
            input.focus(); // Automatically put the typing cursor inside

            // 4. Function to "Commit" (save) the change
            const commitChange = () => {
                const newTitle = input.value.trim() || originalText; // Don't allow empty names
                titleElement.textContent = newTitle;
                input.replaceWith(titleElement); // Swap back to the h3 header

                // 5. Update the name in our memory array
                const task = tasks.find(t => t.id === cardId);
                if (task) task.title = newTitle;
            };

            // 6. Listen for the Enter key or clicking away (blur)
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") commitChange();
            });
            input.addEventListener("blur", commitChange);
        }
    });
});

/**
 * Step 10: Priority Filter
 * Hides cards that don't match the selected priority.
 */
const priorityFilter = document.getElementById("priority-filter");

priorityFilter.addEventListener("change", () => {
    const selectedPriority = priorityFilter.value;
    const allCards = document.querySelectorAll(".task-card");

    allCards.forEach(card => {
        // Find the text inside the badge (low, medium, or high)
        const cardPriority = card.querySelector(".badge").textContent.toLowerCase();
        
        // Hide if: filter isn't "all" AND it doesn't match the card
        const shouldHide = selectedPriority !== "all" && cardPriority !== selectedPriority;
        
        // Use classList.toggle as required by the rubric
        card.classList.toggle("is-hidden", shouldHide);
    });
});

/**
 * LANDMARK: Final Step - Clear All Done Logic
 * Deletes all cards in the 'Done' list with a staggered animation.
 */
clearDoneBtn.addEventListener("click", () => {
    // 1. Get all tasks only in the Done column
    const doneCards = document.querySelectorAll("#done-list .task-card");

    // 2. Loop through them and delete with a small delay for each
    doneCards.forEach((card, index) => {
        setTimeout(() => {
            const taskId = parseInt(card.getAttribute("data-id"));
            deleteTask(taskId); // Uses your existing fade-out delete function
        }, index * 150); // 150ms delay makes them disappear one-by-one
    });
});