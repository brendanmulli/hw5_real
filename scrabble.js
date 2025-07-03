$(document).ready(function() {
    // Main game state object
    const gameState = {
        tiles: [
            {"letter":"A", "value":1, "amount":9, "remaining":9},
            {"letter":"B", "value":3, "amount":2, "remaining":2},
            {"letter":"C", "value":3, "amount":2, "remaining":2},
            {"letter":"D", "value":2, "amount":4, "remaining":4},
            {"letter":"E", "value":1, "amount":12, "remaining":12},
            {"letter":"F", "value":4, "amount":2, "remaining":2},
            {"letter":"G", "value":2, "amount":3, "remaining":3},
            {"letter":"H", "value":4, "amount":2, "remaining":2},
            {"letter":"I", "value":1, "amount":9, "remaining":9},
            {"letter":"J", "value":8, "amount":1, "remaining":1},
            {"letter":"K", "value":5, "amount":1, "remaining":1},
            {"letter":"L", "value":1, "amount":4, "remaining":4},
            {"letter":"M", "value":3, "amount":2, "remaining":2},
            {"letter":"N", "value":1, "amount":6, "remaining":6},
            {"letter":"O", "value":1, "amount":8, "remaining":8},
            {"letter":"P", "value":3, "amount":2, "remaining":2},
            {"letter":"Q", "value":10, "amount":1, "remaining":1},
            {"letter":"R", "value":1, "amount":6, "remaining":6},
            {"letter":"S", "value":1, "amount":4, "remaining":4},
            {"letter":"T", "value":1, "amount":6, "remaining":6},
            {"letter":"U", "value":1, "amount":4, "remaining":4},
            {"letter":"V", "value":4, "amount":2, "remaining":2},
            {"letter":"W", "value":4, "amount":2, "remaining":2},
            {"letter":"X", "value":8, "amount":1, "remaining":1},
            {"letter":"Y", "value":4, "amount":2, "remaining":2},
            {"letter":"Z", "value":10, "amount":1, "remaining":1},
            {"letter":"_", "value":0, "amount":2, "remaining":2}
        ],
        board: Array(7).fill(null),
        currentWord: [],
        score: 0
    };

    // Initialize game on page load
    initGame();

    function initGame() {
        dealTiles(7);
        setupDragAndDrop();
        
        // Button event handlers
        $('#submit-word').click(validateAndSubmitWord);
        $('#new-tiles').click(() => dealTiles(7));
        $('#reset-game').click(resetGame);
    }

    // Deal random tiles to player's rack
    function dealTiles(count) {
        if (count <= 0) return;
        
        const tilePool = [];
        
        gameState.tiles.forEach(tile => {
            for (let i = 0; i < tile.remaining; i++) {
                tilePool.push(tile.letter);
            }
        });
        
        shuffleArray(tilePool).slice(0, count).forEach(letter => {
            const tile = gameState.tiles.find(t => t.letter === letter);
            if (tile) {
                tile.remaining--;
                addTileToRack(letter);
            }
        });
    }

    // Create and add tile to rack
    function addTileToRack(letter) {
        $('<div>')
            .addClass('tile')
            .attr('data-letter', letter)
            .css('background-image', `url('./Scrabble_Tiles/Scrabble_Tile_${letter === '_' ? 'Blank' : letter}.jpg')`)
            .draggable({
                containment: '#game-container',
                revert: 'invalid',
                cursor: 'move',
                zIndex: 100,
                start: function() { $(this).css('opacity', '0.7'); },
                stop: function() { $(this).css('opacity', '1'); }
            })
            .appendTo('#tile-rack');
    }

    // Set up drag and drop functionality
    function setupDragAndDrop() {
        $('.board-square').droppable({
            accept: '.tile',
            tolerance: 'pointer',
            drop: function(event, ui) {
                const $tile = ui.draggable;
                const letter = $tile.attr('data-letter');
                const $square = $(this);
                const position = parseInt($square.attr('data-position'));
                
                if ($square.children('.tile').length > 0) {
                    return false;
                }
                
                if (gameState.currentWord.length > 0) {
                    const positions = gameState.currentWord.map(t => t.position);
                    const minPos = Math.min(...positions);
                    const maxPos = Math.max(...positions);
                    
                    if (position !== minPos - 1 && position !== maxPos + 1) {
                        $tile.draggable("option", "revert", true);
                        alert("Tiles must be placed adjacent to existing tiles!");
                        return false;
                    }
                }
                
                $tile.draggable('destroy')
                    .css({
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)'
                    })
                    .appendTo($square);
                
                gameState.currentWord.push({
                    letter: letter,
                    position: position,
                    type: $square.data('type')
                });
                
                gameState.board[position] = letter;
                updateGameDisplay();
            }
        });

        $('#tile-rack').droppable({
            accept: '.tile',
            drop: function(event, ui) {
                const $tile = ui.draggable;
                const letter = $tile.attr('data-letter');
                
                $tile.draggable('destroy')
                    .css({
                        position: 'relative',
                        top: 'auto',
                        left: 'auto',
                        transform: 'none'
                    })
                    .appendTo(this);
                
                const $parent = $tile.parent();
                if ($parent.hasClass('board-square')) {
                    const position = parseInt($parent.attr('data-position'));
                    
                    gameState.currentWord = gameState.currentWord.filter(t => 
                        t.position !== position
                    );
                    gameState.board[position] = null;
                    
                    updateGameDisplay();
                }
            }
        });
    }

    // Update UI with current word and scores
    function updateGameDisplay() {
        gameState.currentWord.sort((a, b) => a.position - b.position);
        
        const word = gameState.currentWord.map(t => t.letter).join('');
        $('#word-display').text(word || '(no letters placed)');
        
        let wordMultiplier = 1;
        let letterScore = 0;
        
        gameState.currentWord.forEach(tile => {
            const tileData = gameState.tiles.find(t => t.letter === tile.letter);
            let value = tileData ? tileData.value : 0;
            
            if (tile.type === 'double-letter') value *= 2;
            if (tile.type === 'triple-letter') value *= 3;
            if (tile.type === 'double-word') wordMultiplier *= 2;
            if (tile.type === 'triple-word') wordMultiplier *= 3;
            
            letterScore += value;
        });
        
        const wordScore = letterScore * wordMultiplier;
        $('#word-score-display').text(wordScore);
        $('#score-display').text(gameState.score + wordScore);
    }

    // Validate and submit current word
    function validateAndSubmitWord() {
        if (gameState.currentWord.length < 2) {
            alert('Please place at least 2 letters to form a word!');
            return;
        }
        
        const word = gameState.currentWord.map(t => t.letter).join('');
        const wordScore = parseInt($('#word-score-display').text());
        
        gameState.score += wordScore;
        
        $('.board-square .tile').remove();
        const tilesUsed = gameState.currentWord.length;
        gameState.currentWord = [];
        gameState.board = Array(7).fill(null);
        
        dealTiles(tilesUsed);
        
        $('#word-display').text('(no letters placed)');
        $('#word-score-display').text('0');
        
        alert(`You scored ${wordScore} points for "${word}"! Total: ${gameState.score}`);
    }

    // Reset entire game
    function resetGame() {
        if (confirm('Are you sure you want to reset the game?')) {
            gameState.tiles.forEach(tile => {
                tile.remaining = tile.amount;
            });
            
            $('.board-square .tile, #tile-rack .tile').remove();
            gameState.currentWord = [];
            gameState.score = 0;
            gameState.board = Array(7).fill(null);
            
            $('#word-display').text('(no letters placed)');
            $('#score-display').text('0');
            $('#word-score-display').text('0');
            
            dealTiles(7);
        }
    }

    // Helper function to shuffle array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});