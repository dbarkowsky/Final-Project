//easy object to hold json pointer
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
}

//class that represents the cart and does cart functions
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

    calculateTotal(){
        let tempTotal = 0;
        for (let x in this.cartList){
            tempTotal += parseFloat(this.cartList[x].sum);
            console.log("entry price " + this.cartList[x].sum);
            console.log("tempTotal " + tempTotal);
        }
        this.totalPrice = parseFloat(tempTotal).toFixed(2);
        console.log(`total price ${this.totalPrice}`);
    }

    entryExists(tempEntry){
        for (let entry in this.cartList){
            if (this.cartList[entry].id == tempEntry.id){
                return true;
            }
        }
        return false;
    }

    incrementEntry(id){
        for (let entry in this.cartList){
            if (this.cartList[entry].id == id){
                this.cartList[entry].increaseQuantity();
                $(`.cart-box[id="${id}"]`).closest(".quantity").html = `$${this.cartList[entry].sum}`;
                this.cartList[entry].calculateSum();
            }
        }
    }

    empty(){
        this._cartList = [];
        drawCart();
    }

    isEmpty(){
        if (this._cartList.length < 1){
            return true;
        } else {
            return false;
        }
    }

}

//class for each item type in the cart
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

    calculateSum(){
        this._sum = this._item.price * this._quantity;
    }
}

//Waits for API calls, then loads tiles into view
function drawCards(){
    $("#wall").empty();
    let priceModifier = apis.currencies.cad[$("#currency").val()];
    let currencySymbol = buildCurrencySymbols();

    for (item in apis.products){
        $("#wall").append(` \
        <div class="card col-md-4 mx-auto my-4"> \
            <img src="${apis.products[item].image}" class="card-img-top" alt="..."> \
            <div class="card-body"> \
                <h5 class="card-title">${apis.products[item].title}</h5> \
                <p class="card-text">${currencySymbol[$("#currency").val()]}${convertPrice(apis.products[item].price,priceModifier)}</p> \
                <p class="card-text" data-config="{ 'type': 'text', 'limit': 5, 'more': '&#8594; show more', 'less': '&#8592; less' }">${apis.products[item].description}</p> \
                <button class="btn btn-primary card-button" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight" value="${apis.products[item].id}">Add to Cart</button> \
            </div> \
        </div>`);
    }

    //attach listener to button
    $(".card-button").bind("click", addToCart);
    
    console.log("end loadTiles");
}

async function getAPICalls(){
    //get api calls
    try {
        //real api from fakestoreapi
        apis.products = await loadAPI("https://fakestoreapi.com/products");
    } catch (e){
        //backup api from school's server
        apis.products = await loadAPI("https://deepblue.camosun.bc.ca/~c0180354/ics128/final/fakestoreapi.json");
    }
 
    apis.currencies = await loadAPI("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/cad.json");

    console.log(apis.products);
    console.log(apis.currencies);
}

async function loadAPI(url){
    let response = await fetch(url);
    return await response.json();
}

function convertPrice(original, modifier){
    return parseFloat((original * modifier).toFixed(2));
}

function validateField(expression, string){
    expression = new RegExp(expression);
    string = string.trim();
    console.log("in validate");

    if(expression.test(string)){
        console.log(`${string} matches the expression`);
        return true;
    }
    console.log(`${string} doesn't match the expression`);
    return false;
}

//logical cart functions
function addToCart(){
    console.log("adding to cart");
    console.log(`adding item ${this.value} to cart`);

    let tempEntry = new CartEntry(apis.products[this.value-1]);
    //does this item already exist?
    if (cart.entryExists(tempEntry)){
        console.log("entry exists");
        //just increment that entry's quantity by 1
        cart.incrementEntry(tempEntry.id);
    } else {
        console.log("entry is new");
        cart.addEntry(tempEntry);
        console.log(`current item: ${tempEntry.id}`);
    }
    cart.calculateTotal();
    console.log(`current total ${cart.totalPrice}`);
    drawCart();
    console.log(`current cart: ${cart.cartList}`);
    $("#cart-checkout").removeAttr("disabled");
}

function removeFromCart(){
    console.log("removing from cart");
    $(this).closest(".cart-box").remove();
    cart.removeEntry(this.id);
    cart.calculateTotal();
    $("#cart-subtotal").html(`$${parseFloat(cart.totalPrice).toFixed(2)}`);
    //if cart is empty, disable checkout
    if (cart.isEmpty()){
        $("#cart-checkout").attr("disabled", "true");
    }
}

function createCartObject(id){
    let cartObject = apis.products[id];
    return cartObject;
}

//physical cart functions
function drawCart(){
    let priceModifier = apis.currencies.cad[$("#currency").val()];
    let currencySymbol = buildCurrencySymbols();
    $(".offcanvas-body").empty();
    for (entry in cart.cartList){    
        $(".offcanvas-body").append(`<div class="cart-box" id="${cart.cartList[entry].id}"> \ 
                                    <button type="button" class="cart-remove btn-close text-reset" aria-label="Close" id="${cart.cartList[entry].id}"></button> \
                                    <img src="${cart.cartList[entry].item.image}" alt="..."> \
                                    <p>${cart.cartList[entry].item.title}</p> \
                                    <p class="quantity">Qty: ${cart.cartList[entry].quantity}</p> \
                                    <p>${currencySymbol[$("#currency").val()]}${convertPrice(cart.cartList[entry].sum,priceModifier)}</p> \
                                </div>`);
    }
    //set subtotal
    console.log(cart.totalPrice);
    $("#cart-subtotal").html(`${currencySymbol[$("#currency").val()]}${convertPrice(cart.totalPrice, priceModifier)}`);
    //add functions to all buttons
    $(".cart-remove").bind("click", removeFromCart);
}

function emptyCart(){
    $(".offcanvas-body").empty();
    cart.empty();
    cart.calculateTotal();
    $("#cart-subtotal").html(`$${parseFloat(cart.totalPrice).toFixed(2)}`);
    $("#cart-checkout").attr("disabled", "true");
}

function checkout(){
        drawConfirmModal();
        $("#checkout-modal").modal("show");
}

//modal section functions
function closeModal(){
    $("#checkout-modal").modal("hide");
}

function drawConfirmModal(){
    let priceModifier = apis.currencies.cad[$("#currency").val()];
    let currencySymbol = buildCurrencySymbols();
    let taxes = buildTaxData();
    console.log(taxes);
    $("#confirm-content").empty();
    for (entry in cart.cartList){    
        $("#confirm-content").append(`<div class="confirm-box" id="confirm-${cart.cartList[entry].id}"> \ 
                                    <img src="${cart.cartList[entry].item.image}" alt="..."> \
                                    <p>${cart.cartList[entry].item.title}</p> \
                                    <p class="quantity">Qty: ${cart.cartList[entry].quantity}</p> \
                                    <p>${currencySymbol[$("#currency").val()]}${convertPrice(cart.cartList[entry].sum,priceModifier)}</p> \
                                </div>`);
    }

    //taxes are based on the shipping address
    let country = ($("#ship-country").val()).toUpperCase();
    let province = $("#ship-province").val();

    console.log(`current tax: ${taxes[country][province]}`);
    //flat rate of $5 for shipping, not converted for currency. Shipping is taxable.
    $("#confirm-subtotal").html(`${currencySymbol[$("#currency").val()]}${convertPrice(cart.totalPrice, priceModifier)}`);
    $("#confirm-shipping").html(`${currencySymbol[$("#currency").val()]}5.00`);
    $("#confirm-taxes").html(`${currencySymbol[$("#currency").val()]}${((convertPrice(cart.totalPrice, priceModifier) + 5) * taxes[country][province]).toFixed(2)}`);
    $("#confirm-total").html(`${currencySymbol[$("#currency").val()]}${(convertPrice(cart.totalPrice, priceModifier) + (convertPrice(cart.totalPrice, priceModifier)*0.12) + 5).toFixed(2)}`);
}

//modal prev-next buttons
function paymentNext(){
    let verificationPassed = true;
    let ccNumberRegex = "^[0-9]{4}[\\s-.]*[0-9]{4}[\\s-.]*[0-9]{4}[\\s-.]*[0-9]{4}[\\s]*";
    let ccCVCRegex = "^[0-9]{3}$";
    let ccExpiryRegex = "^[0-9]{2}$";

    //If the credit card field is not valid
    if (!validateField(ccNumberRegex, $("#cc-number").val())){
        $("#cc-number-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#cc-number-feedback").fadeOut(250);
    }

    //If the CVC field is not valid
    if (!validateField(ccCVCRegex, $("#cc-cvc").val())){
        $("#cc-cvc-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#cc-cvc-feedback").fadeOut(250);
    }

    //If the Expiry fields are not valid
    /////////////////////////////////////////////add requirement for this current date or later
    if (!validateField(ccExpiryRegex, $("#cc-month").val()) || !validateField(ccExpiryRegex, $("#cc-year").val())){
        $("#cc-expiry-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#cc-expiry-feedback").fadeOut(250);
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
    let nameRegex = "^[A-Za-z\\s-]+[a-z]+";
    let aptRegex = "^[0-9A-Za-z]*$";
    let numberRegex = "^[0-9]+[A-Z]*$";
    let wordRegex = "^[A-Za-z\\s-\\.]+[a-z]+";
    let provinceRegex = "^[A-Z]{2}$";
    let postalRegex = "^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ][\\s]*[0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$";
    let emailRegex = "^[0-9A-Za-z\\._-]+@[0-9A-Za-z\\._-]+\\.[0-9A-Za-z\\._-]+$";
    let phoneRegex = "^[0-9]{3}[\\.\\s-]*[0-9]{3}[\\.\\s-]*[0-9]{4}$";

    //check email field
    if (!validateField(emailRegex, $("#bill-email").val())){
        $("#bill-email-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#bill-email-feedback").fadeOut(250);
    }

    //check phone field
    if (!validateField(phoneRegex, $("#bill-phone").val())){
        $("#bill-phone-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#bill-phone-feedback").fadeOut(250);
    }

    //check first name field
    if (!validateField(nameRegex, $("#bill-fname").val())){
        $("#bill-fname-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#bill-fname-feedback").fadeOut(250);
    }

    //check last name field
    if (!validateField(nameRegex, $("#bill-lname").val())){
        $("#bill-lname-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#bill-lname-feedback").fadeOut(250);
    }

    //check apt field
    if (!validateField(aptRegex, $("#bill-apt").val())){
        $("#bill-apt-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#bill-apt-feedback").fadeOut(250);
    }

    //check house number field
    if (!validateField(numberRegex, $("#bill-housenumber").val())){
        $("#bill-housenumber-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#bill-housenumber-feedback").fadeOut(250);
    }

    //check street field
    if (!validateField(wordRegex, $("#bill-street").val())){
        $("#bill-street-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#bill-street-feedback").fadeOut(250);
    }

    //check city field
    if (!validateField(wordRegex, $("#bill-city").val())){
        $("#bill-city-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#bill-city-feedback").fadeOut(250);
    }

    // //check province field
    // if (!validateField(provinceRegex, $("#bill-province").val().toUpperCase())){
    //     $("#bill-province-feedback").fadeIn(250);
    //     verificationPassed = false;
    // } else {
    //     $("#bill-province-feedback").fadeOut(250);
    // }
    
    // //check country field
    // if (!validateField(wordRegex, $("#bill-country").val())){
    //     $("#bill-country-feedback").fadeIn(250);
    //     verificationPassed = false;
    // } else {
    //     $("#bill-country-feedback").fadeOut(250);
    // }

    //check postal field
    if (!validateField(postalRegex, $("#bill-postal").val().toUpperCase())){
        $("#bill-postal-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#bill-postal-feedback").fadeOut(250);
    }

    if (verificationPassed){
        $("#billing").removeClass("show active");
        $("#shipping").addClass("show active");
        $("#billing-tab").removeClass("active").attr("selected", "false");
        $("#shipping-tab").addClass("active").attr("selected", "true");
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
    let nameRegex = "^[A-Za-z\\s-]+[a-z]+";
    let aptRegex = "^[0-9]*$";
    let numberRegex = "^[0-9]+[A-Z]*$";
    let wordRegex = "^[A-Za-z\\s-\\.]+[a-z]+";
    let provinceRegex = "^[A-Z]{2}$";
    let postalRegex = "^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ][\\s]*[0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$";

    //if you use the same values as billing, don't validate
    if (!$("#same-shipping").prop("checked")){
        //validate as normal
        //check first name field
        if (!validateField(nameRegex, $("#ship-fname").val())){
            $("#ship-fname-feedback").fadeIn(250);
            verificationPassed = false;
        } else {
            $("#ship-fname-feedback").fadeOut(250);
        }

        //check last name field
        if (!validateField(nameRegex, $("#ship-lname").val())){
            $("#ship-lname-feedback").fadeIn(250);
            verificationPassed = false;
        } else {
            $("#ship-lname-feedback").fadeOut(250);
        }

        //check apt field
        if (!validateField(aptRegex, $("#ship-apt").val())){
            $("#ship-apt-feedback").fadeIn(250);
            verificationPassed = false;
        } else {
            $("#ship-apt-feedback").fadeOut(250);
        }

        //check house number field
        if (!validateField(numberRegex, $("#ship-housenumber").val())){
            $("#ship-housenumber-feedback").fadeIn(250);
            verificationPassed = false;
        } else {
            $("#ship-housenumber-feedback").fadeOut(250);
        }

        //check street field
        if (!validateField(wordRegex, $("#ship-street").val())){
            $("#ship-street-feedback").fadeIn(250);
            verificationPassed = false;
        } else {
            $("#ship-street-feedback").fadeOut(250);
        }

        //check city field
        if (!validateField(wordRegex, $("#ship-city").val())){
            $("#ship-city-feedback").fadeIn(250);
            verificationPassed = false;
        } else {
            $("#ship-city-feedback").fadeOut(250);
        }

        // //check province field
        // if (!validateField(provinceRegex, $("#ship-province").val().toUpperCase())){
        //     $("#ship-province-feedback").fadeIn(250);
        //     verificationPassed = false;
        // } else {
        //     $("#ship-province-feedback").fadeOut(250);
        // }
        
        // //check country field
        // if (!validateField(wordRegex, $("#ship-country").val())){
        //     $("#ship-country-feedback").fadeIn(250);
        //     verificationPassed = false;
        // } else {
        //     $("#ship-country-feedback").fadeOut(250);
        // }

        //check postal field
        if (!validateField(postalRegex, $("#ship-postal").val().toUpperCase())){
            $("#ship-postal-feedback").fadeIn(250);
            verificationPassed = false;
        } else {
            $("#ship-postal-feedback").fadeOut(250);
        }
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
}

function confirmFinal(){
    //time to submit json data
    sendData();
}

async function sendData(){
    //build object to send
    cart.orderData = await buildOrderData();
    console.log(cart.orderData);
    //sending data to server
    await fetch("https://deepblue.camosun.bc.ca/~c0180354/ics128/final/", {
        method: "POST",
        body: JSON.stringify(cart.orderData)
    }).then(response => {
        //if post is successful
        emptyCart();
        console.log(response);
    }).catch(error => {
        //if post is NOT successful
        console.log(error);
    });
}


function buildOrderData(){
    let priceModifier = apis.currencies.cad[$("#currency").val()];
    let orderData = { 
        card_number: $("#cc-number").val(),
        expiry_month: $("#cc-month").val(),
        expiry_year: $("#cc-year").val(),
        security_code: $("#cc-cvc").val(),
        amount: (convertPrice(cart.totalPrice, priceModifier) + (convertPrice(cart.totalPrice, priceModifier)*0.12) + 5).toFixed(2),
        currency: $("#currency").val(),
        billing: {
            first_name: $("#bill-fname").val(),
            last_name: $("#bill-lname").val(),
            address_1: $("#bill-housenumber").val(),
            address_2: $("#bill-apt").val(),
            city: $("#bill-city").val(),
            province: $("#bill-province").val(),
            country: $("#bill-country").val(),
            postal: $("#bill-postal").val(),
            phone: $("#confirm-phone").val(),
            email: $("#confirm-email").val()
        },
        shipping: {
            first_name: $("#ship-fname").val(),
            last_name: $("#ship-lname").val(),
            address_1: $("#ship-housenumber").val(),
            address_2: $("#ship-apt").val(),
            city: $("#ship-city").val(),
            province: $("#ship-province").val(),
            country: $("#ship-country").val(),
            postal: $("#ship-postal").val()  
        }
    }

    return orderData;
}

function buildTaxData(){
    let taxData = {
        CANADA: {
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
        USA: {
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

function buildCurrencySymbols(){
    let symbols = {
        cad:"$",
        usd:"$",
        eur:"€"
    };
    return symbols;
}

function updateCurrency(){
    drawCards();
    drawCart();
    drawConfirmModal();
}

function billingProvinceChange(){
    //potentially copy new values to shipping if they are linked
    //will need to call shippingLocationChange as well in that case
    if ($("#same-shipping").prop("checked")){
        billToShipCheckbox();
        shippingProvinceChange();
    }
}

function billingCountryChange(){
    //update provinces list with new list
    switch ($("#bill-country").val()){
        case "CANADA":
            $("#bill-province").html("<option value=\"AB\">AB</option>\
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
                                    <option value=\"YT\">YT</option>");
            break;
        case "USA":
            $("#bill-province").html("<option value=\"AL\">AL</option> \
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
                                    <option value=\"WY\">WY</option>");
            break;
    }
    //potentially copy new values to shipping if they are linked
    //will need to call shippingLocationChange as well in that case
    if ($("#same-shipping").prop("checked")){
        billToShipCheckbox();
        shippingProvinceChange();
    }
}

function shippingProvinceChange(){
    //redraw confirm area because taxes have changed
    drawConfirmModal();
}

function shippingCountryChange(){
    //update provinces list with new list
    switch ($("#ship-country").val()){
        case "CANADA":
            $("#ship-province").html("<option value=\"AB\">AB</option>\
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
                                    <option value=\"YT\">YT</option>");
            break;
        case "USA":
            $("#ship-province").html("<option value=\"AL\">AL</option> \
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
                                    <option value=\"WY\">WY</option>");
            break;
    }

    shippingProvinceChange();
}

function billToShipCheckbox(){
    if($("#same-shipping").prop("checked")){
        $("#ship-fname").val($("#bill-fname").val());
        $("#ship-lname").val($("#bill-lname").val());
        $("#ship-apt").val($("#bill-apt").val());
        $("#ship-housenumber").val($("#bill-housenumber").val());
        $("#ship-street").val($("#bill-street").val());
        $("#ship-city").val($("#bill-city").val());
        $("#ship-country").val($("#bill-country").val());
        $("#ship-province").val($("#bill-province").val());
        $("#ship-postal").val($("#bill-postal").val());
    } else {
        $("#ship-fname").val("");
        $("#ship-lname").val("");
        $("#ship-apt").val("");
        $("#ship-housenumber").val("");
        $("#ship-street").val("");
        $("#ship-city").val("");
        $("#ship-country").val("");
        $("#ship-province").val("");
        $("#ship-postal").val("");
    }
}

/*
after jquery import
<script src="url for masonry"></script>

$("thing I hold cards in ").imagesLoaded(() => {
    let mason = new Masonry($("thig I hold cards in"));
})
*/


/*****  LINEAR CODE STARTS HERE *****/

//Create object that holds API calls
let apis = new JSONHolder();

//Create shopping cart object
let cart = new Cart();

//When document is finished loading, do these things:
$(document).ready(function (){
    const getAPI = async () => {
        await getAPICalls();
        drawCards();
    };
    getAPI();
    

    //add listener to currency select
    $("#currency").on("change", updateCurrency);

    //assign listeners to cart buttons
    $("#cart-empty").bind("click", emptyCart);
    $("#cart-checkout").bind("click", checkout);
    
    //assign listeners to modal buttons
    $(".close-modal").bind("click", closeModal);
    $("#payment-next").bind("click", paymentNext);
    $("#billing-prev").bind("click", billingPrev);
    $("#billing-next").bind("click", billingNext);
    $("#shipping-prev").bind("click", shippingPrev);
    $("#shipping-next").bind("click", shippingNext);
    $("#confirm-prev").bind("click", confirmPrev);
    $("#confirm-final").bind("click", confirmFinal);

    //assign listener to same shipping address checkbox
    $("#same-shipping").on("click", billToShipCheckbox);

    //assign listeners to modal drop down menus
    $("#bill-country").on("change", billingCountryChange);
    $("#bill-province").on("change", billingProvinceChange);
    $("#ship-country").on("change", shippingCountryChange);
    $("#ship-province").on("change", shippingProvinceChange);

    //reset drop downs to default
    $("#currency").val("cad");
    $("#bill-country").val("CANADA");
    $("#bill-province").val("AB");
    $("#ship-country").val("CANADA");
    $("#ship-province").val("AB");
});

/* TODO:
-possibly add .trim to all fields json to send.
-make site look nicer
-add notifier to cart icon
-add cookie functionality
-add reactions to successful or unsuccessful order
-add comments
-restrict modal tabs
-add animations
-fix #wall so it displays nicely
-change .bind to .on where possible
*/