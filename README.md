# ANIME FORGE 3D — Prototype 0.4

## Novedades
- Rig humanoide jerárquico heredado de 0.3.
- Brazos y piernas reconstruidos como `THREE.SkinnedMesh` con tubos segmentados.
- Pesos automáticos de dos influencias por vértice, normalizados (suma 1) y transición suave en codos/rodillas.
- Diagnóstico de pesos por color y simetría procedural de la distribución entre lados.
- Poses de prueba y exportación GLB experimental de las mallas skinned.
- Carga compatible con proyectos locales 0.1, 0.2 y 0.3; guardado en clave 0.4.

## Límites conocidos
- El torso, cabeza, manos, dedos, cabello y accesorios siguen siendo piezas rígidas o independientes.
- La simetría es inherente al generador procedural; el botón informa/aplica esa política, no es un editor de pesos.
- No existe todavía pintura manual de pesos ni edición de vértices.
- Las poses son pruebas del rig, no una biblioteca de animaciones de producción.
- El GLB se genera con GLTFExporter, pero debe validarse en Godot 4 antes de considerarlo listo para producción.
- Requiere conexión a internet para cargar Three.js desde CDN en la primera instalación; el comportamiento offline depende de que los recursos externos hayan quedado disponibles.

## Uso
Abre `index.html` desde un servidor web local/hosting compatible con módulos ES. Para Android, instala como PWA desde el navegador. Arrastra la vista 3D para orbitar y entra en la pestaña Rig para mostrar huesos, pesos y poses.
