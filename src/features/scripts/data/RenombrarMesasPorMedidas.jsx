// Renombrar todas las mesas de trabajo según sus medidas
// Ejemplo: 1080x1920_
var doc = app.activeDocument;
var unidades = " px"; // cambia a " mm" si prefieres

for (var i = 0; i < doc.artboards.length; i++) {
    var ab = doc.artboards[i];
    var rect = ab.artboardRect;

    // Calcula ancho y alto
    var ancho = Math.round(rect[2] - rect[0]);
    var alto = Math.round(rect[1] - rect[3]);

    // Renombra mesa: 1080x1920_
    ab.name = ancho + "x" + alto + "_";
}

alert("✅ Todas las mesas fueron renombradas con sus medidas");
