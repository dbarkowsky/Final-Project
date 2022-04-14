/*****************************************************************/
/************************* Classes *******************************/
/*****************************************************************/

//Easy object to hold json pointers
class JSONHolder {
    _products;
    _currencies;

    get products(){
        return this._products;
    }

    get currencies(){
        return this._currencies;
    }

    set products(pointer){
        this._products = pointer;
    }

    set currencies(pointer){
        this._currencies = pointer;
    }

    getItem(id) {
        for (let x in this.products){
            if (this.products[x].id == id)
                return this.products[x];
        }
    }
}

//Class that represents the cart and does cart functions
class Cart {
    _cartList;
    _totalPrice;
    _orderData;

    constructor(){
        this._cartList = [];
        this._totalPrice = 0;
    }

    get cartList(){
        return this._cartList;
    }

    get totalPrice(){
        return this._totalPrice;
    }

    get orderData(){
        return this._orderData;
    }

    set totalPrice(value){
        this._totalPrice = value;
    }

    set orderData(jsonObject){
        this._orderData = jsonObject;
    }

    set cartList(list){
        this._cartList = list;
    }

    addEntry(item){
        this._cartList.push(item);
    }

    removeEntry(id){
        for (let i = 0; i < this.cartList.length; i++){
            if (this.cartList[i].item.id == id){
                this.cartList.splice(i,1);
                i--; //because an element has been removed...
            }
        }
    }

    //Calculates total value of cart before tax, etc. In CAD
    calculateTotal(){
        let tempTotal = 0;
        for (let x in this.cartList){
            tempTotal += parseFloat(this.cartList[x].sum);
        }
        this.totalPrice = parseFloat(tempTotal).toFixed(2);
    }

    //Calculates total number of items in cart and returns value
    calculateTotalQuantity(){
        let tempTotal = 0;
        for (let x in this.cartList){
            tempTotal += parseFloat(this.cartList[x].quantity);
        }
        return tempTotal;
    }

    //Checks if an entry already exists; returns a boolean
    entryExists(tempEntry){
        for (let entry in this.cartList){
            if (this.cartList[entry].id == tempEntry.id){
                return true;
            }
        }
        return false;
    }

    //Finds an entry and increments its quantity
    incrementEntry(id){
        for (let entry in this.cartList){
            if (this.cartList[entry].id == id){
                this.cartList[entry].increaseQuantity();
                $(`.cart-box[id="${id}"]`).closest(".quantity").html = `$${this.cartList[entry].sum}`;
                this.cartList[entry].calculateSum();
            }
        }
    }

    //Emptys the cart
    empty(){
        this._cartList = [];
        drawCart();
    }

    //Checks for an empty cart
    isEmpty(){
        if (this._cartList.length < 1){
            return true;
        } else {
            return false;
        }
    }

}

//Class for each item type in the cart
class CartEntry {
    _quantity;
    _item;
    _sum;

    constructor(jsonItem){
        this._quantity = 1;
        this._item = jsonItem;
        this._sum = jsonItem.price.toFixed(2); //store price with two decimal places
    }

    get quantity(){
        return this._quantity;
    }

    get item(){
        return this._item;
    }

    get id(){
        return this.item.id;
    }

    get sum(){
        return this._sum;
    }

    set quantity(quantity){
        this._quantity = quantity;
    }

    set item(jsonObject){
        this._item = jsonObject;
    }

    increaseQuantity() {
        this._quantity++;
    }

    decreaseQuantity(){
        this._quantity--;
    }

    //Calculates the total price of this item type in cart
    calculateSum(){
        this._sum = this._item.price * this._quantity;
    }
}

/*****************************************************************/
/*************** Functions for Getting/Sending Data **************/
/*****************************************************************/

//Gets APIs and assigns them to the APIs class instance
async function getAPICalls(){
    try {
        //real API from fakestoreapi
        apis.products = await loadAPI("https://fakestoreapi.com/products");
    } catch (e){
        //backup API from school's server
        apis.products = await loadAPI("https://deepblue.camosun.bc.ca/~c0180354/ics128/final/fakestoreapi.json");
    }
    //get currency API call
    apis.currencies = await loadAPI("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/cad.json");
}

//Helper function to get APIs
async function loadAPI(url){
    let response = await fetch(url);
    return await response.json();
}

//Sends order data to the server
async function sendData(){
    //build object to send
    cart.orderData = await buildOrderData();
    let form_data = new FormData();
    form_data.append("submission", JSON.stringify(cart.orderData));
    //sending data to server
    await fetch("https://deepblue.camosun.bc.ca/~c0180354/ics128/final/", {
        method: "POST",
        body: form_data
    }).then(async response => {
        try {
            //was response successful?
            let brandonsResponse = await response.json();
            if (brandonsResponse.status == "NOT SUBMITTED"){
                throw new Error("Some sent data was in a format not expected by the server.");
            }

            //if post is successful
            emptyCart();
            //let customer know
            $("#confirm").removeClass("show active");
            $("#success-response").addClass("show active");
        } catch (e) {
            //let customer know
            $("#fail-response").html(`<div class="row">
                                        <div class="col-4" id="sad-face">(；′⌒\`)</div>
                                        <div class="col">
                                            <p>Something appears to be odd with the fields provided.</p>
                                            <p>Please double-check your information and try again.</p>
                                        </div>
                                    </div>`);
            $("#fail-response").fadeIn(1000); 
        } 
    }).catch(error => {
        //if post is NOT successful
        //let customer know
        $("#fail-response").html(`<div class="row">
                                    <div class="col-4" id="sad-face">┗( T﹏T )┛</div>
                                    <div class="col">
                                        <p>We're sorry, but our server is not responding. Try again soon.</p> 
                                        <p>If this problem persists, please call 605-475-6964 for assistance.</p>
                                    </div>
                                </div>`);
        $("#fail-response").fadeIn(1000);  
    });
}

//Returns an object that represents the order data.
function buildOrderData(){
    let priceModifier = apis.currencies.cad[$("#currency").val()];
    let taxes = buildTaxData();
    //taxes are based on the shipping address
    let country = ($("#ship-country").val()).toUpperCase();
    let province = $("#ship-province").val();

    let orderData = { 
        card_number: $("#cc-number").val().trim().replaceAll(/\s/g,''),
        expiry_month: $("#cc-month").val(),
        expiry_year: `20${$("#cc-year").val()}`,
        security_code: $("#cc-cvc").val().trim(),
        amount: (convertPrice(cart.totalPrice, priceModifier) + ((convertPrice(cart.totalPrice, priceModifier) + 5) * taxes[country][province]) + 5).toFixed(2),
        currency: $("#currency").val(),
        billing: {
            first_name: $("#bill-fname").val().trim(),
            last_name: $("#bill-lname").val().trim(),
            address_1: `${$("#bill-housenumber").val().trim()} ${$("#bill-street").val().trim()}`,
            address_2: $("#bill-apt").val().trim(),
            city: $("#bill-city").val().trim(),
            province: $("#bill-province").val(),
            country: $("#bill-country").val(),
            postal: $("#bill-postal").val().trim().replaceAll(/\s/g,''),
            phone: $("#bill-phone").val().trim(),
            email: $("#bill-email").val().trim()
        },
        shipping: {
            first_name: $("#ship-fname").val().trim(),
            last_name: $("#ship-lname").val().trim(),
            address_1: `${$("#bill-housenumber").val().trim()} ${$("#bill-street").val().trim()}`,
            address_2: $("#ship-apt").val().trim(),
            city: $("#ship-city").val().trim(),
            province: $("#ship-province").val().trim(),
            country: $("#ship-country").val().trim(),
            postal: $("#ship-postal").val().trim().replaceAll(/\s/g,'') 
        }
    }

    return orderData;
}

/*******************************************************************/
/************ Functions for Setting/Getting Cookies ****************/
/*******************************************************************/

//Saves cart to cookie
function saveCookie(){
    set_cookie("cartCookie", JSON.stringify(cart.cartList));
}

//Loads values from cookie
function loadCookie(){
    let list = JSON.parse(get_cookie("cartCookie"));
    for (let x in list){
        for (let y = 0; y < list[x]._quantity; y++){
            addToCartFromCookie(list[x]._item.id);
        }
    }
    
    cart.calculateTotal();
    drawCart();
    updateCartNotifier();
}

//Adds item to cart when loading cookie only
function addToCartFromCookie(id){
    let tempEntry = new CartEntry(apis.getItem(id));
    //does this item already exist?
    if (cart.entryExists(tempEntry)){
        //just increment that entry's quantity by 1
        cart.incrementEntry(tempEntry.id);
    } else {
        //entry is new
        cart.addEntry(tempEntry);
    }
    //recalculate and redraw cart
    cart.calculateTotal();
    drawCart();
    $("#cart-checkout").removeAttr("disabled");
}

/*****************************************************************/
/************ Functions for Manipulating the Cart ****************/
/*****************************************************************/

//Adds item to cart
function addToCart(){
    let tempEntry = new CartEntry(apis.getItem(this.value));
    //does this item already exist?
    if (cart.entryExists(tempEntry)){
        //just increment that entry's quantity by 1
        cart.incrementEntry(tempEntry.id);
    } else {
        //entry is new
        cart.addEntry(tempEntry);
    }
    //recalculate and redraw cart
    cart.calculateTotal();
    drawCart();
    $("#cart-checkout").removeAttr("disabled");
    updateCartNotifier();
    saveCookie();
}

//Removes item from cart
function removeFromCart(){
    $(this).closest(".cart-box").remove();
    cart.removeEntry(this.id);
    cart.calculateTotal();
    $("#cart-subtotal").html(`$${parseFloat(cart.totalPrice).toFixed(2)}`);
    //if cart is empty, disable checkout
    if (cart.isEmpty()){
        $("#cart-checkout").attr("disabled", "true");
    }
    updateCartNotifier();
    saveCookie();
}

//Creates logical cart object
function createCartObject(id){
    let cartObject = apis.products[id];
    return cartObject;
}

//Empties the cart
function emptyCart(){
    $(".offcanvas-body").empty();
    cart.empty();
    saveCookie();
    updateCartNotifier();
    cart.calculateTotal();
    $("#cart-subtotal").html(`$${parseFloat(cart.totalPrice).toFixed(2)}`);
    $("#cart-checkout").attr("disabled", "true");
}

/*****************************************************************/
/************* Functions for Drawing On-screen Objects ***********/
/*****************************************************************/

//Waits for API calls, then loads tiles into view
function drawCards(){
    $("#wall").empty();
    let priceModifier = apis.currencies.cad[$("#currency").val()];
    let currencySymbol = buildCurrencySymbols();

    //Draws cards onto #wall
    for (item in apis.products){
        $("#wall").append(` \
        <div class="card col-md-4 mx-auto my-4"> \
            <img src="${apis.products[item].image}" class="card-img-top" alt="..."> \
            <div class="card-body"> \
                <h5 class="card-title">${apis.products[item].title}</h5> \
                <p class="card-text">${currencySymbol[$("#currency").val()]}${convertPrice(apis.products[item].price,priceModifier).toFixed(2)}</p> \
                <p class="card-text" data-config="{ 'type': 'text', 'limit': 5, 'more': '&#8594; show more', 'less': '&#8592; less' }">${apis.products[item].description}</p> \
                <button class="btn btn-primary card-button" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight" value="${apis.products[item].id}">Add to Cart</button> \
            </div> \
        </div>`);
    }

    //attach listener to buttons
    $(".card-button").on("click", addToCart);
}

//Redraws the cart
function drawCart(){
    let priceModifier = apis.currencies.cad[$("#currency").val()];
    let currencySymbol = buildCurrencySymbols();
    $(".offcanvas-body").empty();
    for (entry in cart.cartList){    
        $(".offcanvas-body").append(`<div class="cart-box row mb-4" id="${cart.cartList[entry].id}"> 
                                        <div class="col-4">
                                            <img src="${cart.cartList[entry].item.image}" alt="..."> 
                                        </div>
                                        <div class="col">
                                            <button type="button" class="cart-remove btn btn-secondary" aria-label="Close" id="${cart.cartList[entry].id}">–</button>
                                            <p class="cart-title">${cart.cartList[entry].item.title}</p> 
                                            <div class="d-flex row justify-content-between">
                                                <p class="quantity col">Qty: ${cart.cartList[entry].quantity}</p> 
                                                <p class="col">${currencySymbol[$("#currency").val()]}${convertPrice(cart.cartList[entry].sum,priceModifier).toFixed(2)}</p>
                                            </div>  
                                        </div>
                                    </div>`);
    }
    //set subtotal
    $("#cart-subtotal").html(`${currencySymbol[$("#currency").val()]}${convertPrice(cart.totalPrice, priceModifier).toFixed(2)}`);
    //add functions to all buttons
    $(".cart-remove").on("click", removeFromCart);
}

//Draws final page of modal
function drawConfirmModal(){
    let priceModifier = apis.currencies.cad[$("#currency").val()];
    let currencySymbol = buildCurrencySymbols();
    let taxes = buildTaxData();
    $("#confirm-content").empty();
    for (entry in cart.cartList){    
        $("#confirm-content").append(`<div class="confirm-box row" id="confirm-${cart.cartList[entry].id}">  
                                        <div class="col-3">
                                            <img src="${cart.cartList[entry].item.image}" alt="..."> 
                                        </div>
                                        <div class="col">
                                        <p class="cart-title">${cart.cartList[entry].item.title}</p> 
                                        <div class="d-flex row justify-content-between">
                                            <p class="quantity col">Qty: ${cart.cartList[entry].quantity}</p> 
                                            <p class="col">${currencySymbol[$("#currency").val()]}${convertPrice(cart.cartList[entry].sum,priceModifier).toFixed(2)}</p>
                                        </div>  
                                    </div>
                                </div>`);
    }

    //taxes are based on the shipping address
    let country = ($("#ship-country").val()).toUpperCase();
    let province = $("#ship-province").val();

    //flat rate of $5 for shipping, not converted for currency. Shipping is taxable.
    $("#confirm-subtotal").html(`${currencySymbol[$("#currency").val()]}${convertPrice(cart.totalPrice, priceModifier).toFixed(2)}`);
    $("#confirm-shipping").html(`${currencySymbol[$("#currency").val()]}5.00`);
    $("#confirm-taxes").html(`${currencySymbol[$("#currency").val()]}${((convertPrice(cart.totalPrice, priceModifier) + 5) * taxes[country][province]).toFixed(2)}`);
    $("#confirm-total").html(`${currencySymbol[$("#currency").val()]}${(convertPrice(cart.totalPrice, priceModifier) + ((convertPrice(cart.totalPrice, priceModifier) + 5) * taxes[country][province]) + 5).toFixed(2)}`);
}

//If the currency was updated, redraw three areas that are affected.
function updateCurrency(){
    drawCards();
    drawCart();
    drawConfirmModal();
}

//Update the notifier on the cart
function updateCartNotifier(){
    if (cart.cartList.length > 0){
        $("#cart-notifier").html(cart.calculateTotalQuantity());
        $("#cart-notifier").fadeIn(2000);
    } else {
        $("#cart-notifier").fadeOut(2000);
    }
}

/*****************************************************************/
/********** Functions for Converting/Checking Operations *********/
/*****************************************************************/

//Returns a price based on the CAD price * the current conversion ratio
function convertPrice(original, modifier){
    return parseFloat((original * modifier).toFixed(2));
}

//Validates a regular expression against a string
function validateField(expression, string){
    expression = new RegExp(expression);
    string = string.trim();

    if(expression.test(string)){
        return true;
    }
    return false;
}

/*****************************************************************/
/****************** Functions for Button Operations **************/
/*****************************************************************/

//Function for checkout button in cart
function checkout(){
        //don't draw final modal here. Needs tax info, which might not be set.
        $(".tab-pane.show").removeClass("show active");
        $(".nav-link.active").removeClass("active").attr("selected", "false");
        $(".tab-pane#payment").addClass("show active");
        $(".nav-link#payment-tab").addClass("active").attr("selected", "true");
        $("#fail-response").fadeOut(1000);
        $("#checkout-modal").modal("show");
}

//Closes the modal; hides error response area
function closeModal(){
    $("#checkout-modal").modal("hide");
    $("#fail-response").fadeOut(1000);
}

//modal prev-next buttons
function paymentNext(){
    let verificationPassed = true;
    let ccNumberRegex = "^[0-9]{4}[\\s-.]*[0-9]{4}[\\s-.]*[0-9]{4}[\\s-.]*[0-9]{4}[\\s]*$";
    let ccCVCRegex = "(^[0-9]{3}$)";
    let ccExpiryRegex = "^[0-9]{2}$";
    let fadeSpeed = 500;

    //If the credit card field is not valid
    if (!validateField(ccNumberRegex, $("#cc-number").val())){
        $("#cc-number-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#cc-number-feedback").fadeOut(fadeSpeed);
    }

    //If the CVC field is not valid
    if (!validateField(ccCVCRegex, $("#cc-cvc").val())){
        $("#cc-cvc-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#cc-cvc-feedback").fadeOut(fadeSpeed);
    }

    //If the Expiry fields are not valid
    if (!validateField(ccExpiryRegex, $("#cc-month").val()) || !validateField(ccExpiryRegex, $("#cc-year").val()) || 
        new Date(`20${$("#cc-year").val()}`, $("#cc-month").val()) < new Date()){
        $("#cc-expiry-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#cc-expiry-feedback").fadeOut(fadeSpeed);
    }


    if (verificationPassed){
        $("#payment").removeClass("show active");
        $("#billing").addClass("show active");
        $("#payment-tab").removeClass("active").attr("selected", "false");
        $("#billing-tab").addClass("active").attr("selected", "true");
    }
}

function billingPrev(){
    $("#billing").removeClass("show active");
    $("#payment").addClass("show active");
    $("#billing-tab").removeClass("active").attr("selected", "false");
    $("#payment-tab").addClass("active").attr("selected", "true");
}

function billingNext(){
    let verificationPassed = true;
    let nameRegex = "^[A-Za-z\\s-]+[a-z]+$";
    let aptRegex = "^[0-9A-Za-z]*$";
    let numberRegex = "^[0-9]+[A-Z]*$";
    let wordRegex = "^[A-Za-z\\s-\.-]+[A-Za-z]+$";
    let postalRegex;
    if ($("#bill-country").val() == "CA")
        postalRegex = "^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ][\\s]*[0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$";
    else 
        postalRegex = "^[0-9]{5}$";
    let emailRegex = "^[0-9A-Za-z\\._-]+@[0-9A-Za-z\\._-]+\\.[0-9A-Za-z\\._-]+$";
    let phoneRegex = "^[0-9]{3}[\\.\\s-]*[0-9]{3}[\\.\\s-]*[0-9]{4}$";
    let fadeSpeed = 500;

    //check email field
    if (!validateField(emailRegex, $("#bill-email").val())){
        $("#bill-email-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#bill-email-feedback").fadeOut(fadeSpeed);
    }

    //check phone field
    if (!validateField(phoneRegex, $("#bill-phone").val())){
        $("#bill-phone-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#bill-phone-feedback").fadeOut(fadeSpeed);
    }

    //check first name field
    if (!validateField(nameRegex, $("#bill-fname").val())){
        $("#bill-fname-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#bill-fname-feedback").fadeOut(fadeSpeed);
    }

    //check last name field
    if (!validateField(nameRegex, $("#bill-lname").val())){
        $("#bill-lname-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#bill-lname-feedback").fadeOut(fadeSpeed);
    }

    //check apt field
    if (!validateField(aptRegex, $("#bill-apt").val())){
        $("#bill-apt-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#bill-apt-feedback").fadeOut(fadeSpeed);
    }

    //check house number field
    if (!validateField(numberRegex, $("#bill-housenumber").val())){
        $("#bill-housenumber-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#bill-housenumber-feedback").fadeOut(fadeSpeed);
    }

    //check street field
    if (!validateField(wordRegex, $("#bill-street").val())){
        $("#bill-street-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#bill-street-feedback").fadeOut(fadeSpeed);
    }

    //check city field
    if (!validateField(wordRegex, $("#bill-city").val())){
        $("#bill-city-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#bill-city-feedback").fadeOut(fadeSpeed);
    }

     //check if province was selected
     if ($("#bill-province").val() == null){
        $("#bill-province-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#bill-province-feedback").fadeOut(fadeSpeed);
    }

    //check if country was selected
    if ($("#bill-country").val() == null){
        $("#bill-country-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#bill-country-feedback").fadeOut(fadeSpeed);
    }

    //check postal field
    if (!validateField(postalRegex, $("#bill-postal").val().toUpperCase())){
        $("#bill-postal-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#bill-postal-feedback").fadeOut(fadeSpeed);
    }

    if (verificationPassed){
        $("#billing").removeClass("show active");
        $("#shipping").addClass("show active");
        $("#billing-tab").removeClass("active").attr("selected", "false");
        $("#shipping-tab").addClass("active").attr("selected", "true");
        billToShipCheckbox();
    }
}

function shippingPrev(){
    $("#shipping").removeClass("show active");
    $("#billing").addClass("show active");
    $("#shipping-tab").removeClass("active").attr("selected", "false");
    $("#billing-tab").addClass("active").attr("selected", "true");
    //reset checkbox and values of shipping page
    $("#same-shipping").prop("checked", false);
    billToShipCheckbox();
}

function shippingNext(){

    let verificationPassed = true;
    let nameRegex = "^[A-Za-z\\s-]+[a-z]+$";
    let aptRegex = "^[0-9A-Za-z]*$";
    let numberRegex = "^[0-9]+[A-Z]*$";
    let wordRegex = "^[A-Za-z\\s-\.-]+[A-Za-z]+$";
    let postalRegex;
    if ($("#bill-country").val() == "CA")
        postalRegex = "^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ][\\s]*[0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$";
    else 
        postalRegex = "^[0-9]{5}$";
    let fadeSpeed = 500;
    
    //check first name field
    if (!validateField(nameRegex, $("#ship-fname").val())){
        $("#ship-fname-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#ship-fname-feedback").fadeOut(fadeSpeed);
    }

    //check last name field
    if (!validateField(nameRegex, $("#ship-lname").val())){
        $("#ship-lname-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#ship-lname-feedback").fadeOut(fadeSpeed);
    }

    //check apt field
    if (!validateField(aptRegex, $("#ship-apt").val())){
        $("#ship-apt-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#ship-apt-feedback").fadeOut(fadeSpeed);
    }

    //check house number field
    if (!validateField(numberRegex, $("#ship-housenumber").val())){
        $("#ship-housenumber-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#ship-housenumber-feedback").fadeOut(fadeSpeed);
    }

    //check street field
    if (!validateField(wordRegex, $("#ship-street").val())){
        $("#ship-street-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#ship-street-feedback").fadeOut(fadeSpeed);
    }

    //check city field
    if (!validateField(wordRegex, $("#ship-city").val())){
        $("#ship-city-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#ship-city-feedback").fadeOut(fadeSpeed);
    }

    //check if province was selected
    if ($("#ship-province").val() == null){
        $("#ship-province-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#ship-province-feedback").fadeOut(fadeSpeed);
    }

    //check if country was selected
    if ($("#ship-country").val() == null){
        $("#ship-country-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#ship-country-feedback").fadeOut(fadeSpeed);
    }

    //check postal field
    if (!validateField(postalRegex, $("#ship-postal").val().toUpperCase())){
        $("#ship-postal-feedback").fadeIn(fadeSpeed);
        verificationPassed = false;
    } else {
        $("#ship-postal-feedback").fadeOut(fadeSpeed);
    }

    if (verificationPassed){
        drawConfirmModal();
        $("#shipping").removeClass("show active");
        $("#confirm").addClass("show active");
        $("#shipping-tab").removeClass("active").attr("selected", "false");
        $("#confirm-tab").addClass("active").attr("selected", "true");
    }
}

function confirmPrev(){
    $("#confirm").removeClass("show active");
    $("#shipping").addClass("show active");
    $("#confirm-tab").removeClass("active").attr("selected", "false");
    $("#shipping-tab").addClass("active").attr("selected", "true");
    $("#fail-response").fadeOut(1000);
}

function confirmFinal(){
    //time to submit json data
    sendData();
}

/*****************************************************************/
/*************** Functions for Returning Local Data **************/
/*****************************************************************/

//Returns an object for referencing taxes.
function buildTaxData(){
    let taxData = {
        CA: {
            AB: 0.05,
            BC: 0.12,
            MB: 0.12,
            NB: 0.15,
            NL: 0.15,
            NT: 0.05,
            NS: 0.15,
            NU: 0.05,
            ON: 0.13,
            PE: 0.15,
            QC: 0.14975,
            SK: 0.11,
            YT: 0.05
        },
        US: {
            AL: 0.0922,
            AK: 0.0176,
            AZ: 0.084,
            AR: 0.0951,
            CA: 0.086,
            CO: 0.0772,
            CT: 0.0635,
            DE: 0,
            DC: 0.06,
            FL: 0.0708,
            GA: 0.0732,
            HI: 0.0444,
            ID: 0.0603,
            IL: 0.0882,
            IN: 0.07,
            IA: 0.0694,
            KS: 0.0869,
            KY: 0.06,
            LA: 0.0952,
            ME: 0.055,
            MD: 0.06,
            MA: 0.0625,
            MI: 0.06,
            MN: 0.0746,
            MS: 0.0707,
            MO: 0.0825,
            MT: 0,
            NE: 0.0694,
            NV: 0.0823,
            NH: 0,
            NJ: 0.066,
            NM: 0.0783,
            NY: 0.0852,
            NC: 0.0698,
            ND: 0.0696,
            OH: 0.0723,
            OK: 0.0895,
            OR: 0,
            PA: 0.0634,
            RI: 0.07,
            SC: 0.0746,
            SD: 0.064,
            TN: 0.0955,
            TX: 0.0819,
            UT: 0.0719,
            VT: 0.0624,
            VA: 0.0573,
            WA: 0.0923,
            WV: 0.065,
            WI: 0.0543,
            WY: 0.0533
        }
    }
    return taxData;
}

//Returns an object for referencing currency symbols.
function buildCurrencySymbols(){
    let symbols = {
        cad:"$",
        usd:"$",
        eur:"€"
    };
    return symbols;
}

//Returns html for provinces
function getProvinces(){
    let html = "<option value=\"AB\">AB</option>\
                <option value=\"BC\">BC</option>\
                <option value=\"MB\">MB</option>\
                <option value=\"NB\">NB</option>\
                <option value=\"NL\">NL</option>\
                <option value=\"NS\">NS</option>\
                <option value=\"NT\">NT</option>\
                <option value=\"NU\">NU</option>\
                <option value=\"ON\">ON</option>\
                <option value=\"PE\">PE</option>\
                <option value=\"QC\">QC</option>\
                <option value=\"SK\">SK</option>\
                <option value=\"YT\">YT</option>";
    return html;
}

//Returns html for states
function getStates(){
    let html = "<option value=\"AL\">AL</option> \
                <option value=\"AK\">AK</option> \
                <option value=\"AR\">AR</option> \
                <option value=\"AZ\">AZ</option> \
                <option value=\"CA\">CA</option> \
                <option value=\"CO\">CO</option> \
                <option value=\"CT\">CT</option> \
                <option value=\"DE\">DE</option> \
                <option value=\"DC\">DC</option> \
                <option value=\"FL\">FL</option> \
                <option value=\"GA\">GA</option> \
                <option value=\"HI\">HI</option> \
                <option value=\"ID\">ID</option> \
                <option value=\"IL\">IL</option> \
                <option value=\"IN\">IN</option> \
                <option value=\"IA\">IA</option> \
                <option value=\"KS\">KS</option> \
                <option value=\"KY\">KY</option> \
                <option value=\"LA\">LA</option> \
                <option value=\"MA\">MA</option> \
                <option value=\"MD\">MD</option> \
                <option value=\"ME\">ME</option> \
                <option value=\"MI\">MI</option> \
                <option value=\"MN\">MN</option> \
                <option value=\"MO\">MO</option> \
                <option value=\"MS\">MS</option> \
                <option value=\"MT\">MT</option> \
                <option value=\"NC\">NC</option> \
                <option value=\"ND\">ND</option> \
                <option value=\"NE\">NE</option> \
                <option value=\"NH\">NH</option> \
                <option value=\"NJ\">NJ</option> \
                <option value=\"NM\">NM</option> \
                <option value=\"NV\">NV</option> \
                <option value=\"NY\">NY</option> \
                <option value=\"OH\">OH</option> \
                <option value=\"OK\">OK</option> \
                <option value=\"OR\">OR</option> \
                <option value=\"PA\">PA</option> \
                <option value=\"RI\">RI</option> \
                <option value=\"SC\">SC</option> \
                <option value=\"SD\">SD</option> \
                <option value=\"TN\">TN</option> \
                <option value=\"TX\">TX</option> \
                <option value=\"UT\">UT</option> \
                <option value=\"VA\">VA</option> \
                <option value=\"VT\">VT</option> \
                <option value=\"WA\">WA</option> \
                <option value=\"WI\">WI</option> \
                <option value=\"WV\">WV</option> \
                <option value=\"WY\">WY</option>";
    return html;
}



/**********************************************************************/
/*************** Functions for Reacting to Field Changes **************/
/**********************************************************************/

//Called when Bill Province field changes.
function billingProvinceChange(){
    //potentially copy new values to shipping if they are linked
    //will need to call shippingLocationChange as well in that case
    if ($("#same-shipping").prop("checked")){
        $("#ship-province").val($("#bill-province").val());
        shippingProvinceChange();
    }
}

//Update province field based on Country selection. Triggered when country changes.
function billingCountryChange(){
    //update provinces list with new list
    switch ($("#bill-country").val()){
        case "CA":
            $("#bill-province").html(getProvinces());
            $("#bill-province-label").html("Province");
            $("#bill-postal-label").html("Postal Code");
            break;
        case "US":
            $("#bill-province").html(getStates());
            $("#bill-province-label").html("State");
            $("#bill-postal-label").html("ZIP Code");
            break;
    }
    //potentially copy new values to shipping if they are linked
    //will need to call shippingLocationChange as well in that case
    if ($("#same-shipping").prop("checked")){
        $("#ship-country").val($("#bill-country").val());
        shippingCountryChange();
    }
}

function shippingProvinceChange(){
    //Redraw confirm area because taxes have changed
    drawConfirmModal();
}

function shippingCountryChange(){
    //Update provinces list with new list based on country selection
    switch ($("#ship-country").val()){
        case "CA":
            $("#ship-province").html(getProvinces());
            $("#ship-province-label").html("Province");
            $("#ship-postal-label").html("Postal Code");
            break;
        case "US":
            $("#ship-province").html(getStates());
            $("#ship-province-label").html("State");
            $("#ship-postal-label").html("ZIP Code");
            break;
    }

    //Must update taxes based on province.
    shippingProvinceChange();
}

//Activates when the checkbox on the Shipping modal is selected.
//Copies values from Bill to Ship. Calls change event to make country select activate.
function billToShipCheckbox(){
    if($("#same-shipping").prop("checked")){
        $("#ship-fname").val($("#bill-fname").val()).prop("disabled", true);
        $("#ship-lname").val($("#bill-lname").val()).prop("disabled", true);
        $("#ship-apt").val($("#bill-apt").val()).prop("disabled", true);
        $("#ship-housenumber").val($("#bill-housenumber").val()).prop("disabled", true);
        $("#ship-street").val($("#bill-street").val()).prop("disabled", true);
        $("#ship-city").val($("#bill-city").val()).prop("disabled", true);
        $("#ship-country").val($("#bill-country").val()).prop("disabled", true);
        $("#ship-country").change();
        $("#ship-province").val($("#bill-province").val()).prop("disabled", true);
        $("#ship-postal").val($("#bill-postal").val()).prop("disabled", true);
    } else {
        $("#ship-fname").val("").prop("disabled", false);
        $("#ship-lname").val("").prop("disabled", false);
        $("#ship-apt").val("").prop("disabled", false);
        $("#ship-housenumber").val("").prop("disabled", false);
        $("#ship-street").val("").prop("disabled", false);
        $("#ship-city").val("").prop("disabled", false);
        $("#ship-country").val("").prop("disabled", false);
        $("#ship-province").val("").prop("disabled", false);
        $("#ship-postal").val("").prop("disabled", false);
    }
}

/*****************************************************************/
/********************* Functions for Testing *********************/
/*****************************************************************/

//Fills modal fields with values for easy testing.
function testFill(){
    //payment
    $("#cc-number").val("4111 1111 1111 1111");
    $("#cc-cvc").val("123");
    $("#cc-year").val("24");
    $("#cc-month").val("03");

    //billing
    $("#bill-email").val("dsfsd@gml.com");
    $("#bill-phone").val("456-456-7894");
    $("#bill-fname").val("Ted");
    $("#bill-lname").val("Bundy");
    $("#bill-apt").val("");
    $("#bill-housenumber").val("742");
    $("#bill-street").val("Evergreen Terr");
    $("#bill-city").val("Springfield");
    $("#bill-country").val("CA");
    $("#bill-province").val("BC");
    $("#bill-postal").val("V8R2J6");
    
    //shipping
    $("#same-shipping").prop("checked", true);
    billToShipCheckbox();
}


/*****************************************************************/
/******************** LINEAR CODE STARTS HERE ********************/
/*****************************************************************/

//Create object that holds API calls
let apis = new JSONHolder();

//Create shopping cart object
let cart = new Cart();

//When document is finished loading, do these things:
$(document).ready(function (){
    //get the apis and draw the cards
    const getAPI = async () => {
        await getAPICalls();
        drawCards();
        loadCookie();
        drawCart();
        //testing function;
        testFill();
    };
    getAPI();
    

    //add listener to currency select
    $("#currency").on("change", updateCurrency);

    //assign listeners to cart buttons
    $("#cart-empty").on("click", emptyCart);
    $("#cart-checkout").on("click", checkout);
    
    //assign listeners to modal buttons
    $(".close-modal").on("click", closeModal);
    $("#payment-next").on("click", paymentNext);
    $("#billing-prev").on("click", billingPrev);
    $("#billing-next").on("click", billingNext);
    $("#shipping-prev").on("click", shippingPrev);
    $("#shipping-next").on("click", shippingNext);
    $("#confirm-prev").on("click", confirmPrev);
    $("#confirm-final").on("click", confirmFinal);

    //assign listener to same shipping address checkbox
    $("#same-shipping").on("click", billToShipCheckbox);

    //reset drop downs to default
    $("#currency").val("cad");
    $("#bill-country").val("CA");
    $("#bill-province").val("AB");
    $("#ship-country").val("CA");
    $("#ship-province").val("AB");

    //reset shipping checkbox
    $("#same-shipping").prop("checked", false);

    //assign listeners to modal drop down menus
    $("#bill-country").on("change", billingCountryChange);
    $("#bill-province").on("change", billingProvinceChange);
    $("#ship-country").on("change", shippingCountryChange);
    $("#ship-province").on("change", shippingProvinceChange);

    
});

/* TODO:
Required:


Extra:
-add animations
=condense code
-replace modal tabs with icons
*/