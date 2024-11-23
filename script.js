let boardlen = 3, boardwid = 3;
const PLAYER_VERTICAL = 'V';
const COMPUTER_HORIZONTAL = 'H';
let board = Array.from({ length: boardlen }, () => Array(boardwid).fill('0')); // Empty board
let currentPlayer = PLAYER_VERTICAL;

const statusDiv = document.getElementById('status');

const createBoard = () => {
    const boardDiv = document.getElementById('board');
    boardDiv.innerHTML = ''; // Clear the board

    // Dynamically set the grid layout based on the current boardSize
    boardDiv.style.gridTemplateColumns = `repeat(${boardwid}, 50px)`;
    boardDiv.style.gridTemplateRows = `repeat(${boardlen}, 50px)`;

    for (let row = 0; row < boardlen; row++) {
        for (let col = 0; col < boardwid; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            if (board[row][col] === 'V') {
                cell.classList.add('vertical');
            } else if (board[row][col] === 'H') {
                cell.classList.add('horizontal');
            }
            cell.addEventListener('click', handleCellClick);
            boardDiv.appendChild(cell);
        }
    }
};

const moveSound = document.getElementById('move-sound');
const winSound = document.getElementById('win-sound');
const loseSound = document.getElementById('lose-sound');

const playSound = (sound) => {
    sound.currentTime = 0; // Reset sound to start
    sound.play();
};


document.getElementById('set-board-size').addEventListener('click', () => {
    const rows = parseInt(document.getElementById('rows').value);
    const cols = parseInt(document.getElementById('cols').value);
    boardlen = rows;
    boardwid = cols;
    board = Array.from({ length: boardlen }, () => Array(boardwid).fill('0')); // Recreate the empty board
    createBoard();
});

const handleCellClick = (event) => {
    if (currentPlayer !== PLAYER_VERTICAL) return; // Block clicks during computer's turn

    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (placeItem(row, col, PLAYER_VERTICAL)) {
        updateBoard();
        if (!checkGameEnd()) {
            currentPlayer = COMPUTER_HORIZONTAL;
            statusDiv.textContent = "Computer's turn";
            setTimeout(computerTurn, 1000); // Simulate computer's turn
        }
    } else {
        alert("Invalid move, try again.");
    }
};

const placeItem = (row, col, player) => {
    if (player === PLAYER_VERTICAL) {
        if (row + 1 < boardlen && board[row][col] === '0' && board[row + 1][col] === '0') {
            board[row][col] = player;
            board[row + 1][col] = player;
            playSound(moveSound); // Play move sound
            return true;
        }
    } else if (player === COMPUTER_HORIZONTAL) {
        if (col + 1 < boardwid && board[row][col] === '0' && board[row][col + 1] === '0') {
            board[row][col] = player;
            board[row][col + 1] = player;
            playSound(moveSound); // Play move sound
            return true;
        }
    }
    return false;
};

const removeItem = (row, col, player) => {
    if (player === PLAYER_VERTICAL) {
        board[row][col] = '0';
        board[row + 1][col] = '0';
    } else if (player === COMPUTER_HORIZONTAL) {
        board[row][col] = '0';
        board[row][col + 1] = '0';
    }
};

const updateBoard = () => {
    createBoard();
};

const getPossibilities = (player) => {
    let count = 0;
    for (let row = 0; row < boardlen; row++) {
        for (let col = 0; col < boardwid; col++) {
            if (player === PLAYER_VERTICAL) {
                if (row + 1 < boardlen && board[row][col] === '0' && board[row + 1][col] === '0') {
                    count++;
                }
            } else if (player === COMPUTER_HORIZONTAL) {
                if (col + 1 < boardwid && board[row][col] === '0' && board[row][col + 1] === '0') {
                    count++;
                }
            }
        }
    }
    return count;
};

const alphabeta = (depth, player, alpha, beta) => {
    // End condition: no more depth or no more possible moves
    if (depth === 0 || getPossibilities(PLAYER_VERTICAL) === 0 || getPossibilities(COMPUTER_HORIZONTAL) === 0) {
        return { score: getPossibilities(COMPUTER_HORIZONTAL) - getPossibilities(PLAYER_VERTICAL), row: null, col: null };
    }
    const maximizingPlayer = (player === COMPUTER_HORIZONTAL);
    let bestScore = maximizingPlayer ? -Infinity : Infinity;
    let bestRow = null;
    let bestCol = null;
    for (let row = 0; row < boardlen; row++) {
        for (let col = 0; col < boardwid; col++) {
            if (placeItem(row, col, player)) {
                const result = alphabeta(depth - 1, player === COMPUTER_HORIZONTAL ? PLAYER_VERTICAL : COMPUTER_HORIZONTAL, alpha, beta); // Recursive call
                removeItem(row, col, player); // Undo move after evaluating
                if (maximizingPlayer) { // Update scores based on maximizing/minimizing player
                    if (result.score > bestScore) {
                        bestScore = result.score;
                        bestRow = row;
                        bestCol = col;
                    }
                    alpha = Math.max(alpha, bestScore);
                } else {
                    if (result.score < bestScore) {
                        bestScore = result.score;
                        bestRow = row;
                        bestCol = col;
                    }
                    beta = Math.min(beta, bestScore);
                }
                if (alpha >= beta) { // Alpha-Beta Pruning
                    return { score: bestScore, row: bestRow, col: bestCol };
                }
            }
        }
    }
    return { score: bestScore, row: bestRow, col: bestCol };
};

const computerTurn = () => {
    const { row, col } = alphabeta(5, COMPUTER_HORIZONTAL, -Infinity, Infinity); // Increased depth for better decision-making
    if (row !== null && col !== null) {
        const success = placeItem(row, col, COMPUTER_HORIZONTAL);
        if (success) {
            updateBoard();
            if (!checkGameEnd()) {
                currentPlayer = PLAYER_VERTICAL;
                statusDiv.textContent = "Player's turn";
            }
        } else {
            console.error("AI attempted an invalid move. This should not happen!");
        }
    } else {
        console.log("AI has no valid moves.");
    }
};

const checkGameEnd = () => {
    const playerMoves = getPossibilities(PLAYER_VERTICAL);
    const computerMoves = getPossibilities(COMPUTER_HORIZONTAL);
    if (playerMoves === 0) {
        playSound(loseSound); // Player loses
        statusDiv.textContent = "Computer wins!";
        return true;
    } else if (computerMoves === 0) {
        playSound(winSound); // Player wins
        statusDiv.textContent = "Player wins!";
        return true;
    }
    return false;
};

document.getElementById('reset').addEventListener('click', () => {
    board = Array.from({ length: boardlen }, () => Array(boardwid).fill('0'));
    currentPlayer = PLAYER_VERTICAL;
    statusDiv.textContent = "Player's turn";
    updateBoard();
});

// Initialize the game
createBoard();
