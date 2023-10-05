 
import fetch, { FormData, File, fileFrom } from 'node-fetch';
import * as fs from 'fs';

const host='http://10.30.0.65/RESTfulAPI'

async function  login(user, password){

    const endpoint = '/csrest/v1.4/auth/logon';
    console.log("login");

    try{
    let resp = await fetch (host+endpoint+'?applClass=Common', {method:'GET',headers:{'X-USERNAME':user,'X-PASSWORD':password}});
   
    let code = resp.status;
    if (code<300 && code >= 200){
        console.log(`Login OK token:${resp.headers.get('x-archivetoken')}`);
        return resp.headers.get('x-archivetoken');
    }
    else {
        let body = await resp.text();
        console.log(`Error ${code} ${body}`)
    }
    }
    catch (error)
    {
        console.log(error);
    }

    return undefined;
   
}

async function departments(token){

    const endpoint='/csrest/v1.4/common/departments';
    try{
    let resp = await fetch (host+endpoint,{headers:{'X-ARCHIVETOKEN':token}});
    let data = await resp.json();
   

    return data;

    }
    catch(error){
        console.log(error);
    }

}

async function download(token,dbId,docId){

    const endpoint=`/csrest/v1.4/dept/${dbId}/docs/${docId}/data`;
     

    console.log("start download");
    let resp = await fetch(host+endpoint,{headers:{'X-ARCHIVETOKEN':token}});
    let blob = await  resp.blob();
    console.log(resp.headers);
    const buffer = Buffer.from( await blob.arrayBuffer() );

    fs.writeFile('test.pdf', buffer, () => console.log('video saved!') );



}



async function main() {
    let token = await login("ds-eobs","dgdemo");
    console.log(await departments(token));
    await download(token,'1654084758',62);
    console.log(token);
}


main();
