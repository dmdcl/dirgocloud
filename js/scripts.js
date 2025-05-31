function openTab(tabName, element) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tabcontent').forEach(content => {
        content.style.display = 'none';
        content.innerHTML = ''; // Limpiar contenido previo
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.tablink').forEach(link => {
        link.classList.remove('active');
    });
    
    // Activar el botón seleccionado
    element.classList.add('active');
    
    // Mostrar el contenido adecuado
    const tabContent = document.getElementById(tabName);
    tabContent.style.display = 'block';
    
    // Cargar contenido externo si no es la pestaña de inicio
    if (tabName !== 'home') {
        loadExternalContent(tabName);
    }
}

function loadExternalContent(tabName) {
    const contentDiv = document.getElementById(tabName);
    const contentFile = `paginas/${tabName}.html`;
    
    fetch(contentFile)
        .then(response => {
            if (!response.ok) {
                throw new Error('Página no encontrada');
            }
            return response.text();
        })
        .then(html => {
            contentDiv.innerHTML = `<div class="loaded-content">${html}</div>`;
        })
        .catch(error => {
            contentDiv.innerHTML = `
                <div class="loaded-content error">
                    <h3>Error al cargar el contenido</h3>
                    <p>${error.message}</p>
                </div>
            `;
        });
}

// Inicializar - Mostrar solo la pestaña de inicio al cargar
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('home').style.display = 'block';
    document.querySelector('.tablink').classList.add('active');
});