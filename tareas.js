// Enhanced task management with consult/edit, status-only updates, comments history, filtering and error handling.
(function(){
  'use strict';

  // ---- State ----
  const tasks = []; // in-memory for this assignment
  let selectedTaskId = null;

  // ---- Helpers ----
  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function setAlert(elId, type, msg){
    const el = qs('#' + elId);
    el.className = `alert ${type}`;
    el.textContent = msg;
    el.hidden = false;
  }
  function clearAlert(elId){
    const el = qs('#' + elId);
    el.hidden = true;
    el.textContent = '';
    el.className = 'alert';
  }
  function resetCreateForm(){
    qs('#taskId').value='';
    qs('#projectId').value='';
    qs('#titleInput').value='';
    qs('#descInput').value='';
    qs('#dateInput').value='';
    qs('#clientInput').value='';
    qs('#commentsInput').value='';
    qs('#statusInput').value='Por hacer';
  }
  function timestamp(){
    const d = new Date();
    const pad = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // ---- Rendering ----
  function renderTable(){
    const tbody = qs('#taskTable tbody');
    tbody.innerHTML='';
    const filter = qs('#statusFilter').value;
    const filtered = tasks.filter(t => filter==='Todos' ? true : t.status === filter);

    for(const t of filtered){
      const tr = document.createElement('tr');
      tr.dataset.id = t.id;
      tr.innerHTML = `<td>${t.id}</td>
                      <td>${t.title}</td>
                      <td>${t.description}</td>
                      <td>${t.startDate}</td>
                      <td>${t.client}</td>
                      <td>${t.projectId}</td>
                      <td>${(t.comments||'').replace(/\n/g,'<br>')}</td>
                      <td>${t.status}</td>`;
      tbody.appendChild(tr);
    }
  }

  function populateEdit(task){
    if(!task){ return; }
    qs('#e_taskId').value = task.id;
    qs('#e_projectId').value = task.projectId;
    qs('#e_title').value = task.title;
    qs('#e_desc').value = task.description;
    qs('#e_date').value = task.startDate;
    qs('#e_client').value = task.client;
    qs('#e_comments').value = task.comments || '';
    qs('#e_status').value = task.status;
    qs('#e_newComment').value = '';
  }

  function findTaskById(id){ return tasks.find(t => t.id === id); }

  // ---- Events ----
  window.addEventListener('DOMContentLoaded', () => {
    try {
      const data = sessionStorage.getItem('auth_user');
      if(!data){ window.location.replace('login.html'); return }
      const user = JSON.parse(data);
      qs('#userName').value = `${user.name} <${user.email}>`;
    } catch(err){
      console.error(err);
      // Allow page anyway
    }

    // Create task
    qs('#taskForm').addEventListener('submit', (e) => {
      e.preventDefault();
      clearAlert('taskAlert');
      try {
        const id = qs('#taskId').value.trim();
        const projectId = qs('#projectId').value.trim();
        const title = qs('#titleInput').value.trim();
        const description = qs('#descInput').value.trim();
        const startDate = qs('#dateInput').value;
        const client = qs('#clientInput').value.trim();
        const comments = qs('#commentsInput').value.trim();
        const status = qs('#statusInput').value;

        if(!id || !projectId || !title || !description || !startDate || !client){
          setAlert('taskAlert','error','Verifica los campos requeridos.');
          return;
        }
        if(findTaskById(id)){
          setAlert('taskAlert','error','El ID ya existe. Usa un ID único.');
          return;
        }

        tasks.push({ id, projectId, title, description, startDate, client, comments, status });
        renderTable();
        resetCreateForm();
        setAlert('taskAlert','success','Tarea registrada exitosamente.');
      } catch(err){
        console.error(err);
        setAlert('taskAlert','error','Ocurrió un error al registrar la tarea.');
      }
    });

    // Filter
    qs('#statusFilter').addEventListener('change', () => {
      try { renderTable(); } catch(err){ console.error(err); }
    });

    // Row double click -> load into edit form
    qs('#taskTable tbody').addEventListener('dblclick', (e) => {
      const tr = e.target.closest('tr');
      if(!tr) return;
      try {
        const id = tr.dataset.id;
        const task = findTaskById(id);
        if(task){
          selectedTaskId = id;
          populateEdit(task);
          clearAlert('editAlert');
          setAlert('editAlert','success','Ticket cargado en la sección de cambios.');
        }
      } catch(err){
        console.error(err);
        setAlert('editAlert','error','No fue posible cargar el ticket.');
      }
    });

    // Update task (status + optional new comment)
    qs('#editForm').addEventListener('submit', (e) => {
      e.preventDefault();
      clearAlert('editAlert');
      try {
        if(!selectedTaskId){
          setAlert('editAlert','error','Selecciona un ticket con doble clic en la tabla.');
          return;
        }
        const task = findTaskById(selectedTaskId);
        if(!task){
          setAlert('editAlert','error','El ticket seleccionado ya no existe.');
          return;
        }
        // Only status is editable
        const newStatus = qs('#e_status').value;
        const newComment = qs('#e_newComment').value.trim();

        task.status = newStatus;
        if(newComment){
          const entry = `[${timestamp()}] ${newComment}`;
          task.comments = task.comments ? (task.comments + '\\n' + entry) : entry;
        }
        populateEdit(task);
        renderTable();
        setAlert('editAlert','success','Cambios guardados y reflejados en la tabla.');
      } catch(err){
        console.error(err);
        setAlert('editAlert','error','Ocurrió un error al actualizar el ticket.');
      }
    });

    // Logout
    qs('#logoutBtn').addEventListener('click', () => {
      try { sessionStorage.removeItem('auth_user'); } catch {}
      location.href = 'login.html';
    });
  });
})();