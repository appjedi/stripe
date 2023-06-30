const button = document.querySelector("button");
const SERVER_ROOT_URL = "http://localhost:3000/";
button.addEventListener("click", () => {
  console.log("client checkout");
  const test = [
    { id: 1, name: "adam" }, { id: 2, name: "Bob" }
  ]
  const item = {
    itemId: 1,
    cliendId: 1,
    fullName: $("#fullName").val(),
    email: $("#email").val(),
    quantity: $("#quantity").val(),
    test: JSON.stringify(test)
  };

  console.log("Sending:", item);
  fetch(SERVER_ROOT_URL+"charge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(item),
  })
    .then(res => {
      console.log("RES", res);
      alert("Done");
    })
    .then(({ url }) => {
      console.log(url)
    })
    .catch(e => {
      console.error(e.error)
    })
})

var res = sendMessage("hello"); // synch
sendMessage("hello", function (res) { // async
  // res
});

