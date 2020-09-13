const pool = require('../database');

const paths = {
    
};

paths.routes = async (req) => {
    let urls = await pool.query("SELECT vistas.url AS url FROM permisos INNER JOIN vistas ON permisos.idvista = vistas.idvista where permisos.idrol=?", req.user.rol);
    const lista = Object.values(JSON.parse(JSON.stringify(urls)));
    lista.forEach(function(v){ console.log(v.url) })
    return lista;
}

module.exports = paths