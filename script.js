// ************************* SETUP *************************
const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight; 

// ************************* GLOBALS *************************
var frameCount = 0;
var blockSize = 48; // size of all general tiles
var level = 0;
var loadTime = 0;
const pxSize = 4;

// camera positions
var camX;
var camY;

// used to store levels
var levels;

var players = [];
var enemys = [];
var grounds = [];
var lavas = [];
var ports = [];

var objects = [players, grounds, enemys];

// used to detect collision betwen two objects
function collide(obj1, obj2) {
    return obj1.x - obj2.x < obj2.width && obj2.x - obj1.x < obj1.width && obj1.y - obj2.y < obj2.height && obj2.y - obj1.y < obj1.height;
}

// store key presses
const keys = {
    right: {
        pressed: false
    },
    left: {
        pressed: false
    },
    up: {
        pressed: false
    },
    down: {
        pressed: false
    },
    shoot: {
        pressed: true
    },
    strike: {
        pressed: false
    }
}

// FX
var Fx = function(type, x, y, direction, line) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.index = 0;
    this.dead = false;
    this.dustImg1 = new Image();
    this.dustImg1.src = 'assets/dustFX.png';
    this.imgWidth = 0;
    this.imgHeight = 0;
    this.index = 0;
    this.line = line;
    this.scaledSize = 3;
    this.direction = direction;
};
Fx.prototype.draw = function() {
    switch(this.type) {
        case 'horizontalDust':
            this.imgWidth = 7;
            this.imgHeight = 7;
            c.save();
            c.translate(this.x, this.y);
            c.scale(this.direction, 1)
            c.drawImage(this.dustImg1, this.index * this.imgWidth, this.line * this.imgHeight, this.imgWidth, this.imgHeight, 0, 0, this.imgWidth * this.scaledSize, this.imgHeight * this.scaledSize);
            c.restore();

            if (frameCount % 4 === 0) {
                this.index = (this.index + 1);
            }
            this.x += 2 * this.direction;
            this.y -= 1;

            if (this.index === 5) {
                this.dead = true;
            }
            break;
        case 'landingDust':
            this.imgWidth = 7;
            this.imgHeight = 6;
            c.save();
            c.translate(this.x, this.y);
            c.scale(-this.direction, 1)
            c.drawImage(this.dustImg1, this.index * this.imgWidth, this.line * this.imgHeight, this.imgWidth, this.imgHeight, 0, 0, this.imgWidth * this.scaledSize, this.imgHeight * this.scaledSize);
            c.restore();

            if (frameCount % 4 === 0) {
                this.index = (this.index + 1);
            }
            this.x += 1 * this.direction;
            this.y -= 2;

            if (this.index === 5) {
                this.dead = true;
            }
            break;
    }
};

var effects = [];

// ************************* OBJECT CLASSES *************************

// player
var Player = function(x, y, width, height) {
    this.x = x; // x position
    this.y = y; // y position
    this.width = width; // width
    this.height = height; // height
    this.xVel = 0; // x velocity
    this.yVel = 0; // y velocity
    this.acceleration = 0.7; // x acceleration
    this.friction = 0.95;
    this.maxSpeed = 8; // maximum x speed
    this.gravity = 1; // gravity
    this.jumpHeight = 17.5; // max jump height (higher number, the higher the player can jump)
    this.canJump = false; // determines whether the player can jump at a certain instance
    this.dead = false; // determines whether the player is dead or not
    this.playerImg = new Image(); // create new image instance
    this.playerImg.src = 'assets/playerSheet.png';  // assign the source  (https://i.ibb.co/HCnbKHC/rabbit.png)
    this.currentSprite = this.playerImg; // create a current sprite that can be changed
    this.index = 4; // sprite loop index 
    this.line = 0; // y crop on the sprite
    this.slide = 7; // wall slide index
    this.wallJump = true; // used in wall jump, determines whether player can, in fact, wall jump, or not.
    this.kickBack = 4; // used in wall jumping, how far the player can kick off of the wall
    this.runLength = 8; // length of run loop for sprite
    this.loopSpeed = 4; // speed images loop at (the larger the number, the slower the loop)
    this.direction = -1; // direction player is facing (1 || -1 ONLY)
    this.imgWidth = 35; // image width (used for crop)
    this.imgHeight = 40; // image height (used for crop)
    this.scaledSize = 3; // used to rescale the sprite
    this.attacking = false; // attacking or not
    this.longJumpTime = 0;  
    this.animate = false; // whether the program loops through sprites or not
    this.changeDirection = 0;
    this.changeTime = 3;
    this.changeBool = false;
};
Player.prototype.update = function() {
    if (!this.dead) {
        // if (this.changeBool) {
        //     this.changeDirection ++;
        // }

        // if (this.changeDirection < this.changeTime) {
        //     this.index = 9;
        //     this.line = 1;
        //     this.loopSpeed = 0;
        // }else if (this.changeDirection >= this.changeTime) {
        //     this.direction *= -1;
        //     this.changeBool = false;
        //     this.changeDirection = 0;
        // }

        // move along the x if key events are true
        if (keys.left.pressed) {
            // if (this.direction === 1) {
            //     this.changeBool = true;
            // }else {
            //     this.index = 9;
            // }

            this.direction = -1;
            
            if (!this.wallJump && this.xVel <= 0 && !this.changeBool) {
                this.runLength = 8;

                // remove any glitching between sprite line transition (some animations are longer than others)
                if (this.index > 8 && !this.changeBool) {
                    this.index = 0;
                }
                if (this.canJump) {
                    this.line = 1;
                    // draw dust particles
                    if (frameCount % 30 === 0) {
                        effects.push(new Fx('horizontalDust', this.x + this.imgWidth / 2, this.y + this.height - 15, -1, 0));
                    }else if (frameCount % 30 === 15) {
                        effects.push(new Fx('horizontalDust', this.x + this.imgWidth, this.y + this.height - 15, 1, 1));
                    }
                }
            }

            if (this.xVel > -this.maxSpeed) {
                this.xVel -= this.acceleration;
            }
        }
        if (keys.right.pressed) {
            // if (this.direction === -1) {
            //     this.changeBool = true;
            // }
            this.direction = 1;

            // remove any glitching between sprite line transition (some animations are longer than others)
            if (!this.wallJump && !this.changeBool) {
                this.runLength = 8;
                
                // remove any glitching between sprite line transition (some animations are longer than others)
                if (this.index > 8 && !this.changeBool) {
                    this.index = 0;
                }
                if (this.canJump) {
                    this.line = 1;
                    // draw dust particles
                    if (frameCount % 30 === 0) {
                        effects.push(new Fx('horizontalDust', this.x + this.imgWidth / 2, this.y + this.height - 15, -1, 0));
                    }else if (frameCount % 30 === 15) {
                        effects.push(new Fx('horizontalDust', this.x + this.imgWidth, this.y + this.height - 15, 1, 1));
                    }
                }
            }

            if (this.xVel < this.maxSpeed) {
                this.xVel += this.acceleration
            }
        }
        if (!keys.left.pressed && !keys.right.pressed) { 
            this.xVel *= 0.7;
            if (this.xVel > -0.0005 && this.xVel < 0.0005) {
                this.xVel = 0;
            }
            
            this.runLength = 18;
            this.line = 0;
        }

        // jump
        if (keys.up.pressed && this.canJump ) {
            // remove any glitching between sprite line transition (some animations are longer than others)
            if (this.index > 8) {
                this.index = 0;
            }
            
            this.index = 1;
            this.yVel = -this.jumpHeight;
            this.canJump = false;
        }

        // change sprites when jumping/falling
        if (!this.canJump && !this.wallJump) {
            if (this.yVel > -16 && this.yVel < -15) {
                this.index = 1;
            }else if (this.yVel > -12 && this.yVel <= -7) { 
                this.index = 2;
            }else if (this.yVel > -7 && this.yVel <= -4) { 
                this.index = 3;
            }else if (this.yVel > -3 && this.yVel <= 2) { 
                this.index = 4;
            }else if (this.yVel > 2 && this.yVel <= 4) { 
                this.index = 5;
            }else if (this.yVel > 6 && this.yVel <= 8) { 
                this.index = 6;
            }else if (this.yVel > 8 && this.yVel <= 15) { 
                this.index = 7;
            }

            // jump conditional (jumping forward .vs jumping while idle (or very little movement))
            if (this.xVel < 2 && this.xVel > -2) {
                this.line = 2;
                if (this.index >= 7) {
                    this.index = 7;
                }
            }else {
                this.line = 3;
                if (this.index >= 7) {
                    this.index = 7;
                }
            }
        }else {
            // animate sprites
            if (this.yVel >= 0) {
                if (frameCount % this.loopSpeed === 0) {
                    this.index = (this.index + 1) % this.runLength;
                }
            }
        }
        
        if (this.yVel > 1 && this.canJump) {
            this.line = 2;
            this.loopSpeed = 2;
            if (this.index >= 7) {
                this.index = 7;
            }
        }else {
            this.loopSpeed = 4;
            this.runLength = 18; 

        }

        this.x += this.xVel; // update x by x velocity
        this.collide(grounds, this.xVel, 0); // y collisions
    }
    this.y += this.yVel; //update y by y velocity
    this.collide(grounds, 0, this.yVel); // y collisions
    this.yVel += this.gravity; // update y velocity by gravity

    // for long jump wall-kicking
    if (this.longJumpTime > 0) {
        this.longJumpTime --;
    }else {
        this.kickBack = 6;
    }

    if (this.longJumpTime > 0 && this.direction === 1 && this.xVel > 0) {
        this.wallJump = false;
        if (keys.up.pressed) {
            this.kickBack = 10;
            this.xVel = this.kickBack;
            this.yVel = -this.jumpHeight + 2;
            this.longJumpTime = 0;
            this.kickBack = 4;
        }
    }else if (this.longJumpTime > 0 && this.direction === -1 && this.xVel < 0) {
        this.wallJump = false;
        if (keys.up.pressed) {
            this.kickBack = -10;
            this.xVel = this.kickBack;
            this.yVel = -this.jumpHeight + 2;
            this.longJumpTime = 0;
        }
    }

    if (this.xVel > this.maxSpeed || this.xVel < -this.maxSpeed) {
        this.xVel *= this.friction;
    }

    if (this.yVel > 1) {
        this.canJump = false;
    }
};
Player.prototype.collide = function(obj, xVel, yVel) {
    for (var i = 0; i < obj.length; i ++) {
        if (collide(this, obj[i]) && this.dead === false) {
            if (xVel < 0) {
                this.longJumpTime = 9;
                this.xVel = 0;
                this.x = obj[i].x + obj[i].width;

                if (keys.up.pressed && this.wallJump) {
                    this.index = 0;
                    this.line = 4;   
                    this.yVel = -this.jumpHeight + 2;
                    this.xVel = this.kickBack * -this.direction;
                    this.wallJump = false;
                }
                if (!keys.up.pressed) { 
                    // remove any glitching between sprite line transition (some animations are longer than others)
                    if (this.index > 6) {
                        this.index = 0;
                    }  
                    
                    this.wallJump = true;
                    if (this.xVel >= 0 && !this.canJump) {
                        this.line = 4;
                        this.runLength = 6;
                        
                    }else this.canJump = false; 

                    this.yVel = 2.5;
                }
            }
            if (xVel > 0) {
                this.longJumpTime = 10;
                this.xVel = 0;
                this.x = obj[i].x - this.width;

                if (keys.up.pressed && this.wallJump) {  
                    this.index = 0; 
                    this.line = 4;   
                    this.yVel = -this.jumpHeight + 2;
                    this.xVel = this.kickBack * -this.direction;
                    this.wallJump = false;
                }
                if (!keys.up.pressed) {  
                    // remove any glitching between sprite line transition (some animations are longer than others)
                    if (this.index > 6) {
                        this.index = 0;
                    } 

                    this.wallJump = true;
                    if (this.xVel >= 0 && !this.canJump) {
                        this.line = 4;
                        this.runLength = 6;
                    }else this.canJump = false;

                    this.yVel = 2.5;
                }
            }

            if (yVel < 0) {
                this.yVel = 0;
                this.canJump = false;
                this.wallJump = false;
                this.y = obj[i].y + obj[i].height;
            }
            
            if (yVel > 0) {
                this.longJumpTime = 0;
                this.kickBack = 4;
                this.yVel = 0;
                if (!this.canJump) {
                    if (!this.wallJump) {
                        effects.push(new Fx('landingDust', this.x + this.imgWidth + 5, this.y + this.height - 21, 1, 2));
                        effects.push(new Fx('landingDust', this.x - this.imgWidth / 2 - 3, this.y + this.height - 20, -1, 2));
                        effects.push(new Fx('landingDust', this.x + this.imgWidth, this.y + this.height - 20, 1, 2));
                        effects.push(new Fx('landingDust', this.x - this.imgWidth / 2, this.y + this.height - 25, -1, 2));
                        effects.push(new Fx('landingDust', this.x + this.imgWidth - 10, this.y + this.height - 20, 1, 3));
                        effects.push(new Fx('landingDust', this.x - this.imgWidth / 2, this.y + this.height - 24, -1, 2));
                        effects.push(new Fx('landingDust', this.x + this.imgWidth + 4, this.y + this.height - 22, 1, 3));
                    }
                    this.canJump = true;
                }
                this.wallJump = false;
                this.y = obj[i].y - this.height;

                // if (this.y === obj[i].y - this.height && obj[i].type === 1) {
                //     obj[i].type = 5;
                // }else {
                //     obj[i].type = 1;
                // }
                obj[i].stoodOn = true;
            }
        }else obj[i].stoodOn = false;
    }
};
Player.prototype.draw = function() {
    c.save();
    c.translate(this.x + this.imgWidth / 2 - pxSize, this.y - pxSize - (this.imgHeight * this.scaledSize) / 1.86);
    c.scale(this.direction, 1)
    c.drawImage(this.currentSprite, this.index * this.imgWidth, this.line * this.imgHeight, this.imgWidth, this.imgHeight, -(this.imgWidth * this.scaledSize) / 2, blockSize + 4, this.imgWidth * this.scaledSize, this.imgHeight * this.scaledSize);
    c.restore();
};

players.add = function(x, y, w, h) {
    this.push(new Player(x, y, w, h));
};
players.create = function() {
    for (var i = 0; i < this.length; i ++) {
        this[i].update();
        this[i].draw();
    }
};

// solid ground
var Ground = function(x, y, width, height, type) {
    this.collisionOffset = 5;
    this.x = x + this.collisionOffset;
    this.y = y;
    this.width = width - this.collisionOffset;
    this.height = height;
    this.type = type;
    this.image = new Image();
    this.image.src = 'assets/tilemap.png';
    this.column = 0; // column index
    this.row = 0; // row index
    this.spacing = 0; // tile separation
    this.scaledSize = 3;
    this.tileSize = 16;
    this.stoodOn = false;
    this.reformTime = 0;
};  
Ground.prototype.draw = function() {
    c.save();
    c.translate(this.x - this.collisionOffset / 2, this.y)
    c.scale(this.scaledSize, this.scaledSize);

    // select tile image based off of type
    switch (this.type) {
        case 0: 
            this.column = 0;
            this.row = 0;
            break;
        case 1: 
            this.column = 1;
            this.row = 0;
            break;
        case 2: 
            this.column = 2;
            this.row = 0;
            break;
        case 3: 
            this.column = 0;
            this.row = 1;       
            break;
        case 4: 
            this.column = 1;
            this.row = 1;
            break;
        case 5: 
            this.column = 2;
            this.row = 1;
            break;
        case 6: 
            this.column = 0;
            this.row = 2;
            break;
        case 7: 
            this.column = 1;
            this.row = 2;
            break;
        case 8: 
            this.column = 2;
            this.row = 2;
            break;
        case 9: 
            this.column = 3;
            this.row = 3;
            break;
        case 10: 
            this.column = 3;
            this.row = 2;
            break;
        case 11: 
            this.column = 3;
            this.row = 0;
            break;
        case 12: 
            this.column = 1;
            this.row = 3;
            break;
        case 13: 
            this.column = 2;
            this.row = 3;
            break;
        case 14: 
            this.column = 0;
            this.row = 3;
            break;
        case 15: 
            this.column = 3;
            this.row = 1;
            break;
        case 16: 
            this.column = 4;
            this.row = 2;
            break;
        case 'left_corner': 
            this.column = 4;
            this.row = 1;
            break;
        case 'right_corner': 
            this.column = 4;
            this.row = 0;
            break;
        case 'mid_center_corner': 
            this.column = 4;
            this.row = 2;
            break;
        case 'lower_right_corner': 
            this.column = 3;
            this.row = 4;
            break;
        case 'lower_left_corner': 
            this.column = 2;
            this.row = 4;
            break;
        case 'bottom_double_corner': 
            this.column = 5;
            this.row = 0;
            break;
    }

    // tile
    c.drawImage(this.image, this.column * (this.tileSize + this.spacing), this.row * (this.tileSize + this.spacing), 16, 16, 0, 0, 16, 16);

    // draw upper grass tiles
    if (this.type === 1 || this.type === 12 || this.type === 16) {
        this.column = 5;
        this.row = 1;
        c.drawImage(this.image, this.column * (this.tileSize + this.spacing), this.row * (this.tileSize + this.spacing), 16, 16, 0, -16, 16, 16);
    }else if (this.type === 0 || this.type === 14) {
        this.column = 5;
        this.row = 2;
        c.drawImage(this.image, this.column * (this.tileSize + this.spacing), this.row * (this.tileSize + this.spacing), 16, 16, 0, -16, 16, 16);
    }else if (this.type === 2 || this.type === 13) {
        this.column = 5;
        this.row = 3;
        c.drawImage(this.image, this.column * (this.tileSize + this.spacing), this.row * (this.tileSize + this.spacing), 16, 16, 0, -16, 16, 16);
    }else if (this.type === 2) {
        this.column = 5;
        this.row = 3;
        c.drawImage(this.image, this.column * (this.tileSize + this.spacing), this.row * (this.tileSize + this.spacing), 16, 16, 0, -16, 16, 16);
    }else if (this.type === 15) {
        this.column = 5;
        this.row = 4;
        c.drawImage(this.image, this.column * (this.tileSize + this.spacing), this.row * (this.tileSize + this.spacing), 16, 16, 0, -16, 16, 16);
    }

    // add effects when the player stands on top of a grass covered block

    // if (this.stoodOn) {
    //     if (this.reformTime > 0) {
    //         this.reformTime = 0;
    //     }
    //     this.reformTime ++;
    // }
    // if (this.reformTime > 0) {
    //     if (frameCount % 3 === 0 && this.type < 16) {
    //         this.type = (this.type + 1);
    //     }
    // }else if (this.type === 1 && !this.stoodOn) {
    //     if (frameCount % 3 === 0 && this.type > 1) {
    //         this.type = (this.type - 1);
    //     }
    // }


    c.restore();
};

grounds.add = function(x, y, w, h, t) {
    this.push(new Ground(x, y, w, h, t));
};
grounds.create = function() {
    for (var i = 0; i < this.length; i ++) {
        this[i].draw();
    }
};

// enemy
var Enemy = function(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.xVel = 0;
    this.yVel = 0;
    this.acceleration = 0.4;
    this.moveToLeft = true;
    this.direction = -1;
    this.gravity = 0.5;
    this.life = 3;
    this.dead = false;
    this.maxSpeed = 3;
    this.index = 0;
    this.loopSpeed = 4;
    this.img = new Image();
    this.img.src = 'assets/fox.png'
    this.imgWidth = 13;
    this.imgHeight = 16;
    this.scaledSize = 3;
};
Enemy.prototype.update = function() {
    if (!this.dead) {
        if (this.moveToLeft) {
            this.direction = -1;
            this.xVel -= this.acceleration;
        }else if (!this.moveToLeft) {
            this.direction = 1;
            this.xVel += this.acceleration;
        }
        if (frameCount % this.loopSpeed === 0) {
            this.index = (this.index + 1) % 4;
        }

        if (this.xVel > this.maxSpeed) {
            this.xVel = this.maxSpeed;
        }else if (this.xVel < -this.maxSpeed) {
            this.xVel = -this.maxSpeed;
        }

        this.x += this.xVel; // update x by x velocity
        this.collide(grounds, this.xVel, 0); // x collision with solid objects

        // check for collision with player[s]
        for (var i = 0; i < players.length; i ++) {
            if (collide(this, players[i]) && !players[i].dead) {    
                if (!players[i].attacking) {
                    players[i].yVel = -7;
                }
                if (players[i].attacking) {
                    if (players[i].index === 2) {
                        this.life --;
                    }
                }
            }
        }
    }
    if (this.life <= 0) {
        this.dead = true;
    }
    this.y += this.yVel; // update y by y velocity
    this.yVel += this.gravity; // update y velocity by gravity
    this.collide(grounds, 0, this.yVel);
};
Enemy.prototype.collide = function(obj, xVel, yVel) {
    for (var i = 0; i < obj.length; i ++) {
        if (collide(this, obj[i]) && this.dead === false) {
            if (xVel < 0) {
                this.xVel = 0;
                this.x = obj[i].x + obj[i].width;
                this.moveToLeft = false;
                this.yVel = -3;
            }
            if (xVel > 0) {
                this.xVel = 0;
                this.x = obj[i].x - this.width;
                this.moveToLeft = true;
                this.yVel = -3;
            }
            if (yVel < 0) {
                this.yVel = 0;
                this.canJump = false;
                this.y = obj[i].y + obj[i].height;
            }
            if (yVel > 0) {
                this.yVel = 0;
                this.canJump = true;
                this.y = obj[i].y - this.height;
            }
        }
    }
};
Enemy.prototype.draw = function() {
    c.save();
    c.translate(this.x - 20 * this.direction, this.y - this.scaledSize);
    c.scale(this.direction, 1)
    c.drawImage(this.img, this.index * this.imgWidth, 0, this.imgWidth, this.imgHeight, 20 * this.direction, 0, this.imgWidth * this.scaledSize, this.imgHeight * this.scaledSize);
    c.restore();
};

enemys.add = function(x, y, w, h) {
    this.push(new Enemy(x, y, w, h));
};
enemys.create = function() {
    for (var i = 0; i < this.length; i ++) {
        this[i].update();
        this[i].draw();
    }
};

// ************************* LEVEL DATA *************************
levels = [
    [
        "..........................................................................................",
        "..........................................................................................",
        "..........................................................................................",
        "..........................................................................................",
        "..........................................................................................",
        "..........................................................................................",
        "..........................................................................................",
        "..............................---.........................................................",
        ".........--......------.......---...--............---......-----..........................",
        ".....-............----..............--....----....---......-----..........................",
        ".....-.............--.....................----....---......-----..........................",
        ".....-........................................................--..........................",
        ".....-.....-..................................................-...........................",
        "...........-..............................................................................",
        "-..........-..............................................................................",
        "-......-...-....................................................................--........",
        "-......-...-....................................................................--........",
        "-......-........................................................................--........",
        "--...............................................................................-........",
        "--..........................................................................-....-........",
        "-........---.....p.................................................----.....-.............",
        "--------------------------------...................................----.....-.............",
        "--------------------------------...................................----...................",
        "--------------------------------...................................----...................",
        "---------------------------------..................................----...................",
        "---------------------------------.....----..........----..........-----...................",
        "---------------------------------...................----..........-----..........-........",
        "--------------------------------..............-.....----.........--------........-.....---",
        "----...-------------------------....................-----..........----------....-.....---",
        "---.....-----.....-------------.......................---...........--------...........---",
        "--........-...........----................-..........----............-----.............---",
        "--.....................-.............................---.............----...............--",
        "--...................................................---.............----...............--",
        "--.............---..................----...........------...........------........---...--",
        "-----------------------------------------------------------------...-------......--------.",
        "------------------------------------------------------------------..-------......--------.",
        "-----------------------------------...--.....---------------------....-----......--------.",
        "-----------------------------------...........--------------------.....----.....---------.",
        "-----------------------------------............------------------...-------.....---------.",
        "-------------------------------------....,....-------------------...--------....---------.",
        "-----------------------------------------------------------------...--------....---------.",
        "-----------------------------------------------------------------...-------.....---------.",
        "-----------------------------------------------------------------......-.......----------.",
        "-----------------------------------------------------------------..............----------.",
        ".----------------------------------------------------------------..............----------.",
        ".-----------------------------------------------------------------............-----------.",
        ".----------------------------------------------------------------------------------------.",
        ".----------------------------------------------------------------------------------------.",
        "..........................................................................................",
    ],    
];

// apply keys to objects and define them + image selection algorithim
var loadLevels = function() {
    for (var i = 0; i < levels[level].length; i ++) {
        for (var j = 0; j < levels[level][i].length; j ++) {
            // associate specific keys to specific objects
            if (levels[level][i][j] === 'p') {
                players.add(j * blockSize, i * blockSize, blockSize - 25, blockSize * 2 - 5);
            } 
            if (levels[level][i][j] === 'e') {
                enemys.add(j * blockSize, i * blockSize, blockSize, blockSize);
            } 
            if (levels[level][i][j] === '-') {
                // select image relative to other blocks
                if (levels[level][i][j - 1] !== '-' && levels[level][i][j + 1] === '-' && levels[level][i - (i === 0 ? 0 : 1)][j] !== '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] === '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 0);
                }else if (levels[level][i][j + 1] === '-' && levels[level][i][j - 1] === '-' && levels[level][i - (i === 0 ? 0 : 1)][j] !== '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] === '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 1);
                }else if (levels[level][i][j - 1] === '-' && levels[level][i][j + 1] !== '-' && levels[level][i - (i === 0 ? 0 : 1)][j] !== '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] === '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 2);
                }else if (levels[level][i][j + 1] === '-' && levels[level][i][j - 1] !== '-' && levels[level][i - (i === 0 ? 0 : 1)][j] === '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] === '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 3);
                }else if (levels[level][i][j + 1] === '-' && levels[level][i][j - 1] === '-' && levels[level][i - (i === 0 ? 0 : 1)][j] === '-' && levels[level][i + (i === levels[level].length - 1 ? 0 : 1)][j] === '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 4);
                }else if (levels[level][i][j + 1] !== '-' && levels[level][i][j - 1] === '-' && levels[level][i - (i === 0 ? 0 : 1)][j] === '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] === '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 5);
                }else if (levels[level][i][j + 1] === '-' && levels[level][i][j - 1] !== '-' && levels[level][i - (i === 0 ? 0 : 1)][j] === '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] !== '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 6);
                }else if (levels[level][i][j + 1] === '-' && levels[level][i][j - 1] === '-' && levels[level][i - (i === 0 ? 0 : 1)][j] === '-' && levels[level][i + (i === levels[level].length - 1 ? 0 : 1)][j] !== '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 7);
                }else if (levels[level][i][j + 1] !== '-' && levels[level][i][j - 1] === '-' && levels[level][i - (i === 0 ? 0 : 1)][j] === '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] !== '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 8);
                }else if (levels[level][i][j + 1] !== '-' && levels[level][i][j - 1] !== '-' && levels[level][i - (i === 0 ? 0 : 1)][j] === '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] !== '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 9);
                }else if (levels[level][i][j - 1] !== '-' && levels[level][i][j + 1] !== '-' && levels[level][i - (i === 0 ? 0 : 1)][j] === '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] === '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 10);
                }else if (levels[level][i][j - 1] !== '-' && levels[level][i][j + 1] !== '-' && levels[level][i - (i === 0 ? 0 : 1)][j] !== '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] !== '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 11);
                }else if (levels[level][i][j + 1] === '-' && levels[level][i][j - 1] === '-' && levels[level][i - (i === 0 ? 0 : 1)][j] !== '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] !== '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 12);
                }else if (levels[level][i][j + 1] !== '-' && levels[level][i][j - 1] === '-' && levels[level][i - (i === 0 ? 0 : 1)][j] !== '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] !== '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 13);
                }else if (levels[level][i][j + 1] === '-' && levels[level][i][j - 1] !== '-' && levels[level][i - (i === 0 ? 0 : 1)][j] !== '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] !== '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 14);
                }else if (levels[level][i][j + 1] !== '-' && levels[level][i][j - 1] !== '-' && levels[level][i - (i === 0 ? 0 : 1)][j] !== '-' && levels[level][i + (i === levels[level].length ? 0 : 1)][j] === '-') {
                    grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 15);
                }

                // internal corners
                if (levels[level][i][j + 1] === '-' && levels[level][i][j - 1] === '-' && levels[level][i - (i === 0 ? 0 : 1)][j] === '-' && levels[level][i + (i === levels[level].length - 1 ? 0 : 1)][j] === '-') {
                    if (levels[level][i - (i === 0 ? 0 : 1)][j - 1] === '.' && levels[level][i - (i === 0 ? 0 : 1)][j + 1] !== '.' && levels[level][i + (i === levels[level.length] ? 0 : 1)][j - 1] !== '.' && levels[level][i + (i === levels[level].length ? 0 : 1)][j + 1] !== '.') {
                        grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 'left_corner');
                    }else if (levels[level][i - (i === 0 ? 0 : 1)][j - 1] !== '.' && levels[level][i - (i === 0 ? 0 : 1)][j + 1] === '.' && levels[level][i + (i === levels[level.length] ? 0 : 1)][j - 1] !== '.' && levels[level][i + (i === levels[level].length ? 0 : 1)][j + 1] !== '.') {
                        grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 'right_corner');
                    }else if (levels[level][i - (i === 0 ? 0 : 1)][j - 1] === '.' && levels[level][i - (i === 0 ? 0 : 1)][j + 1] === '.' && levels[level][i + (i === levels[level.length] ? 0 : 1)][j - 1] === '.' && levels[level][i + (i === levels[level].length ? 0 : 1)][j + 1] === '.') {
                        grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 'center_corner');
                    }else if (levels[level][i - (i === 0 ? 0 : 1)][j - 1] !== '.' && levels[level][i - (i === 0 ? 0 : 1)][j + 1] !== '.' && levels[level][i + (i === levels[level.length] ? 0 : 1)][j - 1] !== '.' && levels[level][i + (i === levels[level].length ? 0 : 1)][j + 1] === '.') {
                        grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 'lower_right_corner');
                    }else if (levels[level][i - (i === 0 ? 0 : 1)][j - 1] !== '.' && levels[level][i - (i === 0 ? 0 : 1)][j + 1] !== '.' && levels[level][i + (i === levels[level.length] ? 0 : 1)][j - 1] === '.' && levels[level][i + (i === levels[level].length ? 0 : 1)][j + 1] !== '.') {
                        grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 'lower_left_corner');
                    }else if (levels[level][i - (i === 0 ? 0 : 1)][j - 1] !== '.' && levels[level][i - (i === 0 ? 0 : 1)][j + 1] !== '.' && levels[level][i + (i === levels[level.length] ? 0 : 1)][j - 1] === '.' && levels[level][i + (i === levels[level].length ? 0 : 1)][j + 1] === '.') {
                        grounds.add(j * blockSize, i * blockSize, blockSize, blockSize, 'bottom_double_corner');
                    }
                }
            }
        }
    }
};

// create all game objects
function createObjects() {
    grounds.create();
    enemys.create();
    players.create();
};

// used to delete all objects on map
objects.delete = function() {
    for (var i = 0; i < objects.length; i ++) {
        for (var j = 0; j < objects[i].length; j ++) {
            objects[i].splice(j, objects[i].length);
        }
    }
};

// ************************* ANIMATION LOOP *************************
function draw() {
    c.clearRect(0, 0, canvas.width, canvas.height)

    c.imageSmoothingEnabled = false;

    loadTime ++;

    if (loadTime === 1) {
        loadLevels();
    }

    // remove dead enemies
    for (var i = 0; i < enemys.length; i ++) {
        if (enemys.dead) {
            enemys.splice(i, 1);
        }
    }

    c.save(); // save current canvas matrix
    
    var player = players[0]; // save variable that selects first player spawned

    camX = -player.x + canvas.width / 2; // set camera x
    camY = -player.y + canvas.height / 2 + 50; // set camera y

    // CONSTRAIN CAMERA

    // left side
    if ((camX * -1) - blockSize < 0) {
        camX = -blockSize;
    }
    
    // right side
    for (var i = 0; i < levels[level].length - 1; i ++) {
        if ((camX * -1) > (levels[level][i].length - 1) * blockSize - canvas.width) {
            camX = ((levels[level][i].length - 1) * blockSize - canvas.width) * -1;
        }
    }

    // top
    if ((camY * -1) + blockSize < 0) {
        camY = 0 + blockSize;
    }
    
    // bottom
    if ((camY * -1) > (levels[level].length - 1) * blockSize - canvas.height) {
        camY = ((levels[level].length - 1) * blockSize - canvas.height) * -1;
    }

    // keep player in screen

    // left side
    if (player.x < blockSize) {
        player.x = blockSize;
    }
    // right side
    for (var i = 0; i < levels[level].length - 2; i ++) {
        if (player.x > (levels[level][i].length - 2) * blockSize) {
            player.x = ((levels[level][i].length - 2) * blockSize);
        }
    }

    c.translate(Math.floor(camX), Math.floor(camY)); // translate tile map by camera positions

    createObjects(); // call create obj's function

    // draw and remove fx particles
    for (var i = 0; i < effects.length; i ++) {
        effects[i].draw();
        if (effects[i].dead) {
            effects.splice(i, 1);
        }
    }

    c.restore(); // reset saved canvas matrix

    // fake frame rate        
    frameCount = (frameCount + 1) % 60;

    requestAnimationFrame(draw);
}
 
draw(); // call draw loop

// ************************* EVENT LISTENERS *************************
addEventListener('keydown', ({ key }) => {
    switch(key) {
        case 'ArrowRight':
            keys.right.pressed = true;
            break;
        case 'ArrowLeft':
            keys.left.pressed = true;
            break;
        case 'ArrowUp':
            keys.up.pressed = true;
            break;
        case 'ArrowDown':
            keys.down.pressed = true;
            break;
        case ' ':
            keys.shoot.pressed = true;
            break;
        case 'x':
            keys.strike.pressed = true;
            break;
    }
})
addEventListener('keyup', ({ key }) => {
    switch(key) {
        case 'ArrowRight':
            keys.right.pressed = false;
            break;
        case 'ArrowLeft':
            keys.left.pressed = false;
            break;
        case 'ArrowUp':
            keys.up.pressed = false;
            break;
        case 'ArrowDown':
            keys.down.pressed = false;
            break;
        case ' ':
            keys.shoot.pressed = false;
            break;
        case 'x':
            keys.strike.pressed = false;
            break;
    }
})
