var poll_timer = null;


function get_cookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

function get_my_username()
{
    var uid = get_cookie("uid");
    var list = uid.split("|");

    if (list.length == 2) {
        return list[0];
    }

    return "";
}

function list_insert(username, message, color)
{
    var list = document.getElementById("list");
    var item = document.createElement("LI");
    var text_elem = document.createTextNode(username + ": " + message);
    var len = list.length;

    item.style.color = color;
    item.style.fontWeight = "bold";

    item.appendChild(text_elem);
    list.insertBefore(item, list.firstChild);

    if (list.childNodes.length >= 100) {
        list.removeChild(list.lastChild);
    }
}

function sendbutton_onclick()
{
    var username = get_my_username();
    var textbox = document.getElementById("message")

    if (textbox.value.trim() != "") {
        message = textbox.value;
        list_insert(username, message, "#990099");

        req = new XMLHttpRequest();
        req.open("POST", "/miao/post", true);
        req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        req.onreadystatechange = function () {
            if (req.readyState == 4 && req.status == 200) {
            }
        }
        req.send("message=" + message);
    }
    textbox.value = "";
    textbox.focus();
}

function poll_server()
{
    req = new XMLHttpRequest();
    req.open("POST", "/miao/poll", true);
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.onreadystatechange = function () {
        if (req.readyState == 4 && req.status == 200) {
            messages = req.responseText.split("|");
            if (!messages.length) {
                return;
            }
            username = messages[0];
            for (var i = 1; i < messages.length; i++) {
                if (messages[i].length) {
                    list_insert(username, messages[i], "#3300FF");
                }
            }
        }
    }
    req.send();
}

function body_load()
{
    poll_timer = setInterval(function() {
                        poll_server();
                    }, 1000);

    document.getElementById("message").focus();
}

function logout()
{
    clearInterval(poll_timer);
    poll_timer = null;
}
