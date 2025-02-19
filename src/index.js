/* 
  Datalayer Utils 
*/
(function () {

    var dataLayer = [];
    if (window.dataLayer) {
        dataLayer = window.dataLayer;
    }

    window.ready = ready;
    addDataLayerListener(); // Listener for Push events

    var pageType = '{{page_type}}';
    var categoryProducts = '{{json category.products}}';
    var analyticsData = window.analyticsData || [];
    var validateDatalayerJson = () => ({});

    var listeners = [],
        doc = window.document,
        MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
        observer;

    ready('.body', addProductEventListeners); // Add Product event listener

    function ready(selector, fn) {
        // Store the selector and callback to be monitored
        listeners.push({
            selector: selector,
            fn: fn,
        });
        if (!observer) {
            // Watch for changes in the document
            observer = new MutationObserver(check);
            observer.observe(doc.documentElement, {
                childList: true,
                subtree: true,
            });
        }
        // Check if the element is currently in the DOM
        check();
    }

    function check() {
        // Check the DOM for elements matching a stored selector
        for (var i = 0, len = listeners.length, listener, elements; i < len; i++) {
            listener = listeners[i];
            // Query for elements matching the specified selector
            elements = doc.querySelectorAll(listener.selector);
            for (var j = 0, jLen = elements.length, element; j < jLen; j++) {
                element = elements[j];
                // Make sure the callback isn't invoked with the
                // same element more than once
                if (!element.ready) {
                    element.ready = true;
                    // Invoke the callback with the element
                    listener.fn.call(element, element);
                }
            }
        }
    }

    function htmlDecode(input) {
        if (!input) return '';
        var parsedInput = input.replace(/(\r\n|\n|\r)/gm, '');
        var doc = new DOMParser().parseFromString(parsedInput, 'text/html');
        return JSON.parse(doc.documentElement.textContent);
    }

    function getShopper() {
        let name = '{{customer.name}}';
            name = name.split(" ");
        return {
            customer_id: analyticsData.userId || '{{customer.id}}',
            email: analyticsData.userEmail || '{{customer.email}}',
            first_name: name[0],
            last_name: name[1],
        };
    }

    /*
    Product Event listener
    */

    function addProductEventListeners() {
        var productDetailsButton = document.getElementsByClassName('card-figure__link') || [];  //Product card selector
        var mainPageAddButton =    document.querySelectorAll("[data-button-type='add-cart']") || []; //Add to cart button selector
        var productPageAddButton = document.getElementById('form-action-addToCart'); //Add to cart form selector
        var cartPageRemoveButton = document.getElementsByClassName('cart-remove') || []; //Remove from cart button selector
        var cartButton =           document.getElementsByClassName('navUser-item--cart') || []; //Show Cart selector

        // Product Details
        if (productDetailsButton.length > 0) {
            [...productDetailsButton].forEach((el) =>
                el.addEventListener('click', () => {
                    onProductClick(el.attributes[2].nodeValue);
                })
            );
        }

        // Main Page - Add to Cart click
        if (mainPageAddButton.length > 0) {
            mainPageAddButton.forEach((el) =>
                el.addEventListener('click', (event) => {
                    var index = event.target.href.indexOf('product_id');
                    var productId = event.target.href.slice(index).split('=')[1];
                    onAddToCart(productId);
                })
            );
        }

        // Product Page - Add to Cart click
        if (productPageAddButton) {
            productPageAddButton.addEventListener('click', () => {
                onAddToCart('{{product.id}}');
            });
        }

        // Remove from Cart click
        if (cartPageRemoveButton.length > 0) {
            cartPageRemoveButton.forEach((el) =>
                el.addEventListener('click', () => {
                    onRemoveFromCart(el.attributes[1].nodeValue);
                })
            );
        }
        // Cart button click
        if (cartButton.length > 0) {
            cartButton[0].addEventListener('click', () => {
                onViewCart();
            })
        }
    }

    /*
    Datalayer events
    */

    // Measure product/item list views/impressions
    function onProductListView(products) {
        dataLayer.push({
            event: 'view_item_list',
            ecommerce: {
                items: products.map((item) => {
                    var categoryArray = item.category.map((category, key) => ({
                        [`item_category${key + 1}`]: category,
                    }));

                    var categories = Object.assign({}, ...categoryArray);

                    return {
                        item_name: item.name,
                        item_id: item.id,
                        price: item.price.without_tax.value,
                        item_brand: item.brand.name,
                        ...categories,
                        item_list_name: '{{category.name}}',
                        item_list_id: '{{category.id}}',
                    };
                }),
            },
            shopper: { ...getShopper() },
        });
    }

    // Call this function when a user clicks on a product link
    function onProductClick(productName) {
        dataLayer.push({
            event: 'select_item',
            ecommerce: {
                items: [{
                    item_name: productName,
                },],
            },
            shopper: getShopper(),
        });
    }

    // Measure a view of product details. This example assumes the detail view occurs on pageload,
    function onProductDetailsView() {
        console.log('{{getImage product.main_image}}');
        console.log('{{product.sku}}');
        console.log('{{product.gtin}}');
        console.log('{{product.url}}');
        dataLayer.push({
            event: 'view_item',
            ecommerce: {
                items: [{
                    item_name: '{{product.title}}', // Name or ID is required.
                    item_id: '{{product.id}}',
                    price: '{{product.price.without_tax.value}}',
                    item_category: '{{product.category}}',
                    item_variant: '{{product.sku}}',
                },],
            },
            shopper: getShopper(),
        });
    }

    // This event signifies that a user viewed their cart.
    function onViewCart() {
        dataLayer.push({
            event: 'view_cart',
            ecommerce: {
                cart_id: '{{ cart_id }}',
                items: analyticsData.products || htmlDecode("{{json cart.items}}") || [],
            },
            shopper: getShopper(),
        });
    }

    // Measure when a product is added to a shopping cart
    function onAddToCart(productId) {
        dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
                cart_id: '{{ cart_id }}',
                items: [{
                    item_name: '{{product.title}}', // Name or ID is required.
                    item_id: productId,
                    price: '{{product.price.without_tax.value}}',
                    item_category: '{{product.category}}',
                    item_variant: '{{product.sku}}',
                },],
            },
            shopper: getShopper(),
        });
    }

    function onRemoveFromCart(cartItemId) {
        dataLayer.push({
            event: 'remove_from_cart',
            ecommerce: {
                cart_id: '{{ cart_id }}',
                cart_item_id: cartItemId,
            },
            shopper: getShopper(),
        });
    }

    function onCheckoutStarted() {
        dataLayer.push({
            event: 'begin_checkout',
            ecommerce: {
                cart_id: '{{ cart_id }}',
                items: analyticsData.products || [],
            },
            shopper: getShopper(),
        });
    }

    function onPurchase() {
        dataLayer.push({
            event: 'purchase',
            ecommerce: {
                cart_id: '{{ cart_id }}',
                purchase: {
                    products: analyticsData.products || [],
                },
            },
            shopper: getShopper(),
        });
    }


    // Test file config
    /* eslint-disable */
    // if (WEBPACK_MODE === 'production') {
    //     validateDatalayerJson = () => ({});
    // } else {
    //     validateDatalayerJson = require('./testUtils');
    // }
    /* eslint-enable */


    function addDataLayerListener() {
        dataLayer.push = function (e) {
            Array.prototype.push.call(dataLayer, e);
            if (dataLayer && dataLayer.length && dataLayer.length > 0) {
                const dataLayerLength = dataLayer.length;
                const lastAddedItem = dataLayer[dataLayerLength - 1];
                console.log(lastAddedItem);
                validateDatalayerJson(lastAddedItem, 'event');
                validateDatalayerJson(lastAddedItem, 'ecommerce');
                validateDatalayerJson(lastAddedItem, 'shopper');
            }
        };
    }

    /*
    Checkout Started Events
    */

    const mailSelector = document.getElementsByClassName('customerView-body');
    const checkoutId = '{{checkout.id}}' || undefined;
    let userEmail = '';
    const products = [];

    async function getData() {
        if (checkoutId) {
            const url = `/api/storefront/checkouts/${checkoutId}`;
            const response = await fetch(url, {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            return response.json();
        } else {
            return;
        }
    }

    function getCheckoutData() {
        getData().then((data) => {
            if (data.cart && data.cart.lineItems.physicalItems.length) {
                for (const product of data.cart.lineItems.physicalItems) {
                    products.push({
                        product_id: product.productId,
                        sku: product.sku,
                        name: product.name,
                        brand: product.brand,
                        price: product.salePrice,
                        quantity: product.quantity,
                        url: product.url,
                        image_url: product.imageUrl,
                    });
                }
                analyticsData = {
                    checkout_id: data.id,
                    order_id: data.orderId,
                    value: data.grandTotal,
                    revenue: data.subtotal,
                    shipping: data.shippingCostTotal,
                    tax: data.taxTotal,
                    discount: data.cart.discountAmount,
                    coupon: data.cart.coupons,
                    currency: data.cart.currency.code,
                    products: products,
                };
            }
        });

        if (mailSelector && mailSelector[0]) {
            userEmail = mailSelector[0].innerHTML;
            analyticsData.userId = userId;
        }
    }

    /*
    BigCommerce Events Manager
    */

    if (pageType === 'category') {
        onProductListView(htmlDecode(categoryProducts));
    } else if (pageType === 'product') {
        onProductDetailsView();
        console.log('wenis')
    } else if (pageType === 'checkout') {
        getCheckoutData();
        onCheckoutStarted();
    } else if (pageType === 'orderconfirmation') {
        onPurchase();
    } else if (pageType === 'cart') {
        onViewCart();
    }
})();