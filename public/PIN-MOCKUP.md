# Pin-Mockup

    PinMockUp.png     Original, 1254 x 1254 – Quelle, wird nicht ausgeliefert
    pin-mockup.png    400 x 400, daraus erzeugt – DIESE Datei zeigt die Seite

Das Original ist knapp 1 MB gross. Angezeigt wird der Pin in der
Trachtenpin-Kachel des Onboardings mit rund 100 px Breite; 400 px decken auch
Displays mit dreifacher Pixeldichte. Die verkleinerte Fassung ist rund 35 KB,
also etwa ein Dreissigstel – auf Handydaten ein spuerbarer Unterschied.

Neues Original abgelegt? Dann die kleine Fassung neu erzeugen:

    node -e "require('sharp')('public/PinMockUp.png').resize(400,400,{fit:'inside'}).png({compressionLevel:9,palette:true}).toFile('public/pin-mockup.png')"

`sharp` ist als optionale Abhaengigkeit von Next schon installiert.
