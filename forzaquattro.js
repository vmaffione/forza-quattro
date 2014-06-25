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
    this.keys_state = new Array(128);
    this.keys_pending = new Array(128);
    for (var i=0; i<128; i++) {
        this.keys_state[i] = false;
        this.keys_pending[i] = false;
    }
    this.keys_queue = "";
    this.username = "";

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
            txt = "Inserisci la parola d'ordine e premi 'Spazio' per iniziare";
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
        if (this.gl.keys_state[32] == true) {
            clearInterval(this.timer);
            something_changed = 0;  /* Avoid drawing when move() returns. */
            this.gl.username = this.gl.keys_queue;
            this.gl.next_scene();
        }

        return something_changed;
    }
}

function post_start_msg(game)
{
    req = new XMLHttpRequest();
    req.open("POST", "forzaquattro/start", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            if (req.responseText != "") {
                game.player_id_mine = parseInt(req.responseText);
                if (isNaN(game.player_id_mine)) {
                    game.player_id_mine = 0;
                }
            }
            if (game.player_id_mine == 0) {
                game.error_string = "Who are you?";
                game.force_draw = true;
                window.alert("Tu non puoi giocare, non conosci la chiave!");
            } else {
                game.poll_timer = setInterval(function() {
                                                    post_poll_msg(game);
                                                }, 1000);
            }
        }
    }
    req.send("player=" + game.gl.username);
}

function post_move_msg(game, col, move)
{
    req = new XMLHttpRequest();
    req.open("POST", "forzaquattro/move", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.send("player=" + game.gl.username + "&col=" + col + "&move=" + move + "&seqnum=" + game.seqnum);
}

function post_poll_msg(game)
{
    if (game.victory_on) {
        /* Avoid considering the other's moves belonging
           to the next match, while still the player has
           to press Enter in order to exit from the 'victory_on'
           state.
           */
        return;
    }
    req = new XMLHttpRequest();
    req.open("POST", "forzaquattro/poll", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            events = req.responseText.split(",");
            for (var i = 0; i < events.length; i++) {
                cmd = events[i].split(" ");
                if (cmd.length != 3) {
                    continue;
                }
                col = parseInt(cmd[0]);
                seqnum = parseInt(cmd[2]);
                if (seqnum != game.seqnum + 1) {
                    /* Sequencing error, let's reset. */
                    game.reset();
                    game.error_string("seq:" + seqnum + "; exp:" + game.seqnum+1);
                    game.force_draw = true;
                }
                if (cmd[1] == "push") {
                    game.push(col);
                    game.force_draw = true;
                } else if (cmd[1] == "pop") {
                    game.pop(col);
                    game.force_draw = true;
                }
            }
        }
    }
    req.send("player=" + game.gl.username);
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

    /* Create the arrow. */
    this.arrow = new Arrow(this, this.board_x, this.board_y,
                           this.cellW, this.cellH, this.cols);

    this.state = new Array(this.rows);
    for (var i = 0; i < this.rows; i++) {
        this.state[i] = new Array(this.cols)
        for (var j = 0; j < this.cols; j++) {
            this.state[i][j] = 0;
        }
    }

    this.poll_timer = null;

    this.animation_step = animation_step;
    function animation_step()
    {
        /* Move (update) everything. */
        var something_changed = this.move();

        if (something_changed || this.force_draw) {
            /* Draw everything. */
            this.force_draw = false;
            this.draw();
        }
    }

    this.start_scene = start_scene;
    function start_scene()
    {
        var that = this;

        this.reset();
        this.draw();

        this.timer = setInterval(function() {
                        that.animation_step();
                   }, 1000 / 60);

        post_start_msg(this);
   }

    this.draw = draw;
    function draw()
    {
        var ctx = this.gl.canvas.getContext("2d");
        var name;

        /* Draw the background */
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, this.gl.W, this.gl.H);

        /* Draw status info. */
        if (this.player_id_curr == 1) {
            name = "Rosso";
        } else {
            name = "Blu";
        }
        txt = "Prossima mossa: " + name;
        ctx.font = "16px Arial";
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(txt, 20, 30);
        txt = "Mosse eseguite: " + this.moves;
        ctx.fillText(txt, 20, 54);
        txt = "Vittorie rosse: " + this.victory_counter[1];
        ctx.fillText(txt, 20, 78);
        txt = "Vittorie blu:   " + this.victory_counter[2];
        ctx.fillText(txt, 20, 102);
        txt = "Sequenza:   " + this.seqnum;
        ctx.fillText(txt, 20, 126);
        txt = "Errori:   " + this.error_string;
        ctx.fillStyle = '#FF000';
        ctx.fillText(txt, 20, 150);

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
        ctx.strokeStyle = make_rgb(255, 100, 0)
        ctx.lineWidth = this.cellW/40;
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.cols; j++) {
                ctx.beginPath();
                ctx.arc(this.board_x + this.cellW * j + this.cellW/2,
                        this.board_y + this.cellH * i + this.cellH/2,
                        radius, 0, 2 * Math.PI);
                if (this.state[i][j] == 0) {
                    ctx.fillStyle = make_rgb(0, 0, 0);
                } else if (this.state[i][j] == 1) {
                    ctx.fillStyle = make_rgb(255, 0, 0);
                } else {
                    ctx.fillStyle = make_rgb(0, 0, 255);
                }
                ctx.fill();
                ctx.stroke();
            }
        }
        if (this.victory_on) {
            for (var v = 0; v < this.victory_cells.length; v++) {
                var i = this.victory_cells[v][0];
                var j = this.victory_cells[v][1];

                ctx.beginPath();
                ctx.arc(this.board_x + this.cellW * j + this.cellW/2,
                        this.board_y + this.cellH * i + this.cellH/2,
                        radius, 0, 2 * Math.PI);
                if (this.state[i][j] == 1) {
                    ctx.fillStyle = make_rgb(255,
                                             this.victory_color,
                                             this.victory_color);
                } else {
                    ctx.fillStyle = make_rgb(this.victory_color,
                                             this.victory_color,
                                             255);
                }
                ctx.fill();
            }
        }

        /* Draw the arrow. */
        this.arrow.draw();
    }

    this.update_game = update_game;
    function update_game()
    {
        var player = this.player_id_curr;
        var other_player = 3 - player;

        this.moves++;
        this.victory_on = this.check_victory(player);
        if (this.victory_on) {
            this.victory_counter[player]++;
            this.moves = 0;
        } else {
            this.victory_on = this.check_victory(other_player);
            if (this.victory_on) {
                this.victory_counter[other_player]++;
                this.moves = 0;
            }
        }
        this.player_id_curr = other_player;

        this.seqnum++;
    }

    this.check_victory = check_victory;
    function check_victory(player)
    {
        /* Look for horizontal tuples. */
        for (var i = 0; i < this.rows; i++) {
            var cnt = 0;

            for (var j = 0; j < this.cols; j++) {
                if (this.state[i][j] == player) {
                    cnt++;
                    if (cnt >= 4) {
                        for (var v = 0; v < 4; v++) {
                            this.victory_cells[v] = [i, j-3+v];
                        }
                        return true;
                    }
                } else {
                    cnt = 0;
                }
            }
        }

        /* Look for vertical tuples. */
        for (var j = 0; j < this.cols; j++) {
            var cnt = 0;

            for (var i = 0; i < this.rows; i++) {
                if (this.state[i][j] == player) {
                    cnt++;
                    if (cnt >= 4) {
                        for (var v = 0; v < 4; v++) {
                            this.victory_cells[v] = [i-3+v, j];
                        }
                        return true;
                    }
                } else {
                    cnt = 0;
                }
            }
        }

        /* Look for direct diagonal tuples. */
        for (var i = 0; i < this.rows - 3; i++) {
            var cnt = 0;

            for (var j = 0; j < this.cols && i+j < this.rows; j++) {
                if (this.state[i+j][j] == player) {
                    cnt++;
                    if (cnt >= 4) {
                        for (var v = 0; v < 4; v++) {
                            this.victory_cells[v] = [i+j-3+v, j-3+v];
                        }
                        return true;
                    }
                } else {
                    cnt = 0;
                }
            }
        }
        for (var j = 1; j < this.cols - 3; j++) {
            var cnt = 0;

            for (var i = 0; i < this.rows && j+i < this.cols; i++) {
                if (this.state[i][j+i] == player) {
                    cnt++;
                    if (cnt >= 4) {
                        for (var v = 0; v < 4; v++) {
                            this.victory_cells[v] = [i-3+v, j+i-3+v];
                        }
                        return true;
                    }
                } else {
                    cnt = 0;
                }
            }
        }

        /* Look for inverse diagonal tuples. */
        for (var i = 3; i < this.rows; i++) {
            var cnt = 0;

            for (var j = 0; j < this.cols && i-j >= 0; j++) {
                if (this.state[i-j][j] == player) {
                    cnt++;
                    if (cnt >= 4) {
                        for (var v = 0; v < 4; v++) {
                            this.victory_cells[v] = [i-(j-3+v), j-3+v];
                        }
                        return true;
                    }
                } else {
                    cnt = 0;
                }
            }
        }
        for (var j = 1; j < this.cols - 3; j++) {
            var cnt = 0;

            for (var i = 0; i < this.rows && j+i < this.cols; i++) {
                if (this.state[this.rows-1-i][j+i] == player) {
                    cnt++;
                    if (cnt >= 4) {
                        for (var v = 0; v < 4; v++) {
                            this.victory_cells[v] =
                                    [this.rows-1-(i-3+v), j+i-3+v];
                        }
                        return true;
                    }
                } else {
                    cnt = 0;
                }
            }
        }

        return false;
    }

    this.push = push;
    function push(col)
    {
        var row = this.rows - 1;

        while (row >= 0 && this.state[row][col]) {
            row--;
        }
        if (row >= 0) {
            this.state[row][col] = this.player_id_curr;
            this.update_game();

            return true
        }

        return false
    }

    this.pop = pop;
    function pop(col)
    {
        var row = this.rows - 1;

        if (this.state[row][col] == this.player_id_curr) {
            while (row > 0) {
                this.state[row][col] =
                    this.state[row-1][col];
                row--;
            }
            this.state[0][col] = 0;
            this.update_game();

            return true
        }

        return false
    }

    this.reset = reset;
    function reset()
    {
        this.reset_state();
        this.player_id_mine = 0;
        this.player_id_curr = 1;
        this.moves = 0;
        this.victory_counter = [0, 0, 0];
        this.victory_cells = Array(4);
        this.victory_on = false;
        this.victory_color_step = 6;
        this.victory_color = 50;
        this.force_draw = false;
        this.seqnum = 0;
        this.error_string = "";
    }

    this.reset_state = reset_state;
    function reset_state()
    {
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.cols; j++) {
                this.state[i][j] = 0;
            }
        }
    }

    this.move = move;
    function move()
    {
        var something_changed = this.arrow.move();

        /* User presses 'Enter'. */
        if (this.gl.keys_pending[13]) {
            this.gl.keys_pending[13] = false;
            if (this.victory_on) {
                /* Reset after a victory. */
                this.reset_state();
                this.victory_on = false;
                something_changed = 1;
            } else if (this.player_id_curr == this.player_id_mine) {
                col = this.arrow.col;
                ok = this.push(col);
                if (ok) {
                    post_move_msg(this, col, 'push');
                    something_changed = 1;
                }
            }
        }

        /* User presses 'Space'. */
        if (this.gl.keys_pending[32]) {
            this.gl.keys_pending[32] = false;
            if (this.player_id_curr == this.player_id_mine &&
                    !this.victory_on) {
                col = this.arrow.col;
                ok = this.pop(col);
                if (ok) {
                    post_move_msg(this, col, 'pop');
                    something_changed = 1;
                }
            }
        }

        /* User presses 'r' to refresh. */
        if (this.gl.keys_pending[82]) {
            this.gl.keys_pending[82] = false;
            if (!this.victory_on) {
                /* Avoid considering the other's moves belonging
                   to the next match, while still the player has
                   to press Enter in order to exit from the 'victory_on'
                   state.
                   */
                post_poll_msg(this);
                something_changed = 1;
            }
        }

        if (this.victory_on) {
            if (this.victory_color < 10 || this.victory_color > 245) {
                this.victory_color_step *= -1;
            }
            this.victory_color += this.victory_color_step;
            something_changed = 1;
        }

        return something_changed;
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

        if (this.gm.gl.keys_pending[37]) {
            this.gm.gl.keys_pending[37] = false;
            if (this.col) {
                this.x -= this.cellW;
                this.col--;
                something_changed = 1;
            }
        }

        if (this.gm.gl.keys_pending[39]) {
            this.gm.gl.keys_pending[39] = false;
            if (this.col < this.maxcol) {
                this.x += this.cellW;
                this.col++;
                something_changed = 1;
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
    if (g.keys_state[e.keyCode]) {
        g.keys_queue += String.fromCharCode(e.keyCode);
        if (g.keys_queue.length >= 10) {
            g.keys_queue.slice(1, g.keys_queue.length);
        }
    }
    g.keys_state[e.keyCode] = false;
}

/* Record that the key is now pressed. */
function bodyKeyDown(e)
{
    g.keys_state[e.keyCode] = true;
    g.keys_pending[e.keyCode] = true;
}
