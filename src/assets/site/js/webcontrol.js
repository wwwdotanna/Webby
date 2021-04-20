let id = -1;
let cpat = window.api.path.join(window.var.dir, "../../../server/sites/" + id + ".json");
let conf = {};
refreshConfig();

function refreshID() {
    id = -1;
    cpat = window.api.path.join(window.var.dir, "../../../server/sites/" + id + ".json");
    if(document.location.href.includes("#")) {
        let preid = id;
        id = parseInt(document.location.href.split("#")[1]);
        if(window.api.fs.existsSync(window.api.path.join(window.var.dir, "../../../server/sites/" + id + ".json"))) {
            cpat = window.api.path.join(window.var.dir, "../../../server/sites/" + id + ".json");
        } else {
            id = preid;
        }
    }
    refreshConfig();
}
refreshID();
function refreshConfig() {
    conf = {
        id: id,
        tree: JSON.parse(window.api.fs.readFileSync(cpat, "utf8")),
        port: -1
    };
    document.getElementsByClassName("name")[0].value = conf.tree.name;
    document.getElementsByClassName("path")[0].innerText = conf.tree.path;
    if(conf.port == -1) {
        conf.port = parseInt(id) + 80;
    }
    if(conf.tree['status'] == "on") {
        lookLikeStopper();
    } else {
        lookLikeStarter();
    }
}
function setIdTo(id2) {
    cpat = window.api.path.join(window.var.dir, "../../../server/sites/" + id + ".json");
    let preid = id;
    id = parseInt(id2);
    if(window.api.fs.existsSync(window.api.path.join(window.var.dir, "../../../server/sites/" + id + ".json"))) {
        cpat = window.api.path.join(window.var.dir, "../../../server/sites/" + id + ".json");
    } else {
        id = preid;
    }
    refreshConfig();
}
function updateConfSave() {
    let confr = JSON.parse(window.api.fs.readFileSync(cpat, "utf8"));
    let ci = 0;
    Object.keys(conf.tree).forEach((i) => {
        let e = Object.values(conf.tree)[ci];
        confr[i] = e;
        ci++;
    })
    conf.tree = confr;
    conf.tree.name = document.getElementsByClassName("name")[0].value;
    conf.tree.path = document.getElementsByClassName("path")[0].innerText;
    window.api.fs.writeFileSync(cpat, JSON.stringify(conf.tree, null, 4));
}
function openWebsite() {
    window.api.open('http://localhost:' + parseInt(conf.tree.port) + "/index.php");
}
function start() {
    lookLikeStopper();
    window.api.sendm("CONTROLLER", "start:" + id);
}
function lookLikeStopper() {
    conf.tree.status = "on";
    document.getElementsByClassName("stopstar")[0].classList.add("stopper");
    document.getElementsByClassName("stopstar")[0].classList.remove("starter");
    document.getElementsByClassName("stopstar")[0].setAttribute("onclick", "stop()");
    document.getElementsByClassName("stopstar")[0].innerHTML = `<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="icon"><path fill="currentColor" d="M504 256C504 119 393 8 256 8S8 119 8 256s111 248 248 248 248-111 248-248zm-448 0c0-110.5 89.5-200 200-200s200 89.5 200 200-89.5 200-200 200S56 366.5 56 256zm296-80v160c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16V176c0-8.8 7.2-16 16-16h160c8.8 0 16 7.2 16 16z" class=""></path></svg>`;
    updateConfSave();
}
function stop() {
    lookLikeStarter();
    window.api.sendm("CONTROLLER", "stop:" + id);
}
function lookLikeStarter() {
    conf.tree.status = "off";
    document.getElementsByClassName("stopstar")[0].classList.add("starter");
    document.getElementsByClassName("stopstar")[0].classList.remove("stopper");
    document.getElementsByClassName("stopstar")[0].setAttribute("onclick", "start()");
    document.getElementsByClassName("stopstar")[0].innerHTML = `<svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="icon"><path fill="currentColor" d="M371.7 238l-176-107c-15.8-8.8-35.7 2.5-35.7 21v208c0 18.4 19.8 29.8 35.7 21l176-101c16.4-9.1 16.4-32.8 0-42zM504 256C504 119 393 8 256 8S8 119 8 256s111 248 248 248 248-111 248-248zm-448 0c0-110.5 89.5-200 200-200s200 89.5 200 200-89.5 200-200 200S56 366.5 56 256z" class=""></path></svg>`;
    updateConfSave();
}
function deleteWebsite(conforno) {
}