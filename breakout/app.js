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

function drawBrick(brick) {
    context.beginPath();
    context.rect(
        brick.x,
        brick.y,
        brick.width,
        brick.height
    );
    context.fill();
    context.closePath();
}

function drawBricks(bricks) {
    bricks.forEach((brick) => drawBrick(brick));
}

function drawFood(food){
    context.beginPath();
    context.arc(
        food.x,
        food.y,
        food.radius,
        0,
        Math.PI * 2
    );
    context.fill();
    context.closePath();
}

function drawFoods(foods) {
    foods.forEach((food) => drawFood(food));
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

/* Player */
const paddle$ = ticker$
    .withLatestFrom(input$)
    .scan((position, [ticker, direction]) => {
        var bricks = INITIAL_OBJECTS.bricks;

        let next_x = position.x + direction.horizontal * ticker.deltaTime * PADDLE_SPEED;
        let next_y = position.y + direction.vertical * ticker.deltaTime * PADDLE_SPEED;
        let next_position = {
            x:Math.max(Math.min(next_x, canvas.width - PADDLE_WIDTH / 2), PADDLE_WIDTH / 2), 
            y:Math.max(Math.min(next_y, canvas.height), PADDLE_HEIGHT)
        };

        var conflict = false;
        bricks.forEach((brick)=>{
            if (collision(brick,next_position)) {
                conflict = true;
            }
        });

        if (conflict) {
            return position;
        }

        return next_position;

    }, {x:canvas.width / 2, y:canvas.height/2})
    .distinctUntilChanged();

/* Objects */
const INITIAL_OBJECTS = {
    foods: food_factory(),
    bricks: factory(),
    score: 0
};

const objects$ = ticker$
    .withLatestFrom(paddle$)
    .scan(({foods, bricks, collisions, score}, [ticker, paddle]) => {

        let survivors = [];
        collisions = {
            paddle: false,
            floor: false,
            wall: false,
            ceiling: false,
            brick: false,
            food: false
        };

        // Politica de eliminar bricks
        //bricks.forEach((brick) => {
        //    if (!collision(brick, ball)) {
        //        survivors.push(brick);
        //    } else {
        //        collisions.brick = true;
        //        score = score + 10;
        //    }
        //});

        foods.forEach((food) => {
            console.log(paddle.x, food.x)
            if(!food_collision(food, paddle)) {
                survivors.push(food);
            } else {
                score = score + 10;
            }
        });

        return {
            foods: survivors,
            bricks: bricks,
            collisions: collisions,
            score: score
        };

    }, INITIAL_OBJECTS);


/* Bricks */

function factory() {
    let bricks = [];
    let width = 45;
    let height = 45;

    for (let i = 0; i < 11; i++) {
        bricks.push({
            x: 50 * i,
            y:0,
            width:width,
            height:height
        });

        bricks.push({
            x: 50 * i,
            y: 500,
            width:width,
            height:height
        })
    };

    for (let i = 0; i < 9; i++) {
        bricks.push({
            x: 0,
            y:50+50*i,
            width:width,
            height:height
        });
        bricks.push({
            x: 500,
            y:50+50*i,
            width:width,
            height:height
        });
    };

    [1,2,4,5,6,8,9].forEach((i) => {
        bricks.push({
            x: 50,
            y: 50*i,
            width:width,
            height:height
        });

        bricks.push({
            x: 450,
            y: 50*i,
            width:width,
            height:height
        });
    });

    [2,3,4,6,7,8].forEach((i) => {
        bricks.push({
            x: 150,
            y: 50*i,
            width:width,
            height:height
        });

        bricks.push({
            x: 350,
            y: 50*i,
            width:width,
            height:height
        });
    });

    [1,2,3,7,8,9].forEach((i) => {
        bricks.push({
            x: 250,
            y: 50*i,
            width:width,
            height:height
        });

    });

    return bricks;
}

/*Food*/
function food_factory() {
    let foods = [];
    let radius = 10;
    for (let i = 0; i < 10; i++) {
        [2,4,6,8].forEach((j) => {
            foods.push({
                x: 50*j + 25,
                y: 50*i + 25,
                radius: radius
            });
        })
        
    }

    return foods;
}

function collision(brick, position) {
    //console.log(position.x, brick.x)
    return position.x  > brick.x - brick.width /2
        && position.x  < brick.x + brick.width + PADDLE_WIDTH/ 2
        && position.y  > brick.y
        && position.y  < brick.y + brick.height + PADDLE_HEIGHT;
}

function food_collision(food, paddle){
    let dist_x = Math.abs(food.x - paddle.x);
    let dist_y = Math.abs(food.y - paddle.y)
    if (dist_x < 35 && dist_y < 35) {
        return true
    }
    return false
}

/* Game */

drawTitle();
drawControls();
drawAuthor();

function update([ticker, paddle, objects]) {

    context.clearRect(0, 0, canvas.width, canvas.height);

    drawPaddle(paddle);
    drawBricks(objects.bricks);
    drawFoods(objects.foods);
    drawScore(objects.score);

    //if (objects.ball.position.y > canvas.height - BALL_RADIUS) {
    //    drawGameOver('GAME OVER');
    //    game.dispose();
    //}

    //if (!objects.bricks.length) {
    //    drawGameOver('CONGRATULATIONS');
    //    game.dispose();
    //}
}

const game = Rx.Observable
    .combineLatest(ticker$, paddle$, objects$)
    .sample(TICKER_INTERVAL)
    .subscribe(update);
