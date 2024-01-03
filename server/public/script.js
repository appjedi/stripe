const button = document.getElementById("checkoutButton");
const SERVER_ROOT_URL = "http://localhost:8080/";
button.addEventListener("click",async () => {
  console.log("client checkout!!!!");
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
  const url = SERVER_ROOT_URL + "charge";
  console.log("Sending:", item, " to ", url);

  const resp = await fetch(url, {
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
    //window.open(json.url);  
  }
})



