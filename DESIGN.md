# Alianza Heroica — prototipo

## Brief
- Promesa: "Somos un equipo de 4 héroes que, juntos, derrotan hordas y a un jefe gigante."
- Sensación: poder, caos divertido, cooperación. Pensado para niños: perdona errores.
- Verbo principal: golpear (combo de 3). Secundarios: 2 habilidades, esquivar, súper de alianza, cambiar de héroe.
- Cada 5-30 s: acercarse, combo, esquivar el aviso rojo, lanzar habilidad.
- Cada 1-5 min: oleadas más duras (gólems → brutos con barra de aturdimiento → Coloso).
- Perder: si caen los 4. Los caídos se levantan solos (más rápido si un aliado está cerca). Reinicio automático.
- Recompensa: energía al golpear, barra de Alianza al hacer daño, sinergias (2 habilidades de héroes distintos en <1.2 s y cerca = explosión extra).
- Mejor jugador: rompe la barra de aturdimiento (daño x2), encadena sinergias, esquiva avisos.
- Comunicación: avisos rojos en el piso antes de cada golpe enemigo; estrellas sobre enemigos aturdidos.
- No incluye: progresión, inventario, varios niveles, modelos 3D finales.

## Contrato del bucle
El jugador golpea y usa habilidades para limpiar oleadas mientras los gólems telegrafían golpes en rojo; el éxito llena energía y Alianza y avanza la oleada; el fallo te tumba unos segundos (tus aliados te levantan).

## Encuentro
- Plaza circular de radio 20, cámara alta 3/4 que sigue al grupo (sesgada a tu héroe).
- Oleada 1: 5 gólems. Oleada 2: 7 + 1 bruto. Oleada 3: 6 + 3 brutos. Oleada 4: Coloso (golpe de área y embestida en línea) + refuerzos.
- Entre oleadas: curación del 30 % y se levantan los caídos.
