const express = require('express');
const router = express.Router();

const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');

router.get('/add', isLoggedIn, async (req, res) => {
    const apara = await pool.query('SELECT * FROM aparato where estado_aparato=1');
    console.log(apara);
    const tec = await pool.query('select * from tecnicos ');
    res.render('links/add', { apara, tec });
});

router.post('/add', async (req, res) => {
    const { fecha, direccion, barrio, id_aparato} = req.body;
    const newlink = {
        fecha,
        direccion,
        barrio,
        id_aparato,
        iduser: req.user.identificacion
    };
    const tecno =await pool.query('SELECT te.precio, t.nombre,t.identificacion, t.apellido FROM tecnico_aparato te, tecnicos t WHERE t.identificacion=te.identificacion_tecnico AND te.id_aparato=? ', [id_aparato]);
    const apara= await pool.query('SELECT * FROM aparato WHERE id_aparato=?', [id_aparato]);   
    res.render('links/escogertecnico', {tecno, newlink, apara:apara[0]});
});

router.post('/add2', async (req, res) => {
    const { fecha, direccion, barrio, id_aparato, idtecnico} = req.body;
    const newlink = {
        fecha,
        direccion,
        barrio,
        id_aparato,
        iduser: req.user.identificacion, idtecnico
    };
    await pool.query('INSERT INTO servicioespera set ?', [newlink]);
    req.flash('success', 'Servicio Solicitado Correctamente');
    res.redirect('/links');
});

router.get('/', isLoggedIn, async (req, res) => {
    const links = await pool.query('SELECT a.nombre_aparato, s.fecha, s.direccion, s.barrio, s.idservicioespera, s.id_aparato, s.idtecnico, s.iduser, t.nombre, ta.precio FROM servicioespera s, aparato a, tecnicos t, tecnico_aparato ta  WHERE ta.identificacion_tecnico=s.idtecnico AND ta.id_aparato=s.id_aparato and s.idtecnico=t.identificacion and a.id_aparato=s.id_aparato and  iduser=?', [req.user.identificacion]);
    res.render('links/list', { links });
});

router.get('/delete/:idservicioespera', isLoggedIn, async (req, res) => {
    const { idservicioespera } = req.params;
    await pool.query('DELETE FROM servicioespera WHERE idservicioespera = ?', [idservicioespera]);
    req.flash('success', 'Servicio Cancelado Correctamente');
    if (req.user.rol == 1) {

        res.redirect('/links');

    } else if (req.user.rol == 2) {
        res.render('links/confirm');
    };
});

router.get('/edit/:idservicioespera', isLoggedIn, async (req, res) => {
    const { idservicioespera } = req.params;
    const links = await pool.query('SELECT * FROM servicioespera WHERE idservicioespera = ?', [idservicioespera]);

    res.render('links/edit', { links: links[0] });
});

router.post('/edit/:idservicioespera', isLoggedIn, async (req, res) => {
    const { idservicioespera } = req.params;
    const { fecha, direccion, barrio } = req.body;
    const newLink = {
        fecha,
        direccion,
        barrio
    };
    await pool.query('UPDATE servicioespera set ? WHERE idservicioespera = ?', [newLink, idservicioespera]);
    req.flash('success', 'Servicio Actualizado Correctamente');
    res.redirect('/links');
});


router.get('/confirm', isLoggedIn, async (req, res) => {
    console.log('confirm');
    const links = await pool.query('SELECT a.nombre_aparato, s.fecha, s.direccion, s.barrio, s.idservicioespera, u.nombre, u.apellido FROM usuario u,servicioespera s, aparato a, tecnicos t WHERE u.identificacion=s.iduser and s.id_aparato=a.id_aparato AND s.idtecnico=t.identificacion and t.identificacion=?', [req.user.identificacion]);
    res.render('links/confirm', { links });
});

router.get('/confirm2/:idservicioespera', isLoggedIn, async (req, res) => {
    const { idservicioespera } = req.params;
    const links = await pool.query('SELECT a.nombre_aparato, s.fecha, s.direccion, s.barrio, u.nombre, u.apellido, a.id_aparato, u.identificacion, s.idservicioespera, ta.precio FROM servicioespera s, aparato a, usuario u, tecnico_aparato ta  WHERE  ta.identificacion_tecnico=s.idtecnico AND ta.id_aparato=s.id_aparato AND s.id_aparato=a.id_aparato AND u.identificacion=s.iduser AND s.idservicioespera=?', [idservicioespera]);
    req.flash('success', 'Servicio Aceptado Correctamente');
    res.render('links/servicio', { links: links[0] });
});

router.post('/servicio/:idservicioespera', isLoggedIn, async (req, res) => {
    const { idservicioespera } = req.params;
    const { fecha, iduser, id_aparato, descripcion, barrio, direccion, precio } = req.body;
    const servi = {
        fecha, iduser, direccion, barrio, descripcion, idtecnico: req.user.identificacion, id_aparato, precio
    };
    await pool.query('INSERT INTO servicios SET ?', [servi]);
    const jj = await pool.query('DELETE FROM servicioespera WHERE idservicioespera = ?', [idservicioespera]);
    const links = await pool.query('SELECT a.nombre_aparato, s.fecha, s.direccion, s.barrio, s.idservicioespera FROM servicioespera s, aparato a, tecnicos t WHERE  s.id_aparato=a.id_aparato AND s.idtecnico=t.identificacion and t.identificacion=?', [req.user.identificacion]);
    res.render('links/confirm', { links });
});

router.get('/historial', isLoggedIn, async (req, res) => {
    console.log(req.user.rol);
    if (req.user.rol == 1) {
        console.log(req.user.rol + "rollllllllllll");
        const links = await pool.query('select * from servicios where iduser=?', [req.user.identificacion]);
        res.render('links/historial', { links })
    } else {
        const links = await pool.query('select * from servicios where idtecnico=?', [req.user.identificacion]);
        res.render('links/historial', { links })
    };
});

router.get('/crearrol', isLoggedIn, async (req, res) => {
    const rol = await pool.query('select * from rol ');
    res.render('links/crearrol', { rol });
});

router.post('/crearrol', isLoggedIn, async (req, res) => {
    const { idrol, rol, estado } = req.body;
    const newLink = {
        idrol, rol, estado
    };
    await pool.query('INSERT INTO rol set ?', [newLink]);
    req.flash('success', 'Rol Creado Correctamente');
    res.redirect('/links/rol');
});


router.get('/rol', isLoggedIn, async (req, res) => {
    const rol = await pool.query('select * from rol ');
    res.render('links/rol', { rol });
});
router.get('/aparato', isLoggedIn, async (req, res) => {
    const aparato = await pool.query('select * from aparato');

    res.render('links/aparato', { aparato });
});
router.get('/deleterol/:idrol', isLoggedIn, async (req, res) => {
    const { idrol } = req.params;
    await pool.query('DELETE FROM rol WHERE idrol = ?', [idrol]);
    req.flash('success', 'Rol Eliminado Correctamente');
    res.redirect('/links/rol');
});

router.get('/deleteaparato/:id_aparato', isLoggedIn, async (req, res) => {
    const { id_aparato } = req.params;
    await pool.query('DELETE FROM tecnico_aparato WHERE id_aparato = ? and identificacion_tecnico=?', [id_aparato, req.user.identificacion]);
    req.flash('success', 'Aparato Eliminado Correctamente');
    res.redirect('/links/misaparatos');
});

router.get('/editrol/:idrol', isLoggedIn, async (req, res) => {
    const { idrol } = req.params;
    const links = await pool.query('SELECT * FROM rol WHERE idrol = ?', [idrol]);
    res.render('links/editrol', { links: links[0] });
});

router.get('/editaparato/:id_aparato', isLoggedIn, async (req, res) => {
    const { id_aparato } = req.params;
    const links = await pool.query('SELECT * FROM aparato WHERE id_aparato = ?', [id_aparato]);
    res.render('links/editaparato', { links: links[0] });
});
router.get('/editecaparato/:id_aparato', isLoggedIn, async (req, res) => {
    const { id_aparato } = req.params;
    const links = await pool.query('SELECT t.id_aparato, t.precio, t.identificacion_tecnico, a.nombre_aparato, a.estado_aparato  FROM tecnico_aparato t, aparato a WHERE t.id_aparato=a.id_aparato AND t.id_aparato= ? and identificacion_tecnico=?;', [id_aparato, req.user.identificacion]);
    res.render('links/editecaparato', { links: links[0] });
});

router.post('/editecaparato/:id_aparato', isLoggedIn, async (req, res) => {
    const { id_aparato } = req.params;
    const { precio } = req.body;
    const newLink = {
        precio
    };
    await pool.query('UPDATE tecnico_aparato set ? WHERE id_aparato = ? and identificacion_tecnico=?', [newLink, id_aparato, req.user.identificacion]);
    req.flash('success', 'Precio Actualizado Correctamente');
    res.redirect('/links/misaparatos');
});

router.post('/editaparato/:id_aparato', isLoggedIn, async (req, res) => {
    const { id_aparato } = req.params;
    const { nombre_aparato, estado_aparato } = req.body;
    const newLink = {

        nombre_aparato,
        estado_aparato
    };
    await pool.query('UPDATE aparato set ? WHERE id_aparato = ?', [newLink, id_aparato]);
    req.flash('success', 'Aparato Actualizado Correctamente');
    res.redirect('/links/aparato');
});
router.post('/editrol/:idrol', isLoggedIn, async (req, res) => {
    const { idrol } = req.params;
    const { rol, estado } = req.body;
    const newLink = {

        rol,
        estado
    };
    await pool.query('UPDATE rol set ? WHERE idrol = ?', [newLink, idrol]);
    req.flash('success', 'Rol Actualizado Correctamente');
    res.redirect('/links/rol');
});

router.get('/linksall', isLoggedIn, async (req, res) => {
    console.log('ser');
    const links = await pool.query('SELECT s.precio, s.calificacion, s.iduser, u.nombre, u.apellido, s.idtecnico AS idtecnico, t.nombre AS nombretec,  t.apellido AS apetec, s.idservicio, s.fecha, s.direccion, s.descripcion, s.barrio, a.nombre_aparato, s.id_aparato  FROM tecnicos t, usuario u, aparato a, servicios s WHERE s.id_aparato=a.id_aparato AND t.identificacion=s.idtecnico;  ');
    res.render('links/linksall', { links });
});

router.get('/misaparatos', isLoggedIn, async (req, res) => {
    console.log('ser');
    const aparato = await pool.query('SELECT t.id_aparato, t.precio, t.identificacion_tecnico, a.nombre_aparato, a.estado_aparato  FROM tecnico_aparato t, aparato a WHERE t.id_aparato= a.id_aparato and identificacion_tecnico=?', [req.user.identificacion]);
    res.render('links/misparatos', { aparato });
});

router.get('/crearaparatoadmin', isLoggedIn, async (req, res) => {

    res.render('links/crearaparatoadmin');
});

router.post('/crearaparatoadmin', isLoggedIn, async (req, res) => {
    const { estado_aparato, nombre_aparato } = req.body;
    const newLink = {
        estado_aparato, nombre_aparato
    };

    await pool.query('INSERT INTO aparato set ?', [newLink]);
    req.flash('success', 'Aparato Agregado Correctamente');
    res.redirect('/links/aparato');
});
router.get('/crearaparato', isLoggedIn, async (req, res) => {
    const apara = await pool.query('SELECT * FROM aparato where estado_aparato=1');
    console.log(apara);
    res.render('links/crearaparato', { apara });
});
router.post('/crearaparato', isLoggedIn, async (req, res) => {
    const { precio, id_aparato } = req.body;
    const newLink = {
        precio, id_aparato, identificacion_tecnico: req.user.identificacion
    };
    await pool.query('INSERT INTO tecnico_aparato set ?', [newLink]);
    req.flash('success', 'Aparato Agregado Correctamente');
    res.redirect('/links/misaparatos');
});
router.get('/servicioscalificar', isLoggedIn, async (req, res) => {
    console.log('ser');
    const links = await pool.query('SELECT s.precio,s.iduser, u.nombre, u.apellido, s.idtecnico AS idtecnico, t.nombre AS nombretec,  t.apellido AS apetec, s.idservicio, s.fecha, s.direccion, s.descripcion, s.barrio, a.nombre_aparato, s.id_aparato, s.calificacion  FROM tecnicos t, usuario u, aparato a, servicios s WHERE s.id_aparato=a.id_aparato AND t.identificacion=s.idtecnico AND calificacion is null; ');
    res.render('links/servicioscalificar', { links });
});
router.get('/calificar/:idservicio', isLoggedIn, async (req, res) => {
    const { idservicio } = req.params;
    const links = await pool.query('SELECT s.idtecnico AS idtecnico, t.nombre AS nombretec,  t.apellido AS apetec, s.idservicio, s.fecha, s.direccion, s.descripcion, s.barrio, a.nombre_aparato, s.id_aparato, s.calificacion  FROM tecnicos t, usuario u, aparato a, servicios s WHERE s.id_aparato=a.id_aparato AND t.identificacion=s.idtecnico AND s.idservicio=?', [idservicio]);
    res.render('links/calificar', { links: links[0] });
});
router.post('/calificar/:idservicio', isLoggedIn, async (req, res) => {
    const { idservicio } = req.params;
    const { calificacion } = req.body;
    const newLink = {
        calificacion
    };
    await pool.query('UPDATE servicios set ? WHERE idservicio = ?', [newLink, idservicio]);
    req.flash('success', 'Servicio Calificado Correctamente');
    res.redirect('/links/servicioscalificar');
});

router.get('/reportes', isLoggedIn, async (req, res) => {

    res.render('links/reportes');
});
router.get('/realizarreporte', isLoggedIn, async (req, res) => {
    res.render('links/realizarreporte');
});

router.post('/realizarreporte', isLoggedIn, async (req, res) => {
    const { fechainicial, fechafinal } = req.body;
    console.log(fechafinal + '' + fechainicial);
    const repor = await pool.query('SELECT s.id_aparato,a.nombre_aparato, s.idservicio, s.fecha, s.direccion, s.descripcion, s.iduser, s.idtecnico, s.barrio, s.calificacion, u.nombre, u.apellido, t.nombre AS nombretec, t.apellido AS apetec,s.precio FROM servicios s, aparato a, usuario u, tecnicos t WHERE s.id_aparato=a.id_aparato AND s.iduser=u.identificacion AND t.identificacion=s.idtecnico AND s.fecha BETWEEN ? AND ? order by s.idservicio DESC', [fechainicial, fechafinal]);
    console.log(repor);
    res.render('links/listarreportes', { repor });
});

router.get('/realizarreporte2', isLoggedIn, async (req, res) => {
    res.render('links/realizarreporte2');
});

router.post('/realizarreporte2', isLoggedIn, async (req, res) => {
    const { fechainicial, fechafinal } = req.body;
    console.log(fechafinal + '' + fechainicial);
    const repor = await pool.query('SELECT s.id_aparato, a.nombre_aparato, s.idservicio, s.fecha, s.direccion, s.descripcion, s.iduser, s.idtecnico, s.barrio, s.calificacion, u.nombre, u.apellido, t.nombre AS nombretec, t.apellido AS apetec, s.precio FROM servicios s, aparato a, usuario u, tecnicos t WHERE s.id_aparato=a.id_aparato AND s.fecha BETWEEN ? AND ?  ORDER BY s.idtecnico  ASC', [fechainicial, fechafinal]);
    console.log(repor);
    res.render('links/listarreportes', { repor });
});
router.get('/realizarreporte3', isLoggedIn, async (req, res) => {
    res.render('links/realizarreporte2');
});

router.post('/realizarreporte3', isLoggedIn, async (req, res) => {
    const { fechainicial, fechafinal } = req.body;
    console.log(fechafinal + '' + fechainicial);
    const repor = await pool.query('SELECT s.id_aparato,a.nombre_aparato, s.idservicio, s.fecha, s.direccion, s.descripcion, s.iduser, s.idtecnico, s.barrio, s.calificacion, u.nombre, u.apellido, t.nombre AS nombretec, t.apellido AS apetec,s.precio FROM servicios s, aparato a, usuario u, tecnicos t WHERE s.id_aparato=a.id_aparato AND s.iduser=u.identificacion AND t.identificacion=s.idtecnico AND s.fecha BETWEEN ? AND ? order by s.iduser ASC', [fechainicial, fechafinal]);
    console.log(repor);
    res.render('links/listarreportes', { repor });
});
router.get('/realizarreporte4', isLoggedIn, async (req, res) => {
    res.render('links/realizarreporte2');
});

router.post('/realizarreporte4', isLoggedIn, async (req, res) => {
    const { fechainicial, fechafinal } = req.body;
    console.log(fechafinal + '' + fechainicial);
    const repor = await pool.query('SELECT s.id_aparato, a.nombre_aparato, s.idservicio, s.fecha, s.direccion, s.descripcion, s.iduser, s.idtecnico, s.barrio, s.calificacion, u.nombre, u.apellido, t.nombre AS nombretec, t.apellido AS apetec,s.precio FROM servicios s, aparato a, usuario u, tecnicos t WHERE s.id_aparato=a.id_aparato AND s.iduser=u.identificacion AND t.identificacion=s.idtecnico AND s.fecha BETWEEN ? AND ? order by s.id_aparato ASC', [fechainicial, fechafinal]);
    console.log(repor);
    res.render('links/listarreportes', { repor });
});




module.exports = router;