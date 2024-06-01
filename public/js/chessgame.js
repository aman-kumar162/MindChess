const socket = io();

const chess = new Chess();
const boardElement = document.querySelector('.chessboard');

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board(); // Get the current board layout
  
    boardElement.innerHTML = '';
    board.forEach((row, rowIndex) => {
        row.forEach((square, colIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square", (rowIndex + colIndex) % 2 === 0 ? 'light' : 'dark');
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = colIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : 'black');
                pieceElement.innerHTML = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: colIndex };
                        e.dataTransfer.setData('text/plain', ""); // Make draggable
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.append(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });
            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });
            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }
};

const handleMove = (source, target) => {
  // Ensure no extra spaces are included in these variables
  const fromCol = String.fromCharCode(97 + source.col).trim();
  const fromRow = (8 - source.row).toString().trim();
  const toCol = String.fromCharCode(97 + target.col).trim();
  const toRow = (8 - target.row).toString().trim();

  // Concatenate without spaces
  const from = fromCol + fromRow;
  const to = toCol + toRow;

  // Log for debugging
  console.log("From:", from, "To:", to);

  const move = {
      from: from,
      to: to,
      promotion: 'q' // Always promote to a queen for simplicity
  };

  console.log("Emitting move:", move); // Add this line for debugging
  socket.emit('move', move);
};


const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: '♙', r: '♖', n: '♘', b: '♗', q: '♕', k: '♔',
        P: '♟', R: '♜', N: '♞', B: '♝', Q: '♛', K: '♚'
    };
    return unicodePieces[piece.type] || "";
};

socket.on('playerRole', (role) => {
    playerRole = role;
    renderBoard();
});

socket.on('spectatorRole', () => {
    playerRole = null;
    renderBoard();
});

socket.on('boardState', (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on('move', (move) => {
  console.log("Received move:", move); // Add this line for debugging
  chess.move(move);
  renderBoard();
});

renderBoard();
