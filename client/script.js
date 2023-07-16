const button = document.querySelector("button");
const SERVER_ROOT_URL = "http://localhost:3000/";
button.addEventListener("click", async() => {
  console.log("client checkout");
  const test = [
    { id: 1, name: "adam" }, { id: 2, name: "Bob" }
  ]
  const item = {
    itemId: 1,
    cliendId: 1,
    fullName: $("#fullName").val(),
    email: $("#email").val(),
    amount: $("#amount").val(),
    test: JSON.stringify(test)
  };

  console.log("Sending:", item);
  const resp = await fetch(SERVER_ROOT_URL + "charge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  });
  const json = await resp.json();
  console.log("JSON", json);
  if (json.status === 1)
  {
    window.open(json.url);  
  }
})



