/*
    An old fashioned 60 Hz 2D game.

    Written by Vincenzo Maffione.
*/

/* An object containing all the "global" variables. */
var g;

function resize(x)
{
    x.W = x.canvas.width = x.canvas.parentNode.clientWidth;
    x.H = x.canvas.height = x.canvas.parentNode.clientHeight;
    x.cx = x.W/2;
    x.cy = x.H/2;
}

function getRandInt(max)
{
    return Math.floor(Math.random()*max);
}

function getRandIncr(max)
{
    return Math.floor(Math.random()*max*2 - max);
}

/* Global prototype. */
function Global()
{
    /* Grab the 'canvas' element. */
    this.canvas = document.getElementById("gameCanvas");
    resize(this);

    /* Track the "pressed" state of keyboard keys. */
    this.keys_state = new Array();
    for (var i=0; i<128; i++) {
        this.keys_state[i] = false;
    }

    /* Array of game scenes. */
    this.scenes = new Array();
    this.scenes[0] = new Intro(this);
    this.scenes[1] = new Game(this);
    this.scene_idx = 0;

    this.next_scene = next_scene;
    function next_scene() {
        if (this.scene_idx >= 0 &&
                this.scene_idx < this.scenes.length) {
            /* It's essential to increment this.scene_idx
               before invoking a start_scene method, otherwise
               unterminated recursion happens. */
            this.scenes[this.scene_idx++].start_scene();
        }
    }
}

function make_rgb_comp(x)
{
    var comp;

    /* Saturation. */
    if (x > 255) {
        x = 255;
    } else if (x < 0) {
        x = 0;
    }

    /* String conversion and formatting. */
    comp = x.toString(16);
    if (comp.length == 1) {
        comp = "0" + comp;
    }

    return comp;
}

function make_rgb(r, g, b)
{
    return "#" + make_rgb_comp(r) + make_rgb_comp(g) + make_rgb_comp(b);
}

/* A prototype representing the introduction scene. */
function Intro(gl)
{
    this.gl = gl;
    this.rgb1 = 0;  /* RGB component for the first text */
    this.rgb2 = 0;  /* RGB component for the second text */
    this.rgb3 = 0;  /* RGB component for the third text */

    this.start_scene = start_scene;
    function start_scene()
    {
        var that = this;

        /* Draw once at the beginning. */
        this.draw();

        this.timer = setInterval(function() {
                that.animation_step();
                }, 1000 / 60);
    }

    this.animation_step = animation_step;
    function animation_step()
    {
        var something_changed = this.move();

        if (something_changed) {
            this.draw();
        }
    }

    this.draw = draw;
    function draw()
    {
        var ctx = this.gl.canvas.getContext("2d");
        var txt;
        var txt_width;

        /* Draw the background */
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.gl.W, this.gl.H);

        /* Draw the first text. */
        ctx.fillStyle = make_rgb(this.rgb1, 0, this.rgb1);
        ctx.font = "30px Arial";
        txt = "Sei pronto per essere...";
        txt_width = ctx.measureText(txt).width;
        ctx.fillText(txt, (this.gl.W - txt_width)/2, this.gl.H/3);

        /* Draw the second text */
        if (this.rgb2) {
            ctx.fillStyle = make_rgb(this.rgb2, 0, this.rgb2);
            ctx.font = "italic 40px Arial";
            txt = "spennato?";
            txt_width = ctx.measureText(txt).width;
            ctx.fillText(txt, (this.gl.W - txt_width)/2, this.gl.H/3 + 50);
        }

        if (this.rgb3) {
            ctx.fillStyle = make_rgb(this.rgb3, this.rgb3, this.rgb3);
            ctx.font = "12px Arial";
            txt = "Premi 's' per iniziare";
            txt_width = ctx.measureText(txt).width;
            ctx.fillText(txt, (this.gl.W - txt_width)/2, this.gl.H - 30);
        }
    }

    this.move = move;
    function move()
    {
        var something_changed = 0;

        if (this.rgb1 < 255) {
            this.rgb1 += 4;
            something_changed = 1;
        }
        if (this.rgb1 >= 255 && this.rgb2 < 255) {
            this.rgb2 += 10;
            something_changed = 1;
        }
        if (this.rgb1 >= 255 && this.rgb2 >= 255 && this.rgb3 < 255) {
            this.rgb3 += 30;
            something_changed = 1;
        }

        /* Go to the next scene when we intercept that the key
           's' is being pressed. */
        if (this.gl.keys_state[83] == true) {
            clearInterval(this.timer);
            something_changed = 0;  /* Avoid drawing when move() returns. */
            this.gl.next_scene();
        }

        return something_changed;
    }
}

/* A prototype representing the game scene. */
function Game(gl)
{
    this.gl = gl;
    this.rows = 6
    this.cols = 7
    this.board_x = this.gl.W * 15 / 100;
    this.board_y = this.gl.H * 30 / 100;
    this.cellW = this.gl.W * 70/100 / this.cols;
    this.cellH = this.gl.H * 70/100 / this.rows;

    /* Create the kitten. */
    this.arrow = new Arrow(this, this.board_x, this.board_y,
                           this.cellW, this.cellH, this.cols);

    this.animation_step = animation_step;
    function animation_step()
    {
        /* Move (update) everything. */
        var something_changed = this.move();

        if (something_changed) {
            /* Draw everything. */
            this.draw();
        }
    }

    this.start_scene = start_scene;
    function start_scene()
    {
        var that = this;

        this.draw();

        this.timer = setInterval(function() {
                        that.animation_step();
                   }, 1000 / 60);
   }

    this.draw = draw;
    function draw()
    {
        var ctx = this.gl.canvas.getContext("2d");

        /* Draw the background */
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.gl.W, this.gl.H);

        /* Draw status info. */
        txt = "Status1: " + 1392;
        ctx.font = "16px Arial";
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(txt, 20, 30);
        txt = "Status2: " + 3241;
        ctx.fillText(txt, 20, 54);
        /* Debug variables:
        txt = "(interns): " + this.guys.length + " " + this.disap_guys.length;
        ctx.fillText(txt, 20, 70);
        */

        /* Draw hints. */
        ctx.fillStyle = make_rgb(255, 255, 255);
        ctx.font = "italic 12px Arial";
        txt = "Muovi le frecce";
        txt_width = ctx.measureText(txt).width;
        ctx.fillText(txt, (this.gl.W - txt_width)/2, 0 + 25);

        /* Draw the gameboard. */
        ctx.beginPath();
        ctx.rect(this.board_x, this.board_y, this.gl.W * 70/100,
                     this.gl.H * 70 / 100);
        ctx.fillStyle = make_rgb(255, 180, 0);
        ctx.lineWidth = 2;
        ctx.strokeStyle = make_rgb(255, 100, 0);
        ctx.fill();
        ctx.stroke();

        radius = this.cellW * 4/10;
        if (radius > this.cellH * 4/10)
            radius = this.cellH * 4/10;
        ctx.fillStyle = make_rgb(0, 0, 0);
        ctx.strokeStyle = make_rgb(255, 100, 0)
        ctx.lineWidth = this.cellW/40;
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.cols; j++) {
                ctx.beginPath()
                ctx.arc(this.board_x + this.cellW * j + this.cellW/2,
                        this.board_y + this.cellH * i + this.cellH/2,
                        radius, 0, 2 * Math.PI)
                ctx.fill();
                ctx.stroke();
            }
        }

        /* Draw the kitten. */
        this.arrow.draw();
    }

    this.move = move;
    function move()
    {
        return this.arrow.move();
    }
}

/* Arrow prototype */
function Arrow(gm, board_x, board_y, cellW, cellH, cols)
{
    this.gm = gm;
    this.cellW = cellW;
    this.cellH = cellH;
    this.maxcol = cols - 1;
    this.h = 55;  /* Arrow height. */
    this.x = board_x + cellW/2 - 7;
    this.y = board_y - cellH/2 - this.h;
    this.left_state = 0;
    this.right_state = 0;
    this.col = 0;

    this.draw = draw;
    function draw()
    {
        var ctx = this.gm.gl.canvas.getContext("2d");

        /* Draw the circle. */
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + 14, this.y);
        ctx.lineTo(this.x + 14, this.y + this.h);
        ctx.lineTo(this.x + 14 + 7, this.y + this.h);
        ctx.lineTo(this.x + 8, this.y + this.h + 15);
        ctx.lineTo(this.x - 7, this.y + this.h);
        ctx.lineTo(this.x, this.y + this.h);
        ctx.lineTo(this.x, this.y);
        ctx.fill();
    }

    this.move = move;
    function move()
    {
        var something_changed = 0;

        if (this.col) {
            if (this.left_state == 0) {
                if (this.gm.gl.keys_state[37]) {
                    this.left_state = 1;
                }
            } else if (this.left_state == 1) {
                if (!this.gm.gl.keys_state[37]) {
                    this.x -= this.cellW;
                    this.col--;
                    something_changed = 1;
                    this.left_state = 0;
                }
            }
        }

        if (this.col < this.maxcol) {
            if (this.right_state == 0) {
                if (this.gm.gl.keys_state[39]) {
                    this.right_state = 1;
                }
            } else if (this.right_state == 1) {
                if (!this.gm.gl.keys_state[39]) {
                    this.x += this.cellW;
                    this.col++;
                    something_changed = 1;
                    this.right_state = 0;
                }
            }
        }

        return something_changed;
    }
}

/* Create the global object and start the animation. */
function onload()
{
    g = new Global();

    g.next_scene();
}

/* Record that the key is now not pressed. */
function bodyKeyUp(e)
{
    g.keys_state[e.keyCode] = false;
}

/* Record that the key is now pressed. */
function bodyKeyDown(e)
{
    g.keys_state[e.keyCode] = true;
}
