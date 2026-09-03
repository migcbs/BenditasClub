import React, { useEffect, useState } from 'react';
import { Alert, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, Switch, TextField, Typography } from '@mui/material';
import { Banknote, ChefHat, CircleDollarSign, ClipboardList, Edit3, Gift, PackageCheck, Plus, ReceiptText, ShoppingBasket, Sparkles, Trash2 } from 'lucide-react';

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
  const openProduct = (item) => {
    if (item) { setEditId(item.id); setProduct({ nombre: item.nombre, sku: item.sku || '', unit: item.unit, costPerUnit: String(item.costPerUnit || ''), reorderPoint: String(item.reorderPoint || ''), initialStock: '' }); }
    else { setEditId(null); }
    setProductOpen(true);
  };
  const openAdjustment = (item, kind) => { setStockItem(item); setAdjustmentKind(kind); setStockQuantity(''); };
  const openMovements = async () => { setSaving(true); try { setMovements(await api.inventoryMovements(activeBranch, token)); } catch (requestError) { setError(requestError.message); } finally { setSaving(false); } };
  const saveSupplier = async () => { if (!supplier.nombre.trim()) return; setSaving(true); try { await api.createSupplier(supplier, token); await load(); setSupplierOpen(false); setSupplier({ nombre: '', contacto: '', telefono: '' }); } catch (requestError) { setError(requestError.message); } finally { setSaving(false); } };
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
        return <div className="admin-stock-row" key={item.id}><div><b>{item.nombre}</b><small>{Number(item.quantity)} {item.unit} · mínimo {Number(item.reorderPoint)} {item.unit}</small><div className="admin-row-actions"><Button size="small" startIcon={<Edit3 size={14}/>} onClick={() => openProduct(item)}>Editar</Button><Button color="warning" size="small" startIcon={<Trash2 size={14}/>} onClick={() => openAdjustment(item, 'waste')}>Merma</Button></div></div><div className="admin-stock-controls"><span className={`stock-${item.health}`}>{item.health === 'healthy' ? 'Saludable' : item.health === 'critical' ? 'Crítico' : 'Bajo'}</span><LinearProgress variant="determinate" value={ratio} color={item.health === 'healthy' ? 'success' : item.health === 'critical' ? 'error' : 'warning'} /><Button size="small" variant="outlined" aria-label={`Agregar stock a ${item.nombre}`} onClick={() => openAdjustment(item, 'entry')}>+ Stock</Button></div></div>;
      }) : <Empty>No encontramos insumos con ese filtro.</Empty>}
    </div>
    <div className="admin-two-columns">
      <div className="admin-data-panel"><div className="admin-data-heading"><h2>Recetas configuradas</h2><Button size="small" onClick={() => openRecipe()}>Nueva receta</Button></div>{data.recipes.length ? data.recipes.map((recipe) => <div className="admin-list-row" key={recipe.id}><span><b>{recipe.product.nombre}</b><small>{recipe.items.length} ingredientes · rendimiento {Number(recipe.yield)}</small></span><Button size="small" aria-label={`Editar receta de ${recipe.product.nombre}`} onClick={() => openRecipe(recipe)}>Editar</Button></div>) : <Empty>Aún no hay recetas. Los pedidos no descontarán existencias hasta configurarlas.</Empty>}</div>
      <div className="admin-data-panel"><div className="admin-data-heading"><h2>Compras y proveedores</h2><div className="admin-row-actions"><Button size="small" onClick={() => setSupplierOpen(true)}>Proveedor</Button><Button size="small" variant="contained" onClick={() => setPurchaseOpen(true)}>Nueva compra</Button></div></div>{data.purchases.length ? data.purchases.slice(0,5).map((purchase) => <div className="admin-list-row" key={purchase.id}><span><b>{purchase.supplier.nombre}</b><small>{purchase.status} · {purchase.items.length} insumos</small></span><div className="admin-row-actions"><b>{money.format(Number(purchase.total))}</b>{purchase.status !== 'received' ? <Button size="small" variant="outlined" aria-label={`Recibir compra de ${purchase.supplier.nombre}`} onClick={() => receivePurchase(purchase)} disabled={saving}>Recibir</Button> : null}</div></div>) : <Empty>Sin órdenes de compra. Crea proveedores para preparar el próximo abasto.</Empty>}</div>
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
    <Dialog open={supplierOpen} onClose={() => setSupplierOpen(false)} fullWidth maxWidth="xs"><DialogTitle>Agregar proveedor</DialogTitle><DialogContent className="admin-form-grid"><TextField required label="Nombre" value={supplier.nombre} onChange={(e) => setSupplier({...supplier,nombre:e.target.value})}/><TextField label="Contacto" value={supplier.contacto} onChange={(e) => setSupplier({...supplier,contacto:e.target.value})}/><TextField label="Teléfono" value={supplier.telefono} onChange={(e) => setSupplier({...supplier,telefono:e.target.value})}/></DialogContent><DialogActions><Button onClick={() => setSupplierOpen(false)}>Cancelar</Button><Button variant="contained" onClick={saveSupplier}>Guardar proveedor</Button></DialogActions></Dialog>
    <Dialog open={purchaseOpen} onClose={closePurchase} fullWidth maxWidth="sm"><DialogTitle>Nueva orden de compra</DialogTitle><DialogContent className="admin-form-grid"><TextField select required label="Proveedor" value={purchase.supplierId} onChange={(e) => setPurchase({...purchase,supplierId:e.target.value})}>{data.suppliers.map((item)=><MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField label="Notas" value={purchase.notes} onChange={(e) => setPurchase({...purchase,notes:e.target.value})}/>{purchase.items.map((line,index)=><div className="admin-line-editor" key={`purchase-${index}`}><TextField select required label="Ingrediente" value={line.ingredientId} onChange={(e) => updatePurchaseLine(index,'ingredientId',e.target.value)}>{data.ingredients.map((item)=><MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField required label="Cantidad" type="number" value={line.quantityOrdered} onChange={(e) => updatePurchaseLine(index,'quantityOrdered',e.target.value)}/><TextField label="Costo unitario" type="number" value={line.unitCost} onChange={(e) => updatePurchaseLine(index,'unitCost',e.target.value)}/>{purchase.items.length > 1 ? <Button color="warning" onClick={() => removePurchaseLine(index)}>Quitar</Button> : null}</div>)}<Button size="small" variant="outlined" onClick={addPurchaseLine}>Agregar insumo a compra</Button></DialogContent><DialogActions><Button onClick={closePurchase}>Cancelar</Button><Button variant="contained" onClick={savePurchase}>Crear compra</Button></DialogActions></Dialog>
    <Dialog open={recipeOpen} onClose={closeRecipe} fullWidth maxWidth="sm"><DialogTitle>Configurar receta</DialogTitle><DialogContent className="admin-form-grid"><TextField select required label="Producto del menú" value={recipe.productId} onChange={(e) => setRecipe({...recipe,productId:e.target.value})}>{products.map((item)=><MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField required label="Rendimiento" type="number" value={recipe.yield} onChange={(e) => setRecipe({...recipe,yield:e.target.value})}/>{recipe.items.map((line,index)=><div className="admin-line-editor" key={`recipe-${index}`}><TextField select required label="Ingrediente" value={line.ingredientId} onChange={(e) => updateRecipeLine(index,'ingredientId',e.target.value)}>{data.ingredients.map((item)=><MenuItem key={item.id} value={item.id}>{item.nombre}</MenuItem>)}</TextField><TextField required label="Cantidad usada por pedido" type="number" value={line.quantity} onChange={(e) => updateRecipeLine(index,'quantity',e.target.value)}/>{recipe.items.length > 1 ? <Button color="warning" onClick={() => removeRecipeLine(index)}>Quitar</Button> : null}</div>)}<Button size="small" variant="outlined" onClick={addRecipeLine}>Agregar ingrediente a receta</Button></DialogContent><DialogActions><Button onClick={closeRecipe}>Cancelar</Button><Button variant="contained" onClick={saveRecipe}>Guardar receta</Button></DialogActions></Dialog>
  </section>;
}

function Operation({ dashboard }) {
  return <section className="admin-module"><header><div><Typography component="h1">Operación</Typography><Typography>Pedidos, tiempos de cocina y desempeño del menú.</Typography></div><Chip label="En vivo" color="primary" /></header><div className="admin-module-stats"><article><ChefHat/><span><b>{dashboard.summary.pendingOrders}</b><small>Pedidos abiertos</small></span></article><article><PackageCheck/><span><b>{dashboard.summary.orders}</b><small>Pedidos del periodo</small></span></article><article><CircleDollarSign/><span><b>{money.format(dashboard.summary.averageTicket)}</b><small>Ticket promedio</small></span></article></div><div className="admin-two-columns"><div className="admin-data-panel"><div className="admin-data-heading"><h2>Pedidos recientes</h2><span>{dashboard.recentOrders.length}</span></div>{dashboard.recentOrders.length ? dashboard.recentOrders.map((order) => <div className="admin-list-row" key={order.id}><span><b>#{order.id.slice(0,6).toUpperCase()} · {order.clienteNombre || order.tipo}</b><small>{order.estadoCocina} · {order.sucursal}</small></span><b>{money.format(order.total)}</b></div>) : <Empty>No hay pedidos en este periodo.</Empty>}</div><div className="admin-data-panel"><div className="admin-data-heading"><h2>Productos líderes</h2><span>Unidades</span></div>{dashboard.topProducts.map((product) => <div className="admin-list-row" key={product.productId || product.name}><span><b>{product.name || product.nombre}</b><small>{money.format(product.sales)} vendidos</small></span><b>{product.quantity}</b></div>)}</div></div></section>;
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

function Team({ api, token }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    api.users(token).then((result) => live && setUsers(result)).catch((requestError) => live && setError(requestError.message));
    return () => { live = false; };
  }, [api, token]);
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!users) return <Loading />;
  return <section className="admin-module"><header><div><Typography component="h1">Equipo y permisos</Typography><Typography>Accesos operativos separados para piso y cocina.</Typography></div><Chip label={`${users.filter((user) => user.activo).length} activos`} /></header><div className="admin-data-panel"><div className="admin-data-heading"><h2>Personal</h2><span>PIN individual</span></div>{users.map((user) => <div className="admin-list-row" key={user.id}><span><b>{user.nombre}</b><small>{user.sucursal} · {user.role}</small></span><Chip size="small" color={user.activo ? 'success' : 'default'} label={user.activo ? 'Activo' : 'Inactivo'} /></div>)}</div></section>;
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
  const [form, setForm] = useState({ label: '', type: 'discount_percent', value: '', productId: '', stampsRequired: '6' });

  const load = () => Promise.all([api.loyaltyRewards(token), api.loyaltyRedemptions(token)])
    .then(([r, red]) => { setRewards(r); setRedemptions(red); });

  useEffect(() => { load().catch((e) => setError(e.message)); }, [api, token]);

  const openForm = async () => {
    setError('');
    try {
      if (!products.length) setProducts(await api.products());
      setForm({ label: '', type: 'discount_percent', value: '', productId: '', stampsRequired: '6' });
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
      <article><Gift /><span><b>{pending.length}</b><small>Canjes pendientes</small></span></article>
    </div>
    <div className="admin-data-panel">
      <div className="admin-data-heading"><h2>Recompensas</h2><span>Solo una activa a la vez</span></div>
      {rewards.length ? rewards.map((reward) => (
        <div className="admin-list-row" key={reward.id}>
          <span><b>{reward.label}</b><small>{rewardSummary(reward)} · {reward.stampsRequired} sellos</small></span>
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
      </DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button><Button variant="contained" onClick={saveReward} disabled={saving}>Guardar y activar</Button></DialogActions>
    </Dialog>
  </section>;
}

export default function AdminWorkspace({ section, api, token, branch, dashboard }) {
  if (section === 'Operación') return <Operation dashboard={dashboard} />;
  if (section === 'Finanzas') return <Finance api={api} token={token} branch={branch} dashboard={dashboard} />;
  if (section === 'Inventario') return <Inventory api={api} token={token} branch={branch} />;
  if (section === 'Fidelidad') return <Loyalty api={api} token={token} />;
  if (section === 'Equipo') return <Team api={api} token={token} />;
  return null;
}
