function openTab(tabName, element) {
    // Oculta todos los elementos con clase tabcontent
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    
    // Elimina la clase active de todos los botones
    var tablinks = document.getElementsByClassName("tablink");
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    
    // Muestra la pestaña actual y añade la clase active al botón
    document.getElementById(tabName).style.display = "block";
    element.className += " active";
}