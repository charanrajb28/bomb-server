const gridSize = { 4: 10, 8: 12, 12: 14, 16: 16, 32: 20 };
const bombPercentage = 0.4; // 40% of tiles will contain bombs

export function generateGrid(playerCount) {
    const size = gridSize[playerCount] || 10;
    let grid = Array.from({ length: size }, () => Array(size).fill("X"));

    const start = { x: 0, y: 0 };
    const goal = { x: size - 1, y: size - 1 };
    grid[start.x][start.y] = "S";
    grid[goal.x][goal.y] = "G";

    let path = [];
    let x = start.x, y = start.y;
    while (x < goal.x || y < goal.y) {
        if (x < goal.x && Math.random() > 0.5) x++;
        else if (y < goal.y) y++;
        path.push({ x, y });
        grid[x][y] = "P";
    }

    let bombCount = Math.floor(size * size * bombPercentage);
    while (bombCount > 0) {
        let bx = Math.floor(Math.random() * size);
        let by = Math.floor(Math.random() * size);
        if (grid[bx][by] === "X") {
            grid[bx][by] = "B";
            bombCount--;
        }
    }

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (grid[i][j] === "B") {
                [
                    [i - 1, j], [i + 1, j],
                    [i, j - 1], [i, j + 1]
                ].forEach(([nx, ny]) => {
                    if (nx >= 0 && ny >= 0 && nx < size && ny < size && grid[nx][ny] === "X") {
                        grid[nx][ny] = "R";
                    }
                });
            }
        }
    }

    return grid;
}