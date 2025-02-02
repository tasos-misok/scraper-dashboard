// Global μεταβλητή για την αποθήκευση των δεδομένων
let globalData = [];

// Συνάρτηση για την εισαγωγή δεδομένων στον πίνακα
function populateTable(data) {
  const tableBody = document.getElementById("productTable").getElementsByTagName("tbody")[0];
  
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.Site || ''}</td>
      <td>${row.Name || ''}</td>
      <td>${row.Price || ''}</td>
      <td>${row.Stock || ''}</td>
      <td><a href="${row.Link || '#'}" target="_blank">View</a></td>
    `;
    tableBody.appendChild(tr);
  });
}

// Συνάρτηση για εκκαθάριση του πίνακα
function clearTable() {
  const tableBody = document.getElementById("productTable").getElementsByTagName("tbody")[0];
  tableBody.innerHTML = "";
}

// Συνάρτηση που ταξινομεί τα δεδομένα βάσει της τιμής
function sortByPrice(data, ascending = true) {
  data.sort((a, b) => {
    // Αφαιρούμε πιθανά μη αριθμητικά στοιχεία (π.χ. $, €, κλπ.) και μετατρέπουμε σε float.
    let priceA = parseFloat(a.Price.replace(/[^\d\.]/g, "")) || 0;
    let priceB = parseFloat(b.Price.replace(/[^\d\.]/g, "")) || 0;
    return ascending ? priceA - priceB : priceB - priceA;
  });
}

// Ανάκτηση του CSV αρχείου και επεξεργασία του με PapaParse
fetch('multi_site_products.csv')
  .then(response => response.text())
  .then(csvText => {
    // Μετατροπή του CSV σε JSON χρησιμοποιώντας header: true
    const results = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true
    });
    globalData = results.data;  // Αποθήκευση στα globalData για μελλοντική ταξινόμηση
    populateTable(globalData);
  })
  .catch(error => {
    console.error('Error fetching CSV:', error);
  });

// Προσθήκη event listeners στα κουμπιά ταξινόμησης
document.getElementById("sortAsc").addEventListener("click", function() {
  sortByPrice(globalData, true);
  clearTable();
  populateTable(globalData);
});

document.getElementById("sortDesc").addEventListener("click", function() {
  sortByPrice(globalData, false);
  clearTable();
  populateTable(globalData);
});
