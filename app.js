import * as fs from "fs";
import * as pa from 'path';

const host = "http://10.30.0.65/RESTfulAPI";
const departement = 1654084758;
const userId = 'username';
const pwd = 'password';

async function login(user, password) {
  const endpoint = "/csrest/v1.4/auth/logon";
  console.log("login");

  try {
    let resp = await fetch(host + endpoint + "?applClass=Common", {
      method: "GET",
      headers: { "X-USERNAME": user, "X-PASSWORD": password },
    });

    let code = resp.status;
    if (code < 300 && code >= 200) {
      console.log(`Login OK token:${resp.headers.get("x-archivetoken")}`);
      return resp.headers.get("x-archivetoken");
    } else {
      let body = await resp.text();
      console.log(`Error ${code} ${body}`);
    }
  } catch (error) {
    console.log(error);
  }
  return undefined;
}

async function departments(token) {
  const endpoint = "/csrest/v1.4/common/departments";
  try {
    let resp = await fetch(host + endpoint, {
      headers: { "X-ARCHIVETOKEN": token },
    });
    let data = await resp.json();

    return data;
  } catch (error) {
    console.log(error);
  }
}

async function download(token, dbId, docId, path) {
  const endpoint = `/csrest/v1.4/dept/${dbId}/docs/${docId}/data`;

  console.log("start download");
  let resp = await fetch(host + endpoint, {
    headers: { "X-ARCHIVETOKEN": token },
  });
  let blob = await resp.blob();
  //get filename
  let fileName = resp.headers
    .get("content-disposition")
    .split(";")[1]
    .split("=")[1]
    .replaceAll('"','').replaceAll(' ',"_").trim();
  console.log(pa.join(path,fileName));
  const buffer = Buffer.from(await blob.arrayBuffer());

  fs.writeFile(pa.join(path,fileName), buffer, (err) => {if (err) {
    console.error(err);}
    else {
      console.log("Save done ",fileName);
    }

  });
}

async function fetchIndex(token,dbId,docId){
    const endpoint=`/csrest/v1.4/dept/${dbId}/docs/${docId}/indexes`;
    console.log("fetch Index");
    try {
    let resp = await fetch(host + endpoint, {

    headers: { "X-ARCHIVETOKEN": token },
  });
   let indexData= await resp.json();
   return indexData;

} catch (error) {
    console.log(error);
  }

}

async function query(token, indexName,query ){
  const endpoint='/csrest/v1.4/query/search';

  let payload={
    "domain": "*",
    "stampName": indexName,
    "fieldValues": [ ]
  }

  payload.fieldValues=Object.entries(query).map( ([k,v]) =>  {return {fieldName:k,fieldValue:v}});
  console.log("Start query",JSON.stringify(payload));

  try {
    let resp = await fetch(host + endpoint, {
    method:"POST",
    headers: { "X-ARCHIVETOKEN": token,"Content-Type": "application/json", },
    body:JSON.stringify(payload)
  });
   let indexData= await resp.json();
   console.log(resp.code,resp.headers)
   return indexData;

} catch (error) {
    console.log(error);
  }

}


async function  createDocument(token,deptId,document,index)
{
   const endpoint = `/csrest/v1.4/dept/${deptId}/docs`;

   let content= new FormData();

   
   let uploadInfo={
    "docName":"test.txt",
    "fileName":"test.txt",
    "format":"TXT",
    "docTypeId":0,
    "docClass":{"value":"FILE","flag":0},
    "isVersionable":false,
    "indexes":[index]
   };

   content.append("parameter",JSON.stringify(uploadInfo));
   content.append("datafile",new Blob([document], { type : 'application/txt' }),
   "test.txt");

   console.log(content);
   //content.append

   try{

    let resp= await fetch (host+endpoint, {method:"POST",
    headers:{"x-archivetoken":token,"accept":"*/*"},
    body:content});
    console.log("status",resp.status);

    console.log(resp.status);
    return await resp.json();

   }catch(error)
   {
    console.log(error);
   }

   
}
async function  uploadDocument(token,deptId,file,index)
{
   const endpoint = `/csrest/v1.4/dept/${deptId}/docs`;

   let content= new FormData();
   const rawData = fs.readFileSync(file);
   
   let uploadInfo={
    "docName": pa.basename(file),
    "fileName": pa.basename(file),
    "format":pa.extname(file),
    "docTypeId":0,
    "docClass":{"value":"FILE","flag":0},
    "isVersionable":false,
    "indexes":[index]
   };

   content.append("parameter",JSON.stringify(uploadInfo));
   content.append("datafile",new Blob([rawData], { type : 'application/octet-stream' }),
   pa.basename(file));

   console.log(content);
   //content.append

   try{

    let resp= await fetch (host+endpoint, {method:"POST",
    headers:{"x-archivetoken":token,"accept":"*/*"},
    body:content});
    console.log("status",resp.status);

    console.log(resp.status);
    return await resp.json();

   }catch(error)
   {
    console.log(error);
   }

   
}


async function main() {
  let token = await login(userId, pwd);
  console.log(await departments(token));
  console.log(token);
  let result= await query(token, "VERTRAGSMANAGEMENT",{'VERTRAGSNUMMER':'.>'});
  Array.from(result.docIdents).forEach(hit => download(token,hit.deptId, hit.docId, './downloads/'));

  console.log(await createDocument(token,departement,"#Hallo Welt",
  [{"fieldName":"__STAMPNAME","fieldValue":"VERTRAGSMANAGEMENT"},
  {"fieldName":"VERTRAGSSTATUS","fieldValue":"aktiv"},
  {"fieldName":"EDIT67","fieldValue":"test@test.de"}]));
  
  console.log(await uploadDocument(token,departement,"./downloads/av_bayern.pdf",
  [{"fieldName":"__STAMPNAME","fieldValue":"VERTRAGSMANAGEMENT"},
  {"fieldName":"VERTRAGSSTATUS","fieldValue":"aktiv"},
  {"fieldName":"EDIT67","fieldValue":"test@muenchen.de"}]));

  console.log( JSON.stringify( await fetchIndex(token, "departement", 62)));

}

main();
