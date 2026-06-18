import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'
import iconoMercado from './assets/icono-mercado.png'

function App() {
  const [mercados, setMercados] = useState([]);
  const [currentMarket, setCurrentMarket] = useState(null);
  const [productos, setProductos] = useState([]);
  const [descuento, setDescuento] = useState(0);
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [ubicacion, setUbicacion] = useState('Plaza');
  const [loading, setLoading] = useState(false); // Nuevo estado de carga

  useEffect(() => { cargarMercados(); }, []);

  const cargarMercados = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('mercados').select('*').order('created_at', { ascending: false });
      if (data) setMercados(data);
    } finally {
      setLoading(false);
    }
  };

  const crearNuevoMercado = async () => {
    setLoading(true);
    try {
      await supabase.rpc('limpiar_mercados_antiguos');
      const nombreMercado = `Mercado ${new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`;
      const { data } = await supabase.from('mercados').insert([{ nombre: nombreMercado }]).select().single();
      if (data) {
        setCurrentMarket(data);
        setProductos([]);
        cargarMercados();
      }
    } finally {
      setLoading(false);
    }
  };

  const cerrarMercado = async () => {
    if (window.confirm("¿Cerrar mercado? Ya no podrás editar productos ni precios.")) {
      setLoading(true);
      try {
        const { data } = await supabase.from('mercados').update({ cerrado: true }).eq('id', currentMarket.id).select().single();
        if (data) setCurrentMarket(data);
      } finally {
        setLoading(false);
      }
    }
  };

  const seleccionarMercado = async (mercado) => {
    setLoading(true);
    try {
      setCurrentMarket(mercado);
      setDescuento(mercado.descuento || 0);
      const { data } = await supabase.from('productos').select('*').eq('mercado_id', mercado.id).order('id', { ascending: true });
      if (data) setProductos(data);
    } finally {
      setLoading(false);
    }
  };

  const agregarProducto = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const nuevoProducto = { nombre, cantidad: Math.max(0, cantidad).toString(), ubicacion, precio: 0, mercado_id: currentMarket.id, tachado: false };
      const { data } = await supabase.from('productos').insert([nuevoProducto]).select();
      if (data) setProductos([...productos, data[0]]);
      setNombre('');
      setCantidad(1);
    } finally {
      setLoading(false);
    }
  };

  const actualizarPrecio = async (id, nuevoPrecio) => {
    let valor = parseFloat(nuevoPrecio);
    if (isNaN(valor) || valor < 0) valor = 0;
    setProductos(productos.map(p => p.id === id ? { ...p, precio: valor.toString() } : p));
    await supabase.from('productos').update({ precio: valor.toString() }).eq('id', id);
  };

  const actualizarCantidad = async (id, nuevaCantidad) => {
    let valor = parseInt(nuevaCantidad);
    if (isNaN(valor) || valor < 0) valor = 0;
    setProductos(productos.map(p => p.id === id ? { ...p, cantidad: valor.toString() } : p));
    await supabase.from('productos').update({ cantidad: valor.toString() }).eq('id', id);
  };

  const alternarTachado = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual;
    setProductos(productos.map(p => p.id === id ? { ...p, tachado: nuevoEstado } : p));
    await supabase.from('productos').update({ tachado: nuevoEstado }).eq('id', id);
  };

  const eliminarProducto = async (id) => {
    setLoading(true);
    try {
      setProductos(productos.filter(p => p.id !== id));
      await supabase.from('productos').delete().eq('id', id);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = productos.reduce((acc, p) => acc + (parseFloat(p.precio || 0) * parseFloat(p.cantidad || 0)), 0);
  const totalFinal = Math.max(0, subtotal - parseFloat(descuento || 0));

  return (
    <div className="contenedor-principal">
      {/* Overlay del Spinner */}
      {loading && (
        <div className="overlay-loading">
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div className="spinner"></div> Procesando...
          </div>
        </div>
      )}

      {/* --- VISTA DASHBOARD --- */}
      {!currentMarket ? (
        <div className="dashboard-content">
          <h1><img src={iconoMercado} className="icono-titulo" /> Mercados Cordoba</h1>
          <button onClick={crearNuevoMercado} style={{width: '100%', padding: '15px', background: 'var(--color-accento)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', marginBottom: '20px', cursor: 'pointer'}}>
            + Crear Mercado de {new Date().toLocaleDateString('es-CO', { month: 'long' })}
          </button>
          {mercados.map(m => (
            <div key={m.id} onClick={() => seleccionarMercado(m)} className="tarjeta-mercado">
              <div>
                <h3 style={{margin: '0'}}>{m.nombre} {m.cerrado ? '🔒' : ''}</h3>
                <small style={{color: '#888'}}>Creado: {new Date(m.created_at).toLocaleDateString()}</small>
              </div>
              <button onClick={(e) => { 
                  e.stopPropagation(); 
                  if(window.confirm("¿Borrar mercado?")) {
                    setLoading(true);
                    supabase.from('mercados').delete().eq('id', m.id).then(() => { cargarMercados(); setLoading(false); });
                  }
              }} className="btn-borrar">X</button>
            </div>
          ))}
        </div>
      ) : (
        /* --- VISTA DE LISTA --- */
        <div className="list-content">
          <button onClick={() => setCurrentMarket(null)} style={{background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '10px'}}>← Volver al inicio</button>
          <h1><img src={iconoMercado} className="icono-titulo" /> {currentMarket.nombre} {currentMarket.cerrado ? '🔒' : ''}</h1>
          
          {!currentMarket.cerrado && (
            <button onClick={cerrarMercado} style={{width: '100%', marginBottom: '15px', padding: '10px', background: '#555', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'}}>
              Cerrar Mercado (Bloquear edición)
            </button>
          )}

          <form onSubmit={agregarProducto} className="formulario">
            <input type="text" placeholder="Producto" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={currentMarket.cerrado} />
            <input type="number" placeholder="Cant." min="0" value={cantidad} onChange={e => setCantidad(e.target.value)} disabled={currentMarket.cerrado} />
            <select value={ubicacion} onChange={e => setUbicacion(e.target.value)} disabled={currentMarket.cerrado}>
              <option>Plaza</option><option>Fruver</option><option>D1</option><option>Makro</option><option>Ara</option><option>Internet</option>
            </select>
            <button type="submit" disabled={currentMarket.cerrado}>Agregar</button>
          </form>

          <ul className="lista-productos">
            {productos.map(p => (
              <li key={p.id} className={p.tachado ? 'tachado' : ''}>
                <strong>{p.nombre}</strong>
                <input type="number" min="0" value={p.cantidad} onChange={e => actualizarCantidad(p.id, e.target.value)} disabled={currentMarket.cerrado} />
                <input type="number" placeholder="$" min="0" value={p.precio || ''} onChange={e => actualizarPrecio(p.id, e.target.value)} disabled={currentMarket.cerrado} />
                <span>${(parseFloat(p.precio || 0) * parseFloat(p.cantidad || 0)).toLocaleString()}</span>
                <div className="acciones">
                    <button onClick={() => alternarTachado(p.id, p.tachado)} className="btn-completar" disabled={currentMarket.cerrado}>{p.tachado ? '✓' : 'O'}</button>
                    <button onClick={() => eliminarProducto(p.id)} className="btn-eliminar" disabled={currentMarket.cerrado}>X</button>
                </div>
              </li>
            ))}
          </ul>

          <div className="caja-total">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Subtotal:</span> <span>${subtotal.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <span>Descuento ($):</span> 
                <input 
                    type="number" min="0" value={descuento} 
                    onChange={e => setDescuento(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{ width: '100px', padding: '5px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', textAlign: 'center' }}
                    disabled={currentMarket.cerrado}
                />
            </div>
            <hr style={{ margin: '10px 0', borderColor: '#444' }} />
            <h2>Total Final: ${totalFinal.toLocaleString()}</h2>
          </div>
        </div>
      )}
    </div>
  )
}
export default App