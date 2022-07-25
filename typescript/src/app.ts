enum MarkSymbolEnum {
    zero = 'O',
    cross = 'X'
}

enum MarkValueEnum {
    zero = -1,
    cross = 1
}

enum GameModeEnum {
    onePlayer = 'one-player',
    twoPlayer = 'two-players',
}

const MAX_MOVES: number = 9;
const COMPUTER_USER_NAME: string = 'computer';

class Mark {
    mark: MarkSymbolEnum;

    constructor(mark: MarkSymbolEnum) {
        this.mark = mark;
    }

    isCross(): boolean {
        return MarkSymbolEnum.cross === this.mark;
    }

    isZero(): boolean {
        return MarkSymbolEnum.zero === this.mark;
    }

    toString(): string {
        return this.mark;
    }

    toInt(): number {
        return this.isCross() ? MarkValueEnum.cross : MarkValueEnum.zero;
    }
}

class GameMode {
    mode: GameModeEnum;

    constructor(mode: GameModeEnum) {
        this.mode = mode;
    }

    isOnePlayerGameMode() {
        return GameModeEnum.onePlayer === this.mode;
    }

    isTwoPlayersGameMode() {
        return GameModeEnum.twoPlayer === this.mode;
    }

    toString() {
        return this.mode;
    }
}

class Player {
    name: string;
    mark: Mark;
    isComputer: boolean;

    constructor(name: string, mark: Mark, isComputer: boolean = false) {
        this.name = name;
        this.mark = mark;
        this.isComputer = isComputer;
    }
}

class TicTacToe {
    mode: GameMode | null = null;
    board: Array<Array<number>> = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
    ];
    totalMoves: number = 0;
    isStarted: boolean = false;
    currentPlayer: Player | null = null;
    winner: Player | null = null;
    player1: Player | null = null;
    player2: Player | null = null;
    gameOverHandler: Function;
    moveDoneHandler: Function;

    constructor(gameOverHandler: Function, moveDoneHandler: Function) {
        this.gameOverHandler = gameOverHandler;
        this.moveDoneHandler = moveDoneHandler;
    }

    getFirstPlayer(): Player {
        if (!this.player1) {
            throw new Error('Player1 is not defined');
        }

        return this.player1;
    }

    getSecondPlayer(): Player {
        if (!this.player2) {
            throw new Error('Player2 is not defined');
        }

        return this.player2;
    }

    start(): void {
        this.isStarted = true;
        this.totalMoves = 0;
        this.winner = null;
        this.currentPlayer = this.getFirstPlayer().mark.isCross() ? this.getFirstPlayer() : this.getSecondPlayer();
        this.board.forEach((row: Array<number>, y: number): void => {
            row.forEach((value: number, x: number) => this.board[y][x] = 0);
        });

        if (this.currentPlayer?.isComputer) {
            this.computerMove();
        }
    }

    end(): void {
        this.isStarted = false;

        if (this.gameOverHandler) {
            this.gameOverHandler.call(null, this.winner);
        }
    }

    move(x: number, y: number): void {
        if (MAX_MOVES <= this.totalMoves) {
            return;
        }

        if (!this.currentPlayer) {
            return;
        }

        this.board[y][x] = this.currentPlayer.mark.toInt();
        this.totalMoves++;

        if (this.moveDoneHandler) {
            this.moveDoneHandler(this.currentPlayer, x, y);
        }

        this.currentPlayer = this.getFirstPlayer() === this.currentPlayer ? this.getSecondPlayer() : this.getFirstPlayer();

        this.determinateWinner();

        if (this.gameIsOver()) {
            this.end();

            return;
        }

        if (this.currentPlayer?.isComputer) {
            this.computerMove();
        }
    }

    computerMove(): void {
        if (!this.getSecondPlayer()) {
            return;
        }

        const copiedBoard = [...this.board.map(row => [...row])];
        const {move} = this.minimax(copiedBoard, 0, this.getSecondPlayer());

        if (!move) {
            throw new Error('Best move not found');
        }

        this.move(move.x, move.y);
    }

    getEmptyCells(board: Array<Array<number>>): Array<{ x: number, y: number }> {
        const emptyCells: Array<{ x: number, y: number }> = [];
        board.forEach((row: Array<number>, y: number) => {
            row.forEach((val: number, x: number) => {
                if (0 === val) {
                    emptyCells.push({x, y});
                }
            });
        });

        return emptyCells;
    }

    determinateWinner(): void {
        this.winner = this.findWinner(this.board);
    }

    findWinner(board: Array<Array<number>>): Player | null {
        let winMark: MarkSymbolEnum | null;

        const horizontalAmounts = board.map(row => row.reduce((prev, current) => prev + current, 0));
        const verticalAmounts = board.reduce((prevValue, row) => {
            return row.map((value, idx) => prevValue[idx] + value);
        }, [0, 0, 0]);
        const diagonalAmounts = board.reduce((prev, row, yIdx) => {
            return [
                prev[0] + row[yIdx],
                prev[1] + [...row].reverse()[yIdx]
            ];
        }, [0, 0]);

        const boardResult = [...horizontalAmounts, ...verticalAmounts, ...diagonalAmounts];
        const crossWin = Math.max(...boardResult) === 3;
        const zeroWin = Math.min(...boardResult) === -3;

        winMark = crossWin ? MarkSymbolEnum.cross : zeroWin ? MarkSymbolEnum.zero : null;

        let winner: Player | null = null;
        if (this.getFirstPlayer().mark.toString() === winMark) {
            winner = this.getFirstPlayer();
        } else if (this.getSecondPlayer().mark.toString() === winMark) {
            winner = this.getSecondPlayer();
        }

        return winner;
    }

    minimax(board: Array<Array<number>>, depth: number, player: Player, move?: { x: number, y: number }): { score: number, move?: { x: number, y: number } } {
        const winner = this.findWinner(board);
        const emptyCells = this.getEmptyCells(board);

        if (!emptyCells.length || winner) {
            if (winner === this.getSecondPlayer()) {
                return {score: 1, move};
            } else if (winner === this.getFirstPlayer()) {
                return {score: -1, move};
            } else {
                return {score: 0, move};
            }
        }

        let bestScore = player.isComputer ? -Infinity : Infinity;
        let bestMove: { x: number, y: number } | null = null;
        emptyCells.forEach(({x, y}) => {
            board[y][x] = player.mark.toInt();

            const nextPlayer = this.getFirstPlayer() === player ? this.getSecondPlayer() : this.getFirstPlayer();
            const move = {x, y};
            const {score} = this.minimax(board, depth + 1, nextPlayer, move);
            board[y][x] = 0;

            bestScore = player.isComputer ? Math.max(score, bestScore) : Math.min(score, bestScore);
            bestMove = !bestMove || (bestScore === score) ? move : bestMove;
        });

        if (null === bestMove) {
            throw new Error('Best move not found');
        }

        return {score: bestScore, move: bestMove};
    }

    gameIsOver(): boolean {
        return this.winner !== null || this.totalMoves >= MAX_MOVES;
    }
}

class App {
    game: TicTacToe;

    $gameModeForm: HTMLElement;
    $select1PlayerGameModeButton: HTMLElement;
    $select2PlayersGameModeButton: HTMLElement;
    $usernameForm: HTMLElement;
    $gameResultAlert: HTMLElement;
    $welcomeMessageAlert: HTMLElement;
    $restartGameButton: HTMLElement;
    $restartGameContainer: HTMLElement;
    $gameCells: NodeListOf<HTMLElement>;

    constructor() {
        this.$gameModeForm = document.getElementById('form__select_game_type') as HTMLElement;
        this.$select1PlayerGameModeButton = document.querySelector('.form__one_player_game') as HTMLElement;
        this.$select2PlayersGameModeButton = document.querySelector('.form__two_players_game') as HTMLElement;
        this.$usernameForm = document.getElementById('form__enter_player_name') as HTMLElement;
        this.$gameResultAlert = document.querySelector('.game__result') as HTMLElement;
        this.$welcomeMessageAlert = document.querySelector('.game__welcome_message') as HTMLElement;
        this.$restartGameButton = document.querySelector('.btn__start_over') as HTMLElement;
        this.$restartGameContainer = document.querySelector('.game__restart_game_wrapper') as HTMLElement;
        this.$gameCells = document.querySelectorAll('.game__cell');

        this.$select1PlayerGameModeButton.addEventListener('click', this.selectGameModeHandler.bind(this, GameModeEnum.onePlayer));
        this.$select2PlayersGameModeButton.addEventListener('click', this.selectGameModeHandler.bind(this, GameModeEnum.twoPlayer));
        this.$usernameForm.addEventListener('submit', this.startGameHandler.bind(this));
        this.$restartGameButton.addEventListener('click', this.restartGameHandler.bind(this));
        this.$gameCells.forEach(cell => cell.addEventListener('click', this.selectCellHandler.bind(this)));

        this.game = new TicTacToe(this.gameOverHandler, this.moveDoneHandler);
    }

    static init(): App {
        return new App();
    }

    moveDoneHandler(player: Player, x: number, y: number): void {
        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`) as HTMLElement | null;

        if (!cell) {
            throw new Error(`Element with x=${x} and y=${y} not found`);
        }

        cell.innerText = player.mark.toString();
        cell.classList.add('selected');
    }

    gameOverHandler(winner: Player | null): void {
        let message: string;
        if (winner) {
            message = `${winner.name} wins!`;
        } else {
            message = 'You have a draw!';
        }

        const $gameResultMessageEl = document.querySelector('.game__result') as HTMLElement;
        const $restartGameWrapperEl = document.querySelector('.game__restart_game_wrapper') as HTMLElement;

        $gameResultMessageEl.innerText = message;
        $gameResultMessageEl.classList.remove('hidden');
        $restartGameWrapperEl.classList.remove('hidden');
    }

    selectCellHandler(event: any): void {
        const cell = event.target as HTMLElement;
        if (cell.classList.contains('selected') || !this.game.isStarted) {
            return;
        }
        const x = cell.dataset.x;
        const y = cell.dataset.y;

        if (!x || !y) {
            throw new Error('Data attributes with cords not set in selected cell.');
        }

        this.game.move(+x, +y);
    }

    restartGameHandler(): void {
        this.$gameResultAlert.classList.add('hidden');
        this.$restartGameContainer.classList.add('hidden');

        this.$gameCells.forEach(cell => {
            cell.innerText = '';
            cell.classList.remove('selected');
        });

        this.game.getFirstPlayer().mark = new Mark(Math.random() > 0.5 ? MarkSymbolEnum.cross : MarkSymbolEnum.zero);
        this.game.getSecondPlayer().mark = new Mark(this.game.getFirstPlayer().mark.isZero() ? MarkSymbolEnum.cross : MarkSymbolEnum.zero);

        this.renderWelcomeMessage();

        this.game.start();
    }

    selectGameModeHandler(gameMode: GameModeEnum): void {
        this.game.mode = new GameMode(gameMode);

        this.$gameModeForm.classList.add('hidden');
        this.$usernameForm.classList.remove('hidden');

        const $playerNameInputEl = document.querySelector('.form__player2_name') as HTMLElement;
        if (this.game.mode.isOnePlayerGameMode()) {
            $playerNameInputEl.classList.add('hidden');
        } else {
            $playerNameInputEl.classList.remove('hidden');
        }
    }

    startGameHandler(event: any): void {
        event.preventDefault();

        if (!this.game.mode) {
            throw new Error('Game mode should be set before starting the game.');
        }

        const $username1El = this.$usernameForm.querySelector('[name="name1"]') as HTMLInputElement;
        const $username2El = this.$usernameForm.querySelector('[name="name2"]') as HTMLInputElement;
        const username1: string = $username1El.value.trim();
        const username2: string = this.game.mode.isOnePlayerGameMode() ? COMPUTER_USER_NAME : $username2El.value.trim();

        if ('' === username1) {
            return;
        }

        if (this.game.mode.isTwoPlayersGameMode() && '' === username2) {
            return;
        }

        const player1Mark: Mark = new Mark(Math.random() % 2 === 0 ? MarkSymbolEnum.cross : MarkSymbolEnum.zero);
        const player2Mark: Mark = new Mark(player1Mark.isZero() ? MarkSymbolEnum.cross : MarkSymbolEnum.zero);

        this.game.player1 = new Player(username1, player1Mark);
        this.game.player2 = new Player(username2, player2Mark, this.game.mode.isOnePlayerGameMode());

        this.renderWelcomeMessage();

        const $gameContainerEl = document.querySelector('.game__container') as HTMLElement;
        const $formWrapperEl = document.querySelector('.start-game-form-wrapper') as HTMLElement;

        $gameContainerEl.classList.remove('hidden');
        $formWrapperEl.classList.add('hidden');

        this.game.start();
    }

    renderWelcomeMessage(): void {
        if (!this.game.mode) {
            throw new Error('Game mode should be set before rendering the welcome message.');
        }

        let welcomeMessage: string = `Welcome, ${this.game.getFirstPlayer().name}! Let's play! <br> You are "${this.game.getFirstPlayer().mark}".`;
        if (this.game.mode.isTwoPlayersGameMode()) {
            welcomeMessage = `Welcome, ${this.game.getFirstPlayer().name} (${this.game.getFirstPlayer().mark}) and ${this.game.getSecondPlayer().name} (${this.game.getSecondPlayer().mark})! Let's play!`;
        }

        this.$welcomeMessageAlert.innerHTML = welcomeMessage;
        this.$welcomeMessageAlert.classList.remove('hidden');
    }
}

App.init();
