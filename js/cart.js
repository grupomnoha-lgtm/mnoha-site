function initializeCart() {
    let cart = [];
    const cartCount = document.getElementById('cart-count');
    const cartDrawer = document.getElementById('cart-drawer');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-whatsapp-btn');
    const cartToggleButton = document.getElementById('cart-toggle-btn');
    const cartCloseButton = document.getElementById('cart-close-btn');

    // Expone la función addToCart globalmente para que los botones `onclick` puedan usarla.
    window.addToCart = function(name, price) {
        const item = cart.find(i => i.name === name);
        if (item) {
            item.qty += 1;
        } else {
            cart.push({ name, price, qty: 1 });
        }
        updateCartUI();
        if (cartDrawer) cartDrawer.classList.remove('hidden');
    };

    // Expone la función removeFromCart globalmente.
    window.removeFromCart = function(idx) {
        cart.splice(idx, 1);
        updateCartUI();
    };

    function updateCartUI() {
        if (!cartCount || !cartTotalPrice || !cartItemsContainer || !checkoutBtn) return;

        const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        
        cartCount.textContent = totalCount;
        cartTotalPrice.textContent = totalAmount.toLocaleString('es-ES') + ' FCFA';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-gray-500 text-sm text-center my-8">Tu carrito está vacío.</p>';
            checkoutBtn.href = "#";
            return;
        }

        cartItemsContainer.innerHTML = cart.map((item, idx) => `
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                    <p class="font-bold text-sm text-brand-dark">${item.name}</p>
                    <p class="text-xs text-gray-500">${item.qty} x ${item.price.toLocaleString('es-ES')} FCFA</p>
                </div>
                <button onclick="removeFromCart(${idx})" class="text-red-500 hover:text-red-700 font-bold text-xs">Eliminar</button>
            </div>
        `).join('');

        const orderDetails = cart.map(i => `${i.qty}x ${i.name} (${(i.price * i.qty).toLocaleString('es-ES')} FCFA)`).join('%0A');
        checkoutBtn.href = `https://wa.me/240555267985?text=Hola,%20deseo%20realizar%20el%20siguiente%20pedido%20de%20sastrería:%0A${orderDetails}%0ATotal:%20${totalAmount.toLocaleString('es-ES')}%20FCFA`;
    }

    if (cartToggleButton) cartToggleButton.addEventListener('click', () => cartDrawer.classList.remove('hidden'));
    if (cartCloseButton) cartCloseButton.addEventListener('click', () => cartDrawer.classList.add('hidden'));

    updateCartUI(); // Llama para inicializar el estado del carrito en la carga.
}

initializeCart();