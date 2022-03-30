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

//Waits for API calls, then loads tiles into view
async function loadTiles(){
    //get api calls
    apis.products = await loadAPI("https://fakestoreapi.com/products");
    apis.currencies = await loadAPI("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies.json");

    console.log(apis.products);
    console.log(apis.currencies);

    for (item in apis.products){
        $("#wall").append(` \
        <div class="card col mx-auto my-4" style="width: 18rem;"> \
            <img src="${apis.products[item].image}" class="card-img-top" alt="..."> \
            <div class="card-body"> \
                <h5 class="card-title">${apis.products[item].title}</h5> \
                <p class="card-text">${apis.products[item].description}</p> \
                <button class="btn btn-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight">Add to Cart</button> \
            </div> \
        </div>`);
    }

    //attach listener to button
    $(".btn").bind("click", addToCart);
    
    console.log("end loadTiles");
}

async function loadAPI(url){
    let response = await fetch(url);
    return await response.json();
}

function addToCart(){
    console.log("adding to cart");
    // var myOffcanvas = document.getElementById("offcanvasRight");
    // var bsOffcanvas = new bootstrap.Offcanvas(myOffcanvas);
    //$("#offcanvasRight").css("visibility", "visible", "display", "inline-block")
    // bsOffcanvas.show();
}

/*****  LINEAR CODE STARTS HERE *****/

//Create objects needed for API calls
let apis = new JSONHolder();

//Create shopping cart items
let cart = [];

//When document is finished loading, do these things:
$(document).ready(function (){
    loadTiles();

    
});