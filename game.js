let grid;
let cols = 8;
let rows = 8;
let tileSize;

const SWAP_DURATION = 500;

function setup() {
  createCanvas(windowWidth, windowHeight);
  tileSize = min(width / cols, height / rows);
  initGame();
}

function draw() {
  background(255);
  displayGrid();
  refillClearedTiles();
}

function refillClearedTiles() {
  let hasCleared = false;

  for (let col = 0; col < cols; col++) {
    for (let row = rows - 1; row >= 0; row--) {
      if (
        grid[col][row].clearStartTime &&
        millis() - grid[col][row].clearStartTime >= SWAP_DURATION
      ) {
        hasCleared = true;
        for (let r = row; r > 0; r--) {
          grid[col][r] = grid[col][r - 1];
          grid[col][r].row = r;
        }
        grid[col][0] = new Tile(col, 0, tileSize);
      }
    }
  }

  if (hasCleared) {
    setTimeout(() => {
      if (checkMatches()) {
        setTimeout(refillClearedTiles, SWAP_DURATION);
      }
    }, SWAP_DURATION);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  tileSize = min(width / cols, height / rows);
  initGame(); // Reinitialize the game to fit the new canvas size
}

function initGame() {
  grid = [];
  for (let col = 0; col < cols; col++) {
    grid[col] = [];
    for (let row = 0; row < rows; row++) {
      grid[col][row] = new Tile(col, row, tileSize);
    }
  }

  // Check for matches immediately after initializing the grid
  checkMatches();
}

function displayGrid() {
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      grid[col][row].display();
      if (
        selectedTile &&
        selectedTile.col === col &&
        selectedTile.row === row
      ) {
        noFill();
        stroke(255, 0, 0);
        strokeWeight(4);
        rect(col * tileSize, row * tileSize, tileSize, tileSize);
      }
    }
  }
}

class Tile {
  constructor(col, row, size) {
    this.col = col;
    this.row = row;
    this.size = size;
    this.colors = [
      color("red"),
      color("green"),
      color("blue"),
      color("yellow"),
      color("purple"),
    ];
    this.color = random(this.colors);
    this.isClearing = false;
    this.clearStartTime = null;
    this.isSwapping = false;
    this.swapStartTime = null;
    this.targetCol = null;
    this.targetRow = null;
    this.matched = false; // New property to track if the tile is part of a match
  }

  display() {
    if (this.isClearing) {
      let elapsed = millis() - this.clearStartTime;
      if (elapsed < SWAP_DURATION) {
        let alpha = map(elapsed, 0, SWAP_DURATION, 255, 0);
        fill(red(this.color), green(this.color), blue(this.color), alpha);
      } else {
        this.isClearing = false;
        this.color = random(this.colors);
      }
    } else if (this.isSwapping) {
      let elapsed = millis() - this.swapStartTime;
      if (elapsed < SWAP_DURATION) {
        let progress = elapsed / SWAP_DURATION;
        let newX = lerp(
          this.col * this.size + this.size / 2,
          this.targetCol * this.size + this.size / 2,
          progress
        );
        let newY = lerp(
          this.row * this.size + this.size / 2,
          this.targetRow * this.size + this.size / 2,
          progress
        );
        fill(this.color);
        stroke(0);
        ellipse(newX, newY, this.size, this.size);
      } else {
        this.isSwapping = false;
      }
    } else {
      fill(this.color);
      stroke(0);
      ellipse(
        this.col * this.size + this.size / 2,
        this.row * this.size + this.size / 2,
        this.size,
        this.size
      );
    }
  }

  startClearing() {
    this.isClearing = true;
    this.clearStartTime = millis();
  }

  startSwapping(targetCol, targetRow) {
    this.isSwapping = true;
    this.swapStartTime = millis();
    this.targetCol = targetCol;
    this.targetRow = targetRow;
  }
}

let selectedTile = null;

function mousePressed() {
  handleTileSelection(mouseX, mouseY);
}

function touchStarted() {
  handleTileSelection(mouseX, mouseY);
  return false; // Prevent default behavior
}

function handleTileSelection(x, y) {
  let col = floor(x / tileSize);
  let row = floor(y / tileSize);

  if (col >= 0 && col < cols && row >= 0 && row < rows) {
    if (selectedTile) {
      swapTiles(grid[selectedTile.col][selectedTile.row], grid[col][row]);
      selectedTile = null;
    } else {
      selectedTile = { col, row };
    }
  }
}

function swapTiles(tile1, tile2) {
  if (Math.abs(tile1.col - tile2.col) + Math.abs(tile1.row - tile2.row) === 1) {
    tile1.startSwapping(tile2.col, tile2.row);
    tile2.startSwapping(tile1.col, tile1.row);

    setTimeout(() => {
      let tempColor = tile1.color;
      tile1.color = tile2.color;
      tile2.color = tempColor;

      checkMatches(); // Check for matches after the swap

      // Check if either of the swapped tiles are part of a match
      if (!tile1.matched && !tile2.matched) {
        console.log("No matches found. Swapping back...");
        tile1.startSwapping(tile2.col, tile2.row);
        tile2.startSwapping(tile1.col, tile1.row);

        setTimeout(() => {
          // Revert the swap
          let tempColor = tile1.color;
          tile1.color = tile2.color;
          tile2.color = tempColor;
        }, SWAP_DURATION);
      } else {
        setTimeout(refillClearedTiles, SWAP_DURATION);
      }
    }, SWAP_DURATION);
  }
}

function checkMatches() {
  let hasMatches = false;

  // Reset matched status for all tiles
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      grid[col][row].matched = false;
    }
  }

  // Horizontal matches
  for (let row = 0; row < rows; row++) {
    let matchLength = 1;
    for (let col = 1; col < cols; col++) {
      if (
        grid[col][row].color.toString() === grid[col - 1][row].color.toString()
      ) {
        matchLength++;
      } else {
        if (matchLength >= 3) {
          hasMatches = true;
          for (let k = 0; k < matchLength; k++) {
            grid[col - 1 - k][row].matched = true;
          }
        }
        matchLength = 1;
      }
    }
    if (matchLength >= 3) {
      hasMatches = true;
      for (let k = 0; k < matchLength; k++) {
        grid[cols - 1 - k][row].matched = true;
      }
    }
  }

  // Vertical matches
  for (let col = 0; col < cols; col++) {
    let matchLength = 1;
    for (let row = 1; row < rows; row++) {
      if (
        grid[col][row].color.toString() === grid[col][row - 1].color.toString()
      ) {
        matchLength++;
      } else {
        if (matchLength >= 3) {
          hasMatches = true;
          for (let k = 0; k < matchLength; k++) {
            grid[col][row - 1 - k].matched = true;
          }
        }
        matchLength = 1;
      }
    }
    if (matchLength >= 3) {
      hasMatches = true;
      for (let k = 0; k < matchLength; k++) {
        grid[col][rows - 1 - k].matched = true;
      }
    }
  }

  // Clear matched tiles
  if (hasMatches) {
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        if (grid[col][row].matched) {
          grid[col][row].startClearing();
        }
      }
    }
  }

  return hasMatches;
}

function clearMatches(matchedTiles) {
  for (let { col, row } of matchedTiles) {
    grid[col][row].startClearing();
  }
}

function touchMoved() {
  // Prevent scrolling on touch devices
  return false;
}

function touchEnded() {
  return false;
}
