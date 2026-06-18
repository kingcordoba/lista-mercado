import { useState, useEffect } from 'react'
import { supabase } from './supabase' // Importamos la conexión
import './App.css'
import iconoMercado from './assets/icono-mercado.png' // <-- Aquí importamos la imagen directamente

function App() {
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [ubicacion, setUbicacion] = useState('Supermercado');

  // 1. Cargar los productos desde la nube al abrir la app
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('id', { ascending: true }); // Ordena por orden de creación
    
    if (error) console.error("Error cargando productos:", error);
    else setProductos(data);
  };

  // 2. Guardar un producto nuevo en la nube
  const agregarProducto = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    const nuevoProducto = {
      nombre,
      cantidad,
      ubicacion,
      tachado: false
    };

    const { data, error } = await supabase
      .from('productos')
      .insert([nuevoProducto])
      .select(); // .select() hace que Supabase nos devuelva el producto ya con su ID final

    if (error) {
      alert("Hubo un error con Supabase: " + error.message);
      console.error("Detalle del error:", error);
    } else if (data) {
      setProductos([...productos, data[0]]);
      setNombre('');
      setCantidad('');
    }
  };

  // 3. Tachar o destachar en la nube
  const alternarTachado = async (id, estadoActual) => {
    // Truco visual: Actualizamos la pantalla de inmediato para que se sienta rápido
    setProductos(productos.map(prod => 
      prod.id === id ? { ...prod, tachado: !estadoActual } : prod
    ));

    // Luego le avisamos a la base de datos
    const { error } = await supabase
      .from('productos')
      .update({ tachado: !estadoActual })
      .eq('id', id);

    if (error) console.error("Error actualizando producto:", error);
  };

  // 4. Eliminar en la nube
  const eliminarProducto = async (id) => {
    // Truco visual: Lo borramos de la pantalla de inmediato
    setProductos(productos.filter(prod => prod.id !== id));

    // Luego lo borramos de la base de datos
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);
      
    if (error) console.error("Error eliminando producto:", error);
  };

  return (
    <div className="contenedor-principal">
      <h1>
        {/* Usamos la variable iconoMercado en lugar del texto entre comillas */}
        <img src={iconoMercado} alt="Icono" className="icono-titulo" /> 
        Mercados Cordoba
      </h1>

      <form onSubmit={agregarProducto} className="formulario">
        <input 
          type="text" 
          placeholder="¿Qué vas a comprar?" 
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required 
        />
        <input 
          type="text" 
          placeholder="Cantidad (ej. 2 libras)" 
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />
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
              <small>📍 {producto.ubicacion}</small>
            </div>
            <div className="acciones">
              {/* Le pasamos el ID y el estado actual (tachado o no) */}
              <button onClick={() => alternarTachado(producto.id, producto.tachado)}>
                {producto.tachado ? 'Deshacer' : 'Comprado'}
              </button>
              <button onClick={() => eliminarProducto(producto.id)}>Borrar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App