import React, { useEffect, useState } from 'react';
import { Alert, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, Switch, TextField, Typography } from '@mui/material';
import { Banknote, ChefHat, CircleDollarSign, ClipboardList, Edit3, Gift, PackageCheck, Plus, ReceiptText, ShoppingBasket, Sparkles, Trash2 } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const PINK = '#E765B7';
const PINK_DEEP = '#C43D8F';
const CHART_COLORS = ['#E765B7', '#C43D8F', '#f2a4d1', '#8a5a72', '#f6c453', '#7cc6a8'];
const chartMoney = (value) => money.format(value);
const compactMoneyFormat = new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 });
const compactMoney = (value) => compactMoneyFormat.format(value).replace(/\s/g, '');

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

function Loading() { return <div className="admin-module-loading"><CircularProgress size={28} /><span>Cargando datos operativos…</span></div>; }
function Empty({ children }) { return <div className="admin-empty">{children}</div>; }

function Inventory({ api, token, branch }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [stockItem, setStockItem] = useState(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [adjustmentKind, setAdjustmentKind] = useState('entry');
  const [productOpen, setProductOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [product, setProduct] = useState({ nombre: '', sku: '', unit: 'kg', costPerUnit: '', reorderPoint: '', initialStock: '' });
  const [inventoryQuery, setInventoryQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState('all');
  const [movements, setMovements] = useState(null);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [editSupplierId, setEditSupplierId] = useState(null);
  const [supplier, setSupplier] = useState({ nombre: '', contacto: '', telefono: '' });
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [purchase, setPurchase] = useState({ supplierId: '', notes: '', items: [{ ingredientId: '', quantityOrdered: '', unitCost: '' }] });
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [recipe, setRecipe] = useState({ productId: '', yield: '1', items: [{ ingredientId: '', quantity: '' }] });
  const [saving, setSaving] = useState(false);
  const activeBranch = branch === 'all' ? 'xico' : branch;

  const load = () => Promise.all([api.inventory(activeBranch, token), api.recipes(token), api.suppliers(token), api.purchases(branch, token)])
    .then(([ingredients, recipes, suppliers, purchases]) => setData({ ingredients, recipes, suppliers, purchases }));

  useEffect(() => {
    let live = true;
    Promise.all([api.inventory(activeBranch, token), api.recipes(token), api.suppliers(token), api.purchases(branch, token)])
      .then(([ingredients, recipes, suppliers, purchases]) => live && setData({ ingredients, recipes, suppliers, purchases }))
      .catch((requestError) => live && setError(requestError.message));
    return () => { live = false; };
  }, [api, token, branch, activeBranch]);

  const saveStock = async () => {
    const quantity = Number(stockQuantity);
    if (!(quantity > 0)) return setError('La cantidad debe ser mayor a cero.');
    setSaving(true); setError('');
    try {
      const signedQuantity = adjustmentKind === 'waste' ? -quantity : quantity;
      await api.addStock({ ingredientId: stockItem.id, sucursal: activeBranch, quantity: signedQuantity, reason: adjustmentKind === 'waste' ? 'Merma registrada' : 'Entrada manual de inventario' }, token);
      await load(); setStockItem(null); setStockQuantity('');
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };

  const saveProduct = async () => {
    if (!product.nombre.trim() || !product.unit) return setError('Nombre y unidad son obligatorios.');
    setSaving(true); setError('');
    try {
      const payload = {
        nombre: product.nombre.trim(), sku: product.sku.trim() || undefined, unit: product.unit,
        costPerUnit: Number(product.costPerUnit || 0), reorderPoint: Number(product.reorderPoint || 0),
        initialStock: { [activeBranch]: Number(product.initialStock || 0) },
      };
      if (editId) await api.updateIngredient(editId, payload, token);
      else await api.createIngredient(payload, token);
      await load(); closeProduct();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  };
  const closeProduct = () => { setProductOpen(false); setEditId(null); setProduct({ nombre: '', sku: '', unit: 'kg', costPerUnit: '', reorderPoint: '', initialStock: '' }); };
  const desactivarIngrediente = async (item) => {
    if (!window.confirm(`¿Dar de baja "${item.nombre}"? Dejará de aparecer en inventario y recetas.`)) return;
    setSaving(true);
    try { await api.updateIngredient(item.id, { nombre: item.nombre, unit: item.unit, activo: false }, token); await load(); }
    catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };
  const openProduct = (item) => {
    if (item) { setEditId(item.id); setProduct({ nombre: item.nombre, sku: item.sku || '', unit: item.unit, costPerUnit: String(item.costPerUnit || ''), reorderPoint: String(item.reorderPoint || ''), initialStock: '' }); }
    else { setEditId(null); }
    setProductOpen(true);
  };
  const openAdjustment = (item, kind) => { setStockItem(item); setAdjustmentKind(kind); setStockQuantity(''); };
  const openMovements = async () => { setSaving(true); try { setMovements(await api.inventoryMovements(activeBranch, token)); } catch (requestError) { setError(requestError.message); } finally { setSaving(false); } };
const closeSupplierDialog = () => { setSupplierOpen(false); setEditSupplierId(null); setSupplier({ nombre: '', contacto: '', telefono: '' }); };
  const openSupplierDialog = (item) => {
    if (item) { setEditSupplierId(item.id); setSupplier({ nombre: item.nombre, contacto: item.contacto || '', telefono: item.telefono || '' }); }
    else { setEditSupplierId(null); setSupplier({ nombre: '', contacto: '', telefono: '' }); }
    setSupplierOpen(true);
  };
  const saveSupplier = async () => {
    if (!supplier.nombre.trim()) return;
    setSaving(true);
    try {
      if (editSupplierId) await api.updateSupplier(editSupplierId, supplier, token);
      else await api.createSupplier(supplier, token);
      await load(); closeSupplierDialog();
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };
  const desactivarSupplier = async (item) => {
    if (!window.confirm(`¿Dar de baja al proveedor "${item.nombre}"?`)) return;
    setSaving(true);
    try { await api.updateSupplier(item.id, { activo: false }, token); await load(); }
    catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };
  const addPurchaseLine = () => setPurchase((current) => ({ ...current, items: [...current.items, { ingredientId: '', quantityOrdered: '', unitCost: '' }] }));
  const updatePurchaseLine = (index, field, value) => setPurchase((current) => ({ ...current, items: current.items.map((item, lineIndex) => lineIndex === index ? { ...item, [field]: value } : item) }));
  const removePurchaseLine = (index) => setPurchase((current) => ({ ...current, items: current.items.filter((_, lineIndex) => lineIndex !== index) }));
  const closePurchase = () => { setPurchaseOpen(false); setPurchase({ supplierId: '', notes: '', items: [{ ingredientId: '', quantityOrdered: '', unitCost: '' }] }); };
  const savePurchase = async () => {
    const items = purchase.items.filter((item) => item.ingredientId || item.quantityOrdered || item.unitCost);
    if (!purchase.supplierId || !items.length || items.some((item) => !item.ingredientId || Number(item.quantityOrdered) <= 0)) return setError('Completa proveedor, insumos y cantidades.');
    setSaving(true); setError('');
    try {
      await api.createPurchase({ supplierId: purchase.supplierId, sucursal: activeBranch, notes: purchase.notes || undefined, items: items.map((item) => ({ ingredientId: item.ingredientId, quantityOrdered: Number(item.quantityOrdered), unitCost: Number(item.unitCost || 0) })) }, token);
      await load(); closePurchase();
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };
  const receivePurchase = async (order) => {
    const items = order.items.map((item) => ({ id: item.id, quantityReceived: Math.max(0, Number(item.quantityOrdered) - Number(item.quantityReceived || 0)) })).filter((item) => item.quantityReceived > 0);
    if (!items.length) return;
    setSaving(true); setError('');
    try { await api.receivePurchase(order.id, { items }, token); await load(); } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };
  const addRecipeLine = () => setRecipe((current) => ({ ...current, items: [...current.items, { ingredientId: '', quantity: '' }] }));
  const updateRecipeLine = (index, field, value) => setRecipe((current) => ({ ...current, items: current.items.map((item, lineIndex) => lineIndex === index ? { ...item, [field]: value } : item) }));
  const removeRecipeLine = (index) => setRecipe((current) => ({ ...current, items: current.items.filter((_, lineIndex) => lineIndex !== index) }));
  const closeRecipe = () => { setRecipeOpen(false); setRecipe({ productId: '', yield: '1', items: [{ ingredientId: '', quantity: '' }] }); };
  const openRecipe = async (record) => {
    setSaving(true);
    try {
      setProducts(await api.products());
      setRecipe(record ? { productId: record.productId || record.product?.id || '', yield: String(record.yield || 1), items: record.items.length ? record.items.map((item) => ({ ingredientId: item.ingredientId, quantity: String(item.quantity) })) : [{ ingredientId: '', quantity: '' }] } : { productId: '', yield: '1', items: [{ ingredientId: '', quantity: '' }] });
      setRecipeOpen(true);
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };
  const saveRecipe = async () => {
    const items = recipe.items.filter((item) => item.ingredientId || item.quantity);
    if (!recipe.productId || Number(recipe.yield) <= 0 || !items.length || items.some((item) => !item.ingredientId || Number(item.quantity) <= 0)) return setError('Selecciona producto, rendimiento e ingredientes con cantidad.');
    setSaving(true); setError('');
    try { await api.saveRecipe(recipe.productId, { yield: Number(recipe.yield), items: items.map((item) => ({ ingredientId: item.ingredientId, quantity: Number(item.quantity) })) }, token); await load(); closeRecipe(); } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };
  if (!data) return <Loading />;
  const low = data.ingredients.filter((item) => item.health !== 'healthy');
  const filteredIngredients = data.ingredients.filter((item) => {
    const matchesQuery = item.nombre.toLowerCase().includes(inventoryQuery.trim().toLowerCase()) || (item.sku || '').toLowerCase().includes(inventoryQuery.trim().toLowerCase());
    const matchesHealth = healthFilter === 'all' || item.health === healthFilter;
    return matchesQuery && matchesHealth;
  });
  return <section className="admin-module">
    {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
    <header><div><Typography component="h1">Inventario y recetas</Typography><Typography>Existencias reales descontadas desde cada pedido.</Typography></div><div className="admin-header-actions"><Chip label={`${low.length} alerta${low.length !== 1 ? 's' : ''}`} color={low.length ? 'warning' : 'success'} /><Button variant="outlined" startIcon={<ClipboardList size={18}/>} onClick={openMovements}>Movimientos</Button><Button variant="contained" startIcon={<Plus size={18}/>} onClick={() => openProduct()}>Agregar producto</Button></div></header>
    <div className="admin-module-stats">
      <article><PackageCheck /><span><b>{data.ingredients.length}</b><small>Ingredientes activos</small></span></article>
      <article><ShoppingBasket /><span><b>{data.recipes.length}</b><small>Productos con receta</small></span></article>
      <article><ReceiptText /><span><b>{data.purchases.filter((item) => item.status !== 'received').length}</b><small>Compras abiertas</small></span></article>
    </div>
    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Existencias por ingrediente</h2><span>{branch === 'all' ? 'Xico' : branch}</span></div>
      <div className="admin-toolbar-row"><TextField size="small" label="Buscar insumo" value={inventoryQuery} onChange={(event) => setInventoryQuery(event.target.value)} /><TextField size="small" select label="Estado" value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)}><MenuItem value="all">Todos</MenuItem><MenuItem value="critical">Crítico</MenuItem><MenuItem value="low">Bajo</MenuItem><MenuItem value="healthy">Saludable</MenuItem></TextField></div>
      {!data.ingredients.length ? <Empty>Agrega el primer ingrediente para conectar recetas y pedidos.</Empty> : filteredIngredients.length ? filteredIngredients.map((item) => {
        const ratio = Math.min(100, Math.max(0, Number(item.quantity) / Math.max(Number(item.reorderPoint) * 2, 1) * 100));
        return <div className="admin-stock-row" key={item.id}><div><b>{item.nombre}</b><small>{Number(item.quantity)} {item.unit} · mínimo {Number(item.reorderPoint)} {item.unit}</small><div className="admin-row-actions"><Button size="small" startIcon={<Edit3 size={14}/>} onClick={() => openProduct(item)}>Editar</Button><Button color="warning" size="small" startIcon={<Trash2 size={14}/>} onClick={() => openAdjustment(item, 'waste')}>Merma</Button><Button color="error" size="small" onClick={() => desactivarIngrediente(item)}>Dar de baja</Button></div></div><div className="admin-stock-controls"><span className={`stock-${item.health}`}>{item.health === 'healthy' ? 'Saludable' : item.health === 'critical' ? 'Crítico' : 'Bajo'}</span><LinearProgress variant="determinate" value={ratio} color={item.health === 'healthy' ? 'success' : item.health === 'critical' ? 'error' : 'warning'} /><Button size="small" variant="outlined" aria-label={`Agregar stock a ${item.nombre}`} onClick={() => openAdjustment(item, 'entry')}>+ Stock</Button></div></div>;
      }) : <Empty>No encontramos insumos con ese filtro.</Empty>}
    </div>
    <div className="admin-two-columns">
      <div className="admin-data-panel"><div className="admin-data-heading"><h2>Recetas configuradas</h2><Button size="small" onClick={() => openRecipe()}>Nueva receta</Button></div>{data.recipes.length ? data.recipes.map((recipe) => <div className="admin-list-row" key={recipe.id}><span><b>{recipe.product.nombre}</b><small>{recipe.items.length} ingredientes · rendimiento {Number(recipe.yield)}</small></span><Button size="small" aria-label={`Editar receta de ${recipe.product.nombre}`} onClick={() => openRecipe(recipe)}>Editar</Button></div>) : <Empty>Aún no hay recetas. Los pedidos no descontarán existencias hasta configurarlas.</Empty>}</div>
      <div className="admin-data-panel"><div className="admin-data-heading"><h2>Compras y proveedores</h2><div className="admin-row-actions"><Button size="small" onClick={() => openSupplierDialog()}>Proveedor</Button><Button size="small" variant="contained" onClick={() => setPurchaseOpen(true)}>Nueva compra</Button></div></div>
        {data.suppliers.length ? data.suppliers.map((item) => <div className="admin-list-row" key={item.id}><span><b>{item.nombre}</b><small>{item.contacto || item.telefono || 'Sin contacto'}</small></span><div className="admin-row-actions"><Button size="small" startIcon={<Edit3 size={14}/>} onClick={() => openSupplierDialog(item)}>Editar</Button><Button size="small" color="error" onClick={() => desactivarSupplier(item)}>Baja</Button></div></div>) : null}
        {data.purchases.length ? data.purchases.slice(0,5).map((purchase) => <div className="admin-list-row" key={purchase.id}><span><b>{purchase.supplier.nombre}</b><small>{purchase.status} · {purchase.items.length} insumos</small></span><div className="admin-row-actions"><b>{money.format(Number(purchase.total))}</b>{purchase.status !== 'received' ? <Button size="small" variant="outlined" aria-label={`Recibir compra de ${purchase.supplier.nombre}`} onClick={() => receivePurchase(purchase)} disabled={saving}>Recibir</Button> : null}</div></div>) : <Empty>Sin órdenes de compra. Crea proveedores para preparar el próximo abasto.</Empty>}</div>
    </div>
    <Dialog open={Boolean(stockItem)} onClose={() => !saving && setStockItem(null)} fullWidth maxWidth="xs">
      <DialogTitle>{adjustmentKind === 'waste' ? 'Registrar merma' : 'Agregar stock'} · {stockItem?.nombre}</DialogTitle>
      <DialogContent><TextField autoFocus margin="dense" fullWidth label={`Cantidad (${stockItem?.unit || ''})`} type="number" slotProps={{ htmlInput: { min: 0, step: 'any' } }} value={stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} /></DialogContent>
      <DialogActions><Button onClick={() => setStockItem(null)} disabled={saving}>Cancelar</Button><Button color={adjustmentKind === 'waste' ? 'warning' : 'primary'} variant="contained" onClick={saveStock} disabled={saving}>{adjustmentKind === 'waste' ? 'Registrar merma' : 'Guardar stock'}</Button></DialogActions>
    </Dialog>
    <Dialog open={productOpen} onClose={() => !saving && setProductOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>{editId ? 'Editar producto de inventario' : 'Agregar producto de inventario'}</DialogTitle>
      <DialogContent className="admin-form-grid">
        <TextField autoFocus required label="Nombre" value={product.nombre} onChange={(event) => setProduct({ ...product, nombre: event.target.value })} />
        <TextField label="SKU" value={product.sku} onChange={(event) => setProduct({ ...product, sku: event.target.value })} />
        <TextField select required label="Unidad" value={product.unit} onChange={(event) => setProduct({ ...product, unit: event.target.value })}><MenuItem value="kg">Kilogramos</MenuItem><MenuItem value="g">Gramos</MenuItem><MenuItem value="l">Litros</MenuItem><MenuItem value="ml">Mililitros</MenuItem><MenuItem value="pz">Piezas</MenuItem></TextField>
        <TextField label="Costo por unidad" type="number" value={product.costPerUnit} onChange={(event) => setProduct({ ...product, costPerUnit: event.target.value })} />
        <TextField label="Stock mínimo" type="number" value={product.reorderPoint} onChange={(event) => setProduct({ ...product, reorderPoint: event.target.value })} />
        <TextField label={`Stock inicial en ${activeBranch}`} type="number" value={product.initialStock} onChange={(event) => setProduct({ ...product, initialStock: event.target.value })} />
      </DialogContent>
      <DialogActions><Button onClick={closeProduct} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={saveProduct} disabled={saving}>Guardar producto</Button></DialogActions>
    </Dialog>
    <Dialog open={movements !== null} onClose={() => setMovements(null)} fullWidth maxWidth="md"><DialogTitle>Movimientos de inventario · {activeBranch}</DialogTitle><DialogContent>{movements?.length ? movements.map((movement) => <div className="admin-list-row" key={movement.id}><span><b>{movement.ingredient?.nombre || 'Ingrediente'}</b><small>{movement.reason || movement.type} · {new Date(movement.createdAt).toLocaleString('es-MX')}</small></span><b className={Number(movement.quantity) < 0 ? 'stock-critical' : 'stock-healthy'}>{Number(movement.quantity) > 0 ? '+' : ''}{Number(movement.quantity)} {movement.ingredient?.unit}</b></div>) : <Empty>Sin movimientos registrados.</Empty>}</DialogContent><DialogActions><Button onClick={() => setMovements(null)}>Cerrar</Button></DialogActions></Dialog>
    <Dialog open={supplierOpen} onClose={closeSupplierDialog} fullWidth maxWidth="xs"><DialogTitle>{editSupplierId ? 'Editar proveedor' : 'Agregar proveedor'}</DialogTitle><DialogContent className="admin-form-grid"><TextField required label="Nombre" value={supplier.nombre} onChange={(e) => setSupplier({...supplier,nombre:e.target.value})}/><TextField label="Contacto" value={supplier.contacto} onChange={(e) => setSupplier({...supplier,contacto:e.target.value})}/><TextField label="Teléfono" value={supplier.telefono} onChange={(e) => setSupplier({...supplier,telefono:e.target.value})}/></DialogContent><DialogActions><Button onClick={closeSupplierDialog}>Cancelar</Button><Button variant="contained" onClick={saveSupplier}>{editSupplierId ? 'Guardar cambios' : 'Guardar proveedor'}</Button></DialogActions></Dialog>
    <Dialog open={purchaseOpen} onClose={closePurchase} fullWidth maxWidth="sm"><DialogTitle>Nueva orden de compra</DialogTitle><DialogContent className="admin-form-grid"><TextField select required label="Proveedor" value={purchase.supplierId} onChange={(e) => setPurchase({...purchase,supplierId:e.target.value})}>{data.suppliers.map((item)=><MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField label="Notas" value={purchase.notes} onChange={(e) => setPurchase({...purchase,notes:e.target.value})}/>{purchase.items.map((line,index)=><div className="admin-line-editor" key={`purchase-${index}`}><TextField select required label="Ingrediente" value={line.ingredientId} onChange={(e) => updatePurchaseLine(index,'ingredientId',e.target.value)}>{data.ingredients.map((item)=><MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField required label="Cantidad" type="number" value={line.quantityOrdered} onChange={(e) => updatePurchaseLine(index,'quantityOrdered',e.target.value)}/><TextField label="Costo unitario" type="number" value={line.unitCost} onChange={(e) => updatePurchaseLine(index,'unitCost',e.target.value)}/>{purchase.items.length > 1 ? <Button color="warning" onClick={() => removePurchaseLine(index)}>Quitar</Button> : null}</div>)}<Button size="small" variant="outlined" onClick={addPurchaseLine}>Agregar insumo a compra</Button></DialogContent><DialogActions><Button onClick={closePurchase}>Cancelar</Button><Button variant="contained" onClick={savePurchase}>Crear compra</Button></DialogActions></Dialog>
    <Dialog open={recipeOpen} onClose={closeRecipe} fullWidth maxWidth="sm"><DialogTitle>Configurar receta</DialogTitle><DialogContent className="admin-form-grid"><TextField select required label="Producto del menú" value={recipe.productId} onChange={(e) => setRecipe({...recipe,productId:e.target.value})}>{products.map((item)=><MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField required label="Rendimiento" type="number" value={recipe.yield} onChange={(e) => setRecipe({...recipe,yield:e.target.value})}/>{recipe.items.map((line,index)=><div className="admin-line-editor" key={`recipe-${index}`}><TextField select required label="Ingrediente" value={line.ingredientId} onChange={(e) => updateRecipeLine(index,'ingredientId',e.target.value)}>{data.ingredients.map((item)=><MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField required label="Cantidad usada por pedido" type="number" value={line.quantity} onChange={(e) => updateRecipeLine(index,'quantity',e.target.value)}/>{recipe.items.length > 1 ? <Button color="warning" onClick={() => removeRecipeLine(index)}>Quitar</Button> : null}</div>)}<Button size="small" variant="outlined" onClick={addRecipeLine}>Agregar ingrediente a receta</Button></DialogContent><DialogActions><Button onClick={closeRecipe}>Cancelar</Button><Button variant="contained" onClick={saveRecipe}>Guardar receta</Button></DialogActions></Dialog>
  </section>;
}

function Operation({ dashboard, api, token }) {
  const [pendientes, setPendientes] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const cargarPendientes = () => api.pendingDeletions(token).then(setPendientes).catch((e) => setError(e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargarPendientes(); }, [api, token]);

  const resolver = async (id, aprobar) => {
    setBusy(id);
    setError('');
    try { await api.resolveDeletion(id, aprobar, token); await cargarPendientes(); }
    catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };

  const eliminarDirecto = async (order) => {
    const motivo = window.prompt(`¿Por qué eliminas la venta #${order.id.slice(0, 6).toUpperCase()}?`);
    if (!motivo?.trim()) return;
    setBusy(order.id);
    setError('');
    try { await api.deleteOrder(order.id, motivo.trim(), token); window.location.reload(); }
    catch (e) { setError(e.message); }
    finally { setBusy(''); }
  };

  return <section className="admin-module">
    <header><div><Typography component="h1">Operación</Typography><Typography>Pedidos, tiempos de cocina y desempeño del menú.</Typography></div><Chip label="En vivo" color="primary" /></header>
    {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
    <div className="admin-module-stats"><article><ChefHat/><span><b>{dashboard.summary.pendingOrders}</b><small>Pedidos abiertos</small></span></article><article><PackageCheck/><span><b>{dashboard.summary.orders}</b><small>Pedidos del periodo</small></span></article><article><CircleDollarSign/><span><b>{money.format(dashboard.summary.averageTicket)}</b><small>Ticket promedio</small></span></article></div>

    <div className="admin-two-columns">
      <div className="admin-data-panel">
        <div className="admin-data-heading"><h2>Ventas por hora</h2><span>Hoy</span></div>
        <div className="admin-chart-box">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dashboard.hourlySales} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="ventasHora" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PINK} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={PINK} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(36,26,32,.08)" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} fontSize={11} interval={2} />
              <YAxis fontSize={11} width={40} tickFormatter={compactMoney} />
              <Tooltip formatter={(value) => chartMoney(value)} labelFormatter={(h) => `${h}:00 hrs`} />
              <Area type="monotone" dataKey="sales" stroke={PINK_DEEP} strokeWidth={2} fill="url(#ventasHora)" name="Ventas" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="admin-data-panel">
        <div className="admin-data-heading"><h2>Ventas por sucursal</h2><span>Periodo actual</span></div>
        <div className="admin-chart-box">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dashboard.byBranch.map((b) => ({ ...b, label: b.branch === 'xico' ? 'Xico' : 'Coatepec' }))} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(36,26,32,.08)" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={11} width={40} tickFormatter={compactMoney} />
              <Tooltip formatter={(value) => chartMoney(value)} />
              <Bar dataKey="sales" name="Ventas" fill={PINK} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {pendientes.length > 0 && (
      <div className="admin-data-panel">
        <div className="admin-data-heading"><h2>Solicitudes de eliminación</h2><span>{pendientes.length}</span></div>
        {pendientes.map((order) => (
          <div className="admin-list-row" key={order.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
            <span><b>#{order.id.slice(0, 6).toUpperCase()} · {money.format(order.total)}</b><small>Motivo del mesero: {order.eliminacionMotivo}</small></span>
            <div className="admin-row-actions">
              <Button size="small" color="error" variant="outlined" disabled={busy === order.id} onClick={() => resolver(order.id, false)}>Rechazar</Button>
              <Button size="small" color="success" variant="contained" disabled={busy === order.id} onClick={() => resolver(order.id, true)}>Aprobar y eliminar</Button>
            </div>
          </div>
        ))}
      </div>
    )}

    <div className="admin-two-columns">
      <div className="admin-data-panel">
        <div className="admin-data-heading"><h2>Pedidos recientes</h2><span>{dashboard.recentOrders.length}</span></div>
        {dashboard.recentOrders.length ? dashboard.recentOrders.map((order) => (
          <div className="admin-list-row" key={order.id}>
            <span><b>#{order.id.slice(0,6).toUpperCase()} · {order.clienteNombre || order.tipo}</b><small>{order.estadoCocina} · {order.sucursal}</small></span>
            <div className="admin-row-actions">
              <b>{money.format(order.total)}</b>
              {order.estado !== 'cancelado' && (
                <Button size="small" color="error" disabled={busy === order.id} onClick={() => eliminarDirecto(order)}><Trash2 size={16} /></Button>
              )}
            </div>
          </div>
        )) : <Empty>No hay pedidos en este periodo.</Empty>}
      </div>
      <div className="admin-data-panel">
        <div className="admin-data-heading"><h2>Productos líderes</h2><span>Unidades</span></div>
        {dashboard.topProducts.length ? (
          <>
            <div className="admin-chart-box">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={dashboard.topProducts} dataKey="sales" nameKey="name" innerRadius={45} outerRadius={78} paddingAngle={2}>
                    {dashboard.topProducts.map((product, index) => <Cell key={product.productId || product.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => chartMoney(value)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {dashboard.topProducts.map((product) => <div className="admin-list-row" key={product.productId || product.name}><span><b>{product.name || product.nombre}</b><small>{money.format(product.sales)} vendidos</small></span><b>{product.quantity}</b></div>)}
          </>
        ) : <Empty>No hay ventas en este periodo todavía.</Empty>}
      </div>
    </div>
  </section>;
}

function Finance({ api, token, branch, dashboard }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    Promise.all([api.cashShifts(branch, token), api.expenses(branch, token)])
      .then(([shifts, expenses]) => live && setData({ shifts, expenses }))
      .catch((requestError) => live && setError(requestError.message));
    return () => { live = false; };
  }, [api, token, branch]);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return <Loading />;
  const expenses = data.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  return <section className="admin-module"><header><div><Typography component="h1">Finanzas y caja</Typography><Typography>Venta, efectivo esperado, gastos y diferencias de cierre.</Typography></div><Chip label={`${data.shifts.filter((item) => item.status === 'open').length} cajas abiertas`} color="secondary" /></header><div className="admin-module-stats"><article><CircleDollarSign/><span><b>{money.format(dashboard.summary.sales)}</b><small>Venta neta</small></span></article><article><Banknote/><span><b>{money.format(dashboard.summary.cashSales)}</b><small>Venta en efectivo</small></span></article><article><ReceiptText/><span><b>{money.format(expenses)}</b><small>Gastos registrados</small></span></article></div><div className="admin-two-columns"><div className="admin-data-panel"><div className="admin-data-heading"><h2>Turnos de caja</h2><span>Últimos 30</span></div>{data.shifts.length ? data.shifts.map((shift) => <div className="admin-list-row" key={shift.id}><span><b>{shift.sucursal} · {shift.status === 'open' ? 'Abierta' : 'Cerrada'}</b><small>Fondo {money.format(Number(shift.openingAmount))}{shift.difference != null ? ` · diferencia ${money.format(Number(shift.difference))}` : ''}</small></span><Chip size="small" color={shift.status === 'open' ? 'success' : 'default'} label={shift.status} /></div>) : <Empty>No hay turnos de caja registrados.</Empty>}</div><div className="admin-data-panel"><div className="admin-data-heading"><h2>Gastos</h2><span>Comprobación</span></div>{data.expenses.length ? data.expenses.map((expense) => <div className="admin-list-row" key={expense.id}><span><b>{expense.concept}</b><small>{expense.category} · {expense.paymentMethod}</small></span><b>{money.format(Number(expense.amount))}</b></div>) : <Empty>Sin gastos en el periodo.</Empty>}</div></div></section>;
}

const SUCURSAL_LABEL = { xico: 'Xico', coatepec: 'Coatepec' };

function BranchSettings({ api, token }) {
  const [settings, setSettings] = useState(null);
  const [forms, setForms] = useState({});
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [savedFlash, setSavedFlash] = useState('');

  useEffect(() => {
    let live = true;
    api.branchSettings(token)
      .then((rows) => {
        if (!live) return;
        setSettings(rows);
        setForms(Object.fromEntries(rows.map((r) => [r.sucursal, { clabe: r.clabe || '', banco: r.banco || '', titular: r.titular || '' }])));
      })
      .catch((requestError) => live && setError(requestError.message));
    return () => { live = false; };
  }, [api, token]);

  const updateField = (sucursal, field) => (event) => {
    setForms((current) => ({ ...current, [sucursal]: { ...current[sucursal], [field]: event.target.value } }));
  };

  const guardar = async (sucursal) => {
    setSaving(sucursal);
    setError('');
    try {
      const updated = await api.updateBranchSettings(sucursal, forms[sucursal], token);
      setSettings((current) => current.map((r) => (r.sucursal === sucursal ? updated : r)));
      setSavedFlash(sucursal);
      setTimeout(() => setSavedFlash(''), 2000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving('');
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!settings) return <Loading />;

  return (
    <section className="admin-module">
      <header>
        <div>
          <Typography component="h1">Cuentas para transferencia</Typography>
          <Typography>El CLABE que ve el cliente en el popup de "Pagar por transferencia" al hacer su pedido en línea.</Typography>
        </div>
      </header>
      <div className="admin-data-panel">
        {settings.map((row) => (
          <div className="admin-list-row" key={row.sucursal} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
            <b>{SUCURSAL_LABEL[row.sucursal] || row.sucursal}</b>
            <TextField
              size="small"
              label="CLABE (18 dígitos)"
              value={forms[row.sucursal]?.clabe || ''}
              onChange={updateField(row.sucursal, 'clabe')}
              inputProps={{ maxLength: 18, inputMode: 'numeric' }}
            />
            <TextField
              size="small"
              label="Banco (opcional)"
              value={forms[row.sucursal]?.banco || ''}
              onChange={updateField(row.sucursal, 'banco')}
            />
            <TextField
              size="small"
              label="Titular (opcional)"
              value={forms[row.sucursal]?.titular || ''}
              onChange={updateField(row.sucursal, 'titular')}
            />
            <Button
              variant="contained"
              onClick={() => guardar(row.sucursal)}
              disabled={saving === row.sucursal}
              style={{ alignSelf: 'flex-start' }}
            >
              {saving === row.sucursal ? 'Guardando...' : savedFlash === row.sucursal ? '¡Guardado!' : 'Guardar'}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

const EMPTY_STAFF = { nombre: '', role: 'empleado', sucursal: 'xico', pin: '' };

function Team({ api, token }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [staff, setStaff] = useState(EMPTY_STAFF);

  const load = () => api.users(token).then(setUsers).catch((requestError) => setError(requestError.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [api, token]);

  const openStaff = (user) => {
    if (user) { setEditId(user.id); setStaff({ nombre: user.nombre, role: user.role, sucursal: user.sucursal, pin: '' }); }
    else { setEditId(null); setStaff(EMPTY_STAFF); }
    setStaffOpen(true);
  };
  const closeStaff = () => { setStaffOpen(false); setEditId(null); setStaff(EMPTY_STAFF); };

  const saveStaff = async () => {
    if (!staff.nombre.trim() || !staff.sucursal || (!editId && !/^\d{4}$/.test(staff.pin))) {
      return setError('Nombre, sucursal y un PIN de 4 dígitos son obligatorios para dar de alta.');
    }
    setSaving(true); setError('');
    try {
      if (editId) {
        const payload = { nombre: staff.nombre.trim(), role: staff.role, sucursal: staff.sucursal };
        if (staff.pin) {
          if (!/^\d{4}$/.test(staff.pin)) return setError('El nuevo PIN debe ser de 4 dígitos.');
          payload.pin = staff.pin;
        }
        await api.updateUser(editId, payload, token);
      } else {
        await api.createUser({ nombre: staff.nombre.trim(), role: staff.role, sucursal: staff.sucursal, pin: staff.pin }, token);
      }
      await load(); closeStaff();
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };

  const toggleActivo = async (user) => {
    setError('');
    try { await api.updateUser(user.id, { activo: !user.activo }, token); await load(); }
    catch (requestError) { setError(requestError.message); }
  };

  if (error && !users) return <Alert severity="error">{error}</Alert>;
  if (!users) return <Loading />;
  return <section className="admin-module">
    {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
    <header><div><Typography component="h1">Equipo y permisos</Typography><Typography>Accesos operativos separados para piso y cocina.</Typography></div><div className="admin-header-actions"><Chip label={`${users.filter((user) => user.activo).length} activos`} /><Button variant="contained" startIcon={<Plus size={18}/>} onClick={() => openStaff()}>Agregar staff</Button></div></header>
    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Personal</h2><span>PIN individual</span></div>
      {users.length ? users.map((user) => <div className="admin-list-row" key={user.id}>
        <span><b>{user.nombre}</b><small>{user.sucursal} · {user.role}</small></span>
        <div className="admin-row-actions">
          <Chip size="small" color={user.activo ? 'success' : 'default'} label={user.activo ? 'Activo' : 'Inactivo'} />
          <Button size="small" startIcon={<Edit3 size={14}/>} onClick={() => openStaff(user)}>Editar</Button>
          <Switch size="small" checked={user.activo} onChange={() => toggleActivo(user)} aria-label={`${user.activo ? 'Desactivar' : 'Activar'} a ${user.nombre}`} />
        </div>
      </div>) : <Empty>Aún no hay staff registrado.</Empty>}
    </div>
    <Dialog open={staffOpen} onClose={() => !saving && closeStaff()} fullWidth maxWidth="xs">
      <DialogTitle>{editId ? 'Editar staff' : 'Agregar staff'}</DialogTitle>
      <DialogContent className="admin-form-grid">
        <TextField autoFocus required label="Nombre" value={staff.nombre} onChange={(e) => setStaff({ ...staff, nombre: e.target.value })} />
        <TextField select required label="Rol" value={staff.role} onChange={(e) => setStaff({ ...staff, role: e.target.value })}><MenuItem value="empleado">Empleado (piso)</MenuItem><MenuItem value="cocina">Cocina</MenuItem></TextField>
        <TextField select required label="Sucursal" value={staff.sucursal} onChange={(e) => setStaff({ ...staff, sucursal: e.target.value })}><MenuItem value="xico">Xico</MenuItem><MenuItem value="coatepec">Coatepec</MenuItem></TextField>
        <TextField label={editId ? 'Nuevo PIN (opcional, 4 dígitos)' : 'PIN (4 dígitos)'} required={!editId} value={staff.pin} onChange={(e) => setStaff({ ...staff, pin: e.target.value })} inputMode="numeric" slotProps={{ htmlInput: { maxLength: 4 } }} />
      </DialogContent>
      <DialogActions><Button onClick={closeStaff} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={saveStaff} disabled={saving}>{editId ? 'Guardar cambios' : 'Crear staff'}</Button></DialogActions>
    </Dialog>
  </section>;
}

const REWARD_TYPES = [
  { value: 'discount_percent', label: 'Descuento %' },
  { value: 'discount_fixed', label: 'Descuento fijo' },
  { value: 'free_item', label: 'Producto gratis' },
  { value: 'free_shipping', label: 'Envío gratis' },
];
const rewardSummary = (reward) => {
  if (reward.type === 'discount_percent') return `${reward.value}% de descuento`;
  if (reward.type === 'discount_fixed') return `$${reward.value} de descuento`;
  if (reward.type === 'free_shipping') return 'Envío gratis';
  if (reward.type === 'free_item') return `${reward.product?.nombre || 'Producto'} gratis`;
  return reward.label;
};

function Loyalty({ api, token }) {
  const [rewards, setRewards] = useState(null);
  const [redemptions, setRedemptions] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: '', type: 'discount_percent', value: '', productId: '', stampsRequired: '6', minOrderAmount: '0' });
  const [pointsRedemptions, setPointsRedemptions] = useState(null);
  const [puntosPorProducto, setPuntosPorProducto] = useState({});
  const [savingProductId, setSavingProductId] = useState('');
  const [birthdayRewards, setBirthdayRewards] = useState(null);
  const [birthdayForm, setBirthdayForm] = useState({ label: '', type: 'discount_percent', value: '', productId: '' });
  const [birthdayOpen, setBirthdayOpen] = useState(false);
  const [birthdayRedemptions, setBirthdayRedemptions] = useState(null);

  const load = () => Promise.all([
    api.loyaltyRewards(token), api.loyaltyRedemptions(token), api.pointsRedemptions(token),
    api.products(), api.birthdayRewards(token), api.birthdayRedemptions(token),
  ]).then(([r, red, pointsRed, prods, bRewards, bRedemptions]) => {
    setRewards(r); setRedemptions(red); setPointsRedemptions(pointsRed);
    setProducts(prods);
    setPuntosPorProducto(Object.fromEntries(prods.map((p) => [p.id, p.costoPuntos ?? ''])));
    setBirthdayRewards(bRewards); setBirthdayRedemptions(bRedemptions);
  });

  // `load` se recrea cada render — meterlo a las deps causaría un loop
  // (dispara el efecto -> setRewards/setRedemptions -> re-render -> nuevo `load` -> ...).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load().catch((e) => setError(e.message)); }, [api, token]);

  const guardarCostoPuntos = async (productId) => {
    setSavingProductId(productId);
    setError('');
    try {
      const valor = puntosPorProducto[productId];
      await api.updateProduct(productId, { costoPuntos: valor === '' ? null : Number(valor) }, token);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingProductId('');
    }
  };

  const openBirthdayForm = () => {
    setBirthdayForm({ label: '', type: 'discount_percent', value: '', productId: '' });
    setBirthdayOpen(true);
  };

  const saveBirthdayReward = async () => {
    if (!birthdayForm.label.trim()) return setError('El nombre de la promoción es obligatorio.');
    setSaving(true);
    setError('');
    try {
      await api.createBirthdayReward({
        label: birthdayForm.label.trim(),
        type: birthdayForm.type,
        value: birthdayForm.type.startsWith('discount') ? Number(birthdayForm.value || 0) : undefined,
        productId: birthdayForm.type === 'free_item' ? birthdayForm.productId : undefined,
      }, token);
      await load(); setBirthdayOpen(false);
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };

  const toggleBirthdayActive = async (reward) => {
    setSaving(true);
    setError('');
    try { await api.updateBirthdayReward(reward.id, { activo: !reward.activo }, token); await load(); }
    catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };

  const openForm = async () => {
    setError('');
    try {
      if (!products.length) setProducts(await api.products());
      setForm({ label: '', type: 'discount_percent', value: '', productId: '', stampsRequired: '6', minOrderAmount: '0' });
      setOpen(true);
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const saveReward = async () => {
    if (!form.label.trim()) return setError('El nombre de la recompensa es obligatorio.');
    if (form.type === 'free_item' && !form.productId) return setError('Elige el producto que se regala.');
    setSaving(true); setError('');
    try {
      await api.createLoyaltyReward({
        label: form.label.trim(),
        type: form.type,
        value: form.type.startsWith('discount') ? Number(form.value || 0) : undefined,
        productId: form.type === 'free_item' ? form.productId : undefined,
        stampsRequired: Number(form.stampsRequired || 6),
        minOrderAmount: Number(form.minOrderAmount || 0),
      }, token);
      await load(); setOpen(false);
    } catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };

  const toggleActive = async (reward) => {
    setSaving(true); setError('');
    try { await api.updateLoyaltyReward(reward.id, { activo: !reward.activo }, token); await load(); }
    catch (requestError) { setError(requestError.message); } finally { setSaving(false); }
  };

  if (!rewards) return <Loading />;
  const activeReward = rewards.find((r) => r.activo);
  const pending = redemptions?.filter((r) => !r.redeemed) || [];

  return <section className="admin-module">
    {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
    <header>
      <div><Typography component="h1">Tarjeta de fidelidad</Typography><Typography>Configura qué se gana el cliente al completar sus sellos.</Typography></div>
      <div className="admin-header-actions"><Button variant="contained" startIcon={<Plus size={18} />} onClick={openForm}>Nueva recompensa</Button></div>
    </header>
    <div className="admin-module-stats">
      <article><Sparkles /><span><b>{activeReward ? rewardSummary(activeReward) : 'Ninguna'}</b><small>Recompensa activa</small></span></article>
      <article><PackageCheck /><span><b>{activeReward?.stampsRequired ?? 6}</b><small>Sellos requeridos</small></span></article>
      <article><Banknote /><span><b>{money.format(activeReward?.minOrderAmount ?? 0)}</b><small>Compra mínima por sello</small></span></article>
      <article><Gift /><span><b>{pending.length}</b><small>Canjes pendientes</small></span></article>
    </div>
    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Recompensas</h2><span>Solo una activa a la vez</span></div>
      {rewards.length ? rewards.map((reward) => (
        <div className="admin-list-row" key={reward.id}>
          <span><b>{reward.label}</b><small>{rewardSummary(reward)} · {reward.stampsRequired} sellos · compra mín. {money.format(reward.minOrderAmount || 0)}</small></span>
          <div className="admin-row-actions">
            <Chip size="small" color={reward.activo ? 'success' : 'default'} label={reward.activo ? 'Activa' : 'Inactiva'} />
            <Switch checked={reward.activo} onChange={() => toggleActive(reward)} disabled={saving} inputProps={{ 'aria-label': `Activar ${reward.label}` }} />
          </div>
        </div>
      )) : <Empty>Todavía no configuras ninguna recompensa — la tarjeta de fidelidad no otorgará nada hasta que crees una.</Empty>}
    </div>
    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Canjes pendientes</h2><span>{pending.length}</span></div>
      {pending.length ? pending.map((r) => (
        <div className="admin-list-row" key={r.id}>
          <span><b>{r.customer.nombre}</b><small>{rewardSummary(r.reward)} · código {r.code}</small></span>
        </div>
      )) : <Empty>Sin canjes pendientes.</Empty>}
    </div>

    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Puntos por producto</h2><span>2% de cada pedido pagado — sin canjeable si se deja vacío</span></div>
      {products.filter((p) => p.tipo !== 'merch').map((p) => (
        <div className="admin-list-row" key={p.id}>
          <span><b>{p.nombre}</b><small>{money.format(p.precio)}</small></span>
          <div className="admin-row-actions">
            <TextField
              size="small"
              label="Puntos"
              type="number"
              style={{ width: 110 }}
              value={puntosPorProducto[p.id] ?? ''}
              onChange={(e) => setPuntosPorProducto({ ...puntosPorProducto, [p.id]: e.target.value })}
            />
            <Button size="small" variant="outlined" disabled={savingProductId === p.id} onClick={() => guardarCostoPuntos(p.id)}>
              {savingProductId === p.id ? '...' : 'Guardar'}
            </Button>
          </div>
        </div>
      ))}
    </div>

    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Canjes de puntos pendientes</h2><span>{pointsRedemptions?.filter((r) => !r.redeemed).length ?? 0}</span></div>
      {pointsRedemptions?.filter((r) => !r.redeemed).length ? pointsRedemptions.filter((r) => !r.redeemed).map((r) => (
        <div className="admin-list-row" key={r.id}>
          <span><b>{r.customer.nombre}</b><small>{r.product?.nombre || 'Producto eliminado'} · {Number(r.puntos).toFixed(2)} puntos · código {r.code}</small></span>
        </div>
      )) : <Empty>Sin canjes de puntos pendientes.</Empty>}
    </div>

    <header style={{ marginTop: 8 }}>
      <div><Typography component="h1" style={{ fontSize: 20 }}>Promoción de cumpleaños</Typography><Typography>Se activa sola el día del cumpleaños del cliente, si tiene su fecha de nacimiento registrada.</Typography></div>
      <div className="admin-header-actions"><Button variant="contained" startIcon={<Plus size={18} />} onClick={openBirthdayForm}>Nueva promoción</Button></div>
    </header>
    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Promociones</h2><span>Solo una activa a la vez</span></div>
      {birthdayRewards?.length ? birthdayRewards.map((reward) => (
        <div className="admin-list-row" key={reward.id}>
          <span><b>{reward.label}</b><small>{rewardSummary(reward)}</small></span>
          <div className="admin-row-actions">
            <Chip size="small" color={reward.activo ? 'success' : 'default'} label={reward.activo ? 'Activa' : 'Inactiva'} />
            <Switch checked={reward.activo} onChange={() => toggleBirthdayActive(reward)} disabled={saving} inputProps={{ 'aria-label': `Activar ${reward.label}` }} />
          </div>
        </div>
      )) : <Empty>Todavía no configuras ninguna promoción de cumpleaños.</Empty>}
    </div>
    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Canjes de cumpleaños pendientes</h2><span>{birthdayRedemptions?.filter((r) => !r.redeemed).length ?? 0}</span></div>
      {birthdayRedemptions?.filter((r) => !r.redeemed).length ? birthdayRedemptions.filter((r) => !r.redeemed).map((r) => (
        <div className="admin-list-row" key={r.id}>
          <span><b>{r.customer.nombre}</b><small>{rewardSummary(r.reward)} · código {r.code}</small></span>
        </div>
      )) : <Empty>Sin canjes de cumpleaños pendientes.</Empty>}
    </div>

    <Dialog open={birthdayOpen} onClose={() => !saving && setBirthdayOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Nueva promoción de cumpleaños</DialogTitle>
      <DialogContent className="admin-form-grid">
        <TextField autoFocus required label="Nombre" value={birthdayForm.label} onChange={(e) => setBirthdayForm({ ...birthdayForm, label: e.target.value })} />
        <TextField select required label="Tipo" value={birthdayForm.type} onChange={(e) => setBirthdayForm({ ...birthdayForm, type: e.target.value })}>
          {REWARD_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
        </TextField>
        {birthdayForm.type.startsWith('discount') && (
          <TextField required label={birthdayForm.type === 'discount_percent' ? 'Porcentaje' : 'Monto ($)'} type="number" value={birthdayForm.value} onChange={(e) => setBirthdayForm({ ...birthdayForm, value: e.target.value })} />
        )}
        {birthdayForm.type === 'free_item' && (
          <TextField select required label="Producto" value={birthdayForm.productId} onChange={(e) => setBirthdayForm({ ...birthdayForm, productId: e.target.value })}>
            {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
          </TextField>
        )}
      </DialogContent>
      <DialogActions><Button onClick={() => setBirthdayOpen(false)} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={saveBirthdayReward} disabled={saving}>Guardar y activar</Button></DialogActions>
    </Dialog>

    <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Nueva recompensa de fidelidad</DialogTitle>
      <DialogContent className="admin-form-grid">
        <TextField autoFocus required label="Nombre" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <TextField select required label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {REWARD_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
        </TextField>
        {form.type.startsWith('discount') && (
          <TextField required label={form.type === 'discount_percent' ? 'Porcentaje' : 'Monto ($)'} type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        )}
        {form.type === 'free_item' && (
          <TextField select required label="Producto" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
            {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
          </TextField>
        )}
        <TextField required label="Sellos requeridos" type="number" value={form.stampsRequired} onChange={(e) => setForm({ ...form, stampsRequired: e.target.value })} />
        <TextField required label="Compra mínima ($)" type="number" helperText="Pedidos por debajo de este monto no suman sello" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
      </DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={saveReward} disabled={saving}>Guardar y activar</Button></DialogActions>
    </Dialog>
  </section>;
}

const MERCH_ORDER_LABEL = { pendiente: 'Pendiente', pagado: 'Pagado', cancelado: 'Cancelado' };
const MERCH_ORDER_COLOR = { pendiente: 'warning', pagado: 'success', cancelado: 'default' };

function ImageUploadField({ label = 'Imagen', value, onChange, api, token, onError }) {
  const [uploading, setUploading] = useState(false);
  const inputId = React.useId();
  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await api.uploadImage(file, token);
      onChange(url);
    } catch (requestError) { onError(requestError.message); } finally { setUploading(false); }
  };
  return (
    <div className="admin-image-field">
      {value ? <img src={value} alt="" className="admin-image-preview" /> : null}
      <div className="admin-row-actions">
        <Button component="label" size="small" variant="outlined" disabled={uploading}>
          {uploading ? 'Subiendo…' : value ? 'Cambiar imagen' : `Subir ${label.toLowerCase()}`}
          <input id={inputId} type="file" accept="image/*" hidden onChange={handleFile} />
        </Button>
        {value ? <Button size="small" color="warning" onClick={() => onChange('')} disabled={uploading}>Quitar</Button> : null}
      </div>
    </div>
  );
}

function Merch({ api, token }) {
  const [products, setProducts] = useState(null);
  const [orders, setOrders] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');

  const [productOpen, setProductOpen] = useState(false);
  const [product, setProduct] = useState({ nombre: '', categoryId: '', precio: '', imagenUrl: '' });

  const [variantTarget, setVariantTarget] = useState(null);
  const [variant, setVariant] = useState({ nombre: '', precio: '', imagenUrl: '' });

  const [editingVariant, setEditingVariant] = useState(null);

  const load = () => Promise.all([api.merchProducts(token), api.merchOrders(token), api.categories(token)])
    .then(([p, o, c]) => { setProducts(p); setOrders(o); setCategories(c); });

  // Mismo motivo que en Loyalty() arriba: `load` no es estable entre
  // renders, incluirla en las deps provocaría un loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load().catch((e) => setError(e.message)); }, [api, token]);

  const saveCategory = async () => {
    if (!categoryName.trim()) return setError('El nombre de la categoría es obligatorio.');
    setSaving(true); setError('');
    try {
      await api.createCategory({ nombre: categoryName.trim(), orden: 100 }, token);
      await load();
      setCategoryOpen(false); setCategoryName('');
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const openProduct = () => { setProduct({ nombre: '', categoryId: categories[0]?.id || '', precio: '', imagenUrl: '' }); setProductOpen(true); };
  const saveProduct = async () => {
    if (!product.nombre.trim() || !product.precio || !product.categoryId) {
      return setError('Nombre, precio y categoría son obligatorios.');
    }
    setSaving(true); setError('');
    try {
      await api.createProduct({ nombre: product.nombre.trim(), precio: Number(product.precio), categoryId: product.categoryId, tipo: 'merch', imagenUrl: product.imagenUrl || undefined }, token);
      await load();
      setProductOpen(false);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const openVariant = (productId) => { setVariantTarget(productId); setVariant({ nombre: '', precio: '', imagenUrl: '' }); };
  const saveVariant = async () => {
    if (!variant.nombre.trim() || !variant.precio) return setError('Nombre y precio de la variante son obligatorios.');
    setSaving(true); setError('');
    try {
      await api.createVariant(variantTarget, { nombre: variant.nombre.trim(), precio: Number(variant.precio), imagenUrl: variant.imagenUrl || undefined }, token);
      await load();
      setVariantTarget(null);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const openEditVariant = (v) => setEditingVariant({ id: v.id, nombre: v.nombre, precio: String(v.precio), imagenUrl: v.imagenUrl || '', activo: v.activo });
  const saveEditVariant = async () => {
    setSaving(true); setError('');
    try {
      await api.updateVariant(editingVariant.id, { nombre: editingVariant.nombre.trim(), precio: Number(editingVariant.precio), imagenUrl: editingVariant.imagenUrl || null, activo: editingVariant.activo }, token);
      await load();
      setEditingVariant(null);
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const saveStock = async (variantId, sucursal, value) => {
    const quantity = Number(value);
    if (!Number.isFinite(quantity) || quantity < 0) return;
    setError('');
    try {
      await api.updateVariantStock(variantId, { sucursal, quantity }, token);
      await load();
    } catch (e) { setError(e.message); }
  };

  if (!products) return <Loading />;

  return <section className="admin-module">
    {error ? <Alert severity="error" onClose={() => setError('')}>{error}</Alert> : null}
    <header>
      <div><Typography component="h1">Merch</Typography><Typography>Playeras, gorras y accesorios — catálogo, variantes y stock por sucursal.</Typography></div>
      <div className="admin-header-actions">
        <Button variant="outlined" onClick={() => setCategoryOpen(true)}>+ Categoría</Button>
        <Button variant="contained" startIcon={<Plus size={18} />} onClick={openProduct}>Nuevo producto</Button>
      </div>
    </header>

    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Catálogo</h2><span>{products.length} productos</span></div>
      {products.length ? products.map((p) => (
        <div className="admin-list-row" key={p.id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {p.imagenUrl ? <img src={p.imagenUrl} alt="" className="admin-thumb" /> : null}
              <span><b>{p.nombre}</b><small>{p.category?.nombre}</small></span>
            </span>
            <Button size="small" onClick={() => openVariant(p.id)}>+ Variante</Button>
          </div>
          {p.variants.map((v) => (
            <div key={v.id} className="admin-stock-row" style={{ marginLeft: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {v.imagenUrl ? <img src={v.imagenUrl} alt="" className="admin-thumb" /> : null}
                <div>
                  <b>{v.nombre}</b>
                  <small>${v.precio} · {v.activo ? 'Activa' : 'Inactiva'}</small>
                  <div className="admin-row-actions"><Button size="small" startIcon={<Edit3 size={14} />} onClick={() => openEditVariant(v)}>Editar</Button></div>
                </div>
              </div>
              <div className="admin-stock-controls">
                {['xico', 'coatepec'].map((sucursal) => {
                  const stock = v.stocks.find((s) => s.sucursal === sucursal);
                  return (
                    <TextField
                      key={sucursal}
                      size="small"
                      type="number"
                      label={sucursal === 'xico' ? 'Xico' : 'Coatepec'}
                      defaultValue={stock?.quantity ?? 0}
                      slotProps={{ htmlInput: { min: 0 } }}
                      onBlur={(e) => saveStock(v.id, sucursal, e.target.value)}
                      sx={{ width: 100 }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )) : <Empty>Todavía no hay productos de merch — agrega el primero.</Empty>}
    </div>

    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Pedidos de merch</h2><span>Últimos 50</span></div>
      {orders?.length ? orders.map((o) => (
        <div className="admin-list-row" key={o.id}>
          <span><b>{o.clienteNombre || 'Sin nombre'}</b><small>{o.sucursal} · {o.tipoEntrega} · {new Date(o.createdAt).toLocaleString('es-MX')}</small></span>
          <div className="admin-row-actions"><b>{money.format(o.total)}</b><Chip size="small" color={MERCH_ORDER_COLOR[o.estado]} label={MERCH_ORDER_LABEL[o.estado]} /></div>
        </div>
      )) : <Empty>Sin pedidos de merch todavía.</Empty>}
    </div>

    <Dialog open={categoryOpen} onClose={() => !saving && setCategoryOpen(false)} fullWidth maxWidth="xs">
      <DialogTitle>Nueva categoría de merch</DialogTitle>
      <DialogContent><TextField autoFocus fullWidth label="Nombre" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} /></DialogContent>
      <DialogActions><Button onClick={() => setCategoryOpen(false)} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={saveCategory} disabled={saving}>Guardar</Button></DialogActions>
    </Dialog>

    <Dialog open={productOpen} onClose={() => !saving && setProductOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Nuevo producto de merch</DialogTitle>
      <DialogContent className="admin-form-grid">
        <TextField autoFocus required label="Nombre" value={product.nombre} onChange={(e) => setProduct({ ...product, nombre: e.target.value })} />
        <TextField select required label="Categoría" value={product.categoryId} onChange={(e) => setProduct({ ...product, categoryId: e.target.value })}>
          {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
        </TextField>
        <TextField required label="Precio" type="number" value={product.precio} onChange={(e) => setProduct({ ...product, precio: e.target.value })} />
        <ImageUploadField value={product.imagenUrl} onChange={(url) => setProduct({ ...product, imagenUrl: url })} api={api} token={token} onError={setError} />
      </DialogContent>
      <DialogActions><Button onClick={() => setProductOpen(false)} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={saveProduct} disabled={saving}>Guardar producto</Button></DialogActions>
    </Dialog>

    <Dialog open={Boolean(variantTarget)} onClose={() => !saving && setVariantTarget(null)} fullWidth maxWidth="xs">
      <DialogTitle>Nueva variante</DialogTitle>
      <DialogContent className="admin-form-grid">
        <TextField autoFocus required label="Nombre (ej. Rosa, Única)" value={variant.nombre} onChange={(e) => setVariant({ ...variant, nombre: e.target.value })} />
        <TextField required label="Precio" type="number" value={variant.precio} onChange={(e) => setVariant({ ...variant, precio: e.target.value })} />
        <ImageUploadField value={variant.imagenUrl} onChange={(url) => setVariant({ ...variant, imagenUrl: url })} api={api} token={token} onError={setError} />
      </DialogContent>
      <DialogActions><Button onClick={() => setVariantTarget(null)} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={saveVariant} disabled={saving}>Guardar variante</Button></DialogActions>
    </Dialog>

    <Dialog open={Boolean(editingVariant)} onClose={() => !saving && setEditingVariant(null)} fullWidth maxWidth="xs">
      <DialogTitle>Editar variante</DialogTitle>
      {editingVariant && (
        <DialogContent className="admin-form-grid">
          <TextField autoFocus required label="Nombre" value={editingVariant.nombre} onChange={(e) => setEditingVariant({ ...editingVariant, nombre: e.target.value })} />
          <TextField required label="Precio" type="number" value={editingVariant.precio} onChange={(e) => setEditingVariant({ ...editingVariant, precio: e.target.value })} />
          <ImageUploadField value={editingVariant.imagenUrl} onChange={(url) => setEditingVariant({ ...editingVariant, imagenUrl: url })} api={api} token={token} onError={setError} />
          <div className="admin-row-actions">
            <span>Activa</span>
            <Switch checked={editingVariant.activo} onChange={(e) => setEditingVariant({ ...editingVariant, activo: e.target.checked })} />
          </div>
        </DialogContent>
      )}
      <DialogActions><Button onClick={() => setEditingVariant(null)} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={saveEditVariant} disabled={saving}>Guardar cambios</Button></DialogActions>
    </Dialog>
  </section>;
}

export default function AdminWorkspace({ section, api, token, branch, dashboard }) {
  if (section === 'Operación') return <Operation dashboard={dashboard} api={api} token={token} />;
  if (section === 'Finanzas') return <Finance api={api} token={token} branch={branch} dashboard={dashboard} />;
  if (section === 'Inventario') return <Inventory api={api} token={token} branch={branch} />;
  if (section === 'Merch') return <Merch api={api} token={token} />;
  if (section === 'Fidelidad') return <Loyalty api={api} token={token} />;
  if (section === 'Equipo') return <Team api={api} token={token} />;
  if (section === 'Configuración') return <BranchSettings api={api} token={token} />;
  return null;
}
