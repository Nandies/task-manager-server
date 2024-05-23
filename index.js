const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);



app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));



app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./taskmanager.db');

// Create table if it doesn't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        completed BOOLEAN
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT,
        completed BOOLEAN
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT
    )`);
});

const logAction = (type, action, data) => {
    const logEntry = `${new Date().toISOString()} - ${type} ${action}: ${JSON.stringify(data)}\n`;
    fs.appendFileSync(`./logs/${type}.log`, logEntry);
    console.log(`Logged action: ${logEntry}`); // Add this line for debugging
};

if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs');
}

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Archive routes
app.get('/logs/:type', (req, res) => {
    const type = req.params.type;
    fs.readFile(`./logs/${type}.log`, 'utf8', (err, data) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.send(`<pre>${data}</pre>`);
    });
});

// Task routes
app.get('/tasks', (req, res) => {
    db.all("SELECT * FROM tasks", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/tasks', (req, res) => {
    const { description } = req.body;
    db.run("INSERT INTO tasks (description, completed) VALUES (?, ?)", [description, 0], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const newTask = { id: this.lastID, description, completed: 0 };
        io.emit('taskAdded', newTask);
        logAction('tasks', 'added', newTask);
        res.status(201).json(newTask);
    });
});

app.put('/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { description, completed } = req.body;
    if (completed) {
        db.run("DELETE FROM tasks WHERE id = ?", id, function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            io.emit('taskDeleted', id);
            logAction('tasks', 'completed', { id, description });
            res.json({ id, description, completed });
        });
    } else {
        db.run("UPDATE tasks SET description = ?, completed = ? WHERE id = ?", [description, completed, id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            const updatedTask = { id, description, completed };
            io.emit('taskUpdated', updatedTask);
            logAction('tasks', 'updated', updatedTask);
            res.json(updatedTask);
        });
    }
});

app.delete('/tasks/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM tasks WHERE id = ?", id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        io.emit('taskDeleted', id);
        logAction('tasks', 'deleted', { id });
        res.status(204).send();
    });
});

// Goal routes
app.get('/goals', (req, res) => {
    db.all("SELECT * FROM goals", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/goals', (req, res) => {
    const { description } = req.body;
    db.run("INSERT INTO goals (description, completed) VALUES (?, ?)", [description, 0], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const newGoal = { id: this.lastID, description, completed: 0 };
        io.emit('goalAdded', newGoal);
        logAction('goals', 'added', newGoal);
        res.status(201).json(newGoal);
    });
});

app.put('/goals/:id', (req, res) => {
    const { id } = req.params;
    const { description, completed } = req.body;
    if (completed) {
        db.run("DELETE FROM goals WHERE id = ?", id, function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            io.emit('goalDeleted', id);
            logAction('goals', 'completed', { id, description });
            res.json({ id, description, completed });
        });
    } else {
        db.run("UPDATE goals SET description = ?, completed = ? WHERE id = ?", [description, completed, id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            const updatedGoal = { id, description, completed };
            io.emit('goalUpdated', updatedGoal);
            logAction('goals', 'updated', updatedGoal);
            res.json(updatedGoal);
        });
    }
});

app.delete('/goals/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM goals WHERE id = ?", id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        io.emit('goalDeleted', id);
        logAction('goals', 'deleted', { id });
        res.status(204).send();
    });
});

// Note routes
app.get('/notes', (req, res) => {
    db.all("SELECT * FROM notes", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/notes', (req, res) => {
    const { content } = req.body;
    db.run("INSERT INTO notes (content) VALUES (?)", [content], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const newNote = { id: this.lastID, content };
        io.emit('noteAdded', newNote);
        logAction('notes', 'added', newNote);
        res.status(201).json(newNote);
    });
});

app.put('/notes/:id', (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    db.run("UPDATE notes SET content = ? WHERE id = ?", [content, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const updatedNote = { id, content };
        io.emit('noteUpdated', updatedNote);
        logAction('notes', 'updated', updatedNote);
        res.json(updatedNote);
    });
});

app.delete('/notes/:id', (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM notes WHERE id = ?", id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        io.emit('noteDeleted', id);
        logAction('notes', 'deleted', { id });
        res.status(204).send();
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
