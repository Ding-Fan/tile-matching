let grid;
let cols = 8;
let rows = 8;
let tileSize;
let score = 0; // Global score variable

const SWAP_DURATION = 300;
const colorCharacterMap = {
  red: "ア",
  green: "イ",
  blue: "ウ",
  yellow: "エ",
  purple: "オ",
};

function setup() {
  createCanvas(windowWidth, windowHeight + 50); // Add extra height for the score display
  tileSize = min(width / cols, height / rows);
  initGame();
  score = 0;
}

function draw() {
  background(255);

  // Display the score
  fill(0);
  textAlign(LEFT, TOP); // Align text to the left and top
  textSize(32);
  text(`Score: ${score}`, 10, 10); // Position the score at the top-left corner

  displayGrid(); // Draw the grid below the score
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
  let gridOffsetY = 50; // Offset the grid to start below the score

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      grid[col][row].display(gridOffsetY);

      // Highlight the selected tile
      if (
        selectedTile &&
        selectedTile.col === col &&
        selectedTile.row === row
      ) {
        noFill();
        stroke(255, 0, 0);
        strokeWeight(4); // Set stroke weight for the rectangle
        rect(col * tileSize, row * tileSize + gridOffsetY, tileSize, tileSize);
        strokeWeight(1); // Reset stroke weight back to default
      }
    }
  }
}

class Tile {
  constructor(col, row, size) {
    this.col = col;
    this.row = row;
    this.size = size;
    this.colors = {
      red: color("red"),
      green: color("green"),
      blue: color("blue"),
      yellow: color("yellow"),
      purple: color("purple"),
    };
    this.colorName = random(Object.keys(this.colors)); // Select a color name
    this.color = this.colors[this.colorName]; // Get the actual color
    this.character = colorCharacterMap[this.colorName]; // Assign the corresponding Japanese character
    this.isClearing = false;
    this.clearStartTime = null;
    this.isSwapping = false;
    this.swapStartTime = null;
    this.targetCol = null;
    this.targetRow = null;
    this.matched = false; // Property to track if the tile is part of a match
  }

  display(gridOffsetY = 0) {
    let x = this.col * this.size + this.size / 2;
    let y = this.row * this.size + this.size / 2 + gridOffsetY;

    if (this.isClearing) {
      let elapsed = millis() - this.clearStartTime;
      if (elapsed < SWAP_DURATION) {
        let alpha = map(elapsed, 0, SWAP_DURATION, 255, 0);
        fill(red(this.color), green(this.color), blue(this.color), alpha);
      } else {
        this.isClearing = false;
        this.colorName = random(Object.keys(this.colors));
        this.color = this.colors[this.colorName];
        this.character = colorCharacterMap[this.colorName];
      }
    } else if (this.isSwapping) {
      let elapsed = millis() - this.swapStartTime;
      if (elapsed < SWAP_DURATION) {
        let progress = elapsed / SWAP_DURATION;
        x = lerp(
          this.col * this.size + this.size / 2,
          this.targetCol * this.size + this.size / 2,
          progress
        );
        y = lerp(
          this.row * this.size + this.size / 2 + gridOffsetY,
          this.targetRow * this.size + this.size / 2 + gridOffsetY,
          progress
        );
        fill(this.color);
        stroke(0);
        ellipse(x, y, this.size, this.size);
      } else {
        this.isSwapping = false;
      }
    } else {
      fill(this.color);
      stroke(0);
      ellipse(x, y, this.size, this.size);
    }

    // Display the character on the tile
    textAlign(CENTER, CENTER);
    textSize(this.size / 2.4); // Adjust the text size to fit the tile
    fill(0); // Use black color for the text
    text(this.character, x, y); // Draw the character at the center of the tile
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
  let gridOffsetY = 50; // The same offset used when displaying the grid

  // Adjust the calculation by subtracting the gridOffsetY
  let col = floor(x / tileSize);
  let row = floor((y - gridOffsetY) / tileSize);

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
      // Swap the colors and characters
      let tempColor = tile1.color;
      let tempCharacter = tile1.character;

      tile1.color = tile2.color;
      tile1.character = tile2.character;

      tile2.color = tempColor;
      tile2.character = tempCharacter;

      checkMatches(); // Check for matches after the swap

      // Check if either of the swapped tiles are part of a match
      if (!tile1.matched && !tile2.matched) {
        console.log("No matches found. Swapping back...");
        tile1.startSwapping(tile2.col, tile2.row);
        tile2.startSwapping(tile1.col, tile1.row);

        setTimeout(() => {
          // Revert the swap
          let revertColor = tile1.color;
          let revertCharacter = tile1.character;

          tile1.color = tile2.color;
          tile1.character = tile2.character;

          tile2.color = revertColor;
          tile2.character = revertCharacter;
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
            score++; // Increment score for each matched tile
          }
        }
        matchLength = 1;
      }
    }
    if (matchLength >= 3) {
      hasMatches = true;
      for (let k = 0; k < matchLength; k++) {
        grid[cols - 1 - k][row].matched = true;
        score++; // Increment score for each matched tile
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
            score++; // Increment score for each matched tile
          }
        }
        matchLength = 1;
      }
    }
    if (matchLength >= 3) {
      hasMatches = true;
      for (let k = 0; k < matchLength; k++) {
        grid[col][rows - 1 - k].matched = true;
        score++; // Increment score for each matched tile
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

function touchMoved() {
  // Prevent scrolling on touch devices
  return false;
}

function touchEnded() {
  return false;
}
