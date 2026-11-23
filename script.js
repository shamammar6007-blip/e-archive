const SUPABASE_URL = "https://xaornyjlpuztzybilooa.supabase.co";
const SUPABASE_KEY = "sb_publishable_6rXYWoH92haK5XQQbdGHaQ_OpGP4XBb";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLE_NAME = "الأرشفة_الإلكترونية";

const form = document.querySelector("form");
const bookNameInput = document.getElementById("book-name");
const bookNumberInput = document.getElementById("book-number");
const bookTypeInput = document.getElementById("book-type");
const fileNumberInput = document.getElementById("File-number");
const bookDateInput = document.getElementById("book-date");
const bookImageInput = document.getElementById("book-image");

const searchBtn = document.querySelector(".search");
const editBtn = document.querySelector(".correction");
const deleteBtn = document.querySelector(".delete");
const displayBtn = document.querySelector(".display");
const tableSection = document.getElementById("table-section");
const tableBody = document.getElementById("books-table-body");

async function uploadImage(file) {
  if (!file) return "";
  const fileName = `${Date.now()}_${file.name}`;
  const { error } = await db.storage.from("book-images").upload(fileName, file);
  if (error) {
    alert("حدث خطأ أثناء رفع الصورة: " + error.message);
    return "";
  }
  const { data } = db.storage.from("book-images").getPublicUrl(fileName);
  return data.publicUrl;
}

function renderTable(books) {
  tableBody.innerHTML = "";
  tableSection.style.display = "block";

  if (!books || books.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6">لا توجد كتب محفوظة أو مطابقة.</td></tr>`;
    return;
  }

  books.forEach((book) => {
    const row = document.createElement("tr");
    const imgUrl = book["صورة_الكتاب"];
    const imgCell = imgUrl
      ? `<a href="${imgUrl}" target="_blank"><img src="${imgUrl}" class="book-thumb" title="اضغط للتكبير"></a>`
      : "لا توجد صورة";

    row.innerHTML = `
      <td>${book["اسم_الكتاب"] || ""}</td>
      <td>${book["رقم_الكتاب"] || ""}</td>
      <td>${book["نوع_الكتاب"] || ""}</td>
      <td>${book["رقم_الاضبارة"] || ""}</td>
      <td>${book["تاريخ_الكتاب"] || ""}</td>
      <td>${imgCell}</td>
    `;

    row.addEventListener("click", () => {
      bookNameInput.value = book["اسم_الكتاب"] || "";
      bookNumberInput.value = book["رقم_الكتاب"] || "";
      bookTypeInput.value = book["نوع_الكتاب"] || "";
      fileNumberInput.value = book["رقم_الاضبارة"] || "";
      bookDateInput.value = book["تاريخ_الكتاب"] || "";
    });

    tableBody.appendChild(row);
  });
}

async function loadBooks() {
  const { data, error } = await db.from(TABLE_NAME).select("*");
  if (error) return alert("خطأ في جلب البيانات: " + error.message);
  renderTable(data);
}

// 1. زر الإضافة
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!bookNameInput.value.trim() || !bookNumberInput.value.trim()) {
    return alert("يرجى إدخال اسم الكتاب ورقمه.");
  }

  const imageUrl = await uploadImage(bookImageInput.files[0]);

  const { error } = await db.from(TABLE_NAME).insert([{
    "اسم_الكتاب": bookNameInput.value.trim(),
    "رقم_الكتاب": bookNumberInput.value.trim(),
    "نوع_الكتاب": bookTypeInput.value,
    "رقم_الاضبارة": fileNumberInput.value.trim(),
    "تاريخ_الكتاب": bookDateInput.value,
    "صورة_الكتاب": imageUrl,
  }]);

  if (error) return alert("فشل الحفظ: " + error.message);
  form.reset();
  alert("تم حفظ الكتاب على السيرفر بنجاح!");
  loadBooks();
});

// 2. زر العرض
displayBtn.addEventListener("click", loadBooks);

// 3. زر البحث
searchBtn.addEventListener("click", async () => {
  const num = bookNumberInput.value.trim();
  const name = bookNameInput.value.trim();
  if (!num && !name) return alert("أدخل رقم الكتاب أو اسمه للبحث.");

  let query = db.from(TABLE_NAME).select("*");
  if (num) query = query.ilike("رقم_الكتاب", `%${num}%`);
  if (name) query = query.ilike("اسم_الكتاب", `%${name}%`);

  const { data, error } = await query;
  if (error) return alert("خطأ في البحث: " + error.message);
  renderTable(data);
});

// 4. زر التعديل
editBtn.addEventListener("click", async () => {
  const num = bookNumberInput.value.trim();
  if (!num) return alert("أدخل رقم الكتاب المراد تعديله (أو اضغط عليه من الجدول).");

  const updatedData = {
    "اسم_الكتاب": bookNameInput.value.trim(),
    "نوع_الكتاب": bookTypeInput.value,
    "رقم_الاضبارة": fileNumberInput.value.trim(),
    "تاريخ_الكتاب": bookDateInput.value,
  };

  if (bookImageInput.files[0]) {
    updatedData["صورة_الكتاب"] = await uploadImage(bookImageInput.files[0]);
  }

  const { error } = await db.from(TABLE_NAME).update(updatedData).eq("رقم_الكتاب", num);
  if (error) return alert("فشل التعديل: " + error.message);
  form.reset();
  alert("تم تعديل الكتاب على السيرفر!");
  loadBooks();
});

// 5. زر الحذف
deleteBtn.addEventListener("click", async () => {
  const num = bookNumberInput.value.trim();
  if (!num) return alert("أدخل رقم الكتاب المراد حذفه.");

  if (confirm(`هل أنت متأكد من حذف الكتاب رقم (${num})؟`)) {
    const { error } = await db.from(TABLE_NAME).delete().eq("رقم_الكتاب", num);
    if (error) return alert("فشل الحذف: " + error.message);
    form.reset();
    alert("تم حذف الكتاب من السيرفر!");
    loadBooks();
  }
});