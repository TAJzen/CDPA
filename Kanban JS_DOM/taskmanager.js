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
    dateDiv.textContent = `Due: ${taskObj.date || "No date set"}`;
    dateDiv.classList.add("task-date");

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

// Step 7.2: What happens when you click "Save"
saveBtn.addEventListener("click", () => {
    // A. Grab values from the input boxes
    const title = document.getElementById("task-title").value;
    const desc = document.getElementById("task-desc").value;
    const priority = document.getElementById("task-priority").value;
    const date = document.getElementById("task-date").value;

    // B. Validation: Stop if the title is empty
    if (title.trim() === "") {
        alert("Title is required!");
        return;
    }

    // C. Package the data into an object
    const newTask = {
        id: nextId++,
        title: title,
        description: desc,
        priority: priority,
        date: date
    };

    // D. Run the addTask function
    addTask(currentColumnId, newTask);

    // E. Close the modal and clear the form
    closeModal();
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