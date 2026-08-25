import { useState } from 'react';

function AddProductForm({ onAdd }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    precio_kg: '',
    categoria: 'Res',
    imagen: null,
  });
  const [preview, setPreview] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    // useEffect alternative: generate preview URL directly on selection
    const url = URL.createObjectURL(file);
    setPreview(url);
    setForm((prev) => ({ ...prev, imagen: file }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre || !form.precio_kg) return;

    // Immutable add — never mutate the array directly
    onAdd({
      id: Date.now(),
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio_kg: Number(form.precio_kg),
      categoria: form.categoria,
      stock: 0,
      estado: 'active',
      imagen_url: preview,
    });

    // Reset form
    setForm({ nombre: '', descripcion: '', precio_kg: '', categoria: 'Res', imagen: null });
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  return (
    <form className="add-product-form" onSubmit={handleSubmit}>
      <h2 className="form-title">Agregar nuevo corte</h2>

      <div className="form-row">
        <label className="form-label">Nombre</label>
        <input
          className="form-input"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Ej: Nueva Arrachera"
          required
        />
      </div>

      <div className="form-row">
        <label className="form-label">Descripción</label>
        <input
          className="form-input"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Descripción del corte"
        />
      </div>

      <div className="form-row">
        <label className="form-label">Precio / kg (MXN)</label>
        <input
          className="form-input"
          name="precio_kg"
          type="number"
          min="0"
          step="0.01"
          value={form.precio_kg}
          onChange={handleChange}
          placeholder="Ej: 280"
          required
        />
      </div>

      <div className="form-row">
        <label className="form-label">Categoría</label>
        <select className="form-input" name="categoria" value={form.categoria} onChange={handleChange}>
          <option>Res</option>
          <option>Pollo</option>
          <option>Cerdo</option>
          <option>Embutidos</option>
        </select>
      </div>

      <div className="form-row">
        <label className="form-label">Imagen</label>
        <input className="form-input" type="file" accept="image/*" onChange={handleImage} />
        {preview && (
          <img src={preview} alt="Vista previa" className="form-preview" />
        )}
      </div>

      <button className="btn-submit" type="submit">
        Agregar al catálogo
      </button>
    </form>
  );
}

export default AddProductForm;
