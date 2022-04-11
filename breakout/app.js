import Rx from 'rx';


/* Graphics */

const canvas = document.getElementById('stage');
const context = canvas.getContext('2d');
context.fillStyle = 'pink';

const PADDLE_WIDTH = 50;
const PADDLE_HEIGHT = 50;

const BALL_RADIUS = 10;

const BRICK_ROWS = 5;
const BRICK_COLUMNS = 7;
const BRICK_HEIGHT = 50;
const BRICK_GAP = 3;

function drawTitle() {
    context.textAlign = 'center';
    context.font = '24px Courier New';
    context.fillText('rxjs breakout', canvas.width / 2, canvas.height / 2 - 24);
}

function drawControls() {
    context.textAlign = 'center';
    context.font = '16px Courier New';
    context.fillText('presione cualquier tecla para empezar', canvas.width / 2, canvas.height / 2);
}

function drawGameOver(text) {
    context.clearRect(canvas.width / 4, canvas.height / 3, canvas.width / 2, canvas.height / 3);
    context.textAlign = 'center';
    context.font = '24px Courier New';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
}

function drawAuthor() {
    context.textAlign = 'center';
    context.font = '12px Courier New';
    context.fillText('by Manuel Wieser edited by Jose Luco', canvas.width / 2, canvas.height / 2 + 24);
}

function drawScore(score) {
    context.textAlign = 'left';
    context.font = '16px Courier New';
    context.fillText(score, BRICK_GAP, 16);
}

function drawPaddle(position) {
    context.beginPath();
    context.arc(
        position.x,
        position.y - PADDLE_HEIGHT/2,
        PADDLE_WIDTH/2,
        0,
        Math.PI * 2
    );
    context.fill();
    context.closePath();
}

function drawBall(ball) {
    context.beginPath();
    context.arc(ball.position.x, ball.position.y, BALL_RADIUS, 0, Math.PI * 2);
    context.fill();
    context.closePath();
}

function drawBrick(brick) {
    context.beginPath();
    context.rect(
        brick.x - brick.width / 2,
        brick.y - brick.height / 2,
        brick.width,
        brick.height
    );
    context.fill();
    context.closePath();
}

function drawBricks(bricks) {
    bricks.forEach((brick) => drawBrick(brick));
}


/* Ticker */

const TICKER_INTERVAL = 17;

const ticker$ = Rx.Observable
    .interval(TICKER_INTERVAL, Rx.Scheduler.requestAnimationFrame)
    .map(() => ({
        time: Date.now(),
        deltaTime: null
    }))
    .scan(
        (previous, current) => ({
            time: current.time,
            deltaTime: (current.time - previous.time) / 1000
        })
    );


/* Paddle */

const PADDLE_SPEED = 240;
const PADDLE_KEYS = {
    left: 37,
    up: 38,
    right: 39,
    down: 40
};

const input$ = Rx.Observable
    .merge(
        Rx.Observable.fromEvent(document, 'keydown', event => {
            switch (event.keyCode) {
                case PADDLE_KEYS.left:
                    return {vertical: 0, horizontal: -1};
                case PADDLE_KEYS.up:
                    return {vertical: -1, horizontal: 0};
                case PADDLE_KEYS.right:
                    return {vertical: 0, horizontal: 1};
                case PADDLE_KEYS.down:
                    return {vertical: 1, horizontal: 0};
                default:
                    return {vertical:0, horizontal: 0};
            }
        }),
        Rx.Observable.fromEvent(document, 'keyup', event => {
            return {vertical: 0, horizontal: 0};
        })
    )
    .distinctUntilChanged();

const paddle$ = ticker$
    .withLatestFrom(input$)
    .scan((position, [ticker, direction]) => {


        let next_x = position.x + direction.horizontal * ticker.deltaTime * PADDLE_SPEED;
        let next_y = position.y + direction.vertical * ticker.deltaTime * PADDLE_SPEED;
        return {
            x:Math.max(Math.min(next_x, canvas.width - PADDLE_WIDTH / 2), PADDLE_WIDTH / 2), 
            y:Math.max(Math.min(next_y, canvas.height), PADDLE_HEIGHT)
        };

    }, {x:canvas.width / 2, y:canvas.height})
    .distinctUntilChanged();


/* Ball */

const BALL_SPEED = 60;
const INITIAL_OBJECTS = {
    ball: {
        position: {
            x: canvas.width / 2,
            y: canvas.height / 2
        },
        direction: {
            x: 2,
            y: 2
        }
    },
    bricks: factory(),
    score: 0
};

function hit(paddle, ball) {
    return ball.position.x > paddle.x - PADDLE_WIDTH / 2
        && ball.position.x < paddle.x + PADDLE_WIDTH / 2
        && ball.position.y > canvas.height - PADDLE_HEIGHT - BALL_RADIUS / 2;
}

const objects$ = ticker$
    .withLatestFrom(paddle$)
    .scan(({ball, bricks, collisions, score}, [ticker, paddle]) => {

        let survivors = [];
        collisions = {
            paddle: false,
            floor: false,
            wall: false,
            ceiling: false,
            brick: false
        };

        ball.position.x = ball.position.x + ball.direction.x * ticker.deltaTime * BALL_SPEED;
        ball.position.y = ball.position.y + ball.direction.y * ticker.deltaTime * BALL_SPEED;

        bricks.forEach((brick) => {
            if (!collision(brick, ball)) {
                survivors.push(brick);
            } else {
                collisions.brick = true;
                score = score + 10;
            }
        });

        collisions.paddle = hit(paddle, ball);

        if (ball.position.x < BALL_RADIUS || ball.position.x > canvas.width - BALL_RADIUS) {
            ball.direction.x = -ball.direction.x;
            collisions.wall = true;
        }

        collisions.ceiling = ball.position.y < BALL_RADIUS;

        if (collisions.brick || collisions.paddle || collisions.ceiling ) {
            ball.direction.y = -ball.direction.y;
        }

        return {
            ball: ball,
            bricks: survivors,
            collisions: collisions,
            score: score
        };

    }, INITIAL_OBJECTS);


/* Bricks */

function factory() {
    let width = (canvas.width)/ 10;
    let bricks = [];

    //for (let i = 0; i < BRICK_ROWS; i++) {
    //    for (let j = 0; j < BRICK_COLUMNS; j++) {
    //        bricks.push({
    //            x: j * (width + BRICK_GAP) + width / 2 + BRICK_GAP,
    //            y: i * (BRICK_HEIGHT + BRICK_GAP) + BRICK_HEIGHT / 2 + BRICK_GAP + 20,
    //            width: width,
    //            height: BRICK_HEIGHT
    //        });
    //    }
    //}

    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            bricks.push({
                
            })
        }
        
    }

    return bricks;
}

function collision(brick, ball) {
    return ball.position.x + ball.direction.x > brick.x - brick.width / 2
        && ball.position.x + ball.direction.x < brick.x + brick.width / 2
        && ball.position.y + ball.direction.y > brick.y - brick.height / 2
        && ball.position.y + ball.direction.y < brick.y + brick.height / 2;
}


/* Game */

drawTitle();
drawControls();
drawAuthor();

function update([ticker, paddle, objects]) {

    context.clearRect(0, 0, canvas.width, canvas.height);

    drawPaddle(paddle);
    drawBall(objects.ball);
    drawBricks(objects.bricks);
    drawScore(objects.score);

    //if (objects.ball.position.y > canvas.height - BALL_RADIUS) {
    //    drawGameOver('GAME OVER');
    //    game.dispose();
    //}

    if (!objects.bricks.length) {
        drawGameOver('CONGRATULATIONS');
        game.dispose();
    }
}

const game = Rx.Observable
    .combineLatest(ticker$, paddle$, objects$)
    .sample(TICKER_INTERVAL)
    .subscribe(update);
