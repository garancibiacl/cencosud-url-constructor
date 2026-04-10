// Script para Illustrator: redondear mesas de trabajo
var doc = app.activeDocument;
for (var i = 0; i < doc.artboards.length; i++) {
    var ab = doc.artboards[i];
    var rect = ab.artboardRect; // [left, top, right, bottom]
    for (var j = 0; j < rect.length; j++) rect[j] = Math.round(rect[j]);
    ab.artboardRect = rect;
}
alert("Todas las mesas de trabajo fueron ajustadas a valores enteros.");
