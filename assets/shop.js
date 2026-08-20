const GB_COLLECTION="https://goodbulb.com/collections/made-in-usa/products.json?limit=250";
const GB_BASE="https://goodbulb.com";
let SHOP_PRODUCTS=[];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=v=>"$"+(Number(v||0)).toFixed(2);
function cleanTitle(v){
  let x=String(v??"");
  for(let i=0;i<3;i++){const y=x.replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&amp;/gi,"&");if(y===x)break;x=y;}
  x=x.replace(/<\s*br\s*\/?\s*>/gi," ");
  x=x.replace(/&lt;\s*br\s*\/?\s*&gt;/gi," ");
  return x.replace(/\s+/g," ").trim();
}
async function gbCollection(){
  if(SHOP_PRODUCTS.length)return SHOP_PRODUCTS;
  const r=await fetch(GB_COLLECTION,{mode:"cors"}); if(!r.ok)throw new Error("Unable to load products");
  const j=await r.json();
  SHOP_PRODUCTS=(j.products||[]).map(p=>({id:String(p.id),handle:p.handle,title:cleanTitle(p.title),description:p.body_html||"",vendor:p.vendor,product_type:p.product_type,images:p.images||[],variants:p.variants||[],price:Number((p.variants?.[0]?.price)||0),url:GB_BASE+"/products/"+p.handle}));
  return SHOP_PRODUCTS;
}
function cart(){try{return JSON.parse(localStorage.getItem("hc_cart")||"[]")}catch(e){return[]}}
function saveCart(c){localStorage.setItem("hc_cart",JSON.stringify(c));updateCount()}
function updateCount(){const n=cart().reduce((a,i)=>a+Number(i.qty||0),0);document.querySelectorAll("#cartCount").forEach(e=>e.textContent=n)}
function toast(m){let t=document.querySelector(".shop-toast");if(!t){t=document.createElement("div");t.className="shop-toast";document.body.appendChild(t)}t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1600)}
function addProduct(p,qty=1){let c=cart(),x=c.find(i=>String(i.id)===String(p.id));if(x)x.qty+=qty;else c.push({id:String(p.id),handle:p.handle,title:p.title,price:p.price,image:p.images?.[0]?.src||"",qty});saveCart(c);toast("Added to cart")}
function buyProduct(p,qty=1){localStorage.setItem("hc_cart",JSON.stringify([{id:String(p.id),handle:p.handle,title:p.title,price:p.price,image:p.images?.[0]?.src||"",qty}]));location.href="checkout.html"}
function card(p){
 const img=p.images?.[0]?.src||"";
 return `<article class="product-card"><a href="product.html?handle=${encodeURIComponent(p.handle)}" class="product-img"><img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy"></a><div class="product-card-body"><div class="product-tag">MADE IN USA COLLECTION</div><h3><a href="product.html?handle=${encodeURIComponent(p.handle)}">${esc(p.title)}</a></h3><p>${p.variants?.[0]?.title && p.variants[0].title!=="Default Title"?esc(p.variants[0].title):"Available product variant"}</p><strong class="price">${money(p.price)}</strong><div class="card-actions"><button class="btn secondary" onclick='addByHandle(${JSON.stringify(p.handle)})'>Add to Cart</button><a class="btn primary" href="product.html?handle=${encodeURIComponent(p.handle)}">View Product</a></div></div></article>`
}
async function addByHandle(handle){let p=(await gbCollection()).find(x=>x.handle===handle);if(p)addProduct(p)}
async function renderShop(target="#shopProducts",limit=0){
 const el=document.querySelector(target);if(!el)return;
 try{let ps=await gbCollection(); if(limit)ps=ps.slice(0,limit); el.innerHTML=ps.map(card).join("");}
 catch(e){el.innerHTML='<div class="empty"><h2>Shop products could not be loaded</h2><p>Please refresh the page and try again.</p></div>'}
}
async function renderProduct(){
 const area=document.querySelector("#productDetail");if(!area)return;
 const handle=new URLSearchParams(location.search).get("handle");
 if(!handle){area.innerHTML='<div class="empty">Product not selected. <a href="shop.html">Return to Shop</a>.</div>';return}
 try{
  const r=await fetch(`${GB_BASE}/products/${encodeURIComponent(handle)}.js`,{mode:"cors"});if(!r.ok)throw 0;const p=await r.json();
  p.title=cleanTitle(p.title);
  const price=Number(p.price||p.variants?.[0]?.price||0)/100;
  const images=(p.images||[]).map(x=>typeof x==="string"?x:x.src);
  const desc=p.description||"";
  const specs=(p.variants||[]).map(v=>`<tr><td>Variant</td><td>${esc(v.title)}</td></tr><tr><td>Price</td><td>${money(Number(v.price)/100)}</td></tr>`).join("");
  area.innerHTML=`<div class="product-layout"><div><div class="product-main-image"><img id="mainProductImage" src="${esc(images[0]||"")}" alt="${esc(p.title)}"></div>${images.length>1?`<div class="thumbs">${images.map((im,i)=>`<button onclick="document.querySelector('#mainProductImage').src=${JSON.stringify(im)}"><img src="${esc(im)}" alt=""></button>`).join("")}</div>`:""}</div><div><span class="eyebrow">GOODBULB • MADE IN USA COLLECTION</span><h1>${esc(p.title)}</h1><div class="price">${money(price)}</div><div class="buybar"><input id="productQty" class="qty" type="number" min="1" value="1"><button class="btn secondary" id="addProduct">Add to Cart</button><button class="btn primary" id="buyProduct">Buy Now</button></div><p class="mini-note">Cash on Delivery is the payment method offered by this shop.</p><div class="product-description">${desc}</div><table class="specs"><tbody>${specs}</tbody></table><p><a href="${esc(GB_BASE+"/products/"+p.handle)}" target="_blank" rel="noopener">View source product information</a></p></div></div>`;
  const local={id:String(p.id),handle:p.handle,title:p.title,price,images:images.map(src=>({src}))};
  document.querySelector("#addProduct").onclick=()=>addProduct(local,Math.max(1,+document.querySelector("#productQty").value||1));
  document.querySelector("#buyProduct").onclick=()=>buyProduct(local,Math.max(1,+document.querySelector("#productQty").value||1));
 }catch(e){area.innerHTML='<div class="empty"><h2>Product could not be loaded</h2><p>Open the shop and choose another product.</p></div>'}
}
function renderCart(){
 const el=document.querySelector("#cartItems");if(!el)return;
 const c=cart();if(!c.length){el.innerHTML='<div class="empty"><h2>Your cart is empty</h2><p>Browse the shop to add products.</p><a class="btn primary" href="shop.html">Shop Now</a></div>';document.querySelector("#cartTotal").textContent="$0.00";return}
 let total=0;el.innerHTML=c.map(i=>{total+=Number(i.price)*i.qty;return `<div class="cart-row"><img src="${esc(i.image)}" alt="${esc(i.title)}"><div><strong>${esc(i.title)}</strong><div class="mini-note">${money(i.price)} each</div></div><input class="qty" type="number" min="1" value="${i.qty}" onchange="setQty('${esc(i.id)}',this.value)"><button class="btn secondary" onclick="removeItem('${esc(i.id)}')">Remove</button></div>`}).join("");document.querySelector("#cartTotal").textContent=money(total)}
function setQty(id,q){let c=cart(),x=c.find(i=>String(i.id)===String(id));if(x)x.qty=Math.max(1,parseInt(q)||1);saveCart(c);renderCart()}
function removeItem(id){saveCart(cart().filter(i=>String(i.id)!==String(id)));renderCart()}
document.addEventListener("DOMContentLoaded",()=>{updateCount();renderShop("#shopProducts");renderProduct();renderCart();});
