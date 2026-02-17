let isGameLaunched = false;


// This variable remembers all 24 names
let currentImages = Array.from({ length: 24 }, () => "assets/imgHolder.png");

let currentNames = Array.from({ length: 24 }, (_, i) => `Character ${i + 1}`);

// This tracks which card we are currently naming
let nextNameIndex = 0;

let isPickingSecret = false; // The switch that turns on 'Selection Mode'

const singleFileInput = document.getElementById('single-file-input');
let editingIndex = null; // Remembers which card we are changing

function renderBoard() {
    const cardGrid = document.getElementById("card-grid");
    if (!cardGrid) return; 
    cardGrid.innerHTML = "";

    currentImages.forEach((imgUrl, i) => {
        const card = document.createElement("figure");
        card.classList.add("card");

        const displayName = currentNames[i];

        card.innerHTML = `
            <div class="img-card-holder">
                <img class="chr-img" src="${imgUrl}" alt="${displayName}">
            </div>
            <figcaption class="card-name">${displayName}</figcaption>
        `;

        card.addEventListener('click', (e) => {
            // 1. Lock check
            if (isGameLaunched && (e.ctrlKey || isPickingSecret)) {
                return; 
            }

            // 2. Selection Mode
            if (isPickingSecret) {
                const displayImg = document.querySelector(".img-cardyourcharacter-holder img");
                const displayNameDisp = document.querySelector(".your-character .card-name");
                displayImg.src = currentImages[i];
                displayNameDisp.textContent = currentNames[i];
                isPickingSecret = false;
                secretCard.style.outline = "none";
                document.body.style.cursor = "default";
                return;
            }

            // 3. Game Mode (Only flipping)
            if (isGameLaunched) {
                card.classList.toggle('flipped');
                return;
            }

            // 4. Setup Mode (Ctrl + Click)
            if (e.ctrlKey) {
                if (e.target.classList.contains('card-name')) {
                    const newName = prompt("Enter new name:", currentNames[i]);
                    if (newName) {
                        currentNames[i] = newName;
                        saveToStorage();
                        renderBoard();
                    }
                } else if (e.target.classList.contains('chr-img')) {
                    editingIndex = i;
                    singleFileInput.click();
                }
            } 
            else {
                card.classList.toggle('flipped');
            }
        });

        cardGrid.appendChild(card);
    });
}

// FIX: Call it simply
renderBoard();


const importBtn = document.getElementById('import-btn');
const fileInput = document.getElementById('file-input');

// 1. When the orange button is clicked, "click" the hidden file input
importBtn.addEventListener('click', () => {
    if (isGameLaunched) return; // Locked!
    fileInput.click();
});

// 2. When the user finishes picking their 24 images
// 1. When files are imported: update memory and refresh board
fileInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files);
    if (files.length !== 24) {
        alert(`Please select exactly 24 images.`);
        return;
    }

    // Convert images to Base64 so they can be saved to a file
    currentImages = await Promise.all(files.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }));
    
    saveToStorage();
    renderBoard();
});

// 2. When names are typed: just refresh the board (it uses the saved photos)
document.getElementById('character-name').addEventListener('input', renderBoard);


const nameInput = document.getElementById('character-name');

nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // STOPS the page from refreshing

        // 1. Get names from input and clean them up
        const newNames = nameInput.value.split(',').map(n => n.trim()).filter(n => n !== "");

        // 2. Add them to our list starting from nextNameIndex
        newNames.forEach(name => {
            if (nextNameIndex < 24) {
                currentNames[nextNameIndex] = name;
                nextNameIndex++; // Move to the next slot
            }
        });

        // 3. Clear the input so they can type the next batch
        nameInput.value = ""; 
        saveToStorage();
        renderBoard(); // Update the visuals
    }
});

const resetNameBtn = document.getElementById('reset-chr-name-btn');

// Reset Pictures
// SINGLE consolidated reset listener
document.getElementById('reset-chr-btn').addEventListener('click', () => {
    if (isGameLaunched) return;
    
    currentImages = Array.from({ length: 24 }, () => "assets/imgHolder.png");
    document.getElementById('character-name').value = "";
    
    saveToStorage(); // Ensure the "empty" state is also saved
    renderBoard();
});

// Reset Names
resetNameBtn.addEventListener('click', () => {
    if (isGameLaunched) return;
    currentNames = Array.from({ length: 24 }, (_, i) => `Character ${i + 1}`);
    nextNameIndex = 0;
    saveToStorage(); // <--- SAVE TRIGGER
    renderBoard();
});

// Handler for the single file replacement
singleFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0 && editingIndex !== null) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            currentImages[editingIndex] = event.target.result; // Save as permanent text
            saveToStorage(); // <--- SAVE TRIGGER
            renderBoard();
            editingIndex = null;
        };
        reader.readAsDataURL(file);
    }
});

function shuffleYourCharacter() {
    // 1. Generate a random whole number between 0 and 23
    const randomIndex = Math.floor(Math.random() * 24);

    // 2. Get the character data from our memory arrays
    const chosenImage = currentImages[randomIndex];
    const chosenName = currentNames[randomIndex];

    // 3. Find the elements in the "Your Character" section
    const displayImg = document.querySelector(".img-cardyourcharacter-holder img");
    const displayName = document.querySelector(".your-character .card-name");

    // 4. Update the display with the secret character
    if (displayImg && displayName) {
        displayImg.src = chosenImage;
        displayName.textContent = chosenName;
        
        console.log(`Secret character picked: ${chosenName}`);
    }
}

const shuffleBtn = document.querySelector(".shuffle-btn");

if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
        if (isGameLaunched) return; // Locked!
        shuffleYourCharacter();
    });
}

const secretCard = document.querySelector(".your-character .card");

secretCard.addEventListener('click', (e) => {
    // LOCK: Disable manual character selection during game
    if (isGameLaunched) return; 

    if (e.ctrlKey && e.shiftKey) {
        isPickingSecret = true;
        secretCard.style.outline = "4px solid yellow";
        document.body.style.cursor = "crosshair";
    }
});

const exportBtn = document.getElementById('export-pack-btn');

exportBtn.addEventListener('click', () => {
    // LOCK: Prevent downloading during the game
    if (isGameLaunched) return; 

    const gameData = {
        names: currentNames,
        images: currentImages
    };

    const blob = new Blob([JSON.stringify(gameData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-character-pack.json';
    a.click();
    
    URL.revokeObjectURL(url);
});

const importPackBtn = document.getElementById('import-pack-btn');
const packFileInput = document.getElementById('pack-file-input');

// Trigger the hidden file input
// Trigger the hidden file input
importPackBtn.addEventListener('click', () => {
    // LOCK: Prevent loading a new pack during the game
    if (isGameLaunched) return; 

    packFileInput.click();
});

packFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            // Verify the file has the right data
            if (data.names && data.images) {
                currentNames = data.names;
                currentImages = data.images;
                nextNameIndex = 24; 
                
                renderBoard(); // Draw the shared board
                alert("Character Pack Loaded successfully!");
            }
        } catch (err) {
            alert("Error: This file is not a valid Character Pack.");
        }
    };
    reader.readAsText(file);
});

const launchBtn = document.getElementById('launch-btn');
const gameResetBtn = document.querySelector('.reset-btn');

// LAUNCH GAME
launchBtn.addEventListener('click', () => {
    isGameLaunched = true;
    document.body.classList.add('game-active');
    alert("Game Launched! Editing is now locked.");
});

// RESET GAME
gameResetBtn.addEventListener('click', () => {
    isGameLaunched = false;
    document.body.classList.remove('game-active');

    // Ensure selection mode is killed if it was halfway active
    isPickingSecret = false; 
    secretCard.style.outline = "none";
    document.body.style.cursor = "default";

    const allCards = document.querySelectorAll('.card');
    allCards.forEach(card => card.classList.remove('flipped'));

    alert("Game Reset. You can now edit characters again.");
});

// Function to save the current state to the browser's memory
function saveToStorage() {
    try {
        localStorage.setItem('guessWhoImages', JSON.stringify(currentImages));
        localStorage.setItem('guessWhoNames', JSON.stringify(currentNames));
        // Save the index so batch naming continues where it left off
        localStorage.setItem('guessWhoIndex', nextNameIndex.toString());
    } catch (e) {
        console.warn("Storage is full! Try using smaller images or the 'Download Pack' feature.");
    }
}

// 1. First, define the functions
function loadFromStorage() {
    const savedImages = localStorage.getItem('guessWhoImages');
    const savedNames = localStorage.getItem('guessWhoNames');
    if (savedImages) currentImages = JSON.parse(savedImages);
    if (savedNames) currentNames = JSON.parse(savedNames);
}

// 2. Then, run them in this order
loadFromStorage();
renderBoard();
