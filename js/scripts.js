function openTab(tabName, element) {
    // Oculta todos los contenidos de pestañas
    var tabcontents = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontents.length; i++) {
        tabcontents[i].style.display = "none";
    }
    
    // Remueve la clase 'active' de todos los botones
    var tablinks = document.getElementsByClassName("tablink");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    
    // Muestra la pestaña actual y marca el botón como activo
    document.getElementById(tabName).style.display = "block";
    element.className += " active";
    
    // Guarda la pestaña activa en localStorage
    localStorage.setItem('lastActiveTab', tabName);
}

// Cargar la última pestaña activa al recargar la página
document.addEventListener('DOMContentLoaded', function() {
    var lastActiveTab = localStorage.getItem('lastActiveTab');
    if (lastActiveTab) {
        var tabElement = document.querySelector(`.tablink[onclick*="${lastActiveTab}"]`);
        if (tabElement) {
            openTab(lastActiveTab, tabElement);
        } else {
            // Mostrar pestaña de inicio por defecto
            document.getElementById('home').style.display = "block";
            document.querySelector('.tablink').className += " active";
        }
    } else {
        // Mostrar pestaña de inicio por defecto
        document.getElementById('home').style.display = "block";
        document.querySelector('.tablink').className += " active";
    }
});