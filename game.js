//-------Game and Board Logic--------//
const BOARD_SIZE = 8;  // Create Board and set size of board

const COLORS = [ //Create an array of colors for gems
    { name: "Yellow", code: "#FFEB3B"},
    { name: "Red", code: "#E53935"},
    { name: "Green", code: "#43A047"},
    { name: "Blue", code: "#1E88E5"},
    { name: "Purple", code: "#9C27B0"}
];
//Create Game State
let board = []; //Create an empty array named board
let score = 0; //Create a variable to hold the score
let selected = null; //Create a variable to hold the selected gem
let animating = false; //Create a variable to check if the game is animating
let gameOver = false;  //Create a variable to check if the game is over
let lightfallActive = false; //Create a variable to check if the lightfall ability is active

//Timer State
const TIMER_START = 10000; //Set the timer to 10 seconds
let timeLeft = TIMER_START; //Set the time left to the timer start
let timerInterval = null; //Create a variable to hold the timer interval
let timerPaused = false; //Create a variable to check if the timer is paused
let lastTick = null; //Create a variable to hold the last tick time
let timerStarted = false; //Create a variable to check if the timer has started

//DOM Elements
const boardDiv = document.getElementById("board"); //Get the board div from the DOM
const scoreDiv = document.getElementById("score"); //Get the score div from the DOM
const timerDiv = document.getElementById("timer"); //Get the timer div from the DOM
const resetBtn = document.getElementById("resetBtn"); //Get the reset button from the DOM
const heroPanel = document.getElementById("heroPanel"); //Get the hero panel from the DOM

//Factions to handle Heroes and Enemy
const faction = {
    red: "Fire", 
    blue: "Water",
    green: "Earth",
    yellow: "Light",
    purple: "Dark"
};

function factionFire(hero) {
    hero.attackBoost = 1.5; // Boost attack for the next attack
}
function waterFaction(hero) {
    timeLeft += 1000; // Add 1 second to the timer
}
function earthFaction(hero, matchLength) {
    if(matchLength > 3) {
        hero.attackBoost = 1 + (matchLength - 3) * 0.25 // Increase attack boost based on match length
    }
}
function lightFaction(her0) {
    lightfallActive = true; // Activate lightfall ability
}
function darkFaction(hero) {
    hero.mp += 10; // Restore 10 MP to the hero
}

//-----Board Functions-----//
function randomGem(biasColor = null, biasChance = 0.1) {
    if (biasColor && Math.random() < biasChance) {
        const biasIndex = COLORS.findIndex(color => color.name === biasColor); //Find the index of the biased color
        if (biasIndex !== -1) return biasIndex; //Return the index if the biased color is found
    }
    //If no bias or bias chance fails, return a random gem index
    return Math.floor(Math.random() * COLORS.length); //Creating a random gem based on the amount of colors
    }

function initBoard() {

const victoryMsg = document.querySelector('.Victory'); //Check if there is a victory message in the DOM
if(victoryMsg) {
    victoryMsg.remove(); //Remove the victory message if it exists
};

    board = []; //Creating a new board each time this function is called
    for (let r = 0; r < BOARD_SIZE; r++) {
        const row = []; //Create a new row
        for (let c = 0; c < BOARD_SIZE; c++) {
            let gem; 
            do {
                gem = randomGem(); //Call randomGem function to get a random colored gem for each row   
                row[c] = gem; //Assign the gem to the column 
            } while (
                (c >= 2 && row[c-1] === gem && row[c-2] === gem) || //Check if the gem is the same as the previous two gems in the row
                (r >= 2 && board[r-1][c] === gem && board[r-2][c] === gem) || //Check if the gem is the same as the previous two gems in the column
                (r >= 2 && c >= 2 && board[r-1][c-1] === gem && board[r-2][c-2] === gem) || //Check if the gem is the same as the previous two gems in the diagonal
                (r >=2 && c <= BOARD_SIZE - 3 && board[r-1][c+1] === gem && board[r-2][c+2] === gem) //Check if the gem is the same as the previous two gems in the diagonal
            );
        }
        board.push(row); //Push the row to the board
    }
    enemy.hp = enemy.maxHp;
    score = 0; //Reset the score
    selected = null; //Reset the selected gem
    animating = false; //Reset the animating state
    gameOver = false; //Reset the game over state
    updateBoard(); //Update the board
    updateScore(); //Update the score
    resetTimer(); //Reset the timer
    resetHeroesMp(); //Reset the heroes MP
    renderHeroes(); //Render the heroes
    renderEnemy(); //Render the enemy
}
 function updateBoard(matchedPositions = []) {
    boardDiv.innerHTML = ""; //Clear the board div
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const gemDiv = document.createElement('div'); //Create a new div for each gem
            gemDiv.className = 'gem'; //Set the class name to gem
            gemDiv.style.background = COLORS[board[r][c]].code; //Set the background color to the gem color
            gemDiv.title = COLORS[board[r][c]].name; //Set the title to the gem name
            gemDiv.dataset.row = r; //Set the data row attribute to the row index
            gemDiv.dataset.col = c; //Set the data column attribute to the column index
            if (selected && selected.row === r && selected.col === c) { //Check if the gem is selected
                gemDiv.classList.add('selected'); //Add the selected class if the gem is selected
                 }
            if (matchedPositions.some(pos => pos.r === r && pos.c === c)){ //Check if the gem is in the matched positions
                gemDiv.classList.add('matched'); //Add the matched class if the gem is matched
            }
            if (gameOver) gemDiv.style.pointerEvents = 'none'; //Disable pointer events if the game is over
            gemDiv.onclick = () => selectGem(r, c); //Set the onclick event to select the gem
            boardDiv.appendChild(gemDiv); //Append the gem div to the board div
        }
     }
            
}

function collapseBoard() { //Function to collapse the board after matches are found
    for (let c = 0; c < BOARD_SIZE; c++) { // Loop through each column
        let pointer = BOARD_SIZE - 1; // Set a pointer to the bottom of the column
        for (let r = BOARD_SIZE - 1; r >= 0; r--) { // Loop through each row from bottom to top
            if (board[r][c] !== null) { //Check if the gem is not null
                board[pointer][c] = board[r][c]; //Move the gem to the pointer position
                if (pointer !== r) board[r][c] = null; //Set the original position to null if the pointer is not the same as the row
                pointer--; //Move the pointer up
                }
            }
            for (let r = pointer; r >= 0; r--) { // Loop through the remaining rows above the pointer
                if (lightfallActive) {
                    board[r][c] = randomGem("Yellow", 0.05); //If lightfall is active, fill the remaining positions with yellow gems with a bias of 5%
                }else {
                board[r][c] = randomGem(); //Fill the remaining positions with new random gems
            }
        }
    }
        updateBoard(); //Update the board to reflect the changes
        setTimeout(() => {
            if(gameOver) {
                return; //Return if the game is over
            };
            const matches = findMatches(); //Find matches after collapsing the board
            if(matches.length > 0) { //Check if there are matches
                handleMatches(matches); //Handle the matches found
                if (timerStarted) pauseTimer(); //Pause the timer if there are matches
                
            }else {
                lightfallActive = false; //Reset lightfall active state
                resumeTimer(); //Resume the timer if there are no matches
                animating = false; //Set animating to false to allow further input
                
            }
        }, 300) 
}

function updateScore() {
    scoreDiv.textContent = `Score: ${score}`; //Update the score div with the current score
}

//----Match  Handling -----//
function findMatches() { //Function to find matches in the board
    let matches = []; //Create an empty array to hold the matches
    for(let r = 0; r < BOARD_SIZE; r++) {
        for(let c = 0; c < BOARD_SIZE; c++) {
            const color = board[r][c]; //Get the color of the gem at the current position

            //Horizontal Match
            if (c <= BOARD_SIZE - 3) {
                if (board[r][c+1] === color && board[r][c+2] === color) { //Check if the next two gems in the row are the same color
                    matches.push({r, c}, {r, c: c+1}, {r, c: c+2}); //If they are, push the positions to the matches array
                }
            }
            //Vertical Match
            if (r <= BOARD_SIZE - 3) {
                if (board[r+1][c] === color && board [r+2][c] === color) { //Check if the next two gems in the column are the same color
                    matches.push({r, c}, {r: r+1, c}, {r: r+2, c}); //If they are, push the positions to the matches array
                }
            }
            //Diagonal Match (Top-Left to Bottom-Right)
            if (r <= BOARD_SIZE - 3 && c <= BOARD_SIZE - 3) {
                if (board[r+1][c+1] === color && board[r+2][c+2] === color) { //Check if the next two gems in the diagonal are the same color
                    matches.push({r, c}, {r: r+1, c: c+1}, {r: r+2, c: c+2}); //If they are, push the positions to the matches array
                }
            }
            //Diagonal Match (Top-Right to Bottom-Left)
            if (r <= BOARD_SIZE - 3 && c >= 2) {
                if (board[r+1][c-1] === color && board[r+2][c-2] === color) { //Check if the next two gems in the diagonal are the same color
                    matches.push({r, c}, {r: r+1, c: c-1}, {r: r+2, c: c-2}); //If they are, push the positions to the matches array
                }
            }
        }
    }

//Remove duplicates from the matches array
const uniqueMatches = []; //Create an empty array to hold the unique matches
const seen = new Set(); //Create a set to hold the seen positions
for (const m of matches) {
    const key = `${m.r},${m.c}`; //Create a unique key for each position
    if(!seen.has(key)) { //Check if the position has not been seen before
        seen.add(key); //Add the position to the seen set
        uniqueMatches.push(m); //Push the position to the unique matches array
        }
    }
    return uniqueMatches; //Return the unique matches array
};

function handleMatches(matches) { //Function to handle the matches found
    if(gameOver) {
        return; //Return if the game is over
    };
    if(!timerStarted) { //Check if the timer has not started
        startTimer(); //Start the timer
        timerStarted = true; //Set the timer started state to true

    }
    const matchedColors = new Set(); //Create a set to hold the matched colors
    matches.forEach(({r, c}) => {
        const colorIndex = board[r][c]; //Get the color index of the matched gem
        if(colorIndex !== null) { 
            const colorName = COLORS[colorIndex].name; //Get the color name from the COLORS array
            matchedColors.add(colorName); //Add the color name to the matched colors set
        }
    });
    const matchCounts = {}; //Create an object to hold the match counts for each color
    matches.forEach(({r, c}) => {
        const colorIndex = board[r][c]; //Get the color index of the matched gem
        if(colorIndex !== null) {
            const colorName = COLORS[colorIndex].name; //Get the color name from the COLORS array
            matchCounts[colorName] = (matchCounts[colorName] || 0) + 1; //Increment the match count for the color
        }
    });
    matchedColors.forEach(colorName => {
        score+= 10; //Increase the score by 10 for each matched color
        const hero = heroes.find(h => h.color === colorName); //Find the hero with the matched color
        const matchLength = matchCounts[colorName] || 0; //Get the match length for the color, default to 0 if not found
        if (hero) {
            if (colorName === "Yellow" && lightfallActive) {
                hero.mp = Math.min(hero.mp + 5, hero.mpMax); //Increase the hero MP by 5 if lightfall is active, but not exceeding the max MP
            } else {
            hero.mp = Math.min(hero.mp + 10, hero.mpMax); //Increase the hero MP by 10, but not exceeding the max MP
        }
    }
        switch(colorName) {
            case "Red":
                factionFire(hero); //Call the fire faction function for the hero
                break;
            case "Blue":
                waterFaction(hero); //Call the water faction function for the hero
                break;
            case "Green":
                earthFaction(hero, matchLength); //Call the earth faction function for the hero
                break;
            case "Yellow":
                lightFaction(hero); //Call the light faction function for the hero
                break;
            case "Purple":
                darkFaction(hero); //Call the dark faction function for the hero
                break;
        }
    });

    updateBoard(matches); //Update the board with the matched positions
    
    setTimeout(() => { //Set a timeout to allow the board to update before collapsing
        matches.forEach(({r, c}) => { // Loop through each matched position
            board[r][c] = null; //Set the matched positions to null
        }); 
        
        updateScore(); //Update the score
        renderHeroes(); //Render the heroes to reflect the updated MP

        setTimeout(() => {
            collapseBoard(); //Collapse the board after a delay
            
        setTimeout(() => {
            attackHeroesSequentially(0); // Heroes attack, then resume timer
                }, 350);
            }, 300);
        },  200); 
    }

    


//----- Input Handling -----//
function swapGems(r1, c1, r2, c2){
    if (gameOver) return; //Return if the game is over
    animating = true; //Set animating to true to prevent further input
    const temp = board[r1][c1]; //Store the gem at the first position in a temporary variable
    board[r1][c1] = board[r2][c2]; //Swap the gems in the board array
    board[r2][c2] = temp; //Assign the temporary variable to the second position
    updateBoard(); //Update the board to reflect the changes

    setTimeout(() => {
        const matches = findMatches(); 
        if(matches.length === 0) {
            animating =false; 
        }else{
            if (timerStarted) pauseTimer(); //Pause the timer if there are matches
            handleMatches(matches); //Handle the matches found
        }
    }, 200); //Set a timeout to allow the board to update before checking for matches
}

function selectGem(row, col) {
    if (animating || gameOver) return; //Return if the game is animating or over
    if (!selected) { //If no gem is selected
        selected = { row, col }; //Set the selected gem if no gem is selected
    } else { //If a gem is already selected
        const dist = Math.abs(selected.row - row) + Math.abs(selected.col - col); //Calculate the distance between the selected gem and the current gem
        if (dist === 1 || dist === 2) {
            swapGems(selected.row, selected.col, row, col); //Call the swapGems function to swap the gems
        }
        selected = null; //Reset the selected gem
}
updateBoard(); 
};

//----- Hero and Enemy Logic------//

// Hero Data
const heroes = [
{ name: "Flareblade", color: "Red", hp: 100, maxHp: 100, mp: 0, mpMax: 50, attack: 30, attackBoost: 1},
{ name: "Aquaria", color: "Blue", hp: 90, maxHp: 90, mp: 0, mpMax: 50, attack: 25, attackBoost: 1 },
{ name: "Verdant", color: "Green", hp: 110, maxHp: 110, mp: 0, mpMax: 50, attack: 35, attackBoost: 1 },
{ name: "Stormcaller", color: "Yellow", hp: 95, maxHp: 95, mp: 0, mpMax: 50, attack: 28, attackBoost: 1 },
{ name: "Shadowstrike", color: "Purple", hp: 85, maxHp: 85, mp: 0, mpMax: 50, attack: 20, attackBoost: 1 }
];

//Hero Logic
function renderHeroes() {
    heroPanel.innerHTML = ""; //Clear the hero panel
    heroes.forEach(hero => {
        const heroDiv = document.createElement('div'); //Create a new div for each hero
        heroDiv.className = "hero"; //Set the class name to hero
        heroPanel.appendChild(heroDiv); //Append the hero div to the hero panel
       
        //Name
        const name = document.createElement('div'); //Create a new div for the hero name
        name.className = "hero-name"; //Set the class name to hero-name
        name.textContent = hero.name; //Set the text content to the hero name
        heroDiv.appendChild(name); //Append the name div to the hero div

        //Color
        const colorBadge = document.createElement('div'); //Create a new div for the hero color
        colorBadge.className = "hero-color"; //Set the class name to hero-color
        const colorObj = COLORS.find(c => c.name === hero.color); //Find the color object based on the hero color
        colorBadge.style.backgroundColor = colorObj.code; //Set the background color to the hero color
        heroDiv.appendChild(colorBadge); //Append the color badge to the hero div

        // HP Bar
        const hpBar = document.createElement('div'); //Create a new div for the hero HP bar
        hpBar.className = "hero-hp"; //Set the class name to hero-hp
        hpBar.style.width = `${(hero.hp / hero.maxHp) * 100}%`; //Set the width of the HP bar based on the hero HP
        heroDiv.appendChild(hpBar); //Append the HP bar to the hero div

        // MP Bar
        const mpBar = document.createElement('div'); //Create a new div for the hero MP bar
        mpBar.className = "hero-mp"; //Set the class name to hero-mp
        mpBar.style.width = `${(hero.mp / hero.mpMax) * 100}%`; //Set the width of the MP bar based on the hero MP
        heroDiv.appendChild(mpBar); //Append the MP bar to the hero div
    });
};
        function resetHeroesMp() {
            heroes.forEach(hero => {
                hero.mp = 0; //Reset the hero MP to 0
            })
        
        renderHeroes(); //Call the renderHeroes function to render the heroes
        };

       
        

 // ------ Enemy Logic -----//

 // Enemy Data
 const enemy = {
    name: "Shadow Fiend",
    hp: 125,
    maxHp: 125,
    color: "Purple"
 };

 //Enemy Logic

 function renderEnemy() {
    const enemyNameDiv = document.getElementById('enemy-name'); //Get the enemy name div from the DOM
    const enemyHpFill = document.getElementById('enemy-hp-fill'); //Get the enemy HP div from the DOM
    const enemyColorDiv = document.getElementById('enemy-color'); //Get the enemy color div from the DOM
    if(enemyNameDiv) enemyNameDiv.textContent= enemy.name; //Set the text content of the enemy name div to the enemy name
    if(enemyHpFill) enemyHpFill.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;//Set the width of the enemy HP bar based on the enemy HP
    if(enemyColorDiv) enemyColorDiv.style.background = enemy.color; //Set the background color of the enemy color div to the enemy color 
 };

 function dealDamageToEnemy(damage, attackerName) { //Function to deal damage to the enemy
    const hero  =heroes.find(h => h.name === attackerName); //Find the hero who is attacking
    let finalDamage = damage; //Set the final damage to the damage amount
    if (hero && hero.attackBoost) { //Check if the hero exists and has an attack boost
        finalDamage = Math.round(damage * hero.attackBoost); //Calculate the final damage based on the hero attack boost
        hero.attackBoost = 1;
    }
    enemy.hp = Math.max(0, enemy.hp - finalDamage); //Reduce the enemy HP by the final damage amount, ensuring it doesn't go below 0
    const logDiv = document.createElement("div"); //Create a new div for the log
    logDiv.className = "damage-log"; //Set the class name to damage-log
    logDiv.textContent = `${attackerName} hits ${enemy.name} for ${finalDamage}!`; //Set the text content of the log div to the attack message
    console.log(`${hero.name} attacks ${enemy.name} for ${finalDamage} damage!`); 
    document.body.appendChild(logDiv); //Append the log div to the body

    setTimeout(() => logDiv.remove(), 1500); //Set a timeout to remove the log div after 1.5 seconds
    enemy.hp = Math.max(0, enemy.hp -damage); //Reduce the enemy HP by the damage amount, ensuring it doesn't go below 0
    renderEnemy(); //Call the renderEnemy function to render the enemy

    if (enemy.hp === 0) {
        handleEnemyDefeat(); //Call the handleEnemyDefeat function if the enemy HP is 0
    } else {
        flashEnemyPanel(); //Call the flashEnemyPanel function to flash the enemy panel
    }
 };
  // Sequential Attack Logic
        function attackHeroesSequentially(index = 0, callback) {
            if(gameOver) {
                return; //Return if the game is over
            };
            if (index >= heroes.length) { //Check if the index is greater than or equal to the length of the heroes array
                if (callback) callback(); //Call the callback function if provided
                return; //Return if all heroes have attacked
            }
            const hero = heroes[index]; //Get the hero at the current index
            if (hero.mp >= hero.mpMax && enemy.hp > 0) { //Check if the hero MP is greater than or equal to the hero MP max and the enemy HP is greater than 0
                hero.mp = 0; //Reset the hero MP to 0
                renderHeroes(); //Call the renderHeroes function to render the heroes
                dealDamageToEnemy(hero.attack, hero.name); //Call the dealDamageToEnemy function to deal damage to the enemy
                setTimeout(() => {
                    if (enemy.hp > 0) {
                        attackHeroesSequentially(index + 1, callback); //Call the attackHeroesSequentially function with the next index
                    }else{
                        if (callback) callback(); 
                    }
                }, 400); //Set a timeout to allow the enemy to take damage before the next hero attacks 
            } else {
                attackHeroesSequentially(index + 1, callback); //Call the attackHeroesSequentially function with the next index if the hero MP is less than the hero MP max
            }
        };

 function handleEnemyDefeat() {
    const winDiv = document.createElement("div"); //Create a new div for the win message
    winDiv.className = "Victory"; //Set the class name to Victory
    winDiv.textContent = "You defeated the enemy!"; //Set the text content of the win message
    document.body.appendChild(winDiv); //Append the win message to the body

    stopTimer(); 
    gameOver = true; 
    animating = true; 
 };

 function flashEnemyPanel() {
    const enemyContainer = document.getElementById("enemy-container"); //Get the enemy container from the DOM
    if (enemyContainer) {
        enemyContainer.classList.add("hit"); //Add the hit class to the enemy container to trigger the flash animation
        setTimeout(() => {
            enemyContainer.classList.remove("hit"); //Remove the hit class after the animation duration
        }, 300); //Set a timeout to remove the hit class after 300 milliseconds
    }
 };

//----- Timer Logic -----//
function formatTime(ms) {
    const sec = Math.floor(ms / 1000); //Convert milliseconds to seconds
    const tenths = Math.floor((ms % 1000) / 100); //Get the tenths of a second
    return `${sec}.${tenths}`; //Return the formatted time as a string
};

function updateTimerDisplay() {
    timerDiv.textContent = "Time: " + formatTime(Math.max(timeLeft, 0));
};

function startTimer() { //Function to start the timer
    if (timerInterval) return; //Check if the timer interval is already set
    timerPaused = false; //Set the timer paused state to false
    lastTick = Date.now(); //Set the last tick time to the current time

    timerInterval = setInterval(() => { //Set an interval to update the timer every 100 milliseconds
        if (!timerPaused && !gameOver) { //Check if the timer is not paused and the game is not over
            const now = Date.now(); //Get the current time
            const dt = now - lastTick; //Calculate the time since the last tick
            lastTick = now; //Update the last tick time to the current time
            timeLeft -= dt; //Subtract the time since the last tick from the time left

            if (timeLeft <= 0) { //Check if the time left is less than or equal to 0
                timeLeft = 0; //Set the time left to 0
                updateTimerDisplay(); //Update the timer display
                stopTimer();  //Stop the timer
                handleGameOver();  //Handle the game over state
                return; 
            }

            updateTimerDisplay(); 
        }
    }, 100);
}


function stopTimer() { //Function to stop the timer
    if (timerInterval) { //Check if the timer interval is set
        clearInterval(timerInterval); //Clear the timer interval
        timerInterval = null; //Set the timer interval to null
    }
};

function pauseTimer() {
    if (!timerStarted || timerPaused || gameOver || lastTick === null) return;
    timerPaused = true;
    const now = Date.now();
    timeLeft -= Math.max(0, now - lastTick);
    updateTimerDisplay();
}

function resumeTimer() {
    if (!timerStarted || !timerPaused || gameOver) return;
    timerPaused = false;
    lastTick = Date.now();
}

function resetTimer() {
    stopTimer(); 
    timeLeft = TIMER_START; 
    timerPaused = false; 
    gameOver = false;
    lastTick = null;
    timerStarted = false;  
    updateTimerDisplay(); 
};

function handleGameOver() {
    gameOver = true; 
    animating = true; 
    timerDiv.textContent = "Time: 0.0 (Game Over)";
};

//----- Event Listeners -----//
resetBtn.onclick = () => {
    initBoard();
};

// Initialize the game board when the page loads
initBoard(); 