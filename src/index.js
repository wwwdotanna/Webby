const {app, BrowserWindow} = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');
const express = require('express');
const fs = require('fs');
const os = require('fs');
const servArray = [];
const exprArray = [];
const ced = require('chardet');
const FileType = require('file-type');
const ncmd = require('node-cmd');
const cookz = require('cookie-parser');
const qstr = require('query-string');
const PHP = {
    "objectify": (obj) => {
        let cont = "array(";
        let counter = 0;
        Object.keys(obj).forEach((l) => {
            let preval = Object.values(obj)[counter];
            let v = 'urldecode("' + encodeURI(preval) + '")';
            if(preval == false || preval == true) {
                v = preval + "";
            }
            if((preval + "").toLowerCase() == "false") {
                v = "false";
            }
            if((preval + "").toLowerCase() == "true") {
                v = "true";
            }
            if(preval == "" || preval == null || (preval + "").toLowerCase() == "undefined") {
                v = "null";
            }
            if(isNaN(parseFloat(preval)) == false) {
                v = preval;
            }
            cont = cont + `\n    "` + l.replaceAll("-", "_") + `" => ` + v + `,`;
            if(counter == Object.keys(obj).length - 1) {
                cont = cont.substring(0, cont.length - 1);
            }
            counter++;
        });
        return cont + ")";
    }
}

async function resolveFile(conf, pmu, gen, req, res) {
    let body = req.body;
    if(body == undefined) {
        body = {};
    }
    let char = false;
    let ptf = path.join(__dirname, ".phptouch");
    let ptf2 = ptf + ".pre";
    let ptf3 = ptf + ".post";
    char = ced.detectFileSync(pmu);
    if(pmu.includes(".php")) {
        fs.writeFileSync(ptf, "");
        fs.writeFileSync(ptf2, "");
        fs.writeFileSync(ptf3, "");
        let cont = `<?php
set_include_path('` + path.join(pmu, "../") + `');
function getallheaders() {
    $gen = ` + PHP.objectify(req.headers) + `;
    return $gen;
}
$_HEADER = getallheaders();
$_COOKIE = ` + PHP.objectify(req.cookies) + `;
$_ENV = array();
$_SESSION = array();
$_SERVER = ` + PHP.objectify({
    "PHP_SELF": pmu,
    "GATEWAY_INTERFACE": "none",
    "SERVER_ADDR": "",
    "SERVER_NAME": "",
    "SERVER_SOFTWARE": "Apache/2.2.24 USING Webby/0.0.1",
    "SERVER_PROTOCOL": "HTTP/2.0",
    "REQUEST_METHOD": req.method,
    "REQUEST_TIME": Date.now(),
    "QUERY_STRING": req.url.split("?")[1],
    "HTTP_ACCEPT": req.headers["accept"],
    "HTTP_ACCEPT_CHARSET": "UTF-8",
    "HTTP_HOST": req.headers["host"],
    "HTTP_REFERER": "http://" + req.hostname + req.url,
    "HTTPS": "false",
    "REMOTE_ADDR": "",
    "REMOTE_HOST": "",
    "REMOTE_PORT": parseInt(conf.id) + 80,
    "SCRIPT_FILENAME": pmu,
    "SERVER_ADMIN": "admin@webby.io",
    "SERVER_PORT": parseInt(conf.id) + 80,
    "SERVER_SIGNATURE": "Apache/2.2.24 USING Webby/0.0.1",
    "PATH_TRANSLATED": pmu,
    "SCRIPT_NAME": pmu,
    "SCRIPT_URI": req.path
}) + `;
$_REQUEST = array();
$_POST = ` + PHP.objectify(body) + `;
$_GET = ` + PHP.objectify(req.query) + `;
?>` + fs.readFileSync(pmu, "utf8") + `<?php
echo "
~RESOLVERFORQ~" . json_encode(array(
    "headers" => $_HEADER,
    "cookies" => $_COOKIE,
    "env" => $_ENV,
    "session" => $_SESSION
));
?>`;
        fs.writeFileSync(ptf2, cont);
        let cmd = "php \"" + ptf2 + "\" > " + ptf3;
        await ncmd.runSync(cmd);
        let cont2 = fs.readFileSync(ptf3, "utf8");
        if(cont2.includes("\n~RESOLVERFORQ~")) {
            cont2 = cont2.split("\n~RESOLVERFORQ~")[0];
        }
        fs.writeFileSync(ptf, cont2);
        res.send(fs.readFileSync(ptf, "utf8"));
        // fs.unlinkSync(ptf);
        // res.end();
    } else {
        if(!char.startsWith("UTF")) {
            res.sendFile(pmu);
        } else {
            let txt = await FileType.fromFile(pmu);
            if(txt != undefined) {
                txt = txt.mime;
            }
            if(txt == undefined) {
                txt = "text/plain";
            }
            if(!txt.includes("charset")) {
                txt = txt + "; charset=UTF-8";
            }
            res.setHeader("Content-Type", txt);
            res.send(fs.readFileSync(pmu, "utf8"));
            res.end();
        }
    }
}

async function initalizeServer(conf) {
    let gen = express();
    gen.disable('x-powered-by');
    gen.use(cookz());
    let useha = 0;
    let pt = path.join(conf.tree.path);
    let htp = path.join(conf.tree.path, '/.htaccess');
    let regexes = [];
    let regexesAlt = [];
    let regexesProp = [];

    if(fs.existsSync(htp)) {
        useha = 1;
        let hac = fs.readFileSync(htp, "utf8");
        let hacl = hac.split("\n");
        if(hac.toLowerCase().includes("rewriteengine on")) {
            hacl.shift()
            hacl.forEach((i) => {
                i = i.toLowerCase();
                let p = [];
                p[0] = "rewriterule";
                p[1] = i.split("rewriterule ")[1];
                let pinc = ["rewriterule"];
                if(p[1].includes(" ")) {
                    let conjoined = 0;
                    let addinarg = "";
                    let ei = 0;
                    p[1].split("").forEach((e) => {
                        addinarg = addinarg + e;
                        if(e == '"' || e == "[" || e == "]" || e == "'") {
                            if(conjoined == 1) {
                                conjoined = 0;
                            } else {
                                conjoined = 1;
                            }
                        }
                        if(e == " ") {
                            if(conjoined == 0) {
                                addinarg = addinarg.substring(0, addinarg.length - 1);
                                pinc[pinc.length] = addinarg;
                                addinarg = "";
                            }
                        }
                        ei++;
                        if(ei == p[1].length) {
                            pinc[pinc.length] = addinarg;
                            addinarg = "";
                        }
                    });
                    let oi = 0;
                    pinc.forEach((o) => {
                        p[oi] = o;
                        p[oi] = p[oi].replaceAll("\"", "");
                        p[oi] = p[oi].replaceAll("'", "");
                        p[oi] = p[oi].replaceAll("^", "");
                        if(p[oi].endsWith("$")) {
                            p[oi] = p[oi].substring(0, p[oi].length - 1);
                        }
                        p[oi] = p[oi].replaceAll("{path}", __dirname);
                        oi++;
                    });
                }
                if(p[0] == "rewriterule" && p.length >= 3) {
                    regexes[regexes.length] = p[1];
                    regexesAlt[regexesAlt.length] = p[2];
                    regexesProp[regexesProp.length] = [];
                    if(p.length == 4) {
                        regexesProp[regexesProp.length - 1] = p[3].replaceAll(",", "").replaceAll("[", "").replaceAll("]", "").toLowerCase();
                    }
                }
            });
        }
    }

    gen.all('*', (req, res) => {
        let found = 0;
        if(useha == 1) {
            let id = 0;
            var pathx = req.path.substring(1).toLowerCase();
            while(found == 0 && id < regexes.length) {
                let i = regexes[id].toLowerCase();
                let ii = regexesProp[id];
                let r = new RegExp(i);
                let mn = pathx.match(r);
                if(mn !== null) {
                    found = 1;
                    let fl = regexesAlt[id].toLowerCase();
                    let resl = fl;
                    if(i.includes("(")) {
                        let cc = 1;
                        while(i.includes("(") && cc <= 2) {
                            let ccp = "$" + cc;
                            let rep1 = i.split("(")[0];
                            let rep2 = i.split(")")[0];
                            let rep = i.substring(0, rep1.length);
                            let rex = i.substring(rep2.length + 1, i.length);
                            if(rep.includes(")")) {
                                rep = rep.split(")")[1];
                            }
                            if(rex.includes("(")) {
                                rex = rex.split("(")[0];
                            }
                            let makeup = pathx;
                            if(rep !== "") {
                                makeup = ("~|~" + makeup + "~|~").split(rep).slice(1).join(rep);
                                makeup = makeup.replaceAll("~|~", "");
                            }
                            let pathxx = makeup;
                            if(rex !== "") {
                                makeup = ("~|~" + makeup + "~|~").split(rex).slice(0, 1).join(rep);
                                makeup = makeup.replaceAll("~|~", "");
                            }
                            pathx = pathx.split(makeup)[1];
                            if(pathx == null) {
                                pathx = pathxx;
                            }
                            resl = resl.replaceAll(ccp, makeup);
                            let ix = i.split(")");
                            i = ix.slice(1, ix.length).join(")");
                            cc++;
                        }
                    }
                    if(ii.includes("qsa") && req.url.includes("?")) {
                        resl = resl + "&" + ("~|~" + req.url + "~|~").split("?")[1].replaceAll("~|~", "");
                    }
                    let reslq = resl.split("?");
                    if(reslq.length == 0) {
                        reslq = {};
                    } else {
                        reslq = qstr.parse(reslq[1] + "");
                    }
                    let custr = {
                        "body": req.body,
                        "headers": req.headers,
                        "cookies": req.cookies,
                        "method": req.method,
                        "url": path.join(conf.tree.path, resl),
                        "hostname": req.hostname,
                        "path": "/" + resl.split("?")[0],
                        "query": reslq
                    }
                    resolveFile(conf, path.join(conf.tree.path, custr.path), gen, custr, res);
                }
                id++;
            }
        }
        if(found == 0) {
            if(req.path == "/") {
                let pmu2 = path.join(conf.tree.path, "index.html");
                if(fs.existsSync(pmu2)) {
                    resolveFile(conf, pmu2, gen, req, res);
                } else {
                    pmu3 = path.join(conf.tree.path, "index.php");
                    if(fs.existsSync(pmu3)) {
                        resolveFile(conf, pmu3, gen, req, res);
                    } else {
                        resolveFile(conf, path.join(__dirname, "/assets/404.html"), gen, req, res);
                    }
                }
            } else {
                let pmu = path.join(conf.tree.path, req.path.substring(1));
                if(fs.existsSync(pmu)) {
                    resolveFile(conf, pmu, gen, req, res);
                } else {
                    resolveFile(conf, path.join(__dirname, "/assets/404.html"), gen, req, res);
                }
            }
        }

    });

    exprArray[parseInt(conf.id)] = [gen, null];
}

async function refreshSiteArray() {
    let counter = -1;
    fs.readdirSync(path.join(__dirname, "server/sites")).forEach((i) => {
        if(!i.includes("hold") && !i.includes("tree")) {
            const cont = JSON.parse(fs.readFileSync(path.join(__dirname, "server/sites/", i), "utf8"));
            const id = parseInt(i.split(".json")[0]);
            servArray[id] = {
                "id": id,
                "tree": cont,
                "port": parseInt(id) + 80
            };
            initalizeServer(servArray[id]);
            counter++;
        }
    });
}
refreshSiteArray();

async function createWindow () {
    const win = new BrowserWindow({
        width: 800,
        height: 550,
        titleBarStyle: "hiddenInset",
        show: false,
        paintWhenInitiallyHidden: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    win.loadURL("file://" + path.join(__dirname, 'assets/site/website.html#0'));
    win.on("ready-to-show", () => {
        win.show();
    });
    win.webContents.addListener("ipc-message", (e, c, t) => {
        if(c = "CONTROLLER") {
            let id = parseInt(t.split(":")[1]);
            let ac = t.split(":")[0];
            let conf = servArray[id];
            let env = exprArray[id];
            if(ac == "start") {
                env[1] = env[0].listen(parseInt(conf.port));
            } else if(ac == "restart") {
                if(env[1] !== null) {
                    env[1].close();
                    initalizeServer(servArray[id]);
                }
                let env2 = exprArray[id];
                env2[1] = env2[0].listen(parseInt(conf.port));
            } else if(ac == "stop") {
                if(env[1] !== null) {
                    env[1].close();
                }
            }
        }
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});