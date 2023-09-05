"use strict";

const BLACK = 1, WHITE = -1;
let data = [];
let turn = true;
const board = document.getElementById("board");
const h2 = document.querySelector("h2");
const infomation = document.getElementById("infomation");
const counter = document.getElementById("counter");
let cells = 8; // マスの数
let latestPutDisc = "";

let MODE = 0; // 0:マッチAPI前 1:マッチ捜索中 2:自手待ち 3:受信(相手)待ち 4: 自身も手送信待ち 99:マッチ失敗
const myId = crypto.randomUUID();
let myCloer = BLACK;

function start() {
    board.innerHTML = "";
    init();
    modal.classList.add("hide");
}

function init() {
    MODE = 0;
    for (let i = 0; i < cells; i++) {
        const tr = document.createElement("tr");
        data[i] = Array(cells).fill(0);
        for (let j = 0; j < cells; j++) {
            const td = document.createElement("td");
            const disk = document.createElement("div");
            tr.appendChild(td);
            td.appendChild(disk);
            td.className = "cell";
            td.onclick = clicked;
        }
        board.appendChild(tr);
    }
    putDisc(3, 3, WHITE);
    putDisc(4, 4, WHITE);
    putDisc(3, 4, BLACK);
    putDisc(4, 3, BLACK);
    // マッチングAPIコール
    var request = new XMLHttpRequest();
    request.open('GET', 'https://cwylm72ahf.execute-api.ap-northeast-1.amazonaws.com/dev/rv/entry/regist?terminal_id=' + myId, true);
    request.responseType = 'json';
    request.onload = function () {
        var data = this.response;
        console.log("rv/entry/regist");
        console.log(data);
        MODE = 1;
        document.getElementById("infomation").textContent = "マッチ検索中です";
        searchMatching();
    };
    request.send();

    showTurn();
}

function showMassege(massege) {
    alert(massege);
}

function searchMatching() {
    var request = new XMLHttpRequest();
    request.open('GET', 'https://cwylm72ahf.execute-api.ap-northeast-1.amazonaws.com/dev/rv/entry/check?terminal_id=' + myId, true);
    request.responseType = 'json';
    request.onload = function () {
        console.log("rv/entry/search");
        var data = this.response;
        console.log(data);
        if (data.status == "MATCHED") {
            MODE = 2;
            let terminalID_A = data.terminal_id_A;
            let terminalID_B = data.terminal_id_B;
            if (myId == terminalID_A) {
                // turn = true;
                myCloer = BLACK;
                document.getElementById("infomation").textContent = "あなたは黒番です";
            } else {
                MODE = 3;
                // turn = false;
                myCloer = WHITE;
                document.getElementById("infomation").textContent = "あなたは白番です";
                setTimeout(searchPutDisc, 5000); // 再帰なので注意
            }
        } else {
            setTimeout(searchMatching, 5000); // 再帰なので注意
        }
    };
    request.send();
}


function sendPutDisc(x, y) {
    var request = new XMLHttpRequest();
    let left = convertNumToAlfa(String(x));
    latestPutDisc = left + (y + 1);
    console.log("latestPutDisc:" + latestPutDisc);
    request.open('GET', 'https://cwylm72ahf.execute-api.ap-northeast-1.amazonaws.com/dev/rv/action/regist?terminal_id=' + myId + '&action=' + latestPutDisc, true);
    request.responseType = 'json';
    request.onload = function () {
        console.log("rv/action/regist");
        var data = this.response;
        console.log(data);
        MODE = 3;
        searchPutDisc();
        document.getElementById("infomation").textContent = "送信しました:" + latestPutDisc;
    };
    request.send();
}

function searchPutDisc() {
    var request = new XMLHttpRequest();
    request.open('GET', 'https://cwylm72ahf.execute-api.ap-northeast-1.amazonaws.com/dev/rv/action/check?terminal_id=' + myId, true);
    request.responseType = 'json';
    request.onload = function () {
        console.log("rv/action/check");
        var data = this.response;
        console.log(data);
        let latest = data.latest;
        if (latest === latestPutDisc) {
            setTimeout(searchPutDisc, 5000); // 再帰なので注意
            return;
        }
        let x = Number(convertAlfaToNum(latest[0]));
        let y = latest[1];
        clickedAitePlayer(x, y - 1);
        MODE = 2;
        document.getElementById("infomation").textContent = "受信しました:" + latest;
    };
    request.send();
}

function convertNumToAlfa(str) {
    return str.replace("0", "A").replace("1", "B").replace("2", "C").replace("3", "D").replace("4", "E").replace("5", "F").replace("6", "G").replace("7", "H");
}

function convertAlfaToNum(str) {
    return str.replace("A", "0").replace("B", "1").replace("C", "2").replace("D", "3").replace("E", "4").replace("F", "5").replace("G", "6").replace("H", "7");
}


// init();
start();

function putDisc(x, y, color) {
    board.rows[y].cells[x].firstChild.className =
        color === BLACK ? "black" : "white";
    board.rows[y].cells[x].animate(
        { opacity: [0.4, 1] },
        { duration: 700, fill: "forwards" }
    );
    data[y][x] = color;
}

function showTurn() {
    h2.textContent = turn ? "黒の番です" : "白の番です";
    let numWhite = 0,
        numBlack = 0,
        numEmpty = 0;
    for (let x = 0; x < cells; x++) {
        for (let y = 0; y < cells; y++) {
            if (data[x][y] === WHITE) {
                numWhite++;
            }
            if (data[x][y] === BLACK) {
                numBlack++;
            }
            if (data[x][y] === 0) {
                numEmpty++;
            }
        }
    }
    document.getElementById("numBlack").textContent = numBlack;
    document.getElementById("numWhite").textContent = numWhite;

    let blacDisk = checkReverse(BLACK);
    let whiteDisk = checkReverse(WHITE);

    if (numWhite + numBlack === cells * cells || (!blacDisk && !whiteDisk)) {
        if (numBlack > numWhite) {
            document.getElementById("numBlack").textContent = numBlack + numEmpty;
            h2.textContent = "黒の勝ち!!";
            restartBtn();
            showAnime();
        } else if (numBlack < numWhite) {
            document.getElementById("numWhite").textContent = numWhite + numEmpty;
            h2.textContent = "白の勝ち!!";
            restartBtn();
            showAnime();
        } else {
            h2.textContent = "引き分け";
            restartBtn();
            showAnime();
        }
        return;
    }
    if (!blacDisk && turn) {
        h2.textContent = "黒スキップ";
        showAnime();
        turn = !turn;
        setTimeout(showTurn, 2000);
        return;
    }
    if (!whiteDisk && !turn) {
        h2.textContent = "白スキップ";
        showAnime();
        turn = !turn;
        setTimeout(showTurn, 2000);
        return;
    }
}

function clicked() {
    if (MODE !== 2) {
        // 自手待ち状態以外はクリック無効
        return;
    }
    const color = turn ? BLACK : WHITE;
    if (color !== myCloer) {
        return;
    }
    const y = this.parentNode.rowIndex;
    const x = this.cellIndex;
    console.log("clicked :" + x + "," + y);

    console.log(typeof x);
    console.log(typeof y);
    // マスに置けるかチェック
    if (data[y][x] !== 0) {
        return;
    }
    const result = checkPut(x, y, color);
    console.log("checkPut1:" + result.length);
    if (result.length > 0) {
        result.forEach((value) => {
            putDisc(value[0], value[1], color);
        });
        turn = !turn;
        sendPutDisc(x, y);
    }
    showTurn();
}

function clickedAitePlayer(x, y) {
    console.log("clickedAitePlayer :" + x + "," + y);
    console.log(typeof x);
    console.log(typeof y);
    const color = turn ? BLACK : WHITE;
    console.log("color:" + color);
    console.log("myCloer:" + myCloer);
    if (color === myCloer) {
        console.log("color違反");
        return;
    }
    // マスに置けるかチェック
    if (data[y][x] !== 0) {
        console.log("マス違反");
        return;
    }
    const result = checkPut(x, y, color);
    console.log("checkPut2:" + result.length);
    if (result.length > 0) {
        result.forEach((value) => {
            putDisc(value[0], value[1], color);
        });
        turn = !turn;
    }
    showTurn();
}

function checkPut(x, y, color) {
    let dx, dy;
    const opponentColor = color == BLACK ? WHITE : BLACK;
    let tmpReverseDisk = [];
    let reverseDisk = [];
    // 周囲8方向を調べる配列
    const direction = [
        [-1, 0], // 左
        [-1, 1], // 左下
        [0, 1], // 下
        [1, 1], // 右下
        [1, 0], // 右
        [1, -1], // 右上
        [0, -1], // 上
        [-1, -1], // 左上
    ];

    // すでに置いてある
    if (data[y][x] === BLACK || data[y][x] === WHITE) {
        return [];
    }
    // 置いた石の周りに違う色の石があるかチェック
    for (let i = 0; i < direction.length; i++) {
        dx = direction[i][0] + x;
        dy = direction[i][1] + y;
        if (
            dx >= 0 &&
            dy >= 0 &&
            dx <= cells - 1 &&
            dy <= cells - 1 &&
            opponentColor === data[dy][dx]
        ) {
            tmpReverseDisk.push([x, y]);
            tmpReverseDisk.push([dx, dy]);
            // 裏返せるかチェック
            while (true) {
                dx += direction[i][0];
                dy += direction[i][1];
                if (
                    dx < 0 ||
                    dy < 0 ||
                    dx > cells - 1 ||
                    dy > cells - 1 ||
                    data[dy][dx] === 0
                ) {
                    tmpReverseDisk = [];
                    break;
                }
                if (opponentColor === data[dy][dx]) {
                    tmpReverseDisk.push([dx, dy]);
                }
                if (color === data[dy][dx]) {
                    reverseDisk = reverseDisk.concat(tmpReverseDisk);
                    tmpReverseDisk = [];
                    break;
                }
            }
        }
    }
    return reverseDisk;
}

function checkReverse(color) {
    for (let x = 0; x < cells; x++) {
        for (let y = 0; y < cells; y++) {
            const result = checkPut(x, y, color);
            // console.log(result);
            if (result.length > 0) {
                return true;
            }
        }
    }
    return false;
}

function restartBtn() {
    const restartBtn = document.getElementById("restartBtn");
    restartBtn.classList.remove("hide");
    restartBtn.animate(
        { opacity: [1, 0.5, 1] },
        { delay: 2000, duration: 3000, iterations: "Infinity" }
    );

    restartBtn.addEventListener("click", () => {
        document.location.reload();
    });
}
function showAnime() {
    h2.animate({ opacity: [0, 1] }, { duration: 500, iterations: 4 });
}

function sleep(waitSec, callbackFunc) {
    console.log("sleep");
    setTimeout(callbackFunc, waitSec * 1000);
}