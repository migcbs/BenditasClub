const BRANCHES = ['all', 'xico', 'coatepec'];

function parseDashboardFilters(query, now = new Date()) {
  const branch = query.branch || 'all';
  if (!BRANCHES.includes(branch)) {
    throw new Error('Sucursal inválida');
  }

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const from = query.from ? new Date(query.from) : startOfDay;
  const to = query.to ? new Date(query.to) : now;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from >= to) {
    throw new Error('Rango de fechas inválido');
  }

  return { branch, from, to };
}

function summarizeOrders(orders) {
  const paid = orders.filter((order) => order.estado === 'pagado');
  const sales = paid.reduce((sum, order) => sum + order.total, 0);
  const cashSales = paid
    .filter((order) => order.metodoPago === 'efectivo')
    .reduce((sum, order) => sum + order.total, 0);
  const cardSales = paid
    .filter((order) => order.metodoPago === 'tarjeta')
    .reduce((sum, order) => sum + order.total, 0);

  return {
    sales,
    orders: paid.length,
    averageTicket: paid.length ? Math.round(sales / paid.length) : 0,
    cashSales,
    cardSales,
    pendingOrders: orders.filter((order) => order.estado === 'pendiente').length,
    cancelledOrders: orders.filter((order) => order.estado === 'cancelado').length,
    kitchenDelays: orders.filter((order) => {
      if (order.estadoCocina === 'lista' || order.estadoCocina === 'entregada' || order.estado === 'cancelado') return false;
      return Date.now() - new Date(order.createdAt).getTime() > 15 * 60 * 1000;
    }).length,
  };
}

function groupTopProducts(orders) {
  const products = new Map();
  orders.filter((order) => order.estado === 'pagado').forEach((order) => {
    order.items.forEach((item) => {
      const current = products.get(item.productId) || {
        productId: item.productId,
        name: item.nombre,
        quantity: 0,
        sales: 0,
      };
      current.quantity += item.cantidad;
      current.sales += item.subtotal;
      products.set(item.productId, current);
    });
  });
  return [...products.values()].sort((a, b) => b.sales - a.sales).slice(0, 8);
}

function groupByBranch(orders) {
  return ['xico', 'coatepec'].map((branch) => {
    const branchOrders = orders.filter((order) => order.sucursal === branch);
    return { branch, ...summarizeOrders(branchOrders) };
  });
}

function groupHourlySales(orders) {
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, sales: 0, orders: 0 }));
  orders.filter((order) => order.estado === 'pagado').forEach((order) => {
    const hour = new Date(order.createdAt).getHours();
    hours[hour].sales += order.total;
    hours[hour].orders += 1;
  });
  return hours;
}

module.exports = {
  parseDashboardFilters,
  summarizeOrders,
  groupTopProducts,
  groupByBranch,
  groupHourlySales,
};
