// Συνάρτηση για την εισαγωγή δεδομένων στον πίνακα
function populateTable(data) {
    const tableBody = document.getElementById("productTable").getElementsByTagName("tbody")[0];
    
    data.forEach(row => {
      // Ελέγχουμε αν το πεδίο Stock έχει τιμή "Not Fetched", και το αντικαθιστούμε με "Unknown"
      const stockDisplay = row.Stock === "Not Fetched" ? "Unknown" : row.Stock;
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.Site || ''}</td>
        <td>${row.Name || ''}</td>
        <td>${row.Price || ''}</td>
        <td>${stockDisplay}</td>
        <td><a href="${row.Link || '#'}" target="_blank">View</a></td>
      `;
      tableBody.appendChild(tr);
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
      // Η παράμετρος results.data είναι ένας πίνακας αντικειμένων
      populateTable(results.data);
    })
    .catch(error => {
      console.error('Error fetching CSV:', error);
    });
  