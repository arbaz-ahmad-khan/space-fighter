
// You can write more code here

/* START OF COMPILED CODE */

class Level extends Phaser.Scene {

	constructor() {
		super("Level");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/** @returns {void} */
	editorCreate() {

		// bg
		const bg = this.add.image(540, 960, "bg");

		// container_gameOver
		const container_gameOver = this.add.container(0, 0);
		container_gameOver.visible = false;

		// text_1
		const text_1 = this.add.text(540, 560, "", {});
		text_1.setOrigin(0.5, 0.5);
		text_1.text = "Game Over";
		text_1.setStyle({ "fontFamily": "Arial", "fontSize": "150px", "fontStyle": "bold" });
		container_gameOver.add(text_1);

		// text_gameOverScore
		const text_gameOverScore = this.add.text(540, 820, "", {});
		text_gameOverScore.setOrigin(0.5, 0.5);
		text_gameOverScore.text = "Score";
		text_gameOverScore.setStyle({ "fontFamily": "Arial", "fontSize": "100px", "fontStyle": "bold" });
		container_gameOver.add(text_gameOverScore);

		// text_gameOverBest
		const text_gameOverBest = this.add.text(540, 960, "", {});
		text_gameOverBest.setOrigin(0.5, 0.5);
		text_gameOverBest.text = "Best";
		text_gameOverBest.setStyle({ "fontFamily": "Arial", "fontSize": "100px", "fontStyle": "bold" });
		container_gameOver.add(text_gameOverBest);

		// replay
		const replay = this.add.image(540, 1360, "replay");
		replay.setInteractive(this.input.makePixelPerfect());
		container_gameOver.add(replay);

		this.bg = bg;
		this.text_gameOverScore = text_gameOverScore;
		this.text_gameOverBest = text_gameOverBest;
		this.replay = replay;
		this.container_gameOver = container_gameOver;

		this.events.emit("scene-awake");
	}

	/** @type {Phaser.GameObjects.Image} */
	bg;
	/** @type {Phaser.GameObjects.Text} */
	text_gameOverScore;
	/** @type {Phaser.GameObjects.Text} */
	text_gameOverBest;
	/** @type {Phaser.GameObjects.Image} */
	replay;
	/** @type {Phaser.GameObjects.Container} */
	container_gameOver;

	/* START-USER-CODE */

	// Write more your code here

	create() {

		this.editorCreate();
		this.input.setDefaultCursor('default');
		this.isGameOver = false;
		this.level = 1;
		this.lastFiredTime = 0;
		this.lastSpeedIncreaseTime = 0;
		this.enemyShipSpeed = 100;
		this.score = 0;
		this.bestScore = parseInt(localStorage.getItem('bestScore-SpaceFighter')) || 0;
		this.lastSpeedIncreaseTime = this.time.now;
		this.bullets = this.physics.add.group();
		this.enemies = this.physics.add.group();

		this.playerLives = 3;
		this.livesText = this.add.text(540, 50, 'Lives: ' + this.playerLives, {
			fontSize: '48px', fontFamily: "Arial", fontStyle: "bold", fill: '#fff'
		}).setOrigin(0.5);

		this.enemyShipTextures = ['enemyShip', 'enemyShip-2', 'enemyShip-3', 'enemyShip-4'];
		this.bulletFire = this.sound.add('weaponShoot');
		this.hitEnemy = this.sound.add('bulletKill');
		this.scoreAndBestScoreText();
		this.playerShip = this.physics.add.image(540, 960, 'ship');
		this.playerShip.body.setCircle(32);
		this.playerShip.setScale(3, 3);
		this.playerShip.setDepth(1);

		this.cursors = this.input.keyboard.createCursorKeys();
		this.spawnEnemyShips();

		this.enemySpawnTimer = this.time.addEvent({
			delay: Phaser.Math.Between(1000, 2000),
			callback: this.spawnEnemyShips,
			callbackScope: this,
			loop: true
		});

		this.physics.add.collider(this.playerShip, this.enemies, this.gameOver, null, this);
		this.physics.add.overlap(this.bullets, this.enemies, this.enemyHit, null, this);
	}

	scoreAndBestScoreText() {
		this.scoreText = this.add.text(50, 10, 'Score: 0', {
			fontSize: "48px",
			fontFamily: "Arial",
			fontStyle: "bold",
			color: "#ffffff"
		});

		this.bestScoreText = this.add.text(820, 10, 'Best: ' + this.bestScore, {
			fontSize: "48px",
			fontFamily: "Arial",
			fontStyle: "bold",
			color: "#ffffff"
		});
	}

	update(time, delta) {
		const angleToPointer = Phaser.Math.Angle.Between(this.playerShip.x, this.playerShip.y, this.input.activePointer.x, this.input.activePointer.y);
		this.playerShip.rotation = angleToPointer;

		if (!this.isGameOver) {
			if (this.input.activePointer.isDown && time > this.lastFiredTime + 200) {
				this.fireBullet();
				this.lastFiredTime = time;
			}
		}
	}

	fireBullet() {
		this.bulletFire.play();
		const bulletSpawnX = this.playerShip.x + Math.cos(this.playerShip.rotation) * 50;
		const bulletSpawnY = this.playerShip.y + Math.sin(this.playerShip.rotation) * 50;

		const bullet = this.bullets.create(bulletSpawnX, bulletSpawnY, 'bullet').setScale(2);

		const velocityX = Math.cos(this.playerShip.rotation) * 550;
		const velocityY = Math.sin(this.playerShip.rotation) * 550;

		bullet.body.setVelocity(velocityX, velocityY);
		bullet.setRotation(this.playerShip.rotation + Math.PI / 2);
	}

	spawnEnemyShips() {
		const minGap = 50;

		let randomX, randomY;
		do {
			randomX = this.generateRandomNumber(-50, 1200, [[0, 1080]]);
			randomY = this.generateRandomNumber(-20, 2000, [[500, 600]]);
		} while (this.isTooClose(randomX, randomY, minGap));

		const randomTexture = Phaser.Utils.Array.GetRandom(this.enemyShipTextures);
		const enemyShip = this.enemies.create(randomX, randomY, randomTexture);
		enemyShip.setCircle(32);
		enemyShip.bulletHits = 0;
		enemyShip.bulletsNeeded = this.level;

		const angleToPlayer = Phaser.Math.Angle.Between(enemyShip.x, enemyShip.y, this.playerShip.x, this.playerShip.y);
		enemyShip.rotation = angleToPlayer;

		const currentTime = this.time.now;
		if (currentTime - this.lastSpeedIncreaseTime > 20000) {
			this.enemyShipSpeed += 10;
			this.lastSpeedIncreaseTime = currentTime;
			this.level++;
			this.showLevelUpMessage();
		}
		this.physics.moveToObject(enemyShip, this.playerShip, this.enemyShipSpeed);
	}

	showLevelUpMessage() {
		const levelUpText = this.add.text(540, 540, `Level Up`, {
			fontFamily: 'Arial',
			fontSize: '80px',
			fontStyle: 'bold',
			color: '#ffffff'
		}).setOrigin(0.5);

		this.tweens.add({
			targets: levelUpText,
			alpha: 0,
			duration: 1000,
			delay: 2000,
			onComplete: () => levelUpText.destroy()
		});
	}

	isTooClose(x, y, minGap) {
		for (const enemy of this.enemies.getChildren()) {
			const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, x, y);
			if (distance < minGap) {
				return true;
			}
		}
		return false;
	}

	enemyHit(bullet, enemyShip) {
		this.hitEnemy.play();
		this.bulletBlastParticles({ x: enemyShip.x, y: enemyShip.y });
		this.explosionParticles({ x: enemyShip.x, y: enemyShip.y });
		bullet.destroy();
		enemyShip.bulletHits++;

		enemyShip.body.immovable = true;

		if (enemyShip.bulletHits >= enemyShip.bulletsNeeded) {
			enemyShip.destroy();
			this.scoreUpdate();
		}
	}

	scoreUpdate() {
		this.score += 1;
		this.scoreText.setText('Score: ' + this.score);

		if (this.score > this.bestScore) {
			this.bestScore = this.score;
			localStorage.setItem('bestScore-SpaceFighter', this.bestScore);
		}
	}

	gameOver() {
		if (this.playerLives > 1) {
			this.isGameOver = true;
			this.playerLives--;
			this.livesText.setText('Lives: ' + this.playerLives);
			this.resetGameState();
		} else {
			this.isGameOver = true;
			// console.log("Game Over");
			this.sound.play('gameOver');
			this.enemySpawnTimer.destroy();
			this.physics.pause();
			this.bullets.clear(true, true);
			this.enemies.clear(true, true);

			this.tweens.add({
				targets: this.playerShip,
				alpha: 0,
				duration: 1500,
				onComplete: () => this.restartGame(),
			});
		}
	}

	resetGameState() {
		this.isGameOver = false;
		this.physics.resume();
		this.bullets.clear(true, true);
		this.enemies.clear(true, true);
		this.playerShip.setPosition(540, 960);
		this.playerShip.setAlpha(1);
		this.playerShip.setVelocity(0, 0);
		this.spawnEnemyShips();
	}

	restartGame() {
		this.bg.setAlpha(0.8);
		this.scoreText.setVisible(false);
		this.bestScoreText.setVisible(false);
		this.livesText.setVisible(false);
		this.text_gameOverScore.setText('Score: ' + this.score);
		this.text_gameOverBest.setText('Best: ' + this.bestScore);
		this.container_gameOver.setVisible(true);
		this.pointerOverAndOut();
		this.replay.setInteractive().on('pointerdown', () => {
			this.bestScoreText.setText('Best: ' + this.bestScore);
			this.scene.restart();
		});
	}

	generateRandomNumber(min, max, avoidRanges) {
		let randomNumber;
		do {
			randomNumber = Phaser.Math.Between(min, max);
		} while (avoidRanges.some(range => randomNumber >= range[0] && randomNumber <= range[1]));
		return randomNumber;
	}

	pointerOverAndOut() {
		this.pointerOver = (aBtn, scale) => {
			this.input.setDefaultCursor('pointer');
			this.tweens.add({
				targets: aBtn,
				scaleX: scale + 0.05,
				scaleY: scale + 0.05,
				duration: 50
			})
		}
		this.pointerOut = (aBtn, scale) => {
			this.input.setDefaultCursor('default');
			this.tweens.add({
				targets: aBtn,
				scaleX: scale,
				scaleY: scale,
				duration: 50,
				onComplete: () => {
					aBtn.forEach((btn) => {
						btn.setScale(scale);
					});
				}
			})
		}

		this.replay.on('pointerover', () => this.pointerOver([this.replay], 1));
		this.replay.on('pointerout', () => this.pointerOut([this.replay], 1));
	}

	explosionParticles = ({ x, y }, quantity = 5) => {
        const explosionParticles = this.add.particles(x, y, 'explosion-huge', {
            quantity: 5,
            maxParticles: quantity,
            speed: 50,
            scale: { start: 0.2, end: 0.05 },
            alpha: { start: 0.5, end: 0.5 },
        });
        return explosionParticles;
    }

	bulletBlastParticles = ({ x, y }, quantity = 5) => {
        const blastParticle = this.add.particles(x, y, 'spark', {
            quantity: 5,
            maxParticles: quantity,
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: 'ADD',
            stopAfter: 10,
            speed: 400,
            radial: true,
        });
        return blastParticle;
    }

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
