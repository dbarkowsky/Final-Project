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
    _orderData

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
        for (x in this.cartList){
            tempTotal += x.sum;
        }
        this.totalPrice = tempTotal.toFixed(2);
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
            }
        }
    }

    empty(){
        this._cartList = [];
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

    set quantity(quantity){
        this._quantity = quantity;
    }

    set item(jsonObject){
        this._item = jsonObject;
    }

    get sum(){
        return this._sum;
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
async function loadTiles(){
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

    for (item in apis.products){
        $("#wall").append(` \
        <div class="card col mx-auto my-4" style="width: 18rem;"> \
            <img src="${apis.products[item].image}" class="card-img-top" alt="..."> \
            <div class="card-body"> \
                <h5 class="card-title">${apis.products[item].title}</h5> \
                <p class="card-text">$${apis.products[item].price.toFixed(2)}</p> \
                <p class="card-text">${apis.products[item].description}</p> \
                <button class="btn btn-primary card-button" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight" value="${apis.products[item].id}">Add to Cart</button> \
            </div> \
        </div>`);
    }

    //attach listener to button
    $(".card-button").bind("click", addToCart);
    
    console.log("end loadTiles");
}

async function loadAPI(url){
    let response = await fetch(url);
    return await response.json();
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

    drawCart();
    console.log(`current cart: ${cart.cartList}`);
    $("#cart-checkout").removeAttr("disabled");
}

function removeFromCart(){
    console.log("removing from cart");
    $(this).closest(".cart-box").remove();
    cart.removeEntry(this.id);
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
    $(".offcanvas-body").empty();
    for (entry in cart.cartList){    
        $(".offcanvas-body").append(`<div class="cart-box" id="${cart.cartList[entry].id}"> \ 
                                    <button type="button" class="cart-remove btn-close text-reset" aria-label="Close" id="${cart.cartList[entry].id}"></button> \
                                    <img src="${cart.cartList[entry].item.image}" alt="..."> \
                                    <p>${cart.cartList[entry].item.title}</p> \
                                    <p class="quantity">Qty: ${cart.cartList[entry].quantity}</p> \
                                    <p>$${cart.cartList[entry].sum}</p> \
                                </div>`);
    }
    //add functions to all buttons
    $(".cart-remove").bind("click", removeFromCart);
}

function emptyCart(){
    $(".offcanvas-body").empty();
    cart.empty();
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
    $("#confirm-content").empty();
    for (entry in cart.cartList){    
        $("#confirm-content").append(`<div class="confirm-box" id="confirm-${cart.cartList[entry].id}"> \ 
                                    <img src="${cart.cartList[entry].item.image}" alt="..."> \
                                    <p>${cart.cartList[entry].item.title}</p> \
                                    <p class="quantity">Qty: ${cart.cartList[entry].quantity}</p> \
                                    <p>$${cart.cartList[entry].sum}</p> \
                                </div>`);
    }
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
    let aptRegex = "^[0-9]*$";
    let numberRegex = "^[0-9]+[A-Z]*$";
    let wordRegex = "^[A-Za-z\\s-\\.]+[a-z]+";
    let provinceRegex = "^[A-Z]{2}$";
    let postalRegex = "^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ][\\s]*[0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]$";

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

    //check province field
    if (!validateField(provinceRegex, $("#bill-province").val().toUpperCase())){
        $("#bill-province-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#bill-province-feedback").fadeOut(250);
    }
    
    //check country field
    if (!validateField(wordRegex, $("#bill-country").val())){
        $("#bill-country-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#bill-country-feedback").fadeOut(250);
    }

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

        //check province field
        if (!validateField(provinceRegex, $("#ship-province").val().toUpperCase())){
            $("#ship-province-feedback").fadeIn(250);
            verificationPassed = false;
        } else {
            $("#ship-province-feedback").fadeOut(250);
        }
        
        //check country field
        if (!validateField(wordRegex, $("#ship-country").val())){
            $("#ship-country-feedback").fadeIn(250);
            verificationPassed = false;
        } else {
            $("#ship-country-feedback").fadeOut(250);
        }

        //check postal field
        if (!validateField(postalRegex, $("#ship-postal").val().toUpperCase())){
            $("#ship-postal-feedback").fadeIn(250);
            verificationPassed = false;
        } else {
            $("#ship-postal-feedback").fadeOut(250);
        }
    }

    if (verificationPassed){
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
    let verificationPassed = true;
    let emailRegex = "^[0-9A-Za-z\\._-]+@[0-9A-Za-z\\._-]+\\.[0-9A-Za-z\\._-]+$";
    let phoneRegex = "^[0-9]{3}[\\.\\s-]*[0-9]{3}[\\.\\s-]*[0-9]{4}$";

    //check email field
    if (!validateField(emailRegex, $("#confirm-email").val())){
        $("#confirm-email-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#confirm-email-feedback").fadeOut(250);
    }

    //check phone field
    if (!validateField(phoneRegex, $("#confirm-phone").val())){
        $("#confirm-phone-feedback").fadeIn(250);
        verificationPassed = false;
    } else {
        $("#confirm-phone-feedback").fadeOut(250);
    }

    if (verificationPassed){
        //time to submit json data
        sendData();
    }
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
        console.log(response);
    }).catch(error => {
        //if post is NOT successful
        console.log(error);
    });
}

/* TODO:
-add currency selector
-possibly add .trim to all fields.
-copy billing shipping fields if checkbox:checked
*/
function buildOrderData(){
    let orderData = { 
        card_number: $("#cc-number").val(),
        expiry_month: $("#cc-month").val(),
        expiry_year: $("#cc-year").val(),
        security_code: $("#cc-cvc").val(),
        amount: cart.totalPrice,
        currency: 'three character currency code, lowercase -- example: cad',
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
    loadTiles();

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
});