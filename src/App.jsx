import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'
import iconoMercado from './assets/icono-mercado.png'

function App() {
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [ubicacion, setUbicacion] = useState('Supermercado');
  const [precio, setPrecio] = useState('');

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: true });
    
    if (error) console.error("Error cargando productos:", error);
    else setProductos(data);
  };

  // Cálculo del total (aquí está la magia)
  const total = productos.reduce((acc, prod) => acc + (parseFloat(prod.precio) || 0), 0);

  const agregarProducto = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const nuevoProducto = {
      nombre,
      cantidad,
      ubicacion,
      precio: precio ? parseFloat(precio) : null,
      tachado: false
    };

    const { data, error } = await supabase
      .from('productos')
      .insert([nuevoProducto])
      .select();

    if (error) {
      alert("Error al guardar: " + error.message);
    } else if (data) {
      setProductos([...productos, data[0]]);
      setNombre('');
      setCantidad('');
      setPrecio('');
    }
  };

  const alternarTachado = async (id, estadoActual) => {
    setProductos(productos.map(prod => 
      prod.id === id ? { ...prod, tachado: !estadoActual } : prod
    ));

    const { error } = await supabase
      .from('productos')
      .update({ tachado: !estadoActual })
      .eq('id', id);
  };

  const eliminarProducto = async (id) => {
    setProductos(productos.filter(prod => prod.id !== id));
    await supabase.from('productos').delete().eq('id', id);
  };

  return (
    <div className="contenedor-principal">
      <h1>
        <img src={iconoMercado} alt="Icono" className="icono-titulo" /> 
        Mercados Cordoba
      </h1>

      <form onSubmit={agregarProducto} className="formulario">
        <input type="text" placeholder="¿Qué vas a comprar?" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <input type="text" placeholder="Cantidad (ej. 2 libras)" value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
        <input type="number" placeholder="Precio ($)" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        <select value={ubicacion} onChange={(e) => setUbicacion(e.target.value)}>
          <option value="Supermercado">Supermercado</option>
          <option value="Plaza">Plaza</option>
          <option value="D1">D1</option>
          <option value="Ara">Ara</option>
          <option value="Makro">Makro</option>
          <option value="Veterinaria">Veterinaria</option>
          <option value="Otro">Otro</option>
        </select>
        <button type="submit">Agregar</button>
      </form>

      <ul className="lista-productos">
        {productos.map(producto => (
          <li key={producto.id} style={{ textDecoration: producto.tachado ? 'line-through' : 'none', opacity: producto.tachado ? 0.6 : 1 }}>
            <div className="info-producto">
              <strong>{producto.nombre}</strong> 
              <span> ({producto.cantidad}) </span>
              {producto.precio && <strong>| ${producto.precio}</strong>}
              <small>📍 {producto.ubicacion}</small>
            </div>
            <div className="acciones">
              <button onClick={() => alternarTachado(producto.id, producto.tachado)}>
                {producto.tachado ? 'Deshacer' : 'Comprado'}
              </button>
              <button onClick={() => eliminarProducto(producto.id)}>Borrar</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Visualización del Total */}
      <div className="total-lista">
        <h3>Total Estimado: ${total.toLocaleString()}</h3>
      </div>
    </div>
  )
}

export default App