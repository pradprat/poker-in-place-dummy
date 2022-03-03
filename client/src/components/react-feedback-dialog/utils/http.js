const sendHttp = (description, email, screenshot, destination) => new Promise((resolve, reject) => {
  const data = JSON.stringify({ screenshot, description, email });
  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = err => {
    if (xhr.readyState == 4 && xhr.status == 200) {
      // console.log(xhr.responseText);
      resolve("success");
    } else if (xhr.status > 400) {
      reject(err);
    } else {
      // console.log(err);
    }
  };

  // open the request with the verb and the url
  xhr.open("POST", destination);
  xhr.withCredentials = true;
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Access-Control-Allow-Origin", "*");
  xhr.send(data);
});

export default sendHttp;
