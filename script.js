// SITE CONFIG
const ADMIN_PASSWORD = "admin123"; // <<< CHANGE THIS before publishing!
const WHATSAPP_NUMBER = "+9779847614064"; // use international format
const EMAIL_TO = "lalnidhidhakal@gmail.com";

// Google Form: if you want to use Google Form instead of local booking,
// create a Google Form and paste the form URL below. If left empty, link won't show.
const GOOGLE_FORM_URL = ""; // Example: "https://docs.google.com/forms/d/e/XXXXXXXX/viewform"

// Utilities
function qs(sel){return document.querySelector(sel)}
function qsa(sel){return Array.from(document.querySelectorAll(sel))}

// DOM
const bookingForm = qs("#booking-form");
const whatsappBtn = qs("#whatsapp-btn");
const emailBtn = qs("#email-btn");
const gformLink = qs("#gform-link");
const openBookingButtons = qsa(".open-booking");
const adminLink = qs("#admin-link");
const adminModal = qs("#admin-modal");
const closeAdmin = qs("#close-admin");
const adminLoginForm = qs("#admin-login-form");
const adminPasswordInput = qs("#admin-password");
const adminPanel = qs("#admin-panel");
const bookingsList = qs("#bookings-list");
const logoutBtn = qs("#logout-admin");
const productSelect = qs("#product");
const quantityInput = qs("#quantity");

// Pre-fill google form link visibility
if(GOOGLE_FORM_URL){
  gformLink.href = GOOGLE_FORM_URL;
  gformLink.textContent = "Open Google Form";
} else {
  gformLink.style.display = "none";
}

// Open booking from product buttons
openBookingButtons.forEach(btn=>{
  btn.addEventListener("click", ()=> {
    const product = btn.dataset.product;
    const price = btn.dataset.price;
    productSelect.value = product;
    // scroll to booking form
    document.querySelector("#booking").scrollIntoView({behavior:"smooth"});
  })
})

// Build message for WhatsApp / Email
function buildMessage(data){
  return `Hello Lalnidhi Honey Farm,%0AI would like to order ${data.quantity} x ${data.product} (NPR ${data.price} each).%0AName: ${data.name}%0APhone: ${data.phone}%0AEmail: ${data.email || "—"}%0AAddress: ${data.address || "—"}%0A%0AThanks!`;
}

function buildPlainMessage(data){
  return `Hello Lalnidhi Honey Farm,\nI would like to order ${data.quantity} x ${data.product} (NPR ${data.price} each).\nName: ${data.name}\nPhone: ${data.phone}\nEmail: ${data.email || "—"}\nAddress: ${data.address || "—"}\n\nThanks!`;
}

// Read form values
function readForm(){
  const product = productSelect.value;
  const quantity = parseInt(quantityInput.value) || 1;
  const price = product.includes("Half") ? 600 : 1200;
  const name = qs("#name").value.trim();
  const phone = qs("#phone").value.trim();
  const email = qs("#email").value.trim();
  const address = qs("#address").value.trim();
  return {product, quantity, price, name, phone, email, address};
}

// WhatsApp button
whatsappBtn.addEventListener("click", ()=>{
  const data = readForm();
  if(!data.name || !data.phone){
    alert("Please enter at least your name and phone.");
    return;
  }
  const msg = buildMessage(data);
  // whatsapp web link
  const url = `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g,"")}?text=${msg}`;
  window.open(url, "_blank");
});

// Email button
emailBtn.addEventListener("click", ()=>{
  const data = readForm();
  if(!data.name || !data.phone){
    alert("Please enter at least your name and phone.");
    return;
  }
  const subject = encodeURIComponent("Honey Booking: " + data.product);
  const body = encodeURIComponent(buildPlainMessage(data));
  const mailto = `mailto:${EMAIL_TO}?subject=${subject}&body=${body}`;
  window.location.href = mailto;
});

// Save to local (admin view)
bookingForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const data = readForm();
  if(!data.name || !data.phone){
    alert("Please enter at least your name and phone.");
    return;
  }

  // Save booking object with timestamp and status
  const booking = {
    id: 'b_' + Date.now(),
    product: data.product,
    quantity: data.quantity,
    price: data.price,
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    status: "Pending",
    timestamp: new Date().toISOString()
  };

  // Save to localStorage array
  const saved = JSON.parse(localStorage.getItem("lh_bookings") || "[]");
  saved.unshift(booking);
  localStorage.setItem("lh_bookings", JSON.stringify(saved));
  alert("Booking saved locally. Admin can view it after login.");
  bookingForm.reset();
});

// Admin modal open
adminLink.addEventListener("click", (e)=>{
  e.preventDefault();
  adminModal.classList.add("show");
});

// Close admin modal
closeAdmin.addEventListener("click", ()=>{
  adminModal.classList.remove("show");
  adminPanel.style.display = "none";
});

// Admin login
adminLoginForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const pass = adminPasswordInput.value;
  if(pass === ADMIN_PASSWORD){
    // show admin panel
    adminLoginForm.style.display = "none";
    adminPanel.style.display = "block";
    renderBookings();
  } else {
    alert("Incorrect password.");
  }
});

// Render bookings
function renderBookings(){
  const saved = JSON.parse(localStorage.getItem("lh_bookings") || "[]");
  bookingsList.innerHTML = "";
  if(!saved.length){
    bookingsList.innerHTML = "<p>No bookings saved locally yet.</p>";
    return;
  }

  saved.forEach(b=>{
    const el = document.createElement("div");
    el.className = "booking-item";
    el.innerHTML = `
      <div>
        <strong>${b.product} × ${b.quantity}</strong>
        <small class="meta">NPR ${b.price} each • ${new Date(b.timestamp).toLocaleString()}</small>
        <div class="meta">Name: ${escapeHtml(b.name)} • Phone: <a href="tel:${escapeHtml(b.phone)}">${escapeHtml(b.phone)}</a></div>
        <div class="meta">Email: ${escapeHtml(b.email || "—")}</div>
        <div class="meta">Address: ${escapeHtml(b.address || "—")}</div>
      </div>
      <div class="actions">
        <select data-id="${b.id}" class="status-select">
          <option ${b.status==="Pending"?"selected":""}>Pending</option>
          <option ${b.status==="Completed"?"selected":""}>Completed</option>
          <option ${b.status==="Delivered"?"selected":""}>Delivered</option>
        </select>
        <button class="btn outline del-btn" data-id="${b.id}">Delete</button>
      </div>
    `;
    bookingsList.appendChild(el);
  });

  // Add handlers for status change and delete
  qsa(".status-select").forEach(sel=>{
    sel.addEventListener("change", (ev)=>{
      const id = ev.target.dataset.id;
      updateBookingStatus(id, ev.target.value);
    })
  });
  qsa(".del-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      if(confirm("Delete this booking?")){
        deleteBooking(btn.dataset.id);
      }
    })
  });
}

// Update booking status
function updateBookingStatus(id, newStatus){
  let arr = JSON.parse(localStorage.getItem("lh_bookings") || "[]");
  arr = arr.map(b=> b.id===id ? {...b, status:newStatus} : b);
  localStorage.setItem("lh_bookings", JSON.stringify(arr));
  renderBookings();
}

// Delete booking
function deleteBooking(id){
  let arr = JSON.parse(localStorage.getItem("lh_bookings") || "[]");
  arr = arr.filter(b=> b.id !== id);
  localStorage.setItem("lh_bookings", JSON.stringify(arr));
  renderBookings();
}

// Logout admin
logoutBtn.addEventListener("click", ()=>{
  adminLoginForm.style.display = "block";
  adminPasswordInput.value = "";
  adminPanel.style.display = "none";
  // hide modal
  adminModal.classList.remove("show");
})

// Escape HTML for safety when injecting
function escapeHtml(unsafe) {
    if(!unsafe) return "";
    return unsafe.replace(/[&<"'>]/g, function(m) {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
            default: return m;
        }
    });
}
