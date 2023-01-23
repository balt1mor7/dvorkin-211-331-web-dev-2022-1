let counterTasks = 0;
let titles = {
    "create": "Создание новой задачи",
    "edit": "Редактирование задачи",
    "show": "Просмотр задачи",
};
let actionBtn = {
    "create": "Создать",
    "edit": "Сохранить",
    "show": "Окей",
};
let url = "http://tasks-api.std-900.ist.mospolytech.ru";
let apiKey = "50d2199a-42dc-447d-81ed-d68a443b697e";

function alertMes(error, color) {
    let alerts = document.querySelector(".alerts");
    let alert = document.createElement("div");
    alert.classList.add("alert", "alert-dismissible", color);
    alert.setAttribute("role", "alert");
    alert.append(error);
    let btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.classList.add("btn-close");
    btn.setAttribute("data-bs-dismiss", "alert");
    btn.setAttribute("aria-label", "Close");
    alert.append(btn);
    alerts.append(alert);
}

async function toggleTask(event) {
    let target = event.target;
    let taskId = target.closest(".task").id;
    let urlId = new URL(url + "/api/tasks/" + taskId);
    let task;
    urlId.searchParams.append("api_key", apiKey);
    try {
        let response = await fetch(urlId);
        task = await response.json();
        if (task.error) alertMes(task.error, "alert-warning");
    } catch (error) {
        alertMes(error.message, "alert-danger");
    } 
    let newStatus;
    if (task.status == "to-do") {
        newStatus = "done";
    } else if (task.status == "done") {
        newStatus = "to-do";
    }
    let item = document.getElementById(taskId);
    let list = document.querySelector(`#${newStatus}-list ul`);
    list.append(item);

    let form = document.createElement('form');
    let formm = new FormData(form);
    formm.append("status", newStatus);
    try {
        let res = await fetch(urlId, {
            method: 'PUT',
            body: formm
        });
        console.log(formm.get("status"));
        let data = await res.json();
        if (data.error) alertMes(data.error, "alert-warning");
        else alertMes("Статус успешно изменён", "alert-success");
        console.log(data);
    } catch (error) {
        alertMes(error.message, "alert-danger");
    }
    
}

function createNewTaskElem(task) {
    let templateTask = document.getElementById("taskTemplate");
    let newTask = templateTask.content.firstElementChild.cloneNode(true);
    let taskName = newTask.querySelector(".task-name");
    taskName.textContent = task.name;
    newTask.id = task.id;
    let arrows = newTask.querySelectorAll(".toggle-arrow");
    for(let arrow of arrows) {
        arrow.onclick = toggleTask;
    }
    return newTask;
}

async function createTask(name, desc, status) {
    let obj = {
        name: name,
        desc: desc,
        status: status,
        taskId: counterTasks++
    }
    let data;
    let form = new FormData(document.querySelector('form'));
    let urlId = new URL(url + "/api/tasks");
    urlId.searchParams.append("api_key", apiKey);
    try {
        let response = await fetch(urlId, {
        method: 'POST',
        body: form,
        });
        data = await response.json();
        if (data.error) alertMes(data.error, "alert-warning");
        else alertMes("Задача успешно создана", "alert-success");
    } catch (error) {
        alertMes(error.message, "alert-danger");
    }
    console.log(data);
    return data;
}

function addTaskInHtml(task) {
    let list = document.querySelector("#" + task.status + "-list ul");
    list.append(createNewTaskElem(task));
}

async function clickBtnHandler(event) {
    let modalWindow = event.target.closest(".modal");
    let form = modalWindow.querySelector("form");
    let formElements = form.elements;
    let name = formElements["name"].value;
    let desc = formElements["desc"].value;
    let status = formElements["status"].value;
    let action = formElements["action"].value;
    let taskId = formElements["taskId"].value;
    if (action == "create") {                                      
        let task = await createTask(name, desc, status);
        if (task.status) addTaskInHtml(task);
    } else if (action == "edit") {                                
        let urlId = new URL(url + "/api/tasks/" + taskId);
        urlId.searchParams.append("api_key", apiKey);
        let formm = new FormData(form);
        try {
            let response = await fetch(urlId, {
            method: 'PUT',
            body: formm
            });
            let newTask = await response.json();
            if (newTask.error) alertMes(newTask.error, "alert-warning");
            else {
                alertMes("Задача изменена", "alert-success");
                document.getElementById(taskId).querySelector(".task-name").textContent = name;
            } 
        } catch (error) {
            alertMes(error.message, "alert-danger");
        }
    }
    form.reset();
}

async function dataLoad() {
    let maxId = 0;
    let urlId = new URL(url + "/api/tasks");
    urlId.searchParams.append("api_key", apiKey);
    try {
        let response = await fetch(urlId);
        let data = await response.json();
        let tasks = data.tasks;
        alertMes("Данные успешно загружены", "alert-success");
        console.log(data);
        console.log(tasks);
        for (let task of tasks) {
            addTaskInHtml(task);
            if (maxId < task.id) maxId = task.id;
        }
    } catch(err) {
        alertMes(err.message, "alert-danger");
    }
    counterTasks = maxId + 1;
}

function updateCounter(event) {
    let target = event.target;
    let taskCounter = target.closest('.card').querySelector('.task-counter');
    taskCounter.textContent = target.children.length;
}

function parseTask(taskId) {
    let value = localStorage.getItem('task-'+taskId);
    let task = JSON.parse(value);
    return task;
}

async function deleteEvent (event) {
    let taskId = event.relatedTarget.closest('.task').id;
    let urlId = new URL(url + "/api/tasks/" + taskId);
    urlId.searchParams.append("api_key", apiKey);
    try {
        let response = await fetch(urlId);
        let task = await response.json();
        if (task.error) alertMes(task.error, "alert-warning");
        else {
            event.target.querySelector('span.deleteTask').textContent = task.name;
            event.target.querySelector('form').elements['taskid'].value = task.id;
        }
    } catch (error) {
        alertMes(error.message, "alert-danger");
    }
}

async function actionEvent(event) {
    let action = event.relatedTarget.dataset.action;
    let form = event.target.querySelector('form');
    let task;
    form.elements['action'].value = action;
    event.target.querySelector('.modal-title').textContent = titles[action];
    event.target.querySelector('.create-btn').textContent = actionBtn[action];
    if (action == 'edit') {
        let taskId = event.relatedTarget.closest('.task').id;
        let urlId = new URL(url + "/api/tasks/" + taskId);
        urlId.searchParams.append("api_key", apiKey);
        try {
            let response = await fetch(urlId);
            task = await response.json();
            if (task.error) alertMes(task.error, "alert-warning");
            form.elements['name'].value = task.name;
            form.elements['desc'].value = task.desc;
            form.elements['taskId'].value = taskId;
            form.elements['status'].value = task.status;
            form.elements['status'].closest('.row').classList.add('d-none');
        } catch (error) {
            alertMes(error.message, "alert-danger");
            form.elements['status'].closest('.row').classList.add('d-none');
        }
    }
    else if (action == 'show') {
        let taskId = event.relatedTarget.closest('.task').id;
        let urlId = new URL(url + "/api/tasks/" + taskId);
        urlId.searchParams.append("api_key", apiKey);
        try {
            let response = await fetch(urlId);
            task = await response.json();
            if (task.error) alertMes(task.error, "alert-warning");
            form.elements['name'].value = task.name;
            form.elements['desc'].value = task.desc;
            form.elements['taskId'].value = taskId;
            form.elements['status'].closest('.row').classList.add('d-none');
            event.target.querySelector('.back-btn').classList.add('d-none');
            let name = form.querySelector('#name');
            let desc = form.querySelector('#desc');
            name.setAttribute('readonly', '')
            name.classList.remove('form-control');
            name.classList.add('form-control-plaintext');
            desc.setAttribute('readonly', '');
            desc.classList.remove('form-control');
            desc.classList.add('form-control-plaintext');
        } catch (error) {
            alertMes(error.message, "alert-danger");
            form.elements['status'].closest('.row').classList.add('d-none');
            event.target.querySelector('.back-btn').classList.add('d-none');
            let name = form.querySelector('#name');
            let desc = form.querySelector('#desc');
            name.setAttribute('readonly', '')
            name.classList.remove('form-control');
            name.classList.add('form-control-plaintext');
            desc.setAttribute('readonly', '');
            desc.classList.remove('form-control');
            desc.classList.add('form-control-plaintext');
        }
        console.log(task);
        
    }
}

function closeModal(event) {
    let form = event.target.querySelector('form');
    event.target.querySelector('.back-btn').classList.remove('d-none');
    form.querySelector('#name').removeAttribute('readonly');
    form.querySelector('#desc').removeAttribute('readonly');
    form.elements['status'].closest('.row').classList.remove('d-none');
    let name = form.querySelector('#name');
    let desc = form.querySelector('#desc');
    name.classList.remove('form-control-plaintext');
    name.classList.add('form-control');
    desc.classList.remove('form-control-plaintext');
    desc.classList.add('form-control');
}

window.onload = function() {
    let createBtn = document.querySelector(".create-btn");
    createBtn.onclick = clickBtnHandler;
    let lists = document.querySelectorAll('#to-do-list ul, #done-list ul');
    for (let list of lists) {
        list.addEventListener('DOMSubtreeModified', updateCounter);
    }
    let modal = document.querySelector('#deleteTask');
    modal.addEventListener('show.bs.modal', deleteEvent);
    dataLoad();
    let buttonDel = document.querySelector('.delete');
    buttonDel.onclick = function (event) {
        let taskId = event.target.closest('.modal').querySelector('form').elements['taskid'].value;
        let urlId = new URL(url + "/api/tasks/" + taskId);
        urlId.searchParams.append("api_key", apiKey);
        let res = fetch(urlId, {
            method: 'DELETE',
        }).then(response => {
            return response.json()
        }).then(data => {
            alertMes("Задача удалена", "alert-success");
        }).catch(reject => {alertMes(reject.message, "alert-danger")});   
        document.getElementById(taskId).remove();
    }
    let modalAddTask = document.querySelector('#addTask');
    modalAddTask.addEventListener('show.bs.modal', actionEvent);
    let arrows = document.querySelectorAll(".toggle-arrow");
    for(let arrow of arrows) {
        arrow.onclick = toggleTask;
    }
    modalAddTask.addEventListener('hide.bs.modal', closeModal);
}