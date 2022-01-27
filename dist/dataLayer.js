/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/* 
  Datalayer Utils 
*/
window.clShopifyTrack = function() {
    
    function htmlDecode(input) {
        if (!input) return '';
        var parsedInput = input.replace(/(\r\n|\n|\r)/gm, '');
        var doc = new DOMParser().parseFromString(parsedInput, 'text/html');
        return JSON.parse(doc.documentElement.textContent);
    }

    function getURLParams(name, url){
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    };

    function set_cookie(name, value) {
        document.cookie = name +'='+ value +'; Path=/;';
    };

    function get_cookie(name) {
        return document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';
    };

    function get_cookie_startwith(key) {
        var regex = new RegExp('(^|;)\\s*' + key + '\\w*\\s*=\\s*([^;]+)', 'g');
        var matches = document.cookie.matchAll(regex);
        var match = matches.next();
        var values = []
        while(!match.done){
            values.push(match.value[2]);
            match = matches.next();
        }
        return values;
    }

    function delete_cookie(name) {
        document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    };

    __BC__ = {
        pageType: '{{page_type}}',
        categoryName: '{{category.name}}',
        currency: '{{currency_selector.active_currency_code}}',
        analyticsData: window.analyticsData || {},
        cartItems: htmlDecode("{{json cart.items}}"),
        checkoutId: '{{checkout.id}}' || 0,
        orderId: '{{checkout.order.id}}' || 0,
        mainPageAjaxAddButton: false, // set true if the products list has ajax "add to cart" button
    }

    /**
     * Custom configuration should be edit here
     */
    var customBindings = {
        mainPageAddButton: [],
        productPageAddButton: [],
        cartPageRemoveButton: [],
        searchTermQuery: [],
        searchPage: [],
        quickViewModal: [],
        quickViewCartButtonId: [],
        modalHiddenProductId: [],
    };

    var defaultBindings = {
        mainPageAddButton: ["[data-button-type='add-cart']"],
        productPageAddButton: ["#form-action-addToCart"],
        cartPageRemoveButton: [".cart-remove"],
        searchTermQuery: [getURLParams('search_query')],
        searchPage: ['search'],
        quickViewModal: ["#modal"],
        quickViewCartButtonId: ["form-action-addToCart"],
        modalHiddenProductId: ["#modal .productView-details.product-options [name='product_id']"]
    }

    // stitch bindings
    objectArray = customBindings;
    outputObject = __BC__;
    applyBindings = function(objectArray, outputObject){
        for (var x in objectArray) {  
            var key = x;
            var objs = objectArray[x]; 
            values = [];    
            if(objs.length > 0){    
                values.push(objs);
                if(key in outputObject){              
                    values.push(outputObject[key]); 
                    outputObject[key] = values.join(", "); 
                }else{        
                    outputObject[key] = values.join(", ");
                }   
            }  
        }
    };
    applyBindings(customBindings, __BC__);
    applyBindings(defaultBindings, __BC__);



    /*
    Product Event listener
    */

    function addProductEventListeners() {
        var mainPageAddButton    = Czzle(__BC__.mainPageAddButton)    || []; 
        var productPageAddButton = Czzle(__BC__.productPageAddButton) || [];
        var quickViewModal = Czzle(__BC__.quickViewModal) || [];


        // Main Page - Add to Cart click
        if (mainPageAddButton.length > 0) {
            for(var i = 0; i < mainPageAddButton.length; i++) {
                const el = mainPageAddButton[i];
                el.addEventListener('click', (event) => {
                    var index = event.target.href.indexOf('product_id');
                    var productId = event.target.href.slice(index).split('=')[1];
                    onAddToCart(productId, undefined);
                })
            }
        }

        // Product Page - Add to Cart click
        if (productPageAddButton.length > 0) {
            for(var j = 0; j < productPageAddButton.length; j++) {
                const el = productPageAddButton[j];
                el.addEventListener('click', () => {
                    onAddToCart('{{product.id}}', {
                        "product_name": '{{product.title}}', // Name or ID is required.
                        "product_id": '{{product.id}}',
                        "product_price": '{{product.price.without_tax.value}}',
                        "product_category": '{{product.category}}',
                        "product_variant": '{{product.sku}}',
                        "product_sku": '{{product.sku}}'
                    });
                });
            }
        }

        // Remove from Cart click
        setRemoveCartListener();

        if (quickViewModal.length > 0) {
            for(var l = 0; l < quickViewModal.length; l++) {
                const el = quickViewModal[l];
                el.addEventListener('click', (e) => {
                    if(e.target && e.target.id == __BC__.quickViewCartButtonId) {
                        const productId = document.querySelector(__BC__.modalHiddenProductId).value;
                        onAddToCart(productId, undefined);
                    }
                });
            }
        }
    }

    function setRemoveCartListener() {
        var cartPageRemoveButton = Czzle(__BC__.cartPageRemoveButton) || [];

        if (cartPageRemoveButton.length > 0) {
            for(var k = 0; k < cartPageRemoveButton.length; k++) {
                const el = cartPageRemoveButton[k];
                el.addEventListener('click', () => {
                    onRemoveFromCart(el.attributes[1].nodeValue);
                });
            }
        }
    }

    /***
     * Customerlabs default Ecommerce vents
     */

    
    /**
     * Tracks category views
     * 
     * @param {string} categoryName 
     */
    function onCategoryView(categoryName) {
        _cl.pageview("Category viewed", {"customProperties": {"category_name": categoryName}})
    }

    /**
     * Tracks Product views
     */
    function onProductDetailsView() {
        _cl.pageview("Product viewed", {
            "customProperties": {
                "content_type": "product_group",
                "content_category": "{{product.category}}",
                "currency": __BC__.currency
            },
            "productProperties": [{
                "product_name": '{{product.title}}', // Name or ID is required.
                "product_id": '{{product.id}}',
                "product_price": '{{product.price.without_tax.value}}',
                "product_category": '{{product.category}}',
                "product_variant": '{{product.sku}}',
                "product_sku": '{{product.sku}}'
            }]
        })
    }

    /**
     * This function handles cart visits and send it to clabs
     */
    function onViewCart() {
        var products = __BC__.analyticsData.products || __BC__.cartItems || []
        var propertiesToSend = {
            'customProperties': {
                "product_category": "product_group",
                "currency": __BC__.currency
            },
            'productProperties': products.map(function (product) {
                return {
                    "product_name": product.name, // Name or ID is required.
                    "product_id": product.product_id,
                    "product_quantity": product.quantity,
                    "product_price": product.price.value,
                    "product_category": product.category || "",
                    "product_variant": product.sku,
                    "product_sku": product.sku
                }
            })
        };
        _cl.pageview("Cart viewed", propertiesToSend)
    }

    /**
     * This function taks 2 arguments productId and product object
     * If product object present will send added to cart event
     * else this function called from product list with product id
     *         so we add a cookie and wait
     * some times the list product button will be ajax in that time
     * will invoke the function findATCAndSend that will get data from
     * cart and send added to cart event to clabs
     * @param {string} productId
     * @param {object} product
     */
    function onAddToCart(productId, product) {
        if(product){
            propertiesToSend = {
                'customProperties': {
                    "product_category": "product_group",
                    "currency": __BC__.currency
                },
                'productProperties': [product]
            };
            _cl.trackClick("Added to cart", propertiesToSend)
        }else{
            set_cookie("cl_bc_ajax_atc_" + productId, productId);
            if(__BC__.mainPageAjaxAddButton){
                findATCAndSend();
            }
        }
    }

    /**
     * This function handles remove from cart event
     * @param {string} cartItemId 
     */
    function onRemoveFromCart(cartItemId) {
        var products = __BC__.analyticsData.products || __BC__.cartItems || []
        for(var id in products){
            var product = products[id];
            if(product.id == cartItemId){
                var propertiesToSend = {
                    'customProperties': {
                        "product_category": "product_group",
                        "currency": __BC__.currency
                    },
                    'productProperties' : [{
                        "product_id": product.product_id,
                        "product_name": product.name,
                        "product_quantity": product.quantity,
                        "product_sku": product.sku,
                        "product_price": product.price.value,
                    }]
                };
                _cl.trackClick('Removed from cart', propertiesToSend);
            }
        }
    }

    /**
     * This function invoke when a checkout initated
     */
    function onCheckoutStarted() {
        var props = {};
        var analyticsData = __BC__.analyticsData;
        for(var k in analyticsData){
            if(k != "products" && analyticsData[k]){
                props[k] = analyticsData[k];
            }   
        }
        var propertiesToSend = {
            "customProperties": props,
            "productProperties": analyticsData.products
        }
       _cl.pageview("Checkout made", propertiesToSend)
    }

    /**
     * This function is triggered on the order confirmation page
     */
    function onPurchase() {
        var customProps = {};
        var analyticsData = __BC__.analyticsData;
        for(var k in analyticsData){
            if(k != "products"  && k != "billingInfo" && analyticsData[k]){
                customProps[k] = analyticsData[k];
            }   
        }
        
        var propertiesToSend = {
            "customProperties": customProps,
            "productProperties": analyticsData.products
        }
        
        if(analyticsData.order_id && window.localStorage){
            var purchases_str = localStorage.getItem('cl_past_purchases') || "{}";
            var purchases = JSON.parse(purchases_str);
            if(!purchases[""+analyticsData.order_id]){
                _cl.trackClick('Purchased', propertiesToSend);
                purchases[""+analyticsData.order_id] = "true";
                window.localStorage.setItem("cl_past_purchases", JSON.stringify(purchases));
            }
        }else{
            _cl.trackClick('Purchased', propertiesToSend);
        }
        
        if(analyticsData.billingInfo){
            var userAttributes = {};
            var billingInfo = analyticsData.billingInfo;
            if(billingInfo.email){
                for(var k in billingInfo){
                   if(k != "customFields" && billingInfo[k]){
                        userAttributes[k] = {
                           "t": "string",
                           "v": billingInfo[k]
                        };
                   }
                }
                var props = {
                    "customProperties": {
                        "user_traits": {
                            "t": "Object",
                            "v": userAttributes
                        },
                        "identify_by_email": {
                            "t":"string",
                            "v": userAttributes["email"].v,
                            "ib": true
                        }
                    }
                }
                _cl.identify(props)
            }
        }
    }

    function onSearchPage() {
        var customProperties = {
            'search_string': {
                't': 'string',
                'v': __BC__.searchTermQuery
            }
        };
        _cl.pageview("Search made", {"customProperties": customProperties});
    }

    /*
    View cart, Checkout & Purchased events helper
    */

    const mailSelector = document.getElementsByClassName('customerView-body');
    const products = [];

    async function getData(url) {
        const response = await fetch(url, {
            method: 'GET',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.json();
    }

    async function getPurchaseData(callback) {
       if(__BC__.orderId){
           getData(`/api/storefront/order/${__BC__.orderId}`).then((data) => {
                if(data.lineItems.physicalItems.length) {
                    for (const product of data.lineItems.physicalItems) {
                        products.push({
                            product_id: product.productId,
                            product_sku: product.sku,
                            product_name: product.name,
                            product_brand: product.brand,
                            product_price: product.salePrice,
                            product_quantity: product.quantity
                        });
                    }
                    __BC__.analyticsData = {
                        order_id: data.orderId,
                        value: data.orderAmount,
                        revenue: data.orderAmount,
                        shipping: data.shippingCostTotal,
                        tax: data.taxTotal,
                        discount: data.discountAmount,
                        currency: data.currency.code,
                        status: data.status,
                        products: products,
                        billingInfo: data.billingAddress
                    };
                    if(callback){
                        callback();
                    }
                }
           })
       }
    }

    function getCheckoutData(callback) {
        if(__BC__.checkoutId){
            getData(`/api/storefront/checkouts/${__BC__.checkoutId}`).then((data) => {
                if (data.cart && data.cart.lineItems.physicalItems.length) {
                    for (const product of data.cart.lineItems.physicalItems) {
                        products.push({
                            product_id: product.productId,
                            product_sku: product.sku,
                            product_name: product.name,
                            product_brand: product.brand,
                            product_price: product.salePrice,
                            product_quantity: product.quantity
                        });
                    }
                    __BC__.analyticsData = {
                        checkout_id: data.id,
                        order_id: data.orderId,
                        value: data.grandTotal,
                        revenue: data.subtotal,
                        shipping: data.shippingCostTotal,
                        tax: data.taxTotal,
                        discount: data.cart.discountAmount,
                        currency: data.cart.currency.code,
                        products: products,
                    };
                    if(callback){
                        callback();
                    }
                }
            });
    
            if (mailSelector && mailSelector[0]) {
                userEmail = mailSelector[0].innerHTML;
            }
        }
    }

    function findATCAndSend(){
        var pendingList = get_cookie_startwith("cl_bc_ajax_atc_");
        if(pendingList.length > 0){
            getProductAndSend(pendingList);
        }
    }

    function getProductAndSend(productIds) {
        getData(`/api/storefront/carts`).then((data) => {
            var cart = data[0];
            if (cart && cart.lineItems.physicalItems.length) {
                for (const product of cart.lineItems.physicalItems) {
                    if(productIds.includes(""+product.productId)){
                        onAddToCart(product.productId, {
                            "product_name": product.name,
                            "product_id": product.productId,
                            "product_quantity": product.quantity,
                            "product_price": product.salePrice,
                            "product_category": product.category | "",
                            "product_sku": product.sku
                        });
                        delete_cookie("cl_bc_ajax_atc_" + product.productId);
                    }
                }
            }
        });
    }

    function initRemoveFromCartObserver() {
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        function checkChanges(mutations) {
            for (let mutation of mutations) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(element => {
                        if(element.className == "cart"){
                            setRemoveCartListener();
                        }
                    });
                }
            }
        }
        var observer = new MutationObserver(checkChanges);
        var target = document.querySelector(".body")
        observer.observe(target, {childList: true, subtree: true})
    }
    
    
    /*
    BigCommerce Events Manager
    */
   
    addProductEventListeners();
   
    var searchPage = new RegExp(__BC__.searchPage, "g");
    
    findATCAndSend();

    switch (__BC__.pageType) {
        case 'category':
            onCategoryView(__BC__.categoryName);
            break;    
        case 'product':
            onProductDetailsView();
            break;    
        case 'checkout':
            getCheckoutData(onCheckoutStarted);
            break;    
        case 'orderconfirmation':
            getPurchaseData(onPurchase);
            break;    
        case 'cart':
            onViewCart();
            initRemoveFromCartObserver();
            break;    
        default:
            if (__BC__.pageType === 'search' || document.location.pathname.match(searchPage)){
                onSearchPage();
            }
            break;
    }
    
    
}
/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q29udGVudCI6WyIvKiBcclxuICBEYXRhbGF5ZXIgVXRpbHMgXHJcbiovXHJcbndpbmRvdy5jbFNob3BpZnlUcmFjayA9IGZ1bmN0aW9uKCkge1xyXG4gICAgXHJcbiAgICBmdW5jdGlvbiBodG1sRGVjb2RlKGlucHV0KSB7XHJcbiAgICAgICAgaWYgKCFpbnB1dCkgcmV0dXJuICcnO1xyXG4gICAgICAgIHZhciBwYXJzZWRJbnB1dCA9IGlucHV0LnJlcGxhY2UoLyhcXHJcXG58XFxufFxccikvZ20sICcnKTtcclxuICAgICAgICB2YXIgZG9jID0gbmV3IERPTVBhcnNlcigpLnBhcnNlRnJvbVN0cmluZyhwYXJzZWRJbnB1dCwgJ3RleHQvaHRtbCcpO1xyXG4gICAgICAgIHJldHVybiBKU09OLnBhcnNlKGRvYy5kb2N1bWVudEVsZW1lbnQudGV4dENvbnRlbnQpO1xyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIGdldFVSTFBhcmFtcyhuYW1lLCB1cmwpe1xyXG4gICAgICAgIGlmICghdXJsKSB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcclxuICAgICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXFxdXS9nLCBcIlxcXFwkJlwiKTtcclxuICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFwiWz8mXVwiICsgbmFtZSArIFwiKD0oW14mI10qKXwmfCN8JClcIiksXHJcbiAgICAgICAgcmVzdWx0cyA9IHJlZ2V4LmV4ZWModXJsKTtcclxuICAgICAgICBpZiAoIXJlc3VsdHMpIHJldHVybiBudWxsO1xyXG4gICAgICAgIGlmICghcmVzdWx0c1syXSkgcmV0dXJuICcnO1xyXG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1syXS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpKTtcclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gc2V0X2Nvb2tpZShuYW1lLCB2YWx1ZSkge1xyXG4gICAgICAgIGRvY3VtZW50LmNvb2tpZSA9IG5hbWUgKyc9JysgdmFsdWUgKyc7IFBhdGg9LzsnO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRfY29va2llKG5hbWUpIHtcclxuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY29va2llLm1hdGNoKCcoXnw7KVxcXFxzKicgKyBuYW1lICsgJ1xcXFxzKj1cXFxccyooW147XSspJyk/LnBvcCgpIHx8ICcnO1xyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBnZXRfY29va2llX3N0YXJ0d2l0aChrZXkpIHtcclxuICAgICAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKCcoXnw7KVxcXFxzKicgKyBrZXkgKyAnXFxcXHcqXFxcXHMqPVxcXFxzKihbXjtdKyknLCAnZycpO1xyXG4gICAgICAgIHZhciBtYXRjaGVzID0gZG9jdW1lbnQuY29va2llLm1hdGNoQWxsKHJlZ2V4KTtcclxuICAgICAgICB2YXIgbWF0Y2ggPSBtYXRjaGVzLm5leHQoKTtcclxuICAgICAgICB2YXIgdmFsdWVzID0gW11cclxuICAgICAgICB3aGlsZSghbWF0Y2guZG9uZSl7XHJcbiAgICAgICAgICAgIHZhbHVlcy5wdXNoKG1hdGNoLnZhbHVlWzJdKTtcclxuICAgICAgICAgICAgbWF0Y2ggPSBtYXRjaGVzLm5leHQoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBkZWxldGVfY29va2llKG5hbWUpIHtcclxuICAgICAgICBkb2N1bWVudC5jb29raWUgPSBuYW1lICsnPTsgUGF0aD0vOyBFeHBpcmVzPVRodSwgMDEgSmFuIDE5NzAgMDA6MDA6MDEgR01UOyc7XHJcbiAgICB9O1xyXG5cclxuICAgIF9fQkNfXyA9IHtcclxuICAgICAgICBwYWdlVHlwZTogJ3t7cGFnZV90eXBlfX0nLFxyXG4gICAgICAgIGNhdGVnb3J5TmFtZTogJ3t7Y2F0ZWdvcnkubmFtZX19JyxcclxuICAgICAgICBjdXJyZW5jeTogJ3t7Y3VycmVuY3lfc2VsZWN0b3IuYWN0aXZlX2N1cnJlbmN5X2NvZGV9fScsXHJcbiAgICAgICAgYW5hbHl0aWNzRGF0YTogd2luZG93LmFuYWx5dGljc0RhdGEgfHwge30sXHJcbiAgICAgICAgY2FydEl0ZW1zOiBodG1sRGVjb2RlKFwie3tqc29uIGNhcnQuaXRlbXN9fVwiKSxcclxuICAgICAgICBjaGVja291dElkOiAne3tjaGVja291dC5pZH19JyB8fCB1bmRlZmluZWQsXHJcbiAgICAgICAgb3JkZXJJZDogJ3t7Y2hlY2tvdXQub3JkZXIuaWR9fScgfHwgdW5kZWZpbmVkLFxyXG4gICAgICAgIG1haW5QYWdlQWpheEFkZEJ1dHRvbjogZmFsc2UsIC8vIHNldCB0cnVlIGlmIHRoZSBwcm9kdWN0cyBsaXN0IGhhcyBhamF4IFwiYWRkIHRvIGNhcnRcIiBidXR0b25cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEN1c3RvbSBjb25maWd1cmF0aW9uIHNob3VsZCBiZSBlZGl0IGhlcmVcclxuICAgICAqL1xyXG4gICAgdmFyIGN1c3RvbUJpbmRpbmdzID0ge1xyXG4gICAgICAgIG1haW5QYWdlQWRkQnV0dG9uOiBbXSxcclxuICAgICAgICBwcm9kdWN0UGFnZUFkZEJ1dHRvbjogW10sXHJcbiAgICAgICAgY2FydFBhZ2VSZW1vdmVCdXR0b246IFtdLFxyXG4gICAgICAgIHNlYXJjaFRlcm1RdWVyeTogW10sXHJcbiAgICAgICAgc2VhcmNoUGFnZTogW10sXHJcbiAgICAgICAgcXVpY2tWaWV3TW9kYWw6IFtdLFxyXG4gICAgICAgIHF1aWNrVmlld0NhcnRCdXR0b25JZDogW10sXHJcbiAgICAgICAgbW9kYWxIaWRkZW5Qcm9kdWN0SWQ6IFtdLFxyXG4gICAgfTtcclxuXHJcbiAgICB2YXIgZGVmYXVsdEJpbmRpbmdzID0ge1xyXG4gICAgICAgIG1haW5QYWdlQWRkQnV0dG9uOiBbXCJbZGF0YS1idXR0b24tdHlwZT0nYWRkLWNhcnQnXVwiXSxcclxuICAgICAgICBwcm9kdWN0UGFnZUFkZEJ1dHRvbjogW1wiI2Zvcm0tYWN0aW9uLWFkZFRvQ2FydFwiXSxcclxuICAgICAgICBjYXJ0UGFnZVJlbW92ZUJ1dHRvbjogW1wiLmNhcnQtcmVtb3ZlXCJdLFxyXG4gICAgICAgIHNlYXJjaFRlcm1RdWVyeTogW2dldFVSTFBhcmFtcygnc2VhcmNoX3F1ZXJ5JyldLFxyXG4gICAgICAgIHNlYXJjaFBhZ2U6IFsnc2VhcmNoJ10sXHJcbiAgICAgICAgcXVpY2tWaWV3TW9kYWw6IFtcIiNtb2RhbFwiXSxcclxuICAgICAgICBxdWlja1ZpZXdDYXJ0QnV0dG9uSWQ6IFtcImZvcm0tYWN0aW9uLWFkZFRvQ2FydFwiXSxcclxuICAgICAgICBtb2RhbEhpZGRlblByb2R1Y3RJZDogW1wiI21vZGFsIC5wcm9kdWN0Vmlldy1kZXRhaWxzLnByb2R1Y3Qtb3B0aW9ucyBbbmFtZT0ncHJvZHVjdF9pZCddXCJdXHJcbiAgICB9XHJcblxyXG4gICAgLy8gc3RpdGNoIGJpbmRpbmdzXHJcbiAgICBvYmplY3RBcnJheSA9IGN1c3RvbUJpbmRpbmdzO1xyXG4gICAgb3V0cHV0T2JqZWN0ID0gX19CQ19fO1xyXG4gICAgYXBwbHlCaW5kaW5ncyA9IGZ1bmN0aW9uKG9iamVjdEFycmF5LCBvdXRwdXRPYmplY3Qpe1xyXG4gICAgICAgIGZvciAodmFyIHggaW4gb2JqZWN0QXJyYXkpIHsgIFxyXG4gICAgICAgICAgICB2YXIga2V5ID0geDtcclxuICAgICAgICAgICAgdmFyIG9ianMgPSBvYmplY3RBcnJheVt4XTsgXHJcbiAgICAgICAgICAgIHZhbHVlcyA9IFtdOyAgICBcclxuICAgICAgICAgICAgaWYob2Jqcy5sZW5ndGggPiAwKXsgICAgXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaChvYmpzKTtcclxuICAgICAgICAgICAgICAgIGlmKGtleSBpbiBvdXRwdXRPYmplY3QpeyAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnB1c2gob3V0cHV0T2JqZWN0W2tleV0pOyBcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRPYmplY3Rba2V5XSA9IHZhbHVlcy5qb2luKFwiLCBcIik7IFxyXG4gICAgICAgICAgICAgICAgfWVsc2V7ICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRPYmplY3Rba2V5XSA9IHZhbHVlcy5qb2luKFwiLCBcIik7XHJcbiAgICAgICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgICAgIH0gIFxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBhcHBseUJpbmRpbmdzKGN1c3RvbUJpbmRpbmdzLCBfX0JDX18pO1xyXG4gICAgYXBwbHlCaW5kaW5ncyhkZWZhdWx0QmluZGluZ3MsIF9fQkNfXyk7XHJcblxyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgUHJvZHVjdCBFdmVudCBsaXN0ZW5lclxyXG4gICAgKi9cclxuXHJcbiAgICBmdW5jdGlvbiBhZGRQcm9kdWN0RXZlbnRMaXN0ZW5lcnMoKSB7XHJcbiAgICAgICAgdmFyIG1haW5QYWdlQWRkQnV0dG9uICAgID0gQ3p6bGUoX19CQ19fLm1haW5QYWdlQWRkQnV0dG9uKSAgICB8fCBbXTsgXHJcbiAgICAgICAgdmFyIHByb2R1Y3RQYWdlQWRkQnV0dG9uID0gQ3p6bGUoX19CQ19fLnByb2R1Y3RQYWdlQWRkQnV0dG9uKSB8fCBbXTtcclxuICAgICAgICB2YXIgcXVpY2tWaWV3TW9kYWwgPSBDenpsZShfX0JDX18ucXVpY2tWaWV3TW9kYWwpIHx8IFtdO1xyXG5cclxuXHJcbiAgICAgICAgLy8gTWFpbiBQYWdlIC0gQWRkIHRvIENhcnQgY2xpY2tcclxuICAgICAgICBpZiAobWFpblBhZ2VBZGRCdXR0b24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgbWFpblBhZ2VBZGRCdXR0b24ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gbWFpblBhZ2VBZGRCdXR0b25baV07XHJcbiAgICAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGV2ZW50LnRhcmdldC5ocmVmLmluZGV4T2YoJ3Byb2R1Y3RfaWQnKTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvZHVjdElkID0gZXZlbnQudGFyZ2V0LmhyZWYuc2xpY2UoaW5kZXgpLnNwbGl0KCc9JylbMV07XHJcbiAgICAgICAgICAgICAgICAgICAgb25BZGRUb0NhcnQocHJvZHVjdElkLCB1bmRlZmluZWQpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHJvZHVjdCBQYWdlIC0gQWRkIHRvIENhcnQgY2xpY2tcclxuICAgICAgICBpZiAocHJvZHVjdFBhZ2VBZGRCdXR0b24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBmb3IodmFyIGogPSAwOyBqIDwgcHJvZHVjdFBhZ2VBZGRCdXR0b24ubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gcHJvZHVjdFBhZ2VBZGRCdXR0b25bal07XHJcbiAgICAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBvbkFkZFRvQ2FydCgne3twcm9kdWN0LmlkfX0nLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9uYW1lXCI6ICd7e3Byb2R1Y3QudGl0bGV9fScsIC8vIE5hbWUgb3IgSUQgaXMgcmVxdWlyZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9pZFwiOiAne3twcm9kdWN0LmlkfX0nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfcHJpY2VcIjogJ3t7cHJvZHVjdC5wcmljZS53aXRob3V0X3RheC52YWx1ZX19JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2NhdGVnb3J5XCI6ICd7e3Byb2R1Y3QuY2F0ZWdvcnl9fScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF92YXJpYW50XCI6ICd7e3Byb2R1Y3Quc2t1fX0nLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3Rfc2t1XCI6ICd7e3Byb2R1Y3Quc2t1fX0nXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUmVtb3ZlIGZyb20gQ2FydCBjbGlja1xyXG4gICAgICAgIHNldFJlbW92ZUNhcnRMaXN0ZW5lcigpO1xyXG5cclxuICAgICAgICBpZiAocXVpY2tWaWV3TW9kYWwubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBmb3IodmFyIGwgPSAwOyBsIDwgcXVpY2tWaWV3TW9kYWwubGVuZ3RoOyBsKyspIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsID0gcXVpY2tWaWV3TW9kYWxbbF07XHJcbiAgICAgICAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZS50YXJnZXQgJiYgZS50YXJnZXQuaWQgPT0gX19CQ19fLnF1aWNrVmlld0NhcnRCdXR0b25JZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9kdWN0SWQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKF9fQkNfXy5tb2RhbEhpZGRlblByb2R1Y3RJZCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQWRkVG9DYXJ0KHByb2R1Y3RJZCwgdW5kZWZpbmVkKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBzZXRSZW1vdmVDYXJ0TGlzdGVuZXIoKSB7XHJcbiAgICAgICAgdmFyIGNhcnRQYWdlUmVtb3ZlQnV0dG9uID0gQ3p6bGUoX19CQ19fLmNhcnRQYWdlUmVtb3ZlQnV0dG9uKSB8fCBbXTtcclxuXHJcbiAgICAgICAgaWYgKGNhcnRQYWdlUmVtb3ZlQnV0dG9uLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgZm9yKHZhciBrID0gMDsgayA8IGNhcnRQYWdlUmVtb3ZlQnV0dG9uLmxlbmd0aDsgaysrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbCA9IGNhcnRQYWdlUmVtb3ZlQnV0dG9uW2tdO1xyXG4gICAgICAgICAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgb25SZW1vdmVGcm9tQ2FydChlbC5hdHRyaWJ1dGVzWzFdLm5vZGVWYWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKioqXHJcbiAgICAgKiBDdXN0b21lcmxhYnMgZGVmYXVsdCBFY29tbWVyY2UgdmVudHNcclxuICAgICAqL1xyXG5cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBUcmFja3MgY2F0ZWdvcnkgdmlld3NcclxuICAgICAqIFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNhdGVnb3J5TmFtZSBcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gb25DYXRlZ29yeVZpZXcoY2F0ZWdvcnlOYW1lKSB7XHJcbiAgICAgICAgX2NsLnBhZ2V2aWV3KFwiQ2F0ZWdvcnkgdmlld2VkXCIsIHtcImN1c3RvbVByb3BlcnRpZXNcIjoge1wiY2F0ZWdvcnlfbmFtZVwiOiBjYXRlZ29yeU5hbWV9fSlcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRyYWNrcyBQcm9kdWN0IHZpZXdzXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG9uUHJvZHVjdERldGFpbHNWaWV3KCkge1xyXG4gICAgICAgIF9jbC5wYWdldmlldyhcIlByb2R1Y3Qgdmlld2VkXCIsIHtcclxuICAgICAgICAgICAgXCJjdXN0b21Qcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICAgICAgICAgIFwiY29udGVudF90eXBlXCI6IFwicHJvZHVjdF9ncm91cFwiLFxyXG4gICAgICAgICAgICAgICAgXCJjb250ZW50X2NhdGVnb3J5XCI6IFwie3twcm9kdWN0LmNhdGVnb3J5fX1cIixcclxuICAgICAgICAgICAgICAgIFwiY3VycmVuY3lcIjogX19CQ19fLmN1cnJlbmN5XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwicHJvZHVjdFByb3BlcnRpZXNcIjogW3tcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9uYW1lXCI6ICd7e3Byb2R1Y3QudGl0bGV9fScsIC8vIE5hbWUgb3IgSUQgaXMgcmVxdWlyZWQuXHJcbiAgICAgICAgICAgICAgICBcInByb2R1Y3RfaWRcIjogJ3t7cHJvZHVjdC5pZH19JyxcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9wcmljZVwiOiAne3twcm9kdWN0LnByaWNlLndpdGhvdXRfdGF4LnZhbHVlfX0nLFxyXG4gICAgICAgICAgICAgICAgXCJwcm9kdWN0X2NhdGVnb3J5XCI6ICd7e3Byb2R1Y3QuY2F0ZWdvcnl9fScsXHJcbiAgICAgICAgICAgICAgICBcInByb2R1Y3RfdmFyaWFudFwiOiAne3twcm9kdWN0LnNrdX19JyxcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9za3VcIjogJ3t7cHJvZHVjdC5za3V9fSdcclxuICAgICAgICAgICAgfV1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBmdW5jdGlvbiBoYW5kbGVzIGNhcnQgdmlzaXRzIGFuZCBzZW5kIGl0IHRvIGNsYWJzXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG9uVmlld0NhcnQoKSB7XHJcbiAgICAgICAgdmFyIHByb2R1Y3RzID0gX19CQ19fLmFuYWx5dGljc0RhdGEucHJvZHVjdHMgfHwgX19CQ19fLmNhcnRJdGVtcyB8fCBbXVxyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzVG9TZW5kID0ge1xyXG4gICAgICAgICAgICAnY3VzdG9tUHJvcGVydGllcyc6IHtcclxuICAgICAgICAgICAgICAgIFwicHJvZHVjdF9jYXRlZ29yeVwiOiBcInByb2R1Y3RfZ3JvdXBcIixcclxuICAgICAgICAgICAgICAgIFwiY3VycmVuY3lcIjogX19CQ19fLmN1cnJlbmN5XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICdwcm9kdWN0UHJvcGVydGllcyc6IHByb2R1Y3RzLm1hcChmdW5jdGlvbiAocHJvZHVjdCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfbmFtZVwiOiBwcm9kdWN0Lm5hbWUsIC8vIE5hbWUgb3IgSUQgaXMgcmVxdWlyZWQuXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2lkXCI6IHByb2R1Y3QucHJvZHVjdF9pZCxcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfcXVhbnRpdHlcIjogcHJvZHVjdC5xdWFudGl0eSxcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfcHJpY2VcIjogcHJvZHVjdC5wcmljZS52YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfY2F0ZWdvcnlcIjogcHJvZHVjdC5jYXRlZ29yeSB8fCBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF92YXJpYW50XCI6IHByb2R1Y3Quc2t1LFxyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9za3VcIjogcHJvZHVjdC5za3VcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9O1xyXG4gICAgICAgIF9jbC5wYWdldmlldyhcIkNhcnQgdmlld2VkXCIsIHByb3BlcnRpZXNUb1NlbmQpXHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIHRha3MgMiBhcmd1bWVudHMgcHJvZHVjdElkIGFuZCBwcm9kdWN0IG9iamVjdFxyXG4gICAgICogSWYgcHJvZHVjdCBvYmplY3QgcHJlc2VudCB3aWxsIHNlbmQgYWRkZWQgdG8gY2FydCBldmVudFxyXG4gICAgICogZWxzZSB0aGlzIGZ1bmN0aW9uIGNhbGxlZCBmcm9tIHByb2R1Y3QgbGlzdCB3aXRoIHByb2R1Y3QgaWRcclxuICAgICAqICAgICAgICAgc28gd2UgYWRkIGEgY29va2llIGFuZCB3YWl0XHJcbiAgICAgKiBzb21lIHRpbWVzIHRoZSBsaXN0IHByb2R1Y3QgYnV0dG9uIHdpbGwgYmUgYWpheCBpbiB0aGF0IHRpbWVcclxuICAgICAqIHdpbGwgaW52b2tlIHRoZSBmdW5jdGlvbiBmaW5kQVRDQW5kU2VuZCB0aGF0IHdpbGwgZ2V0IGRhdGEgZnJvbVxyXG4gICAgICogY2FydCBhbmQgc2VuZCBhZGRlZCB0byBjYXJ0IGV2ZW50IHRvIGNsYWJzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcHJvZHVjdElkXHJcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gcHJvZHVjdFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBvbkFkZFRvQ2FydChwcm9kdWN0SWQsIHByb2R1Y3QpIHtcclxuICAgICAgICBpZihwcm9kdWN0KXtcclxuICAgICAgICAgICAgcHJvcGVydGllc1RvU2VuZCA9IHtcclxuICAgICAgICAgICAgICAgICdjdXN0b21Qcm9wZXJ0aWVzJzoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9jYXRlZ29yeVwiOiBcInByb2R1Y3RfZ3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICBcImN1cnJlbmN5XCI6IF9fQkNfXy5jdXJyZW5jeVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICdwcm9kdWN0UHJvcGVydGllcyc6IFtwcm9kdWN0XVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBfY2wudHJhY2tDbGljayhcIkFkZGVkIHRvIGNhcnRcIiwgcHJvcGVydGllc1RvU2VuZClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgc2V0X2Nvb2tpZShcImNsX2JjX2FqYXhfYXRjX1wiICsgcHJvZHVjdElkLCBwcm9kdWN0SWQpO1xyXG4gICAgICAgICAgICBpZihfX0JDX18ubWFpblBhZ2VBamF4QWRkQnV0dG9uKXtcclxuICAgICAgICAgICAgICAgIGZpbmRBVENBbmRTZW5kKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGhhbmRsZXMgcmVtb3ZlIGZyb20gY2FydCBldmVudFxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGNhcnRJdGVtSWQgXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIG9uUmVtb3ZlRnJvbUNhcnQoY2FydEl0ZW1JZCkge1xyXG4gICAgICAgIHZhciBwcm9kdWN0cyA9IF9fQkNfXy5hbmFseXRpY3NEYXRhLnByb2R1Y3RzIHx8IF9fQkNfXy5jYXJ0SXRlbXMgfHwgW11cclxuICAgICAgICBmb3IodmFyIGlkIGluIHByb2R1Y3RzKXtcclxuICAgICAgICAgICAgdmFyIHByb2R1Y3QgPSBwcm9kdWN0c1tpZF07XHJcbiAgICAgICAgICAgIGlmKHByb2R1Y3QuaWQgPT0gY2FydEl0ZW1JZCl7XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydGllc1RvU2VuZCA9IHtcclxuICAgICAgICAgICAgICAgICAgICAnY3VzdG9tUHJvcGVydGllcyc6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2NhdGVnb3J5XCI6IFwicHJvZHVjdF9ncm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImN1cnJlbmN5XCI6IF9fQkNfXy5jdXJyZW5jeVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgJ3Byb2R1Y3RQcm9wZXJ0aWVzJyA6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9pZFwiOiBwcm9kdWN0LnByb2R1Y3RfaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9uYW1lXCI6IHByb2R1Y3QubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3F1YW50aXR5XCI6IHByb2R1Y3QucXVhbnRpdHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9za3VcIjogcHJvZHVjdC5za3UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwicHJvZHVjdF9wcmljZVwiOiBwcm9kdWN0LnByaWNlLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIH1dXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgX2NsLnRyYWNrQ2xpY2soJ1JlbW92ZWQgZnJvbSBjYXJ0JywgcHJvcGVydGllc1RvU2VuZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIGZ1bmN0aW9uIGludm9rZSB3aGVuIGEgY2hlY2tvdXQgaW5pdGF0ZWRcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gb25DaGVja291dFN0YXJ0ZWQoKSB7XHJcbiAgICAgICAgdmFyIHByb3BzID0ge307XHJcbiAgICAgICAgdmFyIGFuYWx5dGljc0RhdGEgPSBfX0JDX18uYW5hbHl0aWNzRGF0YTtcclxuICAgICAgICBmb3IodmFyIGsgaW4gYW5hbHl0aWNzRGF0YSl7XHJcbiAgICAgICAgICAgIGlmKGsgIT0gXCJwcm9kdWN0c1wiICYmIGFuYWx5dGljc0RhdGFba10pe1xyXG4gICAgICAgICAgICAgICAgcHJvcHNba10gPSBhbmFseXRpY3NEYXRhW2tdO1xyXG4gICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzVG9TZW5kID0ge1xyXG4gICAgICAgICAgICBcImN1c3RvbVByb3BlcnRpZXNcIjogcHJvcHMsXHJcbiAgICAgICAgICAgIFwicHJvZHVjdFByb3BlcnRpZXNcIjogYW5hbHl0aWNzRGF0YS5wcm9kdWN0c1xyXG4gICAgICAgIH1cclxuICAgICAgIF9jbC5wYWdldmlldyhcIkNoZWNrb3V0IG1hZGVcIiwgcHJvcGVydGllc1RvU2VuZClcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgZnVuY3Rpb24gaXMgdHJpZ2dlcmVkIG9uIHRoZSBvcmRlciBjb25maXJtYXRpb24gcGFnZVxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBvblB1cmNoYXNlKCkge1xyXG4gICAgICAgIHZhciBjdXN0b21Qcm9wcyA9IHt9O1xyXG4gICAgICAgIHZhciBhbmFseXRpY3NEYXRhID0gX19CQ19fLmFuYWx5dGljc0RhdGE7XHJcbiAgICAgICAgZm9yKHZhciBrIGluIGFuYWx5dGljc0RhdGEpe1xyXG4gICAgICAgICAgICBpZihrICE9IFwicHJvZHVjdHNcIiAgJiYgayAhPSBcImJpbGxpbmdJbmZvXCIgJiYgYW5hbHl0aWNzRGF0YVtrXSl7XHJcbiAgICAgICAgICAgICAgICBjdXN0b21Qcm9wc1trXSA9IGFuYWx5dGljc0RhdGFba107XHJcbiAgICAgICAgICAgIH0gICBcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHByb3BlcnRpZXNUb1NlbmQgPSB7XHJcbiAgICAgICAgICAgIFwiY3VzdG9tUHJvcGVydGllc1wiOiBjdXN0b21Qcm9wcyxcclxuICAgICAgICAgICAgXCJwcm9kdWN0UHJvcGVydGllc1wiOiBhbmFseXRpY3NEYXRhLnByb2R1Y3RzXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGFuYWx5dGljc0RhdGEub3JkZXJfaWQgJiYgd2luZG93LmxvY2FsU3RvcmFnZSl7XHJcbiAgICAgICAgICAgIHZhciBwdXJjaGFzZXNfc3RyID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2NsX3Bhc3RfcHVyY2hhc2VzJykgfHwgXCJ7fVwiO1xyXG4gICAgICAgICAgICB2YXIgcHVyY2hhc2VzID0gSlNPTi5wYXJzZShwdXJjaGFzZXNfc3RyKTtcclxuICAgICAgICAgICAgaWYoIXB1cmNoYXNlc1tcIlwiK2FuYWx5dGljc0RhdGEub3JkZXJfaWRdKXtcclxuICAgICAgICAgICAgICAgIF9jbC50cmFja0NsaWNrKCdQdXJjaGFzZWQnLCBwcm9wZXJ0aWVzVG9TZW5kKTtcclxuICAgICAgICAgICAgICAgIHB1cmNoYXNlc1tcIlwiK2FuYWx5dGljc0RhdGEub3JkZXJfaWRdID0gXCJ0cnVlXCI7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJjbF9wYXN0X3B1cmNoYXNlc1wiLCBKU09OLnN0cmluZ2lmeShwdXJjaGFzZXMpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBfY2wudHJhY2tDbGljaygnUHVyY2hhc2VkJywgcHJvcGVydGllc1RvU2VuZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGFuYWx5dGljc0RhdGEuYmlsbGluZ0luZm8pe1xyXG4gICAgICAgICAgICB2YXIgdXNlckF0dHJpYnV0ZXMgPSB7fTtcclxuICAgICAgICAgICAgdmFyIGJpbGxpbmdJbmZvID0gYW5hbHl0aWNzRGF0YS5iaWxsaW5nSW5mbztcclxuICAgICAgICAgICAgaWYoYmlsbGluZ0luZm8uZW1haWwpe1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBrIGluIGJpbGxpbmdJbmZvKXtcclxuICAgICAgICAgICAgICAgICAgIGlmKGsgIT0gXCJjdXN0b21GaWVsZHNcIiAmJiBiaWxsaW5nSW5mb1trXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJBdHRyaWJ1dGVzW2tdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBcInRcIjogXCJzdHJpbmdcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJ2XCI6IGJpbGxpbmdJbmZvW2tdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcHMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJjdXN0b21Qcm9wZXJ0aWVzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1c2VyX3RyYWl0c1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInRcIjogXCJPYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidlwiOiB1c2VyQXR0cmlidXRlc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImlkZW50aWZ5X2J5X2VtYWlsXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidFwiOlwic3RyaW5nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInZcIjogdXNlckF0dHJpYnV0ZXNbXCJlbWFpbFwiXS52LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpYlwiOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBfY2wuaWRlbnRpZnkocHJvcHMpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gb25TZWFyY2hQYWdlKCkge1xyXG4gICAgICAgIHZhciBjdXN0b21Qcm9wZXJ0aWVzID0ge1xyXG4gICAgICAgICAgICAnc2VhcmNoX3N0cmluZyc6IHtcclxuICAgICAgICAgICAgICAgICd0JzogJ3N0cmluZycsXHJcbiAgICAgICAgICAgICAgICAndic6IF9fQkNfXy5zZWFyY2hUZXJtUXVlcnlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgX2NsLnBhZ2V2aWV3KFwiU2VhcmNoIG1hZGVcIiwge1wiY3VzdG9tUHJvcGVydGllc1wiOiBjdXN0b21Qcm9wZXJ0aWVzfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgIFZpZXcgY2FydCwgQ2hlY2tvdXQgJiBQdXJjaGFzZWQgZXZlbnRzIGhlbHBlclxyXG4gICAgKi9cclxuXHJcbiAgICBjb25zdCBtYWlsU2VsZWN0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdjdXN0b21lclZpZXctYm9keScpO1xyXG4gICAgY29uc3QgcHJvZHVjdHMgPSBbXTtcclxuXHJcbiAgICBhc3luYyBmdW5jdGlvbiBnZXREYXRhKHVybCkge1xyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2godXJsLCB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgICAgIGNhY2hlOiAnbm8tY2FjaGUnLFxyXG4gICAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZnVuY3Rpb24gZ2V0UHVyY2hhc2VEYXRhKGNhbGxiYWNrKSB7XHJcbiAgICAgICBpZihfX0JDX18ub3JkZXJJZCl7XHJcbiAgICAgICAgICAgZ2V0RGF0YShgL2FwaS9zdG9yZWZyb250L29yZGVyLyR7X19CQ19fLm9yZGVySWR9YCkudGhlbigoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YS5saW5lSXRlbXMucGh5c2ljYWxJdGVtcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2R1Y3Qgb2YgZGF0YS5saW5lSXRlbXMucGh5c2ljYWxJdGVtcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0cy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfaWQ6IHByb2R1Y3QucHJvZHVjdElkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9za3U6IHByb2R1Y3Quc2t1LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9uYW1lOiBwcm9kdWN0Lm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X2JyYW5kOiBwcm9kdWN0LmJyYW5kLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9wcmljZTogcHJvZHVjdC5zYWxlUHJpY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X3F1YW50aXR5OiBwcm9kdWN0LnF1YW50aXR5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBfX0JDX18uYW5hbHl0aWNzRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3JkZXJfaWQ6IGRhdGEub3JkZXJJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGRhdGEub3JkZXJBbW91bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldmVudWU6IGRhdGEub3JkZXJBbW91bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoaXBwaW5nOiBkYXRhLnNoaXBwaW5nQ29zdFRvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXg6IGRhdGEudGF4VG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdW50OiBkYXRhLmRpc2NvdW50QW1vdW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW5jeTogZGF0YS5jdXJyZW5jeS5jb2RlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGRhdGEuc3RhdHVzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0czogcHJvZHVjdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJpbGxpbmdJbmZvOiBkYXRhLmJpbGxpbmdBZGRyZXNzXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICBpZihjYWxsYmFjayl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH0pXHJcbiAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZ2V0Q2hlY2tvdXREYXRhKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgaWYoX19CQ19fLmNoZWNrb3V0SWQpe1xyXG4gICAgICAgICAgICBnZXREYXRhKGAvYXBpL3N0b3JlZnJvbnQvY2hlY2tvdXRzLyR7X19CQ19fLmNoZWNrb3V0SWR9YCkudGhlbigoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuY2FydCAmJiBkYXRhLmNhcnQubGluZUl0ZW1zLnBoeXNpY2FsSXRlbXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBwcm9kdWN0IG9mIGRhdGEuY2FydC5saW5lSXRlbXMucGh5c2ljYWxJdGVtcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0cy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2R1Y3RfaWQ6IHByb2R1Y3QucHJvZHVjdElkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9za3U6IHByb2R1Y3Quc2t1LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9uYW1lOiBwcm9kdWN0Lm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X2JyYW5kOiBwcm9kdWN0LmJyYW5kLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdF9wcmljZTogcHJvZHVjdC5zYWxlUHJpY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0X3F1YW50aXR5OiBwcm9kdWN0LnF1YW50aXR5XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBfX0JDX18uYW5hbHl0aWNzRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tvdXRfaWQ6IGRhdGEuaWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9yZGVyX2lkOiBkYXRhLm9yZGVySWQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBkYXRhLmdyYW5kVG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldmVudWU6IGRhdGEuc3VidG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNoaXBwaW5nOiBkYXRhLnNoaXBwaW5nQ29zdFRvdGFsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YXg6IGRhdGEudGF4VG90YWwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc2NvdW50OiBkYXRhLmNhcnQuZGlzY291bnRBbW91bnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbmN5OiBkYXRhLmNhcnQuY3VycmVuY3kuY29kZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdHM6IHByb2R1Y3RzLFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoY2FsbGJhY2spe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICBcclxuICAgICAgICAgICAgaWYgKG1haWxTZWxlY3RvciAmJiBtYWlsU2VsZWN0b3JbMF0pIHtcclxuICAgICAgICAgICAgICAgIHVzZXJFbWFpbCA9IG1haWxTZWxlY3RvclswXS5pbm5lckhUTUw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gZmluZEFUQ0FuZFNlbmQoKXtcclxuICAgICAgICB2YXIgcGVuZGluZ0xpc3QgPSBnZXRfY29va2llX3N0YXJ0d2l0aChcImNsX2JjX2FqYXhfYXRjX1wiKTtcclxuICAgICAgICBpZihwZW5kaW5nTGlzdC5sZW5ndGggPiAwKXtcclxuICAgICAgICAgICAgZ2V0UHJvZHVjdEFuZFNlbmQocGVuZGluZ0xpc3QpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBnZXRQcm9kdWN0QW5kU2VuZChwcm9kdWN0SWRzKSB7XHJcbiAgICAgICAgZ2V0RGF0YShgL2FwaS9zdG9yZWZyb250L2NhcnRzYCkudGhlbigoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgY2FydCA9IGRhdGFbMF07XHJcbiAgICAgICAgICAgIGlmIChjYXJ0ICYmIGNhcnQubGluZUl0ZW1zLnBoeXNpY2FsSXRlbXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IHByb2R1Y3Qgb2YgY2FydC5saW5lSXRlbXMucGh5c2ljYWxJdGVtcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKHByb2R1Y3RJZHMuaW5jbHVkZXMoXCJcIitwcm9kdWN0LnByb2R1Y3RJZCkpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkFkZFRvQ2FydChwcm9kdWN0LnByb2R1Y3RJZCwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X25hbWVcIjogcHJvZHVjdC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X2lkXCI6IHByb2R1Y3QucHJvZHVjdElkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJwcm9kdWN0X3F1YW50aXR5XCI6IHByb2R1Y3QucXVhbnRpdHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfcHJpY2VcIjogcHJvZHVjdC5zYWxlUHJpY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3RfY2F0ZWdvcnlcIjogcHJvZHVjdC5jYXRlZ29yeSB8IFwiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInByb2R1Y3Rfc2t1XCI6IHByb2R1Y3Quc2t1XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGVfY29va2llKFwiY2xfYmNfYWpheF9hdGNfXCIgKyBwcm9kdWN0LnByb2R1Y3RJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gaW5pdFJlbW92ZUZyb21DYXJ0T2JzZXJ2ZXIoKSB7XHJcbiAgICAgICAgdmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSB3aW5kb3cuTXV0YXRpb25PYnNlcnZlciB8fCB3aW5kb3cuV2ViS2l0TXV0YXRpb25PYnNlcnZlcjtcclxuICAgICAgICBmdW5jdGlvbiBjaGVja0NoYW5nZXMobXV0YXRpb25zKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IG11dGF0aW9uIG9mIG11dGF0aW9ucykge1xyXG4gICAgICAgICAgICAgICAgaWYgKG11dGF0aW9uLnR5cGUgPT09ICdjaGlsZExpc3QnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbXV0YXRpb24uYWRkZWROb2Rlcy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihlbGVtZW50LmNsYXNzTmFtZSA9PSBcImNhcnRcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRSZW1vdmVDYXJ0TGlzdGVuZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGNoZWNrQ2hhbmdlcyk7XHJcbiAgICAgICAgdmFyIHRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuYm9keVwiKVxyXG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUodGFyZ2V0LCB7Y2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICAvKlxyXG4gICAgQmlnQ29tbWVyY2UgRXZlbnRzIE1hbmFnZXJcclxuICAgICovXHJcbiAgIFxyXG4gICAgYWRkUHJvZHVjdEV2ZW50TGlzdGVuZXJzKCk7XHJcbiAgIFxyXG4gICAgdmFyIHNlYXJjaFBhZ2UgPSBuZXcgUmVnRXhwKF9fQkNfXy5zZWFyY2hQYWdlLCBcImdcIik7XHJcbiAgICBcclxuICAgIGZpbmRBVENBbmRTZW5kKCk7XHJcblxyXG4gICAgc3dpdGNoIChfX0JDX18ucGFnZVR5cGUpIHtcclxuICAgICAgICBjYXNlICdjYXRlZ29yeSc6XHJcbiAgICAgICAgICAgIG9uQ2F0ZWdvcnlWaWV3KF9fQkNfXy5jYXRlZ29yeU5hbWUpO1xyXG4gICAgICAgICAgICBicmVhazsgICAgXHJcbiAgICAgICAgY2FzZSAncHJvZHVjdCc6XHJcbiAgICAgICAgICAgIG9uUHJvZHVjdERldGFpbHNWaWV3KCk7XHJcbiAgICAgICAgICAgIGJyZWFrOyAgICBcclxuICAgICAgICBjYXNlICdjaGVja291dCc6XHJcbiAgICAgICAgICAgIGdldENoZWNrb3V0RGF0YShvbkNoZWNrb3V0U3RhcnRlZCk7XHJcbiAgICAgICAgICAgIGJyZWFrOyAgICBcclxuICAgICAgICBjYXNlICdvcmRlcmNvbmZpcm1hdGlvbic6XHJcbiAgICAgICAgICAgIGdldFB1cmNoYXNlRGF0YShvblB1cmNoYXNlKTtcclxuICAgICAgICAgICAgYnJlYWs7ICAgIFxyXG4gICAgICAgIGNhc2UgJ2NhcnQnOlxyXG4gICAgICAgICAgICBvblZpZXdDYXJ0KCk7XHJcbiAgICAgICAgICAgIGluaXRSZW1vdmVGcm9tQ2FydE9ic2VydmVyKCk7XHJcbiAgICAgICAgICAgIGJyZWFrOyAgICBcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBpZiAoX19CQ19fLnBhZ2VUeXBlID09PSAnc2VhcmNoJyB8fCBkb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZS5tYXRjaChzZWFyY2hQYWdlKSl7XHJcbiAgICAgICAgICAgICAgICBvblNlYXJjaFBhZ2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbn0iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=