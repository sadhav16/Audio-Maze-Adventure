const { useState, useEffect, useCallback, useRef } = React;

// Game configuration
const GAME_CONFIG = {
  mazeSize: 12,
  playerStartHealth: 100,
  monsterDamage: 25,
  potionHealing: 40,
  swordDamage: 30,
  shieldProtection: 15
};

const EMOJIS = {
  player: "🧑",
  wall: "⬛",
  path: "⬜", 
  key: "🔑",
  monster: "👾",
  sword: "⚔️",
  shield: "🛡️",
  potion: "🧪",
  exit: "🚪"
};

const AUDIO_MESSAGES = {
  welcome: "Welcome to the Audio Maze Adventure! This game is designed for blind students using audio cues and emoji accessibility. Left-click anywhere to start or restart. Right-click to stop playing. Use arrow keys to move through the maze.",
  gameStart: "Game started! You are at the maze entrance. Your goal is to find a key, collect weapons, and reach the exit door alive.",
  gameStop: "Game stopped. Left-click to restart when ready.",
  victory: "Congratulations! You found the key and reached the exit door. You won!",
  defeat: "Game over. You ran out of health. Left-click to try again."
};

const ITEM_DESCRIPTIONS = {
  key: "A golden key 🔑 that unlocks the exit door",
  sword: "A sharp sword ⚔️ for fighting monsters",
  shield: "A protective shield 🛡️ that reduces damage",
  potion: "A healing potion 🧪 that restores your health",
  monster: "A dangerous monster 👾 that attacks on contact",
  exit: "The exit door 🚪 that leads to victory"
};

// Text-to-speech utility
const speak = (text, priority = false) => {
  if ('speechSynthesis' in window) {
    if (priority) {
      window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    window.speechSynthesis.speak(utterance);
  }
};

// Maze generation
const generateMaze = () => {
  const size = GAME_CONFIG.mazeSize;
  const maze = Array(size).fill(null).map(() => Array(size).fill('wall'));
  
  // Create paths using recursive backtracking
  const stack = [];
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));
  
  const directions = [[0, 2], [2, 0], [0, -2], [-2, 0]];
  
  const isValid = (x, y) => x >= 0 && x < size && y >= 0 && y < size;
  
  const carve = (x, y) => {
    maze[y][x] = 'path';
    visited[y][x] = true;
    
    const shuffled = [...directions].sort(() => Math.random() - 0.5);
    
    for (const [dx, dy] of shuffled) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (isValid(nx, ny) && !visited[ny][nx]) {
        maze[y + dy/2][x + dx/2] = 'path';
        carve(nx, ny);
      }
    }
  };
  
  carve(1, 1);
  
  // Ensure start and end are paths
  maze[1][1] = 'path';
  maze[size-2][size-2] = 'path';
  
  return maze;
};

// Place items randomly in the maze
const placeItems = (maze) => {
  const size = GAME_CONFIG.mazeSize;
  const items = {};
  const pathCells = [];
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (maze[y][x] === 'path' && !(x === 1 && y === 1) && !(x === size-2 && y === size-2)) {
        pathCells.push([x, y]);
      }
    }
  }
  
  // Shuffle path cells
  pathCells.sort(() => Math.random() - 0.5);
  
  // Place items
  const itemTypes = ['key', 'sword', 'shield', 'potion', 'potion', 'monster', 'monster', 'monster'];
  itemTypes.forEach((type, index) => {
    if (index < pathCells.length) {
      const [x, y] = pathCells[index];
      items[`${x},${y}`] = type;
    }
  });
  
  // Place exit
  items[`${size-2},${size-2}`] = 'exit';
  
  return items;
};

const AudioMazeGame = () => {
  const [gameState, setGameState] = useState('menu');
  const [maze, setMaze] = useState([]);
  const [items, setItems] = useState({});
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [playerHealth, setPlayerHealth] = useState(GAME_CONFIG.playerStartHealth);
  const [inventory, setInventory] = useState([]);
  const [lastMessage, setLastMessage] = useState('');
  const gameContainerRef = useRef(null);

  const announcePosition = useCallback((x, y, newItems = items, newInventory = inventory, newHealth = playerHealth) => {
    let message = `You are at position ${x}, ${y}. `;
    
    // Check current cell
    const currentKey = `${x},${y}`;
    if (newItems[currentKey]) {
      const item = newItems[currentKey];
      message += `There is ${ITEM_DESCRIPTIONS[item]} here. `;
    }
    
    // Check surroundings for threats and items
    const directions = [
      { dx: 0, dy: -1, name: 'north' },
      { dx: 1, dy: 0, name: 'east' },
      { dx: 0, dy: 1, name: 'south' },
      { dx: -1, dy: 0, name: 'west' }
    ];
    
    directions.forEach(({ dx, dy, name }) => {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      
      if (maze[ny] && maze[ny][nx] === 'wall') {
        message += `Wall to your ${name}. `;
      } else if (newItems[key]) {
        const item = newItems[key];
        if (item === 'monster') {
          message += `Warning! Monster to your ${name}! `;
        } else {
          message += `${ITEM_DESCRIPTIONS[item]} to your ${name}. `;
        }
      } else if (maze[ny] && maze[ny][nx] === 'path') {
        message += `Path to your ${name}. `;
      }
    });
    
    // Add inventory and health status
    if (newInventory.length > 0) {
      message += `Your inventory contains: ${newInventory.join(', ')}. `;
    } else {
      message += `Your inventory is empty. `;
    }
    message += `Your health is ${newHealth}. `;
    
    setLastMessage(message);
    speak(message, true);
  }, [maze, items, inventory, playerHealth]);

  const initializeGame = useCallback(() => {
    const newMaze = generateMaze();
    const newItems = placeItems(newMaze);
    const startPos = { x: 1, y: 1 };
    const startHealth = GAME_CONFIG.playerStartHealth;
    const startInventory = [];
    
    setMaze(newMaze);
    setItems(newItems);
    setPlayerPos(startPos);
    setPlayerHealth(startHealth);
    setInventory(startInventory);
    setGameState('playing');
    
    speak(AUDIO_MESSAGES.gameStart, true);
    
    setTimeout(() => {
      announcePosition(startPos.x, startPos.y, newItems, startInventory, startHealth);
    }, 2000);
  }, [announcePosition]);

  const movePlayer = useCallback((dx, dy) => {
    if (gameState !== 'playing') return;
    
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    
    if (maze[newY] && maze[newY][newX] === 'path') {
      const newPos = { x: newX, y: newY };
      setPlayerPos(newPos);
      
      const itemKey = `${newX},${newY}`;
      let newItems = { ...items };
      let newInventory = [...inventory];
      let newHealth = playerHealth;
      let message = '';
      
      if (items[itemKey]) {
        const item = items[itemKey];
        
        switch (item) {
          case 'key':
            newInventory.push('key');
            delete newItems[itemKey];
            message = 'You picked up the golden key! ';
            break;
          case 'sword':
            newInventory.push('sword');
            delete newItems[itemKey];
            message = 'You picked up a sword! ';
            break;
          case 'shield':
            newInventory.push('shield');
            delete newItems[itemKey];
            message = 'You picked up a shield! ';
            break;
          case 'potion':
            newHealth = Math.min(GAME_CONFIG.playerStartHealth, newHealth + GAME_CONFIG.potionHealing);
            delete newItems[itemKey];
            message = `You drank a healing potion! Your health is now ${newHealth}. `;
            setPlayerHealth(newHealth);
            break;
          case 'monster':
            if (newInventory.includes('sword')) {
              delete newItems[itemKey];
              message = 'You defeated the monster with your sword! ';
            } else {
              const damage = newInventory.includes('shield') ? 
                Math.max(0, GAME_CONFIG.monsterDamage - GAME_CONFIG.shieldProtection) : 
                GAME_CONFIG.monsterDamage;
              newHealth -= damage;
              setPlayerHealth(newHealth);
              message = `A monster attacked you! You took ${damage} damage. Your health is now ${newHealth}. `;
            }
            break;
          case 'exit':
            if (newInventory.includes('key')) {
              setGameState('victory');
              speak(AUDIO_MESSAGES.victory, true);
              return;
            } else {
              message = 'The exit door is locked! You need a key to open it. ';
            }
            break;
        }
      }
      
      if (newHealth <= 0) {
        setGameState('defeat');
        setPlayerHealth(0);
        speak(AUDIO_MESSAGES.defeat, true);
        return;
      }
      
      setItems(newItems);
      setInventory(newInventory);
      if (newHealth !== playerHealth) {
        setPlayerHealth(newHealth);
      }
      
      setTimeout(() => {
        announcePosition(newX, newY, newItems, newInventory, newHealth);
      }, 100);
    } else {
      speak('You cannot move there. There is a wall blocking your path.', true);
    }
  }, [gameState, playerPos, maze, items, inventory, playerHealth, announcePosition]);

  const handleKeyDown = useCallback((event) => {
    if (gameState !== 'playing') return;
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        movePlayer(0, -1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        movePlayer(0, 1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        movePlayer(-1, 0);
        break;
      case 'ArrowRight':
        event.preventDefault();
        movePlayer(1, 0);
        break;
      case 'i':
      case 'I':
        event.preventDefault();
        const invMessage = inventory.length > 0 ? 
          `Your inventory contains: ${inventory.join(', ')}.` : 
          'Your inventory is empty.';
        speak(invMessage, true);
        break;
      case 'h':
      case 'H':
        event.preventDefault();
        const healthMessage = `Your current health is ${playerHealth} out of ${GAME_CONFIG.playerStartHealth}.`;
        speak(healthMessage, true);
        break;
      case 'l':
      case 'L':
        event.preventDefault();
        speak(`You are at position ${playerPos.x}, ${playerPos.y} in the maze.`, true);
        break;
      case 'r':
      case 'R':
        event.preventDefault();
        if (lastMessage) {
          speak(lastMessage, true);
        }
        break;
    }
  }, [gameState, movePlayer, inventory, playerHealth, playerPos, lastMessage]);

  const handleMouseClick = useCallback((event) => {
    event.preventDefault();
    if (event.button === 0) { // Left click
      if (gameState === 'menu' || gameState === 'victory' || gameState === 'defeat') {
        initializeGame();
      }
    } else if (event.button === 2) { // Right click
      if (gameState === 'playing') {
        setGameState('menu');
        speak(AUDIO_MESSAGES.gameStop, true);
      }
    }
  }, [gameState, initializeGame]);

  // Event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseClick);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseClick);
      document.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [handleKeyDown, handleMouseClick]);

  // Focus management
  useEffect(() => {
    if (gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
  }, [gameState]);

  // Initial welcome message
  useEffect(() => {
    speak(AUDIO_MESSAGES.welcome);
  }, []);

  const renderMaze = () => {
    if (gameState !== 'playing') return null;
    
    return (
      <div className="maze-container">
        <div 
          className="maze-grid" 
          style={{ gridTemplateColumns: `repeat(${GAME_CONFIG.mazeSize}, 1fr)` }}
          role="grid"
          aria-label="Maze grid"
        >
          {maze.map((row, y) =>
            row.map((cell, x) => {
              const isPlayer = playerPos.x === x && playerPos.y === y;
              const itemKey = `${x},${y}`;
              const hasItem = items[itemKey];
              
              return (
                <div
                  key={`${x}-${y}`}
                  className={`maze-cell ${cell} ${isPlayer ? 'player' : ''}`}
                  role="gridcell"
                  aria-label={
                    isPlayer ? 
                      `Player position at ${x}, ${y}` : 
                      hasItem ? 
                        `${ITEM_DESCRIPTIONS[hasItem]} at ${x}, ${y}` :
                        `${cell} at ${x}, ${y}`
                  }
                >
                  {isPlayer ? EMOJIS.player : hasItem ? EMOJIS[hasItem] : cell === 'wall' ? EMOJIS.wall : EMOJIS.path}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderGameStatus = () => {
    if (gameState !== 'playing') return null;
    
    return (
      <div className="game-status" role="status" aria-live="polite">
        <div className="status-info">
          <div className="status-item">
            <span>Position:</span>
            <strong>{playerPos.x}, {playerPos.y}</strong>
          </div>
          <div className="health-bar">
            <span>Health:</span>
            <div className="health-indicator">
              <div 
                className={`health-fill ${playerHealth < 30 ? 'critical' : playerHealth < 60 ? 'low' : ''}`}
                style={{ width: `${(playerHealth / GAME_CONFIG.playerStartHealth) * 100}%` }}
              ></div>
            </div>
            <strong>{playerHealth}/{GAME_CONFIG.playerStartHealth}</strong>
          </div>
        </div>
        <div className="inventory-panel">
          <span>Inventory:</span>
          {inventory.length === 0 ? (
            <span>Empty</span>
          ) : (
            inventory.map((item, index) => (
              <div key={index} className="inventory-item">
                <span>{EMOJIS[item]}</span>
                <span>{item}</span>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderControls = () => {
    return (
      <div className="controls-panel">
        <h3 className="controls-title">Game Controls</h3>
        <ul className="controls-list">
          <li>
            <span className="control-key">↑↓←→</span>
            <span>Move through maze</span>
          </li>
          <li>
            <span className="control-key">I</span>
            <span>Check inventory</span>
          </li>
          <li>
            <span className="control-key">H</span>
            <span>Check health</span>
          </li>
          <li>
            <span className="control-key">L</span>
            <span>Current location</span>
          </li>
          <li>
            <span className="control-key">R</span>
            <span>Repeat last message</span>
          </li>
        </ul>
        <div className="click-instructions">
          <div className="click-instruction">
            <div className="mouse-icon"></div>
            <span>Left-click: Start/Restart</span>
          </div>
          <div className="click-instruction">
            <div className="mouse-icon"></div>
            <span>Right-click: Stop game</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className="game-container" 
      ref={gameContainerRef}
      tabIndex={-1}
      role="main"
      aria-label="Audio Maze Adventure Game"
    >
      <div className="game-header">
        <h1 className="game-title">Audio Maze Adventure</h1>
        <p className="game-subtitle">
          An accessible maze game designed for blind students using audio cues and emojis
        </p>
      </div>

      {gameState === 'menu' && (
        <div className="game-message" role="status">
          <h2>Welcome to Audio Maze Adventure!</h2>
          <p>Left-click anywhere to start your adventure</p>
          <p>Use audio cues and keyboard navigation to navigate through the maze</p>
        </div>
      )}

      {gameState === 'victory' && (
        <div className="game-message" role="status">
          <h2>🎉 Congratulations! You Won! 🎉</h2>
          <p>You successfully found the key and escaped the maze!</p>
          <p>Left-click to play again</p>
        </div>
      )}

      {gameState === 'defeat' && (
        <div className="game-message" role="status">
          <h2>💀 Game Over 💀</h2>
          <p>You ran out of health. Better luck next time!</p>
          <p>Left-click to try again</p>
        </div>
      )}

      {renderGameStatus()}
      {renderMaze()}
      {renderControls()}

      <div className="sr-only" aria-live="assertive" role="status">
        Game state: {gameState}
      </div>
    </div>
  );
};

ReactDOM.render(<AudioMazeGame />, document.getElementById('root'));