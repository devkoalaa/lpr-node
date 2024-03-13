/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import express from "express";
import DigestClient from "digest-fetch";
import xml2json from "xml2json";
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const camIP = `http://${process.env.CAM_IP}/local/fflprapp/`;
const hostDefault = camIP + "search.cgi?limit=20";
const hostLast = camIP + "search.cgi?limit=2";
const placa = 'paz'
const host = `http://${process.env.CAM_IP}/local/fflprapp/search.cgi?Text=${placa}`;
const username = process.env.CAM_USERNAME;
const password = process.env.CAM_PASSWORD;
const digest = new DigestClient(username, password);

async function fetchData(url) {
  let value;
  // do {
  const resp = await digest.fetch(url);
  const reader = resp.body.getReader();
  const result = await reader.read();

  value = result.value;
  console.log("Tamanho do Array:\n", value.length);
  // console.log("Array:\n", value);

  //   if (value.length < 1600) {
  //     await new Promise((resolve) => setTimeout(resolve, 5000));
  //   }
  // } while (value.length < 1600);

  return value;
}

app.get("/v1/events/last", async function (req, res) {
  console.log(process.env.CAM_USERNAME);

  var response;
  try {
    const value = await fetchData(hostLast);
    const jsonResult = xml2json.toJson(value);
    // console.log("jsonResult:\n", jsonResult);
    const result = JSON.parse(jsonResult);

    if (result && result.events && result.events.event) {
      response = result.events.event;
    } else {
      console.error(
        "Não foi possível encontrar 'events' ou 'event' no resultado"
      );
    }
  } catch (err) {
    console.error("Deu ruim:", err);
  }

  console.log('\nresponse:', response);
  console.log("\n---------------------------------------------------\n\n");
  res.status(200).json(response);
});

app.get("/v1/vehicles", async function (req, res) {
  var imgs = [];
  try {
    const value = await fetchData(hostDefault);
    const jsonResult = xml2json.toJson(value);
    // console.log("jsonResult:\n", jsonResult);
    const result = JSON.parse(jsonResult);

    if (result && result.events && result.events.event) {
      result.events.event.map((event, index) => {
        console.log(`Placa(${index}): ${event.LPR}`);
        imgs.push(camIP + event.ROI_BMP);
      });
    } else {
      console.error(
        "Não foi possível encontrar 'events' ou 'event' no resultado"
      );
    }
  } catch (err) {
    console.error("Deu ruim:", err);
  }

  console.log(imgs);
  console.log("\n\n---------------------------------------------------\n\n");
  res.send(`
  <html>
    <h1>LPR</h1>
    ${imgs.map((img) => {
    return `<img src="${img}"/>`;
  })}
  </html>`);
});

app.listen(3000, function () {
  console.log("\nServidor rodando: http://localhost:3000/ 🔥\n");
});
