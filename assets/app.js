const ZERO_MARK = 'O';
const CROSS_MARK = 'X';

const ZERO_MARK_VALUE = -1;
const CROSS_MARK_VALUE = 1;

const MAX_MOVES = 9;

const ONE_PLAYER_GAME_MODE = 'one-player';
const TWO_PLAYERS_GAME_MODE = 'two-players';

const COMPUTER_USER_NAME = 'computer';

class Mark {
    constructor(mark) {
        this.mark = mark;
    }

    isCross() {
        return CROSS_MARK === this.mark;
    }

    isZero() {
        return ZERO_MARK === this.mark;
    }

    toString() {
        return this.mark;
    }

    toInt() {
        return this.isCross() ? CROSS_MARK_VALUE : ZERO_MARK_VALUE;
    }
}

class GameMode {
    constructor(mode) {
        this.mode = mode;
    }

    isOnePlayerGameMode() {
        return ONE_PLAYER_GAME_MODE === this.mode;
    }

    isTwoPlayersGameMode() {
        return TWO_PLAYERS_GAME_MODE === this.mode;
    }

    toString() {
        return this.mode;
    }
}

class Player {
    constructor(name, mark, isComputer = false) {
        this.name = name;
        this.mark = mark;
        this.isComputer = isComputer;
    }
}

class TicTacToe {
    mode = null;
    board = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
    totalMoves = 0;
    isStarted = false;
    currentPlayer = null;
    winner = null;
    player1 = null;
    player2 = null;

    constructor(gameOverHandler, moveDoneHandler) {
        this.gameOverHandler = gameOverHandler;
        this.moveDoneHandler = moveDoneHandler;
    }

    start() {
        this.isStarted = true;
        this.totalMoves = 0;
        this.winner = null;
        this.currentPlayer = this.player1.mark.isCross() ? this.player1 : this.player2;
        this.board.forEach((row, y) => {
            row.forEach((value, x) => this.board[y][x] = 0);
        });

        if (this.currentPlayer.isComputer) {
            this.computerMove();
        }
    }

    end() {
        this.isStarted = false;

        if (typeof this.gameOverHandler === 'function') {
            this.gameOverHandler.call(null, this.winner);
        }
    }

    move(x, y) {
        if (MAX_MOVES <= this.totalMoves) {
            return;
        }

        this.board[y][x] = this.currentPlayer.mark.toInt();
        this.totalMoves++;

        if (typeof this.moveDoneHandler === 'function') {
            this.moveDoneHandler(this.currentPlayer, x, y);
        }

        this.currentPlayer = this.player1 === this.currentPlayer ? this.player2 : this.player1;

        this.determinateWinner();

        if (this.gameIsOver()) {
            this.end();

            return;
        }

        if (this.currentPlayer.isComputer) {
            this.computerMove();
        }
    }

    computerMove() {
        const [, {x, y}] = this.minimax([...this.board.map(row => [...row])], 0, this.player2);

        this.move(x, y);
    }

    getEmptyCells(board) {
        const emptyCells = [];
        board.forEach((row, y) => {
            row.forEach((val, x) => {
                if (0 === val) {
                    emptyCells.push({x, y});
                }
            });
        });

        return emptyCells;
    }

    determinateWinner() {
        this.winner = this.findWinner(this.board);
    }

    findWinner(board) {
        let winMark;

        const horizontalAmounts = board.map(row => row.reduce((prev, current) => prev + current, 0));
        const verticalAmounts = board.reduce((prevValue, row) => {
            return row.map((value, idx) => prevValue[idx] + value);
        }, [0,0,0]);
        const diagonalAmounts = board.reduce((prev, row, yIdx) => {
            return [
                prev[0] + row[yIdx],
                prev[1] + [...row].reverse()[yIdx]
            ];
        }, [0, 0]);

        const boardResult = [...horizontalAmounts, ...verticalAmounts, ...diagonalAmounts];
        const crossWin = Math.max(...boardResult) === 3;
        const zeroWin = Math.min(...boardResult) === -3;

        if (crossWin) {
            winMark = CROSS_MARK;
        } else if (zeroWin) {
            winMark = ZERO_MARK;
        }

        let winner = null;
        if (this.player1.mark.toString() === winMark) {
            winner = this.player1;
        } else if (this.player2.mark.toString() === winMark) {
            winner = this.player2;
        }

        return winner;
    }

    minimax(board, depth, player, move) {
        const winner = this.findWinner(board);
        const emptyCells = this.getEmptyCells(board);
        if (!emptyCells.length || winner) {
            if (winner === this.player2) {
                return [1, move];
            } else if (winner === this.player1) {
                return [-1, move];
            } else {
                return [0, move];
            }
        }

        let bestScore = player.isComputer ? -Infinity : Infinity;
        let bestMove;
        emptyCells.forEach(({x, y}) => {
            board[y][x] = player.mark.toInt();

            const nextPlayer = this.player1 === player ? this.player2 : this.player1;
            const move = {x, y};
            const [score] = this.minimax(board, depth + 1, nextPlayer, {x, y});
            board[y][x] = 0;

            bestScore = player.isComputer ? Math.max(score, bestScore) : Math.min(score, bestScore);
            bestMove = !bestMove || (bestScore === score) ? move : bestMove;
        });

        return [bestScore, bestMove];
    }

    gameIsOver() {
        return this.winner !== null || this.totalMoves >= MAX_MOVES;
    }
}

class App {
    game = null;

    constructor() {
        this.$gameModeForm = document.getElementById('form__select_game_type');
        this.$select1PlayerGameModeButton = document.querySelector('.form__one_player_game');
        this.$select2PlayersGameModeButton = document.querySelector('.form__two_players_game');
        this.$usernameForm = document.getElementById('form__enter_player_name');
        this.$gameResultAlert = document.querySelector('.game__result');
        this.$welcomeMessageAlert = document.querySelector('.game__welcome_message');
        this.$restartGameButton = document.querySelector('.btn__start_over');
        this.$restartGameContainer = document.querySelector('.game__restart_game_wrapper');
        this.$gameCells = document.querySelectorAll('.game__cell');

        this.$select1PlayerGameModeButton.addEventListener('click', this.selectGameModeHandler.bind(this, ONE_PLAYER_GAME_MODE));
        this.$select2PlayersGameModeButton.addEventListener('click', this.selectGameModeHandler.bind(this, TWO_PLAYERS_GAME_MODE));
        this.$usernameForm.addEventListener('submit', this.startGameHandler.bind(this));
        this.$restartGameButton.addEventListener('click', this.restartGameHandler.bind(this));
        this.$gameCells.forEach(cell => cell.addEventListener('click', this.selectCellHandler.bind(this)));

        this.game = new TicTacToe(this.gameOverHandler, this.moveDoneHandler);
    }

    moveDoneHandler(player, x, y) {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);

        cell.innerText = player.mark.toString();
        cell.classList.add('selected');
    }

    gameOverHandler(winner) {
        let message;
        if (winner) {
            message = `${winner.name} wins!`;
        } else {
            message = 'You have a draw!';
        }
        document.querySelector('.game__result').innerText = message;

        document.querySelector('.game__result').classList.remove('hidden');
        document.querySelector('.game__restart_game_wrapper').classList.remove('hidden');
    }

    selectCellHandler(event) {
        const cell = event.target;
        if (cell.classList.contains('selected') || !this.game.isStarted) {
            return;
        }

        this.game.move(+cell.dataset.x, +cell.dataset.y);
    }

    restartGameHandler() {
        this.$gameResultAlert.classList.add('hidden');
        this.$restartGameContainer.classList.add('hidden');

        this.$gameCells.forEach(cell => {
            cell.innerText = '';
            cell.classList.remove('selected');
        });

        this.game.player1.mark = new Mark(Math.random() > 0.5 ? CROSS_MARK : ZERO_MARK);
        this.game.player2.mark = new Mark(this.game.player1.mark.isZero() ? CROSS_MARK : ZERO_MARK);

        this.renderWelcomeMessage();

        this.game.start();
    }

    selectGameModeHandler(gameMode) {
        this.game.mode = new GameMode(gameMode);

        this.$gameModeForm.classList.add('hidden');
        this.$usernameForm.classList.remove('hidden');

        if (this.game.mode.isOnePlayerGameMode()) {
            document.querySelector('.form__player2_name').classList.add('hidden');
        } else {
            document.querySelector('.form__player2_name').classList.remove('hidden');
        }
    }

    startGameHandler(event) {
        event.preventDefault();

        const username1 = this.$usernameForm.querySelector('[name="name1"]').value.trim();
        const username2 = this.game.mode.isOnePlayerGameMode() ? COMPUTER_USER_NAME : this.$usernameForm.querySelector('[name="name2"]').value.trim();

        if ('' === username1) {
            return;
        }

        if (this.game.mode.isTwoPlayersGameMode() && '' === username2) {
            return;
        }

        const player1Mark = new Mark(Math.random() % 2 === 0 ? CROSS_MARK : ZERO_MARK);
        const player2Mark = new Mark(player1Mark.isZero() ? CROSS_MARK : ZERO_MARK);

        this.game.player1 = new Player(username1, player1Mark);
        this.game.player2 = new Player(username2, player2Mark, this.game.mode.isOnePlayerGameMode());

        this.renderWelcomeMessage();

        document.querySelector('.game__container').classList.remove('hidden');
        document.querySelector('.start-game-form-wrapper').classList.add('hidden');

        this.game.start();
    }

    renderWelcomeMessage() {
        let welcomeMessage = `Welcome, ${this.game.player1.name}! Let's play! <br> You are "${this.game.player1.mark}".`;
        if (this.game.mode.isTwoPlayersGameMode()) {
            welcomeMessage = `Welcome, ${this.game.player1.name} (${this.game.player1.mark}) and ${this.game.player2.name} (${this.game.player2.mark})! Let's play!`;
        }

        this.$welcomeMessageAlert.innerHTML = welcomeMessage;
        this.$welcomeMessageAlert.classList.remove('hidden');
    }
}

const gameView = new App();
