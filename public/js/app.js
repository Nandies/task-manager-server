$(document).ready(function() {
    const socket = io();

    function loadTasks() {
        $.get('/tasks', function(data) {
            $('#task-list').empty();
            data.forEach(function(task) {
                $('#task-list').append(`
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span class="task-desc">${task.description}</span>
                        <span>
                            <button class="btn btn-sm btn-success complete-task" data-id="${task.id}">Complete</button>
                            <button class="btn btn-sm btn-danger delete-task" data-id="${task.id}">Delete</button>
                        </span>
                    </li>
                `);
            });
        });
    }

    function loadGoals() {
        $.get('/goals', function(data) {
            $('#goal-list').empty();
            data.forEach(function(goal) {
                $('#goal-list').append(`
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span class="goal-desc">${goal.description}</span>
                        <span>
                            <button class="btn btn-sm btn-success complete-goal" data-id="${goal.id}">Complete</button>
                            <button class="btn btn-sm btn-danger delete-goal" data-id="${goal.id}">Delete</button>
                        </span>
                    </li>
                `);
            });
        });
    }

    function loadNotes() {
        $.get('/notes', function(data) {
            $('#note-list').empty();
            data.forEach(function(note) {
                $('#note-list').append(`
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        <span class="note-content">${note.content}</span>
                        <button class="btn btn-sm btn-danger delete-note" data-id="${note.id}">Delete</button>
                    </li>
                `);
            });
        });
    }

    $('#task-form').submit(function(e) {
        e.preventDefault();
        const description = $('#task-input').val();
        if (description) {
            $.post('/tasks', { description }, function() {
                $('#task-input').val('');
                loadTasks(); // Reload tasks to reflect the new addition
            });
        }
    });

    $('#goal-form').submit(function(e) {
        e.preventDefault();
        const description = $('#goal-input').val();
        if (description) {
            $.post('/goals', { description }, function() {
                $('#goal-input').val('');
                loadGoals(); // Reload goals to reflect the new addition
            });
        }
    });

    $('#note-form').submit(function(e) {
        e.preventDefault();
        const content = $('#note-input').val();
        if (content) {
            $.post('/notes', { content }, function() {
                $('#note-input').val('');
                loadNotes(); // Reload notes to reflect the new addition
            });
        }
    });

    $(document).on('click', '.complete-task', function() {
        const id = $(this).data('id');
        const description = $(this).closest('li').find('.task-desc').text().trim();
        $.ajax({
            url: `/tasks/${id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ description, completed: true }),
            success: function() {
                loadTasks();
            }
        });
    });

    $(document).on('click', '.complete-goal', function() {
        const id = $(this).data('id');
        const description = $(this).closest('li').find('.goal-desc').text().trim();
        $.ajax({
            url: `/goals/${id}`,
            type: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ description, completed: true }),
            success: function() {
                loadGoals();
            }
        });
    });

    $(document).on('click', '.delete-task', function() {
        const id = $(this).data('id');
        $.ajax({
            url: `/tasks/${id}`,
            type: 'DELETE',
            success: function() {
                loadTasks();
            }
        });
    });

    $(document).on('click', '.delete-goal', function() {
        const id = $(this).data('id');
        $.ajax({
            url: `/goals/${id}`,
            type: 'DELETE',
            success: function() {
                loadGoals();
            }
        });
    });

    $(document).on('click', '.delete-note', function() {
        const id = $(this).data('id');
        $.ajax({
            url: `/notes/${id}`,
            type: 'DELETE',
            success: function() {
                loadNotes();
            }
        });
    });

    socket.on('taskAdded', function(task) {
        loadTasks();
    });

    socket.on('goalAdded', function(goal) {
        loadGoals();
    });

    socket.on('noteAdded', function(note) {
        loadNotes();
    });

    socket.on('taskUpdated', function(task) {
        loadTasks();
    });

    socket.on('goalUpdated', function(goal) {
        loadGoals();
    });

    socket.on('noteUpdated', function(note) {
        loadNotes();
    });

    socket.on('taskDeleted', function(id) {
        loadTasks();
    });

    socket.on('goalDeleted', function(id) {
        loadGoals();
    });

    socket.on('noteDeleted', function(id) {
        loadNotes();
    });

    loadTasks();
    loadGoals();
    loadNotes();
});
