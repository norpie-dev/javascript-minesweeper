// Board Things

let MINE = '💣';
let FLAG = '🚩';
let CROSS = '❌';

let CSS_MAX_GAME_WIDTH = 900;
let CSS_BORDER_WIDTH = 1;

var game;

class Game {

  cellsClicked = 0;
  cellsRevealed = 0;

  constructor(board) {
    this.board = board;
    this.makeBoardHTML();
    board.drawCells();
    board.generateCss();
    board.addListeners();
    this.timePlayed = 0;
    this.lost = false;
    this.counter = window.setInterval(function() {
      game.timeSingleSecond();
    }, 1000);
  }

  /**
  Checks if the game is done
  */
  checkWinLoss() {
    if(this.cellsRevealed == (this.board.size ** 2) - this.board.mines | this.lost) {
      this.makeGameOverScreenHTML(this.lost);
      this.board.revealAll();
      window.clearInterval(this.counter);
    }
  }


  /**
  Draws the game over screen
  */
  makeGameOverScreenHTML(lost) {
    let container = document.getElementById('container');

    let box = document.createElement('div');
    box.setAttribute('id', 'game-over');

    let text = document.createElement('p');
    text.setAttribute('id', 'game-over-text');
    text.innerHTML = lost ? 'You lost' : 'You won';
    text.innerHTML = text.innerHTML + "<br>" + "Times clicked: " + this.cellsClicked;
    let minutes = Math.floor(this.timePlayed/60);
    let seconds = this.timePlayed % 60;
    text.innerHTML = text.innerHTML + "<br>" + "Time played: " + minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
    box.appendChild(text);

    let button = document.createElement('button');
    button.setAttribute('id', 'main-menu-button');
    button.setAttribute('onclick', 'mainMenu()');
    button.innerHTML = 'Main Menu';

    box.appendChild(button);

    container.appendChild(box);
  }


  /**
  Draws thew game board html and stats
  */
  makeBoardHTML() {
    let container = document.getElementById('container');
    let board = document.createElement('div');
    board.setAttribute('id', 'board');
    board.setAttribute('class', 'board');
    container.appendChild(board);
    let stats = document.createElement('div');
    stats.setAttribute('id', 'stats');
    let time = document.createElement('p');
    time.setAttribute('id', 'time');
    time.setAttribute('class', 'stats');
    time.innerHTML = "Time played: 00:00";
    stats.appendChild(time);
    let clicks = document.createElement('p');
    clicks.setAttribute('id', 'clicks');
    clicks.setAttribute('class', 'stats');
    clicks.innerHTML = "Cell clicked: " + this.cellsClicked;
    stats.appendChild(clicks);

    let mainMenu = document.createElement('p');
    mainMenu.setAttribute('class', 'stats');
    mainMenu.setAttribute('onclick', 'mainMenu()');
    mainMenu.innerHTML = CROSS;
    stats.appendChild(mainMenu);

    container.appendChild(stats);
  }

  /**
  Updates timer and clicks
  */
  updateBoardHTML() {
    let time = document.getElementById('time');
    let minutes = Math.floor(this.timePlayed/60);
    let seconds = this.timePlayed % 60;
    time.innerHTML = "Time played: " + minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
    let clicks = document.getElementById('clicks');
    clicks.innerHTML = "Cell clicked: " + this.cellsClicked;
  }

  /**
  Method run every second while game is being played
  */
  timeSingleSecond() {
    this.timePlayed++;
    this.updateBoardHTML();
  }

}

class Board {

  constructor(size, mines) {
    this.size = size;
    this.mines = mines;

    this.CSS_CELL_WIDTH_HEIGHT = CSS_MAX_GAME_WIDTH / this.size;
    this.CSS_EMOJI_HEIGHT = CSS_MAX_GAME_WIDTH / this.size

    this.cells = this.populate(size, mines);                // fill board
    this.cells = this.assign(size, this.cells);             // assigns possitions as coordinates, coordinates are the key to the hashmap, ie. x = 5, y = 2 => "5,2"
    this.cells = this.calculate(size, this.cells);          // calculate the neighbour cell count
  }


  populate(size, mines) {
    let cellsArray = []
    let cells = size**2;
    let normals = cells - mines;
    for (var i = 0; i < normals; i++) {
        let cell = new Cell();
        cellsArray.push(cell);
    }
    for (var i = 0; i < mines; i++) {
        let mine = new Mine();
        cellsArray.push(mine);
    }
    shuffle(cellsArray)
    return cellsArray;
  }

  assign(size, cells) {
    let map = new Map();
    for (var x = 0; x < size; x++) {
      for (var y = 0; y < size; y++) {
        let cell = cells.pop();
        cell.coordinate = x + "," + y;
        map.set(cell.coordinate, cell);
      }
    }
    return map;
  }

  calculate(size, cells) {
    for (var [coordinate, cell] of cells) {
      if(cell instanceof Mine) {
        continue;
      }
      let coordinates = coordinateStringToArray(coordinate)
      let neighbourCoordinates = getAllNeighbourCoordinates(size, coordinates[0], coordinates[1]);
      let mineCount = 0;
      for (var i = 0; i < neighbourCoordinates.length; i++) {
        let neighbourX = neighbourCoordinates[i][0];
        let neighbourY = neighbourCoordinates[i][1];
        let neighbourCell = cells.get(neighbourX + "," + neighbourY);
        if(neighbourCell instanceof Mine) {
          mineCount++;
        }
      }
      cell.mines = mineCount;
      cells.set(coordinate, cell);
    }
    return cells;
  }


  /**
  Draws the cell <div>s to the board
  */
  drawCells() {
    let board = document.getElementById('board');
    for (var [coordinate, cell] of this.cells) {
      let element = document.createElement('div');
      element.setAttribute('class', 'cell');
      element.setAttribute('id', coordinate);
      board.appendChild(element);
      cell.element = document.getElementById(cell.coordinate);
      this.cells.set(coordinate, cell);
    }
  }


  /**
  Generates the css based on the size requested
  */
  generateCss() {
    let elements = document.getElementsByClassName('cell');
    for (var i = 0; i < elements.length; i++) {
      let element = elements.item(i);
      element.style.backgroundColor = "gray";
      element.style.height = (this.CSS_CELL_WIDTH_HEIGHT - CSS_BORDER_WIDTH * 2) + "px";
      element.style.width = (this.CSS_CELL_WIDTH_HEIGHT - CSS_BORDER_WIDTH * 2) + "px";
      element.style.lineHeight = (this.CSS_EMOJI_HEIGHT) + "px";
    }
  }

  /**
  Adds click listeners to the cells
  */
  addListeners() {
    let elements = document.getElementsByClassName("cell");
    for (var i = 0; i < elements.length; i++) {
      elements[i].addEventListener('click', function() {
        game.board.cells.get(this.id).click(false);
      });
      elements[i].addEventListener('contextmenu', function(event) {
        event.preventDefault();
        game.board.cells.get(this.id).click(true);
      });
    }
  }

  /**
  Reveals all the cells, run after game over
  */
  revealAll() {
    for (var [coordinate, cell] of this.cells) {
      cell.reveal(true, true);
    }
  }
}

class Cell {
  constructor() {
    this.revealed = false;
    this.flagged = false;
    this.mines = 0;
    this.coordinate = "0,0";
  }

  /**
  Flags or unflags a cell
  */
  flag() {
    if(this.revealed) {
      return;
    }
    if(this.flagged) {
      this.flagged = false;
    } else {
      this.flagged = true;
    }
    game.board.cells.set(this.coordinate, this);
    this.flagHTML();
  }

  /**
  Draws the flag or unflag html
  */
  flagHTML() {
    let element = this.element;
    if(this.flagged) {
      element.innerHTML = FLAG;
    } else {
      element.innerHTML = "";
    }
  }

  /**
  Reveals the cell, if its not flagged or already revealed
  */
  reveal(auto, end) {
    if (!end & this.flagged) {
      return;
    }
    if (this.revealed) {
      return;
    }
    if (!auto) {
      game.cellsClicked++;
    }
    game.cellsRevealed++;
    this.revealed = true;
    game.board.cells.set(this.coordinate, this);
    this.revealHTML();
    if (this.mines == 0 && !(this instanceof Mine)) {
      this.revealNeighbours(this.coordinate);
    }
    if(this instanceof Mine) {
      game.lost = true;
    }
  }

  /**
  Reveals the neighbour-cells of the current cell
  */
  revealNeighbours() {
    let coordinate = coordinateStringToArray(this.coordinate);
    let neighbourCoordinates = getAllNeighbourCoordinates(game.board.size, coordinate[0], coordinate[1]);
    for (var i = 0; i < neighbourCoordinates.length; i++) {
      let cell = getCellFromCoordinate(neighbourCoordinates[i][0] + ',' + neighbourCoordinates[i][1]);
      cell.reveal(true, false);
    }
  }

  /**
  Draws the reveal html
  */
  revealHTML() {
    let element = this.element;
    if(this instanceof Mine) {
      element.innerHTML = MINE;
    }
    if(this.mines != 0) {
      element.innerHTML = this.mines;
    }
    element.style.backgroundColor = "lightgrey";
  }

  /**
  Method run by a click on a cell <div>
  */
  click(right) {
    if(right) {
      this.flag();
    } else {
      this.reveal(false, false);
    }
    game.updateBoardHTML();
    game.checkWinLoss();
  }
}

class Mine extends Cell {}

/**
function run by main menu play button
*/
function play() {
  let sizes = {
    "small-radio": 10,
    "medium-radio": 20,
    "large-radio": 30
  };
  let sizeMines = {
    10: 10,
    20: 100,
    30: 150
  };
  let size = sizes[findCheckedRadioButton(document.querySelectorAll('input[name="size"]')).id];
  clearScreen();
  game = new Game(new Board(size, sizeMines[size]));

}

/**
Clears html and draws main menu
*/
function mainMenu() {
  if(game != null) {
    window.clearInterval(game.counter);
  }
  clearScreen();
  makeMainMenu();
}

/**
Parses list of radio buttons and returns the one selected
*/
function findCheckedRadioButton(radioButtons) {
  for (var radioButton of radioButtons) {
    if(radioButton.checked) {
      return radioButton;
    }
  }
}

/**
Returns a list of all neighbouring coordinates, based on size, and current coordinate
*/
function getAllNeighbourCoordinates(size, x, y) {
  let neighbours = []
  // All posibilities
  neighbours.push([x - 1, y + 1]);
  neighbours.push([x - 1, y]);
  neighbours.push([x - 1, y - 1]);
  neighbours.push([x, y + 1]);
  neighbours.push([x, y - 1]);
  neighbours.push([x + 1, y + 1]);
  neighbours.push([x + 1, y]);
  neighbours.push([x + 1, y - 1]);
  //Check validity
  for (var i = 7; i >= 0; i--) {
    let x = neighbours[i][0];
    let y = neighbours[i][1];
    if(!isValidCoordinate(x, y, size)) {
      delete neighbours[i];
    }
  }
  var filtered = neighbours.filter(function (el) {
    return el != null;
  });
  return filtered;
}

/**
Checks if a coordinate is not in an impossible place e.g. outside the board, like negative numbers
*/
function isValidCoordinate(x, y, size) {
  if(x < 0 | y < 0 | x >= size | y >= size ) {
    return false;
  }
  return true;
}

function coordinateStringToArray(coordinate) {
  let split = coordinate.split(",");
  return [Number(split[0]), Number(split[1])];
}

function arrayCoordinateToString(coordinate) {
  let coordinateString = coordinate[0] + ',' + coordinate[1];
  return coordinateString;
}

/**
Reveals the cell, if its not flagged or already revealed
*/
function getCellFromCoordinate(coordinate) {
  let cell = game.board.cells.get(coordinate);
  return cell;
}

/**
Removes whatever is currently on screen and defaults to <div id="container">
*/
function clearScreen() {
  let container = document.getElementById('container');
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

/**
Draws main menu html
*/
function makeMainMenu() {
  let container = document.getElementById('container');
  let mainMenu = document.createElement('div');
  container.appendChild(mainMenu);
  let title = document.createElement('h1');
  title.innerHTML = 'Minesweeper';
  mainMenu.appendChild(title);
  let button = document.createElement('button');
  button.setAttribute('id', 'play-button');
  button.setAttribute('onclick', 'play()');
  button.innerHTML = 'Play';
  mainMenu.appendChild(button);

  sizeDictionary = {
    0 : 'small',
    1 : 'medium',
    2 : 'large',
  };

  for(i = 0; i < 3; i++) {
    size = sizeDictionary[i];
    let radioElement = document.createElement('input');
    radioElement.setAttribute('type', 'radio');
    radioElement.setAttribute('id',  size + '-radio');
    radioElement.setAttribute('name', 'size');
    radioElement.checked = i==0 ? true : false;
    mainMenu.appendChild(radioElement);
    let radioElementLabel = document.createElement('label');
    radioElementLabel.setAttribute('for', size + '-radio');
    radioElementLabel.innerHTML = size;
    mainMenu.appendChild(radioElementLabel);
  }
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
// http://en.wikipedia.org/wiki/Fisher-Yates_shuffle
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// This draws the main menu html when page is loaded
mainMenu();
