import MovingDirection from "./MovingDirection.js";
import Rotation from "./Rotation.js";

export default class Pacman {
  constructor(x, y, tileSize, velocity, tileMap) {
    this.x = x;
    this.y = y;
    this.tileSize = tileSize;
    this.velocity = velocity;
    this.tileMap = tileMap;

    this.currentMovingDirection = null;
    this.requestedMotvingDirection = null;

    this.pacmanRotation = Rotation.right;

    this.wakaSound = new Audio("./sounds/waka.wav");

    this.powerDotSound = new Audio("./sounds/power_dot.wav");
    this.powerDotActive = false;
    this.powerDotAboutToExpire = false;
    this.timers = [];

    this.eatGhostSound = new Audio("./sounds/eat_ghost.wav");

    this.pacmanAnimationTimerDefault = 10;
    this.pacmanAnimationTimer = null;

    this.madeFirstMove = false;

    document.addEventListener("keydown", this.#keydown);

    this.#loadPacmanImages();
  }

  draw(ctx, pause, enemies, mspacman) {
    if (!pause) {
      this.#move();
      this.#animate();
    }
    this.#eatDot();
    this.#eatPowerDot(mspacman);
    this.#eatGhost(enemies);
    const size = this.tileSize / 2;

    ctx.save();
    ctx.translate(this.x + size, this.y + size);
    ctx.rotate((this, this.pacmanRotation * 90 * Math.PI) / 180);
    ctx.drawImage(
      this.pacmanImages[this.pacmanImageIndex],
      -size,
      -size,
      this.tileSize,
      this.tileSize
    );

    ctx.restore();
  }

  #loadPacmanImages() {
    const pacmanImage0 = new Image();
    pacmanImage0.src = "./images/pac0.png";

    const pacmanImage1 = new Image();
    pacmanImage1.src = "./images/pac1.png";

    const pacmanImage2 = new Image();
    pacmanImage2.src = "./images/pac2.png";

    const pacmanImage3 = new Image();
    pacmanImage3.src = "./images/pac1.png";

    this.pacmanImages = [
      pacmanImage0,
      pacmanImage1,
      pacmanImage2,
      pacmanImage3,
    ];

    this.pacmanImageIndex = 0;
  }

  #keydown = (event) => {
    //up
    if (event.keyCode == 38) {
      if (this.currentMovingDirection == MovingDirection.down) {
        this.currentMovingDirection == MovingDirection.up;
      }
      this.requestedMotvingDirection = MovingDirection.up;
      this.madeFirstMove = true;
    }
    //down
    if (event.keyCode == 40) {
      if (this.currentMovingDirection == MovingDirection.up) {
        this.currentMovingDirection == MovingDirection.down;
      }
      this.requestedMotvingDirection = MovingDirection.down;
      this.madeFirstMove = true;
    }
    //left
    if (event.keyCode == 37) {
      if (this.currentMovingDirection == MovingDirection.right) {
        this.currentMovingDirection == MovingDirection.left;
      }
      this.requestedMotvingDirection = MovingDirection.left;
      this.madeFirstMove = true;
    }
    //right
    if (event.keyCode == 39) {
      if (this.currentMovingDirection == MovingDirection.left) {
        this.currentMovingDirection == MovingDirection.right;
      }
      this.requestedMotvingDirection = MovingDirection.right;
      this.madeFirstMove = true;
    }
  };

  #move() {
    if (this.currentMovingDirection != this.requestedMotvingDirection) {
      if (
        Number.isInteger(this.x / this.tileSize) &&
        Number.isInteger(this.y / this.tileSize)
      ) {
        if (
          !this.tileMap.didCollideWithEnviroment(
            this.x,
            this.y,
            this.requestedMotvingDirection
          )
        ) {
          this.currentMovingDirection = this.requestedMotvingDirection;
        }
      }
    }

    if (
      this.tileMap.didCollideWithEnviroment(
        this.x,
        this.y,
        this.currentMovingDirection
      )
    ) {
      this.pacmanAnimationTimer = null;
      this.pacmanImageIndex = 1;
      return;
    } else if (
      this.currentMovingDirection != null &&
      this.pacmanAnimationTimer == null
    ) {
      this.pacmanAnimationTimer = this.pacmanAnimationTimerDefault;
    }

    switch (this.currentMovingDirection) {
      case MovingDirection.up:
        this.y -= this.velocity;
        this.pacmanRotation = Rotation.up;
        break;
      case MovingDirection.down:
        this.y += this.velocity;
        this.pacmanRotation = Rotation.down;
        break;
      case MovingDirection.left:
        this.x -= this.velocity;
        this.pacmanRotation = Rotation.left;
        break;
      case MovingDirection.right:
        this.x += this.velocity;
        this.pacmanRotation = Rotation.right;
        break;
    }
  }

  #animate() {
    if (this.pacmanAnimationTimer == null) {
      return;
    }
    this.pacmanAnimationTimer--;
    if (this.pacmanAnimationTimer == 0) {
      this.pacmanAnimationTimer = this.pacmanAnimationTimerDefault;
      this.pacmanImageIndex++;
      if (this.pacmanImageIndex == this.pacmanImages.length) {
        this.pacmanImageIndex = 0;
      }
    }
  }

  #eatDot() {
    if (this.tileMap.eatDot(this.x, this.y) && this.madeFirstMove) {
      this.wakaSound.play();
    }
  }

  #eatGhost(enemies) {
    if (this.powerDotActive) {
      const collideEnemies = enemies.filter((enemy) => enemy.collideWith(this));
      collideEnemies.forEach((enemy) => {
        enemies.splice(enemies.indexOf(enemy), 1);
        this.eatGhostSound.play();
      });
    }
  }

  #eatPowerDot(mspacman) {
    if (this.tileMap.eatPowerDot(this.x, this.y)) {
      this.powerDotSound.play();
      this.powerDotActive = true;
      mspacman.powerDotActive = true;

      this.powerDotAboutToExpire = false;
      mspacman.powerDotAboutToExpire = false;
      this.timers.forEach((timer) => clearTimeout(timer));
      mspacman.timers.forEach((timer) => clearTimeout(timer));
      this.timer = [];
      mspacman.timer = [];

      let powerDotTimer = setTimeout(() => {
        this.powerDotActive = false;
        mspacman.powerDotActive = false;

        this.powerDotAboutToExpire = false;
        mspacman.powerDotAboutToExpire = false;
      }, 1000 * 6);

      this.timers.push(powerDotTimer);
      mspacman.timers.push(powerDotTimer);

      let powerDotAboutToExpireTimer = setTimeout(() => {
        this.powerDotAboutToExpire = true;
        mspacman.powerDotAboutToExpire = true;
      }, 1000 * 3);

      this.timers.push(powerDotAboutToExpireTimer);
      mspacman.timers.push(powerDotAboutToExpireTimer);
    }
  }
}
