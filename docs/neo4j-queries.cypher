// Ejemplos de Consultas Neo4j para Clínica Dental SaaS
// Ejecutar en Neo4j Browser (http://localhost:7474) o via driver

/*
===========================================
CONSULTAS BÁSICAS
===========================================
*/

// 1. Ver todos los pacientes
MATCH (p:Patient)
RETURN p
LIMIT 25;

// 2. Buscar paciente por nombre
MATCH (p:Patient)
WHERE p.firstName =~ '(?i).*juan.*' OR p.lastName =~ '(?i).*juan.*'
RETURN p;

// 3. Ver citas del día de hoy
MATCH (a:Appointment)-[:FOR_PATIENT]->(p:Patient)
MATCH (a)-[:WITH_DENTIST]->(d:User)
WHERE date(a.dateTime) = date()
RETURN a, p, d
ORDER BY a.dateTime;

// 4. Pacientes con alergias específicas
MATCH (p:Patient)
WHERE 'Penicilina' IN p.allergies
RETURN p.firstName, p.lastName, p.phone, p.allergies;

/*
===========================================
CONSULTAS AVANZADAS (Relaciones)
===========================================
*/

// 5. Pacientes que recibieron un tratamiento específico
MATCH (p:Patient)<-[:FOR_PATIENT]-(t:Treatment {name: 'Implante'})
RETURN p.firstName, p.lastName, t.startDate, t.cost
ORDER BY t.startDate DESC;

// 6. Historial completo de un paciente
MATCH (p:Patient {email: 'juan@example.com'})
OPTIONAL MATCH (p)<-[:FOR_PATIENT]-(a:Appointment)-[:WITH_DENTIST]->(d:User)
OPTIONAL MATCH (p)<-[:FOR_PATIENT]-(t:Treatment)
RETURN p, collect(DISTINCT a) as citas, collect(DISTINCT t) as tratamientos;

// 7. Dentista con más citas este mes
MATCH (d:User {role: 'DENTIST'})<-[:WITH_DENTIST]-(a:Appointment)
WHERE a.dateTime >= datetime() - duration({days: 30})
RETURN d.firstName, d.lastName, count(a) as total_citas
ORDER BY total_citas DESC;

// 8. Tratamientos por tipo de procedimiento
MATCH (t:Treatment)
RETURN t.name, count(*) as total, avg(t.cost) as costo_promedio
ORDER BY total DESC;

/*
===========================================
CONSULTAS DE NEGOCIO
===========================================
*/

// 9. Ingresos totales del mes
MATCH (t:Treatment)
WHERE t.startDate >= date() - duration({days: 30})
RETURN sum(t.cost) as ingresos_totales, sum(t.paid) as cobrado, sum(t.cost - t.paid) as pendiente;

// 10. Materiales con stock bajo
MATCH (m:Material)
WHERE m.stockQuantity < m.minStockLevel
RETURN m.name, m.stockQuantity, m.minStockLevel, (m.minStockLevel - m.stockQuantity) as deficit
ORDER BY deficit DESC;

// 11. Tasa de no-show (pacientes que no asistieron)
MATCH (a:Appointment)
WHERE a.dateTime < datetime()
WITH count(a) as total,
     sum(CASE WHEN a.status = 'NO_SHOW' THEN 1 ELSE 0 END) as no_shows
RETURN total, no_shows, round(100.0 * no_shows / total, 2) as tasa_no_show;

// 12. Pacientes con pagos pendientes
MATCH (p:Patient)<-[:FOR_PATIENT]-(t:Treatment)
WHERE t.paid < t.cost
RETURN p.firstName, p.lastName, p.phone, sum(t.cost - t.paid) as deuda_total
ORDER BY deuda_total DESC;

/*
===========================================
ANÁLISIS AVANZADO (Patrones)
===========================================
*/

// 13. Pacientes con implantes que tuvieron complicaciones
MATCH (p:Patient)<-[:FOR_PATIENT]-(t:Treatment)
WHERE t.name CONTAINS 'Implante' AND t.complications IS NOT NULL
RETURN p.firstName, p.lastName, t.name, t.complications, t.startDate;

// 14. Materiales más usados en tratamientos
MATCH (t:Treatment)-[:USED]->(m:Material)
RETURN m.name, m.brand, count(t) as veces_usado
ORDER BY veces_usado DESC
LIMIT 10;

// 15. Pacientes referidos entre especialistas (si existe relación REFERRED)
MATCH path = (d1:User {role: 'DENTIST'})-[:REFERRED]->(p:Patient)-[:RECEIVED_TREATMENT_FROM]->(d2:User {role: 'DENTIST'})
WHERE d1 <> d2
RETURN d1.firstName + ' ' + d1.lastName as referente,
       p.firstName + ' ' + p.lastName as paciente,
       d2.firstName + ' ' + d2.lastName as especialista;

// 16. Patrones de tratamiento (tratamientos que suelen ir juntos)
MATCH (p:Patient)<-[:FOR_PATIENT]-(t1:Treatment)
MATCH (p)<-[:FOR_PATIENT]-(t2:Treatment)
WHERE t1.name < t2.name AND 
      abs(duration.between(t1.startDate, t2.startDate).days) < 30
RETURN t1.name, t2.name, count(*) as frecuencia
ORDER BY frecuencia DESC
LIMIT 10;

/*
===========================================
CONSULTAS DE RENDIMIENTO
===========================================
*/

// 17. Agenda del dentista (próximos 7 días)
MATCH (d:User {email: 'dentista@clinica.com'})<-[:WITH_DENTIST]-(a:Appointment)-[:FOR_PATIENT]->(p:Patient)
WHERE a.dateTime >= datetime() AND a.dateTime <= datetime() + duration({days: 7})
RETURN date(a.dateTime) as fecha,
       time(a.dateTime) as hora,
       a.duration as duracion,
       p.firstName + ' ' + p.lastName as paciente,
       a.type as tipo,
       a.status as estado
ORDER BY a.dateTime;

// 18. Utilización de salas (si tienes campo room)
MATCH (a:Appointment)
WHERE a.dateTime >= datetime() - duration({days: 30})
  AND a.room IS NOT NULL
RETURN a.room, count(*) as citas_totales, avg(a.duration) as duracion_promedio
ORDER BY citas_totales DESC;

// 19. Eficiencia por dentista (citas completadas vs canceladas)
MATCH (d:User {role: 'DENTIST'})<-[:WITH_DENTIST]-(a:Appointment)
WITH d,
     sum(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END) as completadas,
     sum(CASE WHEN a.status = 'CANCELLED' THEN 1 ELSE 0 END) as canceladas,
     count(a) as total
RETURN d.firstName + ' ' + d.lastName as dentista,
       completadas,
       canceladas,
       total,
       round(100.0 * completadas / total, 2) as tasa_completadas
ORDER BY tasa_completadas DESC;

/*
===========================================
MANTENIMIENTO Y ADMINISTRACIÓN
===========================================
*/

// 20. Crear índices adicionales (si necesitas)
CREATE INDEX treatment_date_idx IF NOT EXISTS
FOR (t:Treatment) ON (t.startDate);

CREATE INDEX invoice_status_idx IF NOT EXISTS
FOR (i:Invoice) ON (i.status);

// 21. Ver estadísticas de la base de datos
CALL db.stats.retrieve('GRAPH COUNTS');

// 22. Contar nodos y relaciones
MATCH (n)
RETURN labels(n) as tipo, count(*) as total
ORDER BY total DESC;

MATCH ()-[r]->()
RETURN type(r) as tipo_relacion, count(*) as total
ORDER BY total DESC;

// 23. Limpiar datos de prueba (¡CUIDADO! Solo en desarrollo)
// MATCH (n) DETACH DELETE n;  // ⚠️ Borra TODO

// 24. Eliminar solo citas antiguas
MATCH (a:Appointment)
WHERE a.dateTime < datetime() - duration({days: 365})
DETACH DELETE a;

/*
===========================================
CONSULTAS PARA REPORTES
===========================================
*/

// 25. Reporte mensual de ingresos por tipo de tratamiento
MATCH (t:Treatment)
WHERE t.startDate >= date() - duration({days: 30})
RETURN t.name as tratamiento,
       count(*) as cantidad,
       sum(t.cost) as ingresos_totales,
       sum(t.paid) as cobrado,
       avg(t.cost) as costo_promedio
ORDER BY ingresos_totales DESC;

// 26. Nuevos pacientes por mes
MATCH (p:Patient)
WHERE p.createdAt >= datetime() - duration({months: 6})
RETURN date.truncate('month', p.createdAt) as mes,
       count(*) as nuevos_pacientes
ORDER BY mes DESC;

// 27. Tasa de retención (pacientes que volvieron)
MATCH (p:Patient)<-[:FOR_PATIENT]-(a:Appointment)
WITH p, collect(a.dateTime) as citas
WHERE size(citas) > 1
RETURN count(p) as pacientes_recurrentes,
       avg(size(citas)) as citas_promedio;

/*
===========================================
NOTAS DE USO
===========================================

1. Ejecutar en Neo4j Browser:
   - Abrir http://localhost:7474
   - Login con credenciales de .env
   - Copiar/pegar consulta
   - Click en "Play" o Ctrl+Enter

2. Usar en código (TypeScript):
   ```typescript
   import { getSession } from '@/lib/neo4j';
   
   const session = await getSession();
   const result = await session.run(`
     MATCH (p:Patient)
     WHERE p.firstName =~ $search
     RETURN p
   `, { search: '(?i).*juan.*' });
   
   const patients = result.records.map(r => r.get('p').properties);
   await session.close();
   ```

3. Performance tips:
   - Usar índices en campos de búsqueda frecuente
   - Limitar resultados con LIMIT
   - Evitar operaciones cartesianas sin WHERE
   - Usar EXPLAIN/PROFILE para analizar queries

4. Backup recomendado:
   - Neo4j Desktop: Botón "Manage" > "Dump" (exportar)
   - CLI: neo4j-admin dump --database=neo4j --to=backup.dump
*/
