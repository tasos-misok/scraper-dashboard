document.addEventListener("DOMContentLoaded", function() {
  // Ο κώδικας του main.js εδώ

  // Global μεταβλητή για την αποθήκευση των δεδομένων
  let globalData = [];

  // Συνάρτηση για την εισαγωγή δεδομένων στον πίνακα
  function populateTable(data) {
    const tableBody = document.getElementById("productTable").getElementsByTagName("tbody")[0];
    data.forEach(row => {
      const stockDisplay = (row.Stock && row.Stock.trim().toLowerCase() === "not fetched") ? "Unknown" : row.Stock;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.Site || ''}</td>
        <td>${row.Name || ''}</td>
        <td>${row.Price || ''}</td>
        <td>${stockDisplay || ''}</td>
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
    console.log("Before sorting:", data.map(d => d.Price));
    data.sort((a, b) => {
      let priceA = parseFloat(a.Price.replace(/[^\d\.]/g, "")) || 0;
      let priceB = parseFloat(b.Price.replace(/[^\d\.]/g, "")) || 0;
      return ascending ? priceA - priceB : priceB - priceA;
    });
    console.log("After sorting:", data.map(d => d.Price));
  }

  // Ανάκτηση του CSV αρχείου και επεξεργασία του με PapaParse
  fetch('multi_site_products.csv')
    .then(response => response.text())
    .then(csvText => {
      const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true
      });
      globalData = results.data;
      console.log("Loaded globalData:", globalData);
      populateTable(globalData);
    })
    .catch(error => {
      console.error('Error fetching CSV:', error);
    });

  // Προσθήκη event listeners στα κουμπιά ταξινόμησης
  document.getElementById("sortAsc").addEventListener("click", function() {
    console.log("Sort Ascending button clicked");
    sortByPrice(globalData, true);
    clearTable();
    populateTable(globalData);
  });

  document.getElementById("sortDesc").addEventListener("click", function() {
    console.log("Sort Descending button clicked");
    sortByPrice(globalData, false);
    clearTable();
    populateTable(globalData);
  });

});
