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
        // If the tile is cleared, make the tiles above it fall down
        for (let r = row; r > 0; r--) {
          grid[col][r] = grid[col][r - 1];
          grid[col][r].row = r; // Update the row number of the tile
        }
        // Create a new tile at the top
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
}

function initGame() {
  grid = [];
  for (let col = 0; col < cols; col++) {
    grid[col] = [];
    for (let row = 0; row < rows; row++) {
      grid[col][row] = new Tile(col, row, tileSize);
    }
  }
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
  let col = floor(mouseX / tileSize);
  let row = floor(mouseY / tileSize);

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

      if (!checkMatches()) {
        console.log("No matches found. Swapping back...");
        tile1.startSwapping(tile2.col, tile2.row);
        tile2.startSwapping(tile1.col, tile1.row);

        setTimeout(() => {
          let tempColor = tile1.color;
          tile1.color = tile2.color;
          tile2.color = tempColor;
        }, SWAP_DURATION);
      }
    }, SWAP_DURATION);
  }
}

function checkMatches() {
  let matchedTiles = [];
  let hasMatches = false;

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
            matchedTiles.push({ col: col - 1 - k, row });
          }
        }
        matchLength = 1;
      }
    }
    if (matchLength >= 3) {
      hasMatches = true;
      for (let k = 0; k < matchLength; k++) {
        matchedTiles.push({ col: cols - 1 - k, row });
      }
    }
  }

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
            matchedTiles.push({ col, row: row - 1 - k });
          }
        }
        matchLength = 1;
      }
    }
    if (matchLength >= 3) {
      hasMatches = true;
      for (let k = 0; k < matchLength; k++) {
        matchedTiles.push({ col, row: rows - 1 - k });
      }
    }
  }

  if (matchedTiles.length > 0) {
    clearMatches(matchedTiles);
  }

  return hasMatches;
}

function clearMatches(matchedTiles) {
  for (let { col, row } of matchedTiles) {
    grid[col][row].startClearing();
  }
}

function touchStarted() {
  mousePressed();
  return false;
}

function touchMoved() {
  mouseDragged();
  return false;
}

function touchEnded() {
  mouseReleased();
  return false;
}

function mouseDragged() {
  // Not needed for this game
}

function mouseReleased() {
  // Not needed for this game
}
