(async () => {
  /** @type {HTMLTableElement} */
  let table = document.getElementById('kv-table-body');
  let kv_pairs = await (await fetch('/values')).json();

  console.log(kv_pairs);

  for (const key in kv_pairs) {
    console.log(key);
    let tr = table.insertRow(-1);
    tr.insertCell().innerText = key;
    tr.insertCell().innerText = new String(kv_pairs[key]);
  }
})();

