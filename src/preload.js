const {contextBridge, ipcRenderer} = require('electron');
const fs = require('fs');
const path = require('path');
const ncmd = require('node-cmd');

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type]);
    }
});

contextBridge.exposeInMainWorld("api", {
    "fs": fs,
    "path": path,
    "open": async(url) => {
        let cmd = "";
        if(process.platform == "darwin") {
            cmd = "open " + url;
        } else if(process.platform == "win") {
            cmd = "start \"" + url + "\"";
        } else {
            cmd = "xdg-open \"" + url + "\"";
        }
        cmd = "cd " + __dirname + " && " + cmd;
        console.log(cmd);
        let d = ncmd.runSync(cmd);
        console.log(d);
    },
    "sendm": ipcRenderer.send
});
contextBridge.exposeInMainWorld("var", {
    "dir": path.join(__dirname + "/assets/site/js")
});