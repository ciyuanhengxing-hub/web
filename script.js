window.onload = function () {
    function $(id) {
        return document.getElementById(id);
    }

    var game = $("game");
    var gameStart = $("gameStart");
    var gameEnter = $("gameEnter");
    var plane = $("plane");
    var imageButton = $("imageButton");
    var startCover = $("startCover");
    var startText = $("startText");
    var gameOverScore = $("gameOverScore");
    var soundButton = $("soundButton");
    var pauseButton = $("pauseButton");
    var retryButton = $("retryButton");
    var heartBox = $("hearts");
    var energyBox = $("energy");
    var scoreBox = $("score");
    var enemyBox = $("enemy");
    var shieldBox = $("shield");
    var warningBox = $("warning");
    var enemyBulletBox = $("enemyBullet");
    var bulletBox = $("bullet");
    var effectBox = $("effect");
    var bgCanvas = $("bgCanvas");
    var ctx = bgCanvas.getContext("2d");
    var bgm = $("bgm");

    var bgImg = new Image();
    bgImg.src = "img/background.png";

    bgm.volume = 0.5;
    bgm.preload = "auto";

    var soundOn = true;

    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;

    var offCanvas = document.createElement("canvas");
    var offCtx = offCanvas.getContext("2d");
    offCtx.imageSmoothingEnabled = false;
    offCtx.webkitImageSmoothingEnabled = false;
    offCtx.mozImageSmoothingEnabled = false;
    offCtx.msImageSmoothingEnabled = false;

    var x = 0;
    var y = 0;
    var speed = 8;

    var keys = {};
    var gameRunning = false;
    var waitingStart = false;
    var gameOver = false;

    var dragging = false;
    var dragPointerId = null;
    var dragOffsetX = 0;
    var dragOffsetY = 0;
    var dragTargetX = 0;
    var dragTargetY = 0;

    var bullets = [];
    var specialBullets = [];
    var enemyBullets = [];
    var eliteBullets = [];
    var enemies = [];
    var shields = [];
    var rocketExplosions = [];

    var bulletSpeed = 20;
    var bulletW = 12;
    var bulletH = 24;
    var shootCooldown = 150;
    var lastShootTime = 0;
    var playerBulletDamage = 10;

    var specialFireCooldown = 250;
    var lastSpecialFireTime = 0;

    var playerHP = 3;
    var heartImgs = [];
    var playerHurtLockUntil = 0;

    var energyLevel = 0;
    var energyProgress = 0;
    var eliteKillCounter = 0;

    var score = 0;

    var enemyIdSeed = 1;

    var enemySpawnCooldown = 750;
    var lastEnemySpawnTime = 0;
    var enemySpawnPauseUntil = 0;

    var eliteSpawnCooldown = 3000;
    var lastEliteSpawnTime = 0;

    var enemy4SpawnCooldown = 15000;
    var nextEnemy4SpawnTime = 0;

    var nextBarrierSpawnTime = 0;
    var barrierSpawnInterval = 30000;

    var playerDeathStartTime = 0;

    var enemyTypes = {
        basic: {
            src: "img/enemy.png",
            width: 33,
            height: 40,
            hp: 1,
            speed: 1.5,
            fireCooldown: 2000,
            fireMinRange: 150,
            fireMaxRange: 260,
            fireBulletSpeed: 2.0,
            canFire: true,
            energyCharge: 1
        },
        barrier: {
            src: "img/enemy_2.png",
            width: 180,
            height: 220,
            hp: 150,
            speed: 0.3,
            fireCooldown: 0,
            fireMinRange: 0,
            fireMaxRange: 0,
            fireBulletSpeed: 0,
            canFire: false,
            shieldSrc: "img/hz.png",
            shieldWidth: 270,
            shieldHeight: 145,
            shieldOffsetX: -45,
            shieldOffsetY: 78,
            energyCharge: 3
        },
        elite: {
            src: "img/enemy_3.png",
            width: 46,
            height: 56,
            hp: 30,
            speed: 1.5,
            fireCooldown: 4000,
            fireMinRange: 0,
            fireMaxRange: 0,
            fireBulletSpeed: 4.2,
            canFire: true,
            energyCharge: 0
        },
        enemy4: {
            src: "img/enemy_4.png",
            width: 96,
            height: 68,
            hp: 50,
            speed: 0,
            fireCooldown: 0,
            fireMinRange: 0,
            fireMaxRange: 0,
            fireBulletSpeed: 0,
            canFire: false,
            energyCharge: 2
        }
    };

    var bgW = 0;
    var bgH = 0;
    var bgOffset = 0;
    var bgSpeed = 1;
    var bgRunning = false;
    var bgRAF = null;
    var bgReady = false;

    function isMenuTarget(target) {
        return target && target.closest && target.closest("#gameMenu");
    }

    function setCoverText(text) {
        startText.innerText = text;
    }

    function renderPlane() {
        plane.style.left = Math.round(x) + "px";
        plane.style.top = Math.round(y) + "px";
    }

    function clampPlane() {
        var maxX = gameEnter.clientWidth - plane.offsetWidth;
        var maxY = gameEnter.clientHeight - plane.offsetHeight;

        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x > maxX) x = maxX;
        if (y > maxY) y = maxY;

        renderPlane();
    }

    function setPlaneStart() {
        requestAnimationFrame(function () {
            x = (gameEnter.clientWidth - plane.offsetWidth) / 2;
            y = gameEnter.clientHeight - plane.offsetHeight - 20;
            clampPlane();
        });
    }

    function clearInputState() {
        keys = {};
        dragging = false;
        dragPointerId = null;
    }

    function clearBullets() {
        bullets = [];
        specialBullets = [];
        bulletBox.innerHTML = "";
    }

    function clearEnemyBullets() {
        enemyBullets = [];
        eliteBullets = [];
        enemyBulletBox.innerHTML = "";
    }

    function clearEnemies() {
        enemies = [];
        enemyBox.innerHTML = "";
    }

    function clearShields() {
        shields = [];
        shieldBox.innerHTML = "";
    }

    function clearWarnings() {
        warningBox.innerHTML = "";
    }

    function clearEffects() {
        rocketExplosions = [];
        effectBox.innerHTML = "";
    }

    function clearEnemySystem() {
        clearEnemies();
        clearBullets();
        clearEnemyBullets();
        clearShields();
        clearWarnings();
        clearEffects();
    }

    function resizeCanvas() {
        bgW = gameEnter.clientWidth;
        bgH = gameEnter.clientHeight;
        bgCanvas.width = bgW;
        bgCanvas.height = bgH;
        offCanvas.width = bgW;
        offCanvas.height = bgH;
    }

    function prepareBackground() {
        if (!bgImg.complete || bgImg.naturalWidth === 0 || !bgW || !bgH) return;
        offCtx.clearRect(0, 0, bgW, bgH);
        offCtx.drawImage(bgImg, 0, 0, bgW, bgH);
        bgReady = true;
    }

    function drawBackground() {
        if (!bgW || !bgH) return;

        ctx.clearRect(0, 0, bgW, bgH);

        if (!bgReady) {
            if (bgImg.complete && bgImg.naturalWidth > 0) {
                prepareBackground();
            } else {
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, bgW, bgH);
                return;
            }
        }

        var offset = Math.floor(bgOffset) % bgH;
        if (offset < 0) offset += bgH;

        if (offset === 0) {
            ctx.drawImage(offCanvas, 0, 0, bgW, bgH, 0, 0, bgW, bgH);
            return;
        }

        ctx.drawImage(offCanvas, 0, offset, bgW, bgH - offset, 0, 0, bgW, bgH - offset);
        ctx.drawImage(offCanvas, 0, 0, bgW, offset, 0, bgH - offset, bgW, offset);
    }

    function loopBackground() {
        if (!bgRunning) return;
        drawBackground();
        bgOffset += bgSpeed;
        if (bgOffset >= bgH) bgOffset -= bgH;
        bgRAF = requestAnimationFrame(loopBackground);
    }

    function startBackground() {
        if (bgRunning) return;
        bgRunning = true;
        resizeCanvas();
        prepareBackground();
        drawBackground();
        bgRAF = requestAnimationFrame(loopBackground);
    }

    function stopBackground() {
        bgRunning = false;
        if (bgRAF !== null) {
            cancelAnimationFrame(bgRAF);
            bgRAF = null;
        }
    }

    function renderHearts() {
        heartBox.innerHTML = "";
        heartImgs = [];

        for (var i = 0; i < 3; i++) {
            var img = document.createElement("img");
            img.draggable = false;
            img.src = i < playerHP ? "img/heart.png" : "img/heart2.png";
            heartBox.appendChild(img);
            heartImgs.push(img);
        }
    }

    function refreshHearts() {
        for (var i = 0; i < heartImgs.length; i++) {
            heartImgs[i].src = i < playerHP ? "img/heart.png" : "img/heart2.png";
        }
    }

    function renderEnergy() {
        energyBox.innerHTML = "";
        var img = document.createElement("img");
        img.draggable = false;
        img.src = "img/energy_" + (energyLevel + 1) + ".png";
        energyBox.appendChild(img);

        if (energyLevel >= 5) {
            energyBox.classList.add("full");
        } else {
            energyBox.classList.remove("full");
        }
    }

    function renderScore() {
        scoreBox.innerText = "score：" + score;
    }

    function updateGameOverScore() {
        if (gameOver) {
            gameOverScore.style.display = "block";
            gameOverScore.innerText = "score：" + score;
        } else {
            gameOverScore.style.display = "none";
            gameOverScore.innerText = "";
        }
    }

    function addEnergyProgressPoints(points) {
        if (energyLevel >= 5) {
            renderEnergy();
            return;
        }

        energyProgress += points;

        while (energyProgress >= 10 && energyLevel < 5) {
            energyProgress -= 10;
            energyLevel++;
        }

        if (energyLevel >= 5) {
            energyLevel = 5;
            energyProgress = 0;
        }

        renderEnergy();
    }

    function registerEliteKill() {
        eliteKillCounter++;
        if (eliteKillCounter >= 2) {
            eliteKillCounter -= 2;
            addEnergyProgressPoints(10);
        } else {
            renderEnergy();
        }
    }

    function addEnergyFromEnemy(typeName) {
        var type = enemyTypes[typeName] || enemyTypes.basic;

        if (typeName === "elite") {
            registerEliteKill();
            return;
        }

        var charge = type.energyCharge || 1;
        addEnergyProgressPoints(charge);
    }

    function addScoreFromEnemy(enemyItem) {
        score += enemyItem.scoreValue || 0;
        renderScore();
    }

    function updateSoundButton() {
        soundButton.src = soundOn ? "img/sound_k.png" : "img/sound_g.png";
    }

    function playBgm() {
        if (!soundOn) return;

        if (bgm.ended) {
            try {
                bgm.currentTime = 0;
            } catch (err) {}
        }

        var p = bgm.play();
        if (p && p.catch) {
            p.catch(function () {});
        }
    }

    function pauseBgm() {
        bgm.pause();
    }

    bgm.addEventListener("ended", function () {
        if (!soundOn) return;
        try {
            bgm.currentTime = 0;
        } catch (err) {}
        playBgm();
    });

    function toggleSound() {
        soundOn = !soundOn;
        updateSoundButton();

        if (soundOn) {
            if (gameRunning && !gameOver) {
                playBgm();
            }
        } else {
            pauseBgm();
        }
    }

    function showCover(text) {
        setCoverText(text || "點擊繼續");
        startCover.style.display = "flex";
        waitingStart = true;
        gameRunning = false;
        clearInputState();
        stopBackground();
        pauseBgm();
        updateGameOverScore();
    }

    function hideCover() {
        startCover.style.display = "none";
        waitingStart = false;
        updateGameOverScore();
    }

    function createExplosion(cx, cy, size) {
        var ex = document.createElement("div");
        ex.className = "explosion";
        ex.style.width = size + "px";
        ex.style.height = size + "px";
        ex.style.left = Math.round(cx - size / 2) + "px";
        ex.style.top = Math.round(cy - size / 2) + "px";

        effectBox.appendChild(ex);

        setTimeout(function () {
            if (ex && ex.parentNode) {
                ex.parentNode.removeChild(ex);
            }
        }, 360);
    }

    function createRocketExplosion(cx, cy) {
        var radius = 84;
        createExplosion(cx, cy, radius * 2);
        rocketExplosions.push({
            x: cx,
            y: cy,
            r: radius,
            damage: 1,
            start: Date.now(),
            duration: 360,
            hitPlayer: false
        });
    }

    function triggerGameOver(now) {
        if (gameOver) return;

        gameOver = true;
        gameRunning = false;
        waitingStart = false;
        game.classList.add("gameOver");
        setCoverText("遊戲結束");
        startCover.style.display = "flex";
        clearInputState();
        stopBackground();
        pauseBgm();

        playerDeathStartTime = now || Date.now();

        createExplosion(x + plane.offsetWidth / 2, y + plane.offsetHeight / 2, 76);
        setTimeout(function () {
            createExplosion(x + plane.offsetWidth / 2 + 8, y + plane.offsetHeight / 2 - 6, 46);
        }, 120);

        updateGameOverScore();
    }

    function startGame() {
        if (!waitingStart || gameOver) return;

        hideCover();
        gameRunning = true;
        clearInputState();
        lastShootTime = Date.now();
        lastEnemySpawnTime = Date.now();
        lastEliteSpawnTime = Date.now();
        enemySpawnPauseUntil = 0;
        startBackground();

        if (soundOn && bgm.paused) {
            playBgm();
        }
    }

    function pauseGame() {
        if (!gameRunning || gameOver) return;
        showCover("點擊繼續");
        pauseBgm();
    }

    function resetGame() {
        clearInputState();
        clearEnemySystem();
        bgOffset = 0;

        gameOver = false;
        game.classList.remove("gameOver");

        playerHP = 3;
        playerHurtLockUntil = 0;
        playerDeathStartTime = 0;

        energyLevel = 0;
        energyProgress = 0;
        eliteKillCounter = 0;

        score = 0;

        gameRunning = true;
        waitingStart = false;
        startCover.style.display = "none";

        lastShootTime = Date.now();
        lastSpecialFireTime = 0;
        lastEnemySpawnTime = Date.now();
        lastEliteSpawnTime = Date.now();
        enemySpawnPauseUntil = 0;
        nextBarrierSpawnTime = Date.now() + barrierSpawnInterval;
        nextEnemy4SpawnTime = Date.now() + enemy4SpawnCooldown;

        renderHearts();
        renderEnergy();
        renderScore();
        updateGameOverScore();
        setPlaneStart();
        startBackground();

        if (soundOn && bgm.paused) {
            playBgm();
        }
    }

    function hitTest(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }

    function rectIntersectsCircle(rx, ry, rw, rh, cx, cy, r) {
        var nearestX = Math.max(rx, Math.min(cx, rx + rw));
        var nearestY = Math.max(ry, Math.min(cy, ry + rh));
        var dx = cx - nearestX;
        var dy = cy - nearestY;
        return dx * dx + dy * dy <= r * r;
    }

    function renderShield(sh) {
        sh.el.style.left = Math.round(sh.x) + "px";
        sh.el.style.top = Math.round(sh.y) + "px";
        sh.el.style.width = sh.w + "px";
        sh.el.style.height = sh.h + "px";
    }

    function removeShield(sh) {
        if (!sh) return;

        if (sh.el && sh.el.parentNode) {
            sh.el.parentNode.removeChild(sh.el);
        }

        for (var i = shields.length - 1; i >= 0; i--) {
            if (shields[i] === sh) {
                shields.splice(i, 1);
                break;
            }
        }
    }

    function createShieldForEnemy(enemy) {
        var type = enemyTypes[enemy.type];
        if (!type.shieldSrc) return null;

        var el = document.createElement("img");
        el.src = type.shieldSrc;
        el.draggable = false;

        var sh = {
            enemyId: enemy.id,
            el: el,
            x: enemy.x + type.shieldOffsetX,
            y: enemy.y + type.shieldOffsetY,
            w: type.shieldWidth,
            h: type.shieldHeight,
            follow: true,
            solid: false
        };

        renderShield(sh);
        shieldBox.appendChild(el);
        shields.push(sh);

        return sh;
    }

    function createEnemy4Warning(enemy) {
        removeEnemy4Warning(enemy);

        var left = document.createElement("div");
        var right = document.createElement("div");
        left.className = "warningLine";
        right.className = "warningLine";

        warningBox.appendChild(left);
        warningBox.appendChild(right);

        enemy.warningEls = [left, right];
        renderEnemy4Warning(enemy);
    }

    function renderEnemy4Warning(enemy) {
        if (!enemy.warningEls || enemy.warningEls.length < 2) return;

        var top = Math.max(0, Math.round(enemy.y + enemy.h * 0.45));
        var height = Math.max(0, gameEnter.clientHeight - top);
        var leftX = Math.round(enemy.x + 8);
        var rightX = Math.round(enemy.x + enemy.w - 8);

        enemy.warningEls[0].style.left = leftX + "px";
        enemy.warningEls[0].style.top = top + "px";
        enemy.warningEls[0].style.height = height + "px";

        enemy.warningEls[1].style.left = rightX + "px";
        enemy.warningEls[1].style.top = top + "px";
        enemy.warningEls[1].style.height = height + "px";
    }

    function removeEnemy4Warning(enemy) {
        if (!enemy || !enemy.warningEls) return;

        for (var i = 0; i < enemy.warningEls.length; i++) {
            var el = enemy.warningEls[i];
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        }

        enemy.warningEls = null;
    }

    function isPlaneBlockedByShield(px, py) {
        var pw = plane.offsetWidth;
        var ph = plane.offsetHeight;

        for (var i = 0; i < shields.length; i++) {
            var sh = shields[i];
            if (!sh.solid) continue;

            if (hitTest(
                px + 6, py + 6, pw - 12, ph - 12,
                sh.x + 4, sh.y + 4, sh.w - 8, sh.h - 8
            )) {
                return true;
            }
        }

        return false;
    }

    function getEnemyType(typeName) {
        return enemyTypes[typeName] || enemyTypes.basic;
    }

    function canPlaceEnemy(ex, ey, ew, eh) {
        var pad = 10;

        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (hitTest(ex - pad, ey - pad, ew + pad * 2, eh + pad * 2, e.x, e.y, e.w, e.h)) {
                return false;
            }
        }

        for (var s = 0; s < shields.length; s++) {
            var sh = shields[s];
            if (!sh.solid) continue;
            if (hitTest(ex - pad, ey - pad, ew + pad * 2, eh + pad * 2, sh.x, sh.y, sh.w, sh.h)) {
                return false;
            }
        }

        return ex >= 0 && ex <= gameEnter.clientWidth - ew;
    }

    function createEnemy(typeName, ex, ey, now) {
        var type = getEnemyType(typeName);
        var el = document.createElement("img");
        el.src = type.src;
        el.draggable = false;
        el.style.width = type.width + "px";
        el.style.height = type.height + "px";
        el.style.left = Math.round(ex) + "px";
        el.style.top = Math.round(ey) + "px";
        el.style.opacity = "1";

        enemyBox.appendChild(el);

        var enemy = {
            id: enemyIdSeed++,
            type: typeName,
            el: el,
            x: ex,
            y: ey,
            w: type.width,
            h: type.height,
            hp: type.hp,
            scoreValue: type.hp || 0,
            speed: type.speed,
            fireCooldown: type.fireCooldown,
            fireMinRange: type.fireMinRange,
            fireMaxRange: type.fireMaxRange,
            canFire: type.canFire !== false,
            nextFireTime: now + (type.fireCooldown || 0),
            spawned: typeName === "basic" || typeName === "enemy4" ? true : ey >= 0,
            shield: null,
            warningEls: null,
            phase: null,
            phaseStart: 0,
            warnDuration: 1250,
            chargeDuration: 900,
            chargeSpeed: 14.5,
            chargeEndTime: 0,
            chargeLineSide: null,
            chargeLineX: 0
        };

        if (type.shieldSrc) {
            enemy.shield = createShieldForEnemy(enemy);
        }

        if (typeName === "enemy4") {
            enemy.phase = "warn";
            enemy.phaseStart = now;
            enemy.chargeLineSide = x + plane.offsetWidth / 2 <= ex + type.width / 2 ? "left" : "right";
            createEnemy4Warning(enemy);
        }

        enemies.push(enemy);
    }

    function countEliteEnemies() {
        var count = 0;
        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i].type === "elite") count++;
        }
        return count;
    }

    function countEnemy4() {
        var count = 0;
        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i].type === "enemy4") count++;
        }
        return count;
    }

    function hasActiveBarrier() {
        for (var i = 0; i < enemies.length; i++) {
            if (enemies[i].type === "barrier") return true;
        }
        return false;
    }

    function spawnBarrierIfNeeded(now) {
        if (now < nextBarrierSpawnTime) return;
        if (hasActiveBarrier()) return;

        var type = getEnemyType("barrier");
        var placed = false;

        for (var tryCount = 0; tryCount < 20; tryCount++) {
            var maxX = gameEnter.clientWidth - type.width;
            var xPos = 8 + Math.random() * Math.max(0, maxX - 16);
            var yPos = -type.height - 60 - Math.random() * 80;

            if (canPlaceEnemy(xPos, yPos, type.width, type.height)) {
                createEnemy("barrier", xPos, yPos, now);
                placed = true;
                break;
            }
        }

        if (placed) {
            nextBarrierSpawnTime = Infinity;
        } else {
            nextBarrierSpawnTime = now + 1000;
        }
    }

    function spawnEnemyWave(now) {
        if (now < enemySpawnPauseUntil) return;

        var maxEnemies = 20;
        var available = maxEnemies - enemies.length;
        if (available <= 0) {
            enemySpawnPauseUntil = now + 5000;
            return;
        }

        var count = Math.min(1 + Math.floor(Math.random() * 2), available);

        for (var i = 0; i < count; i++) {
            var typeName = "basic";
            var type = getEnemyType(typeName);
            var placed = false;

            for (var tryCount = 0; tryCount < 20; tryCount++) {
                var maxX = gameEnter.clientWidth - type.width;
                var xPos = 8 + Math.random() * Math.max(0, maxX - 16);
                var yPos = -type.height - Math.random() * 160 - i * 35;

                if (canPlaceEnemy(xPos, yPos, type.width, type.height)) {
                    createEnemy(typeName, xPos, yPos, now);
                    placed = true;
                    break;
                }
            }

            if (enemies.length >= maxEnemies) {
                enemySpawnPauseUntil = now + 5000;
                break;
            }

            if (!placed) continue;
        }

        if (enemies.length >= maxEnemies) {
            enemySpawnPauseUntil = now + 5000;
        }
    }

    function spawnEliteWave(now) {
        if (now - lastEliteSpawnTime < eliteSpawnCooldown) return;
        if (countEliteEnemies() >= 5) return;

        var type = getEnemyType("elite");
        var placed = false;

        for (var tryCount = 0; tryCount < 20; tryCount++) {
            var maxX = gameEnter.clientWidth - type.width;
            var xPos = 8 + Math.random() * Math.max(0, maxX - 16);
            var yPos = -type.height - 40 - Math.random() * 100;

            if (canPlaceEnemy(xPos, yPos, type.width, type.height)) {
                createEnemy("elite", xPos, yPos, now);
                placed = true;
                break;
            }
        }

        if (placed) {
            lastEliteSpawnTime = now;
        } else {
            lastEliteSpawnTime = now;
        }
    }

    function spawnEnemy4IfNeeded(now) {
        if (now < nextEnemy4SpawnTime) return;
        if (countEnemy4() > 0) return;

        var type = getEnemyType("enemy4");
        var placed = false;

        for (var tryCount = 0; tryCount < 20; tryCount++) {
            var maxX = gameEnter.clientWidth - type.width;
            var xPos = 8 + Math.random() * Math.max(0, maxX - 16);
            var yPos = 36 + Math.random() * 40;

            if (canPlaceEnemy(xPos, yPos, type.width, type.height)) {
                createEnemy("enemy4", xPos, yPos, now);
                placed = true;
                break;
            }
        }

        if (placed) {
            nextEnemy4SpawnTime = Infinity;
        } else {
            nextEnemy4SpawnTime = now + 1000;
        }
    }

    function fireEnemyBullet(enemyItem) {
        var type = getEnemyType(enemyItem.type);
        if (!type.canFire) return;

        var b = document.createElement("img");
        b.src = "img/e_bullet.png";
        b.draggable = false;

        var bw = 28;
        var bh = 34;
        var bx = Math.round(enemyItem.x + enemyItem.w / 2 - bw / 2);
        var by = Math.round(enemyItem.y + enemyItem.h - 2);

        b.style.left = bx + "px";
        b.style.top = by + "px";
        b.style.width = bw + "px";
        b.style.height = bh + "px";

        enemyBulletBox.appendChild(b);

        enemyBullets.push({
            el: b,
            x: bx,
            y: by,
            w: bw,
            h: bh,
            speed: type.fireBulletSpeed
        });
    }

    function fireEliteRocket(enemyItem) {
        var b = document.createElement("img");
        b.src = "img/enemy_bullet2.png";
        b.draggable = false;

        var bw = 34;
        var bh = 46;
        var bx = Math.round(enemyItem.x + enemyItem.w / 2 - bw / 2);
        var by = Math.round(enemyItem.y + enemyItem.h - 4);

        b.style.left = bx + "px";
        b.style.top = by + "px";
        b.style.width = bw + "px";
        b.style.height = bh + "px";

        enemyBulletBox.appendChild(b);

        eliteBullets.push({
            el: b,
            x: bx,
            y: by,
            w: bw,
            h: bh,
            speed: 4.2
        });
    }

    function playerTakeDamage(now, amount) {
        if (gameOver) return;
        if (now < playerHurtLockUntil) return;

        amount = amount || 1;
        playerHP -= amount;
        if (playerHP < 0) playerHP = 0;
        refreshHearts();

        playerHurtLockUntil = now + 750;

        if (playerHP <= 0) {
            triggerGameOver(now);
        }
    }

    function bulletHitsEnemy(b, e) {
        var bx1 = b.x + 2;
        var bx2 = b.x + bulletW - 2;
        var ex1 = e.x + 4;
        var ex2 = e.x + e.w - 4;

        var top = Math.min(b.y, b.prevY);
        var bottom = Math.max(b.y + bulletH, b.prevY + bulletH);

        var ey1 = e.y + 4;
        var ey2 = e.y + e.h - 4;

        return bx1 < ex2 && bx2 > ex1 && top < ey2 && bottom > ey1;
    }

    function handleEnemyDeathByIndex(index, now) {
        var e = enemies[index];
        if (!e) return false;

        createExplosion(e.x + e.w / 2, e.y + e.h / 2, 42);

        if (e.type === "barrier" && e.shield) {
            e.shield.follow = false;
            e.shield.solid = true;
            renderShield(e.shield);
            nextBarrierSpawnTime = now + barrierSpawnInterval;
        } else if (e.shield) {
            removeShield(e.shield);
        }

        if (e.type === "enemy4") {
            removeEnemy4Warning(e);
            nextEnemy4SpawnTime = now + enemy4SpawnCooldown;
        }

        if (e.el && e.el.parentNode) {
            e.el.parentNode.removeChild(e.el);
        }

        enemies.splice(index, 1);

        score += e.scoreValue || 0;
        renderScore();

        if (e.type === "elite") {
            registerEliteKill();
        } else {
            addEnergyFromEnemy(e.type);
        }

        return true;
    }

    function finishEnemy4ByIndex(index, now) {
        var e = enemies[index];
        if (!e) return false;

        removeEnemy4Warning(e);

        if (e.el && e.el.parentNode) {
            e.el.parentNode.removeChild(e.el);
        }

        enemies.splice(index, 1);
        nextEnemy4SpawnTime = now + enemy4SpawnCooldown;
        return true;
    }

    function updateEnemy4(e, index, now) {
        var planeW = plane.offsetWidth;
        var planeH = plane.offsetHeight;

        if (e.phase === "warn") {
            renderEnemy4Warning(e);

            if (now >= e.phaseStart + e.warnDuration) {
                e.phase = "charge";
                e.chargeEndTime = now + e.chargeDuration;
                e.chargeLineX = e.chargeLineSide === "left" ? e.x + 8 : e.x + e.w - 8;
                removeEnemy4Warning(e);
            }

            return false;
        }

        if (e.phase === "charge") {
            if (e.chargeLineSide === "left") {
                e.x = e.chargeLineX;
            } else {
                e.x = e.chargeLineX - e.w;
            }

            e.y += e.chargeSpeed;

            e.el.style.left = Math.round(e.x) + "px";
            e.el.style.top = Math.round(e.y) + "px";

            if (hitTest(
                e.x + 4, e.y + 4, e.w - 8, e.h - 8,
                x + 6, y + 6, planeW - 12, planeH - 12
            )) {
                playerTakeDamage(now);
                finishEnemy4ByIndex(index, now);
                return true;
            }

            if (
                now >= e.chargeEndTime ||
                e.y > gameEnter.clientHeight + e.h ||
                e.y < -e.h
            ) {
                finishEnemy4ByIndex(index, now);
                return true;
            }
        }

        return false;
    }

    function movePlane() {
        if (!gameRunning) return;

        function tryMoveX(dx) {
            var nx = x + dx;
            var maxX = gameEnter.clientWidth - plane.offsetWidth;
            if (nx < 0) nx = 0;
            if (nx > maxX) nx = maxX;

            if (!isPlaneBlockedByShield(nx, y)) {
                x = nx;
            }
        }

        function tryMoveY(dy) {
            var ny = y + dy;
            var maxY = gameEnter.clientHeight - plane.offsetHeight;
            if (ny < 0) ny = 0;
            if (ny > maxY) ny = maxY;

            if (!isPlaneBlockedByShield(x, ny)) {
                y = ny;
            }
        }

        if (dragging) {
            var dx = dragTargetX - x;
            var dy = dragTargetY - y;

            if (Math.abs(dx) <= speed) {
                tryMoveX(dx);
            } else {
                tryMoveX(dx > 0 ? speed : -speed);
            }

            if (Math.abs(dy) <= speed) {
                tryMoveY(dy);
            } else {
                tryMoveY(dy > 0 ? speed : -speed);
            }

            clampPlane();
            return;
        }

        if (keys["ArrowLeft"] || keys["a"] || keys["A"]) tryMoveX(-speed);
        if (keys["ArrowRight"] || keys["d"] || keys["D"]) tryMoveX(speed);
        if (keys["ArrowUp"] || keys["w"] || keys["W"]) tryMoveY(-speed);
        if (keys["ArrowDown"] || keys["s"] || keys["S"]) tryMoveY(speed);

        clampPlane();
    }

    function shootBullet(now) {
        if (!gameRunning) return;
        if (now - lastShootTime < shootCooldown) return;

        lastShootTime = now;

        var b = document.createElement("img");
        b.src = "img/bullet.png";
        b.draggable = false;

        var bx = Math.round(x + plane.offsetWidth / 2 - bulletW / 2);
        var by = Math.round(y - bulletH + 10);

        if (bx < 0) bx = 0;
        if (bx > gameEnter.clientWidth - bulletW) bx = gameEnter.clientWidth - bulletW;
        if (by < 0) by = 0;

        b.style.left = bx + "px";
        b.style.top = by + "px";

        bulletBox.appendChild(b);

        bullets.push({
            el: b,
            x: bx,
            y: by,
            prevY: by,
            atk: playerBulletDamage
        });
    }

    function fireSpecialBullet(now) {
        if (!gameRunning) return;
        if (energyLevel < 5) return;
        if (now - lastSpecialFireTime < specialFireCooldown) return;

        lastSpecialFireTime = now;
        energyLevel = 0;
        energyProgress = 0;
        renderEnergy();

        var b = document.createElement("img");
        b.src = "img/bullet3.png";
        b.draggable = false;

        var bw = 58;
        var bh = 92;
        var bx = Math.round(x + plane.offsetWidth / 2 - bw / 2);
        var by = Math.round(y - bh + 8);

        if (bx < 0) bx = 0;
        if (bx > gameEnter.clientWidth - bw) bx = gameEnter.clientWidth - bw;
        if (by < 0) by = 0;

        b.style.left = bx + "px";
        b.style.top = by + "px";
        b.style.width = bw + "px";
        b.style.height = bh + "px";

        bulletBox.appendChild(b);

        specialBullets.push({
            el: b,
            x: bx,
            y: by,
            w: bw,
            h: bh,
            speedY: 4,
            accel: 0.45,
            maxSpeed: 18,
            atk: 160,
            hitEnemyIds: {}
        });
    }

    function attemptSpecialFire(now) {
        if (!gameRunning || gameOver) return false;
        if (energyLevel < 5) return false;
        if (now - lastSpecialFireTime < specialFireCooldown) return false;

        fireSpecialBullet(now);
        return true;
    }

    function updateBullets() {
        if (!gameRunning) return;

        for (var i = bullets.length - 1; i >= 0; i--) {
            var item = bullets[i];
            item.prevY = item.y;
            item.y -= bulletSpeed;
            item.el.style.top = Math.round(item.y) + "px";

            if (item.y + bulletH < 0) {
                item.el.remove();
                bullets.splice(i, 1);
            }
        }
    }

    function updateEnemyBullets() {
        if (!gameRunning) return;

        for (var i = enemyBullets.length - 1; i >= 0; i--) {
            var item = enemyBullets[i];
            item.y += item.speed;
            item.el.style.top = Math.round(item.y) + "px";

            if (hitTest(
                item.x + 4, item.y + 4, item.w - 8, item.h - 8,
                x + 6, y + 6, plane.offsetWidth - 12, plane.offsetHeight - 12
            )) {
                item.el.remove();
                enemyBullets.splice(i, 1);
                playerTakeDamage(Date.now());
                continue;
            }

            if (item.y > gameEnter.clientHeight + item.h) {
                item.el.remove();
                enemyBullets.splice(i, 1);
            }
        }
    }

    function updateEliteBullets() {
        if (!gameRunning) return;

        var planeW = plane.offsetWidth;
        var planeH = plane.offsetHeight;

        for (var i = eliteBullets.length - 1; i >= 0; i--) {
            var item = eliteBullets[i];
            item.y += item.speed;
            item.el.style.top = Math.round(item.y) + "px";

            var horizontalOverlap = item.x < x + planeW && item.x + item.w > x;
            var directHit = hitTest(item.x, item.y, item.w, item.h, x, y, planeW, planeH);

            if (directHit || (horizontalOverlap && item.y + item.h >= y - 18)) {
                createRocketExplosion(item.x + item.w / 2, item.y + item.h / 2);
                item.el.remove();
                eliteBullets.splice(i, 1);
                continue;
            }

            if (item.y > gameEnter.clientHeight + item.h) {
                item.el.remove();
                eliteBullets.splice(i, 1);
            }
        }
    }

    function updateRocketExplosions(now) {
        for (var i = rocketExplosions.length - 1; i >= 0; i--) {
            var item = rocketExplosions[i];

            if (gameRunning && !item.hitPlayer) {
                if (rectIntersectsCircle(x, y, plane.offsetWidth, plane.offsetHeight, item.x, item.y, item.r)) {
                    item.hitPlayer = true;
                    playerTakeDamage(now, item.damage);
                }
            }

            if (now - item.start >= item.duration) {
                rocketExplosions.splice(i, 1);
            }
        }
    }

    function updateSpecialBullets() {
        if (!gameRunning) return;

        for (var i = specialBullets.length - 1; i >= 0; i--) {
            var item = specialBullets[i];

            item.speedY = Math.min(item.maxSpeed, item.speedY + item.accel);
            item.y -= item.speedY;
            item.el.style.top = Math.round(item.y) + "px";

            for (var s = shields.length - 1; s >= 0; s--) {
                var sh = shields[s];
                if (!sh.solid) continue;

                if (hitTest(
                    item.x + 8, item.y + 10, item.w - 16, item.h - 20,
                    sh.x + 4, sh.y + 4, sh.w - 8, sh.h - 8
                )) {
                    removeShield(sh);
                }
            }

            for (var j = enemies.length - 1; j >= 0; j--) {
                var e = enemies[j];
                if (item.hitEnemyIds[e.id]) continue;
                if (!e.spawned) continue;

                if (hitTest(
                    item.x + 8, item.y + 10, item.w - 16, item.h - 20,
                    e.x + 3, e.y + 3, e.w - 6, e.h - 6
                )) {
                    item.hitEnemyIds[e.id] = true;
                    e.hp -= item.atk;

                    if (e.hp <= 0) {
                        handleEnemyDeathByIndex(j, Date.now());
                    }
                }
            }

            if (item.y + item.h < 0) {
                item.el.remove();
                specialBullets.splice(i, 1);
            }
        }
    }

    function updateEnemies(now) {
        if (!gameRunning) return;

        var planeW = plane.offsetWidth;
        var planeH = plane.offsetHeight;
        var planeCX = x + planeW / 2;
        var planeCY = y + planeH / 2;

        for (var i = enemies.length - 1; i >= 0; i--) {
            var e = enemies[i];
            var type = getEnemyType(e.type);
            var enemyRemoved = false;

            if (e.type === "enemy4") {
                if (updateEnemy4(e, i, now)) {
                    continue;
                }
            } else {
                e.y += e.speed;
                e.el.style.left = Math.round(e.x) + "px";
                e.el.style.top = Math.round(e.y) + "px";
            }

            if (!e.spawned && e.y >= 0) {
                e.spawned = true;
            }

            if (e.shield && e.shield.follow) {
                e.shield.x = e.x + type.shieldOffsetX;
                e.shield.y = e.y + type.shieldOffsetY;
                renderShield(e.shield);
            }

            var fadeStart = gameEnter.clientHeight - 120;
            if (e.y + e.h > fadeStart) {
                var fade = 1 - ((e.y + e.h - fadeStart) / 120);
                if (fade < 0) fade = 0;
                if (fade > 1) fade = 1;
                e.el.style.opacity = String(fade);

                if (e.shield && e.shield.follow) {
                    e.shield.el.style.opacity = String(Math.max(0.18, fade * 0.45));
                }
            } else {
                e.el.style.opacity = "1";
                if (e.shield && e.shield.follow) {
                    e.shield.el.style.opacity = "0.34";
                }
            }

            if (e.y > gameEnter.clientHeight + 20) {
                if (e.type === "barrier") {
                    if (e.shield) {
                        removeShield(e.shield);
                    }
                    nextBarrierSpawnTime = now + barrierSpawnInterval;
                } else if (e.shield) {
                    removeShield(e.shield);
                }

                e.el.remove();
                enemies.splice(i, 1);
                continue;
            }

            if (!e.spawned) {
                continue;
            }

            if (e.type !== "enemy4" && hitTest(
                e.x + 4, e.y + 4, e.w - 8, e.h - 8,
                x + 6, y + 6, planeW - 12, planeH - 12
            )) {
                playerTakeDamage(now);
            }

            for (var j = bullets.length - 1; j >= 0; j--) {
                var b = bullets[j];

                if (bulletHitsEnemy(b, e)) {
                    b.el.remove();
                    bullets.splice(j, 1);

                    e.hp -= (b.atk || playerBulletDamage);

                    if (e.hp <= 0) {
                        enemyRemoved = handleEnemyDeathByIndex(i, now);
                    }
                    break;
                }
            }

            if (enemyRemoved) {
                continue;
            }

            if (e.canFire) {
                var dx = (e.x + e.w / 2) - planeCX;
                var dy = (e.y + e.h / 2) - planeCY;
                var dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= e.fireMaxRange && dist >= e.fireMinRange) {
                    if (now >= e.nextFireTime) {
                        fireEnemyBullet(e);
                        e.nextFireTime = now + e.fireCooldown;
                    }
                }
            }
        }
    }

    function updatePlayerVisual(now) {
        if (gameOver) {
            if (playerDeathStartTime) {
                var d = now - playerDeathStartTime;
                var fade = 1 - d / 900;
                if (fade < 0) fade = 0;
                plane.style.opacity = String(fade);
            }
            return;
        }

        if (now < playerHurtLockUntil) {
            plane.style.opacity = Math.floor(now / 80) % 2 === 0 ? "0.18" : "1";
        } else {
            plane.style.opacity = "1";
        }
    }

    soundButton.onclick = function (e) {
        e.stopPropagation();
        toggleSound();
    };

    pauseButton.onclick = function (e) {
        e.stopPropagation();
        pauseGame();
    };

    retryButton.onclick = function (e) {
        e.stopPropagation();
        resetGame();
    };

    imageButton.onclick = function () {
        gameStart.style.display = "none";
        gameEnter.style.display = "block";

        gameOver = false;
        game.classList.remove("gameOver");

        clearInputState();
        clearEnemySystem();
        bgOffset = 0;

        waitingStart = true;
        gameRunning = false;
        lastShootTime = 0;
        lastSpecialFireTime = 0;
        lastEnemySpawnTime = 0;
        lastEliteSpawnTime = 0;
        enemySpawnPauseUntil = 0;
        playerHurtLockUntil = 0;
        playerDeathStartTime = 0;

        playerHP = 3;
        energyLevel = 0;
        energyProgress = 0;
        eliteKillCounter = 0;
        score = 0;

        nextBarrierSpawnTime = Date.now() + barrierSpawnInterval;
        nextEnemy4SpawnTime = Date.now() + enemy4SpawnCooldown;

        renderHearts();
        renderEnergy();
        renderScore();
        updateSoundButton();
        updateGameOverScore();

        requestAnimationFrame(function () {
            resizeCanvas();
            prepareBackground();
            drawBackground();
            setPlaneStart();
        });

        showCover("點擊開始遊戲");
    };

    document.addEventListener("keydown", function (e) {
        if (e.code === "Space") {
            e.preventDefault();

            if (waitingStart) {
                if (!isMenuTarget(e.target)) startGame();
                return;
            }

            if (!gameRunning || gameOver) return;

            attemptSpecialFire(Date.now());
            return;
        }

        if (gameOver) return;

        if (waitingStart) {
            if (!isMenuTarget(e.target)) startGame();
            return;
        }

        if (!gameRunning) return;

        keys[e.key] = true;
    });

    document.addEventListener("keyup", function (e) {
        if (!gameRunning) return;
        keys[e.key] = false;
    });

    document.addEventListener("pointerdown", function (e) {
        if (gameOver) return;

        if (waitingStart && !isMenuTarget(e.target)) {
            startGame();
            return;
        }

        if (!gameRunning) return;
        if (isMenuTarget(e.target)) return;
        if (plane.contains(e.target)) return;

        attemptSpecialFire(Date.now());
    });

    plane.addEventListener("pointerdown", function (e) {
        if (!gameRunning || gameOver) return;

        dragging = true;
        dragPointerId = e.pointerId;
        dragOffsetX = e.clientX - x;
        dragOffsetY = e.clientY - y;
        dragTargetX = x;
        dragTargetY = y;

        if (plane.setPointerCapture) {
            try {
                plane.setPointerCapture(e.pointerId);
            } catch (err) {}
        }

        e.preventDefault();
    });

    document.addEventListener("pointermove", function (e) {
        if (!dragging || !gameRunning || e.pointerId !== dragPointerId) return;

        dragTargetX = e.clientX - dragOffsetX;
        dragTargetY = e.clientY - dragOffsetY;
        e.preventDefault();
    });

    document.addEventListener("pointerup", function (e) {
        if (e.pointerId === dragPointerId) {
            dragging = false;
            dragPointerId = null;
        }
    });

    document.addEventListener("pointercancel", function (e) {
        if (e.pointerId === dragPointerId) {
            dragging = false;
            dragPointerId = null;
        }
    });

    window.addEventListener("blur", function () {
        clearInputState();
    });

    window.addEventListener("resize", function () {
        if (gameEnter.style.display === "block") {
            resizeCanvas();
            prepareBackground();
            drawBackground();
            clampPlane();
        }
    });

    bgImg.onload = function () {
        if (gameEnter.style.display === "block") {
            resizeCanvas();
            prepareBackground();
            drawBackground();
        }
    };

    function initUI() {
        playerHP = 3;
        energyLevel = 0;
        energyProgress = 0;
        score = 0;
        renderHearts();
        renderEnergy();
        renderScore();
        updateSoundButton();
        updateGameOverScore();
    }

    initUI();

    setInterval(function () {
        var now = Date.now();

        if (gameRunning) {
            movePlane();
            shootBullet(now);

            if (now >= enemySpawnPauseUntil && now - lastEnemySpawnTime >= enemySpawnCooldown) {
                spawnEnemyWave(now);
                lastEnemySpawnTime = now;
            }

            spawnBarrierIfNeeded(now);
            spawnEliteWave(now);
            spawnEnemy4IfNeeded(now);
        }

        updateBullets();
        updateSpecialBullets();
        updateEnemies(now);
        updateEnemyBullets();
        updateEliteBullets();
        updateRocketExplosions(now);
        updatePlayerVisual(now);
    }, 20);
};