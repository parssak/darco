import React, {useState, useRef, useEffect} from 'react';
import './App.css';
import { usePdf } from '@mikecousins/react-pdf';
import { jsPDF } from 'jspdf';
import styled, { keyframes } from 'styled-components';
import { bounce, pulse, fadeIn, tada } from 'react-animations';
// import 'context-filter-polyfill';

let pdfName = "";
let originalBlob = "";
const bounceAnimation = keyframes`${fadeIn}`;
const BouncyDiv = styled.div`
  animation: 0.5s ${bounceAnimation};
  
`;

async function invertImage(imageURL: string) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.crossOrigin = "";
    img.onload = draw;
    img.src = imageURL;

    function draw() {
      let canvas = document.querySelector("#dark-canvas");
      // @ts-ignore
      let ctx = canvas.getContext("2d");
      // @ts-ignore
      // ctx.filter = "invert(1) hue-rotate(90grad)";
      // @ts-ignore
      canvas.width = img.width;
      // @ts-ignore
      canvas.height = img.height;

      // filter
      // @ts-ignore
      if (typeof ctx.filter !== "undefined") {
        // @ts-ignore
        ctx.filter = "invert(1) hue-rotate(150grad)";
        // ctx.imageRendering = "pixelated";
        // @ts-ignore
        ctx.drawImage(img, 0, 0);
      } else {
        // @ts-ignore
        ctx.filter = "invert(1) hue-rotate(150grad)";
        // @ts-ignore
        ctx.drawImage(img, 0, 0);
      }

      // @ts-ignore
      resolve(canvas.toDataURL('image/jpeg', 1));
    }
  })
}


async function invertPdfPages(pdfDocument): Promise<Array<string>> {
  let imageArray = [];
  const rotate = 0;
  const scale = 2;

  for (let i = 1; i <= pdfDocument.numPages; i++) {
    const canvasEl = document.createElement('canvas');
    const page = await pdfDocument.getPage(i);

    const rotation = rotate === 0 ? page.rotate : page.rotate + rotate;
    console.log("rotation is " +rotation);
    const dpRatio = window.devicePixelRatio;
    const adjustedScale = scale * dpRatio;
    const viewport = page.getViewport({ scale: adjustedScale, rotation });

    const canvasContext = canvasEl.getContext('2d');

    canvasEl.style.width = `${viewport.width / dpRatio}px`;
    canvasEl.style.height = `${viewport.height / dpRatio}px`;
    canvasEl.height = viewport.height;
    canvasEl.width = viewport.width;

    await page.render({
      canvasContext,
      viewport,
    }).promise;

    let invertedURL = await invertImage(canvasEl.toDataURL());

    console.log("page" + i + "this inverted URL is" + invertedURL);
    const darkImage = document.createElement("img");
    // @ts-ignore
    darkImage.src = invertedURL;

    // @ts-ignore
    imageArray.push(invertedURL);
  }

  return imageArray;
}

async function determineOrientation() {
  let canvas = document.getElementById("preparecanvas");
  // @ts-ignore
  let width = canvas.width;
  // @ts-ignore
  let height = canvas.height;
  if (height >= width) {
    return 'p'
  } else return 'l'
}

async function imagesToPDF(imageArray: Array<string>, orientation: String) {
  return new Promise(resolve => {
    // @ts-ignore
    let doc = new jsPDF(orientation, 'mm');

    for (let i = 0; i < imageArray.length; i++) {
      if (i !== imageArray.length - 1) doc.addPage();

      doc.setPage(i+1);
      const imgData = imageArray[i];

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      doc.setFillColor('#000000');
      doc.rect(0, 0, width, height);
      // @ts-ignore
      doc.addImage(imgData, 0, 0, width, height);
    }

    let documentName = pdfName.concat("dark");

    // @ts-ignore
    if (window.webkit){
      // @ts-ignore
      window.webkit.messageHandlers.getDocumentName.postMessage(documentName.concat(".pdf"))
    }

    let fileReader = new FileReader()
    let base64;
    let blobPDF = new Blob([doc.output('blob')], {type : 'application/pdf'});
    // var blobUrl = URL.createObjectURL(blobPDF);
    // @ts-ignore
    fileReader.readAsDataURL(blobPDF);
    fileReader.onload = function(fileLoadedEvent) {
      // @ts-ignore
      base64 = fileLoadedEvent.target.result;
      // console.log(base64.slice(28))
      // console.log(base64.slice(28) == originalBlob)
      // @ts-ignore
      // window.location.replace(blobUrl)
      resolve(base64);
      // @ts-ignore
        // @ts-ignore

        // window.webkit.messageHandlers.openDocument.postMessage(base64)
      }
      // doc.save(documentName.concat(".pdf"));
  });
}

// async function imagesToPDF(imageArray: Array<string>, orientation: String) {
//   // @ts-ignore
//   let doc = new jsPDF(orientation, 'mm');
//
//   for (let i = 0; i < imageArray.length; i++) {
//     if (i !== imageArray.length - 1) doc.addPage();
//
//     doc.setPage(i+1);
//     const imgData = imageArray[i];
//
//     const width = doc.internal.pageSize.getWidth();
//     const height = doc.internal.pageSize.getHeight();
//
//     doc.setFillColor('#000000');
//     doc.rect(0, 0, width, height);
//     // @ts-ignore
//     doc.addImage(imgData, 0, 0, width, height);
//   }
//
//   let documentName = pdfName.concat("dark");
//
//   // @ts-ignore
//   if (window.webkit){
//     // @ts-ignore
//     window.webkit.messageHandlers.getDocumentName.postMessage(documentName.concat(".pdf"))
//   }
//
//   let fileReader = new FileReader()
//   let base64;
//   let blobPDF = new Blob([doc.output('blob')], {type : 'application/pdf'});
//   // var blobUrl = URL.createObjectURL(blobPDF);
//   // @ts-ignore
//   fileReader.readAsDataURL(blobPDF);
//   fileReader.onload = function(fileLoadedEvent) {
//     // @ts-ignore
//     base64 = fileLoadedEvent.target.result;
//     // console.log(base64.slice(28))
//     // console.log(base64.slice(28) == originalBlob)
//     // @ts-ignore
//     // window.location.replace(blobUrl)
//
//     // @ts-ignore
//     if (window.webkit) {
//       // @ts-ignore
//       window.webkit.messageHandlers.openDocument.postMessage(base64)
//     }
//     // doc.save(documentName.concat(".pdf"));
//   }
// }

function getDataUrlFromFile(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.addEventListener('load', function () {
      // @ts-ignore
      console.log("Result is:",reader.result.slice(28));
      // @ts-ignore
      originalBlob = reader.result.slice(28);
      resolve(reader.result);
    }, false);
    reader.readAsDataURL(file);
  });
}

function PdfPreview(props) {
  const [page, setPage] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState(1);

  let { pdfDocument, pdfPage } = usePdf({
    file: props.dataUrl,
    page,
    canvasRef,
    workerSrc: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.2.228/pdf.worker.js",
    scale: scale
  });


  useEffect(() => {
    if (pdfDocument !== undefined && canvasRef.current) {
      // console.log(canvasRef.current.width);
      if (canvasRef.current.width <= 350) {
        // console.log("entered2");
        setScale(1)
      }
    }

  })

  // if (pdfDocument !== undefined) {
  //   ensureSize()
  // }

  return (
      <div>
        {/*{!pdfDocument &&<span>Loading...</span>}*/}
        {/*<span>Preparing...</span>*/}
        {!pdfDocument ? null : <button className={"custom-file-upload"}
                                       onClick={async () => {
                                         const orientation = await determineOrientation();
                                         const imageArray = await invertPdfPages(pdfDocument);
                                         const finalBase64 = await imagesToPDF(imageArray, orientation);

                                         // @ts-ignore
                                         if (window.webkit) {
                                           // @ts-ignore
                                           window.webkit.messageHandlers.openDocument.postMessage(finalBase64)
                                         }

                                       }}>Ready to convert!</button>}

        {/*{!pdfDocument ? null : <button className={"custom-file-upload"}*/}
        {/*                               id={"back-button"}*/}
        {/*                               onClick={async () => {*/}
        {/*                                 const orientation = await determineOrientation();*/}
        {/*                                 const imageArray = await invertPdfPages(pdfDocument);*/}
        {/*                                 const finalBase64 = await imagesToPDF(imageArray, orientation);*/}

        {/*                                 // @ts-ignore*/}
        {/*                                 if (window.webkit) {*/}
        {/*                                   // @ts-ignore*/}
        {/*                                   window.webkit.messageHandlers.openDocument.postMessage(finalBase64)*/}
        {/*                                 }*/}

        {/*                               }}>Go back</button>}*/}
        <BouncyDiv><div>
          <canvas ref={canvasRef} id={"preparecanvas"}/>
        </div></BouncyDiv>
        <div>
          <canvas id="dark-canvas"/>
        </div>
      </div>
  );
}

function App() {
  const [dataUrl, setDataUrl] = useState(null);

  // const [page, setPage] = useState(1);
  // let canvasRef = useRef<HTMLCanvasElement | null>(null);

  // let { pdfDocument, pdfPage } = usePdf({
  //   file: "/standardPDF.pdf",
  //   page,
  //   canvasRef,
  // });

  return  (
      <div>
        <div className={"heading"}>
          <h2>Welcome to</h2>
          <h1>Darco</h1>
        </div>
        {dataUrl ? null : <input id="prompt"type="file"
                                 onChange={async (evt) => {
                                   const files = evt.target.files;

                                   // @ts-ignore
                                   if (files.length) {
                                     // Picked a file.
                                     // @ts-ignore
                                     pdfName = files[0].name.substring(0, files[0].name.lastIndexOf('.'))

                                     // @ts-ignore
                                     const newDataUrl = await getDataUrlFromFile(files[0]);
                                     // @ts-ignore
                                     setDataUrl(newDataUrl);
                                   }
                                 }}
                                 accept="application/pdf"
        />}
        {dataUrl ? null : <label htmlFor="file-upload" className="custom-file-upload">
          <i className="fa fa-cloud-upload"></i> Select PDF...
        </label>}
        <input id="file-upload"type="file"
               onChange={async (evt) => {
                 const files = evt.target.files;

                 // @ts-ignore
                 if (files.length) {
                   // Picked a file.
                   // @ts-ignore
                   pdfName = files[0].name.substring(0, files[0].name.lastIndexOf('.'))

                   // @ts-ignore
                   const newDataUrl = await getDataUrlFromFile(files[0]);
                   // @ts-ignore
                   setDataUrl(newDataUrl);
                 }
               }}
               accept="application/pdf"
        />
        {dataUrl ? <PdfPreview dataUrl={dataUrl}/> : null}
        {/*{!dataUrl ? <canvas ref={canvasRef} id={"beginCanvas"} /> : null}*/}
        {!dataUrl ? <BouncyDiv><div className={"introPage"}>
          <h1 style={{
            marginTop: 65,
            marginLeft: 20
          }}>Please <span>select</span> a PDF</h1>
          <h1 style={{
            marginTop: 160,
            textAlign: "right",
            marginLeft: 330,
            marginRight: 20
          }}>And we will<br/>convert it<br/> to a more</h1>
          <span
              style={{textAlign: "right",
                marginTop: -20,
                marginLeft: 312,
                marginRight: 20}}
              id={"eye-friendly"}>eye-friendly</span>
          <h1 style={{
            marginTop: 0,
            textAlign: "right",
            marginLeft: 343,
            marginRight: 10}}>alternative</h1>
        </div></BouncyDiv> : null}
      </div>

  );
}
export default App;
